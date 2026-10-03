import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { FreeformInputSection } from './components/FreeformInputSection';
import { ClarificationRadar } from './components/ClarificationRadar';
import { BifurcationTreeViewer } from './components/BifurcationTreeViewer';
import { PreMortemStressTest } from './components/PreMortemStressTest';
import { KillCriteriaProtocol } from './components/KillCriteriaProtocol';
import { DecisionManifestoModal } from './components/DecisionManifestoModal';
import { DecisionJournalDrawer } from './components/DecisionJournalDrawer';
import { BackupModal } from './components/BackupModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  getStoredDecisions,
  saveDecisions,
  getActiveDecisionId,
  setActiveDecisionId,
  getPrivacyAccepted,
  setPrivacyAccepted,
  INITIAL_DECISION,
} from './utils/storage';
import { Decision, CalibrationEntry, KillCriterion } from './types/decision';
import { AlertCircle, BookOpen, ShieldAlert, CheckCircle2 } from 'lucide-react';

function createEmptyDecision(): Decision {
  return {
    ...INITIAL_DECISION,
    id: `dec_${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [decisions, setDecisions] = useState<Decision[]>(() => {
    const stored = getStoredDecisions();
    return stored.length ? stored : [];
  });
  const [activeId, setActiveId] = useState<string>(() => getActiveDecisionId());
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [privacyAccepted, setPrivacyAcceptedState] = useState(() => getPrivacyAccepted());
  const [showPrivacyGate, setShowPrivacyGate] = useState(() => !getPrivacyAccepted());

  const { isInstallable, install } = usePWAInstall();

  const activeDecision: Decision =
    decisions.find((d) => d.id === activeId) ||
    decisions[0] ||
    createEmptyDecision();

  useEffect(() => {
    saveDecisions(decisions);
  }, [decisions]);

  useEffect(() => {
    if (activeId) setActiveDecisionId(activeId);
  }, [activeId]);

  const upsertDecision = (decision: Decision) => {
    setDecisions((prev) => {
      const idx = prev.findIndex((d) => d.id === decision.id);
      if (idx === -1) return [...prev, decision];
      const next = [...prev];
      next[idx] = { ...decision, updatedAt: Date.now() };
      return next;
    });
    setActiveId(decision.id);
  };

  const updateActive = (patch: Partial<Decision>) => {
    const updated = { ...activeDecision, ...patch, updatedAt: Date.now() };
    upsertDecision(updated);
  };

  const handleRadar = async (rawInput: string) => {
    setErrorMessage('');
    setIsLoading(true);
    setStatusMessage('Фаза 1: только диагностические вопросы (сценарии не генерируются)...');

    try {
      const response = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setErrorMessage(json.error || 'Не удалось получить вопросы. Повторите попытку.');
        setStatusMessage('');
        return;
      }

      const draftC = json.data.draftOptionC;
      const newDecision: Decision = {
        ...createEmptyDecision(),
        title: json.data.title || 'Разбор дилеммы',
        rawInput,
        phase: 'RADAR',
        status: 'DRAFT',
        modelUsed: json.modelUsed || '',
        identifiedAssets: json.data.identifiedAssets || [],
        coreFears: json.data.coreFears || [],
        clarificationQuestions: json.data.clarificationQuestions || [],
        alternatives: draftC
          ? [
              {
                id: 'opt-c-draft',
                letter: 'C',
                title: draftC.title || 'Вариант C (черновик)',
                tagline: draftC.tagline || '',
                description: draftC.description || '',
                doorType: draftC.doorType || 'TWO_WAY',
                isSyntheticHybrid: true,
              },
            ]
          : [],
        privacyNoticeAccepted: true,
      };

      upsertDecision(newDecision);
      setStatusMessage(
        'Ответьте на вопросы (особенно HIGH). Полный анализ запустится только после этого.'
      );
    } catch (e: any) {
      setErrorMessage(e.message || 'Сеть или сервер недоступны.');
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeFull = async () => {
    setErrorMessage('');
    setIsLoading(true);
    setStatusMessage('Фаза 2: полный анализ с учётом ваших ответов...');

    try {
      const response = await fetch('/api/analyze-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: activeDecision.rawInput,
          title: activeDecision.title,
          clarificationQuestions: activeDecision.clarificationQuestions,
          draftOptionC: activeDecision.alternatives.find((a) => a.letter === 'C') || null,
          identifiedAssets: activeDecision.identifiedAssets,
          coreFears: activeDecision.coreFears,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setErrorMessage(
          json.error || 'Анализ не выполнен. Закройте HIGH-вопросы или повторите.'
        );
        setStatusMessage('');
        return;
      }

      const d = json.data;
      const calibrationEntries: CalibrationEntry[] = (d.suggestedCalibration || []).map(
        (c: any, i: number) => ({
          id: `cal_${Date.now()}_${i}`,
          createdAt: Date.now(),
          horizonDays: (c.horizonDays === 30 || c.horizonDays === 180 ? c.horizonDays : 90) as 30 | 90 | 180,
          reviewDate: new Date(Date.now() + (c.horizonDays || 90) * 86400000)
            .toISOString()
            .slice(0, 10),
          hypothesis: c.hypothesis || '',
          estimate: c.estimate || '',
          estimateSource: 'MODEL' as const,
          rationale: c.rationale || '',
        })
      );

      updateActive({
        phase: 'ANALYSIS',
        status: 'ANALYZED',
        modelUsed: json.modelUsed || activeDecision.modelUsed,
        title: d.title || activeDecision.title,
        alternatives: d.alternatives || activeDecision.alternatives,
        bifurcationPoints: d.bifurcationPoints || [],
        preMortem: d.preMortem || null,
        killCriteria: d.killCriteria || [],
        executiveComment: d.executiveComment,
        calibrationEntries: [
          ...(activeDecision.calibrationEntries || []),
          ...calibrationEntries,
        ],
      });
      setStatusMessage('Анализ готов. Проверьте Pre-Mortem, Kill-Criteria и журнал калибровки.');
    } catch (e: any) {
      setErrorMessage(e.message || 'Сеть или сервер недоступны.');
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAnswer = (questionId: string, answer: string, markAssumedRisk?: boolean) => {
    const updated = activeDecision.clarificationQuestions.map((q) =>
      q.id === questionId
        ? {
            ...q,
            userAnswer: answer,
            status: markAssumedRisk ? ('ASSUMED_RISK' as const) : ('ANSWERED' as const),
          }
        : q
    );
    updateActive({ clarificationQuestions: updated });
  };

  const handleAddKillCriterion = (c: Omit<KillCriterion, 'id'>) => {
    updateActive({
      killCriteria: [...activeDecision.killCriteria, { ...c, id: `k_${Date.now()}` }],
    });
  };

  const handleDeleteKillCriterion = (id: string) => {
    updateActive({
      killCriteria: activeDecision.killCriteria.filter((k) => k.id !== id),
    });
  };

  const handleNewDecision = () => {
    const d = createEmptyDecision();
    upsertDecision(d);
    setErrorMessage('');
    setStatusMessage('');
  };

  const handleDeleteDecision = (id: string) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id));
    if (activeId === id) setActiveId('');
  };

  const handleAddReflectionNote = (decisionId: string, noteText: string) => {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              userReflectionNotes: [
                ...d.userReflectionNotes,
                { id: `n_${Date.now()}`, timestamp: Date.now(), text: noteText },
              ],
              updatedAt: Date.now(),
            }
          : d
      )
    );
  };

  const handleRestoreDecisions = (restored: Decision[]) => {
    setDecisions(restored);
    if (restored[0]) setActiveId(restored[0].id);
  };

  const acceptPrivacy = () => {
    setPrivacyAccepted(true);
    setPrivacyAcceptedState(true);
    setShowPrivacyGate(false);
  };

  const highUnresolved = activeDecision.clarificationQuestions.filter(
    (q) => q.criticality === 'HIGH' && q.status === 'UNRESOLVED'
  );
  const showAnalysis =
    activeDecision.phase === 'ANALYSIS' || activeDecision.phase === 'DECIDED';

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100">
      <OfflineIndicator />
      <NavigationHeader
        currentModel={activeDecision.modelUsed || '—'}
        onNewDecision={handleNewDecision}
        onOpenJournal={() => setIsJournalOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenManifesto={() => setIsManifestoOpen(true)}
        isInstallable={isInstallable}
        onInstallPWA={install}
      />

      {showPrivacyGate && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Конфиденциальность</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Текст вашей дилеммы будет отправлен в API языковых моделей (Google Gemini) для
              анализа. Решения, ответы и журнал хранятся только локально на вашем устройстве.
              Сервер не сохраняет историю диалогов.
            </p>
            <button
              onClick={acceptPrivacy}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm"
            >
              Понятно, продолжить
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Ошибка</div>
              <div>{errorMessage}</div>
              <div className="text-red-300/80 mt-1 text-xs">
                Мы намеренно не подставляем «заглушку-анализ» с выдуманными цифрами.
              </div>
            </div>
          </div>
        )}

        {statusMessage && !errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-200 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {statusMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-full border ${
              activeDecision.phase === 'RADAR'
                ? 'bg-amber-950 border-amber-700 text-amber-200'
                : activeDecision.phase === 'ANALYSIS'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                : 'bg-slate-800 border-slate-600'
            }`}
          >
            Фаза: {activeDecision.phase}
          </span>
          {activeDecision.modelUsed && (
            <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300">
              Модель: {activeDecision.modelUsed}
            </span>
          )}
        </div>

        {privacyAccepted && (
          <FreeformInputSection
            onAnalyze={handleRadar}
            isLoading={isLoading}
            statusMessage={statusMessage}
          />
        )}

        {activeDecision.clarificationQuestions.length > 0 && (
          <ClarificationRadar
            questions={activeDecision.clarificationQuestions}
            onUpdateAnswer={handleUpdateAnswer}
            onRefineWithAnswers={handleAnalyzeFull}
            isRefining={isLoading}
          />
        )}

        {activeDecision.phase === 'RADAR' && highUnresolved.length > 0 && (
          <div className="p-3 rounded-xl border border-amber-800/40 bg-amber-950/20 text-sm text-amber-100">
            Осталось HIGH-вопросов без ответа: {highUnresolved.length}. Ответьте или отметьте
            «риск неизвестности», затем нажмите «Пересчитать сценарии» в блоке радара.
          </div>
        )}

        {showAnalysis && (
          <>
            {activeDecision.executiveComment && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Вывод</div>
                {activeDecision.executiveComment}
              </div>
            )}

            {activeDecision.alternatives.length > 0 && (
              <BifurcationTreeViewer
                alternatives={activeDecision.alternatives}
                bifurcationPoints={activeDecision.bifurcationPoints}
                sliders={activeDecision.sensitivitySliders}
                onUpdateSliders={(s) => updateActive({ sensitivitySliders: s })}
              />
            )}

            {activeDecision.preMortem && (
              <PreMortemStressTest preMortem={activeDecision.preMortem} />
            )}

            <KillCriteriaProtocol
              killCriteria={activeDecision.killCriteria}
              onAddCriterion={handleAddKillCriterion}
              onDeleteCriterion={handleDeleteKillCriterion}
            />

            {activeDecision.calibrationEntries.length > 0 && (
              <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-slate-100">Журнал калибровки</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Прогнозы на 30/90/180 дней. Позже заполните поле «Факт» — это калибровка мышления.
                </p>
                <div className="space-y-2">
                  {activeDecision.calibrationEntries.map((c) => (
                    <div
                      key={c.id}
                      className="text-xs p-3 rounded-lg bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-200">{c.hypothesis}</span>
                        <span className="text-violet-300">{c.horizonDays} дн.</span>
                      </div>
                      <div className="text-slate-400">
                        Оценка: {c.estimate} ({c.estimateSource === 'MODEL' ? 'модель' : 'вы'})
                      </div>
                      {c.rationale && (
                        <div className="text-slate-500 mt-1">Основание: {c.rationale}</div>
                      )}
                      <div className="text-slate-500 mt-1">
                        Проверка: {c.reviewDate} · Факт: {c.fact || '— ещё не заполнено'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <DecisionJournalDrawer
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        decisions={decisions}
        activeDecisionId={activeId}
        onSelectDecision={(id) => setActiveId(id)}
        onDeleteDecision={handleDeleteDecision}
        onAddReflectionNote={handleAddReflectionNote}
      />
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        decisions={decisions}
        onRestoreDecisions={handleRestoreDecisions}
      />
      {isManifestoOpen && (
        <DecisionManifestoModal
          decision={activeDecision}
          isOpen={isManifestoOpen}
          onClose={() => setIsManifestoOpen(false)}
        />
      )}
    </div>
  );
}
