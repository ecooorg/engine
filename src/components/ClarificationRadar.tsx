import React, { useState } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Send,
  RefreshCw,
  Info
} from 'lucide-react';
import { ClarificationQuestion } from '../types/decision';

interface ClarificationRadarProps {
  questions: ClarificationQuestion[];
  onUpdateAnswer: (questionId: string, answer: string, markAssumedRisk?: boolean) => void;
  onRefineWithAnswers: () => void;
  isRefining: boolean;
}

export const ClarificationRadar: React.FC<ClarificationRadarProps> = ({
  questions,
  onUpdateAnswer,
  onRefineWithAnswers,
  isRefining,
}) => {
  const [activeAnswers, setActiveAnswers] = useState<Record<string, string>>({});

  const handleTextChange = (id: string, text: string) => {
    setActiveAnswers((prev) => ({ ...prev, [id]: text }));
  };

  const handleSaveAnswer = (q: ClarificationQuestion) => {
    const text = activeAnswers[q.id]?.trim() || q.userAnswer || '';
    if (!text) return;
    onUpdateAnswer(q.id, text, false);
  };

  const handleMarkRisk = (q: ClarificationQuestion) => {
    onUpdateAnswer(q.id, 'Параметр пока не подтвержден (заложено как стресс-фактор риска)', true);
  };

  const answeredCount = questions.filter((q) => q.status !== 'UNRESOLVED').length;
  const highPriorityUnresolved = questions.filter(
    (q) => q.criticality === 'HIGH' && q.status === 'UNRESOLVED'
  ).length;

  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/40 px-2 py-0.5 rounded-full">
              Анти-галлюцинаторный радар
            </span>
            <span className="text-xs text-slate-400">
              Отвечено: <strong className="text-slate-200">{answeredCount} из {questions.length}</strong>
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <span>Диагностические вопросы для калибровки</span>
            {highPriorityUnresolved > 0 && (
              <span className="text-xs bg-rose-950/90 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full font-medium">
                {highPriorityUnresolved} критических пробелов
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Система не домысливает факты. Чем точнее ответы на эти вопросы, тем реалистичнее прогноз и расчет точек невозврата.
          </p>
        </div>

        {answeredCount > 0 && (
          <button
            onClick={onRefineWithAnswers}
            disabled={isRefining}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefining ? 'animate-spin' : ''}`} />
            <span>{isRefining ? 'Пересчет модели...' : 'Пересчитать сценарии'}</span>
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {questions.map((q) => {
          const isAnswered = q.status === 'ANSWERED';
          const isAssumedRisk = q.status === 'ASSUMED_RISK';
          const localVal = activeAnswers[q.id] !== undefined ? activeAnswers[q.id] : q.userAnswer || '';

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 transition-all ${
                isAnswered
                  ? 'bg-slate-900/60 border-emerald-900/40'
                  : isAssumedRisk
                  ? 'bg-slate-900/60 border-amber-900/40'
                  : q.criticality === 'HIGH'
                  ? 'bg-rose-950/20 border-rose-900/50'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      q.criticality === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                        : q.criticality === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {q.criticality === 'HIGH' ? 'Критично для прогноза' : 'Важный фактор'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    [{q.category}]
                  </span>
                </div>

                {isAnswered && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Учтено
                  </span>
                )}
                {isAssumedRisk && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/50">
                    <AlertTriangle className="w-3.5 h-3.5" /> Зона риска
                  </span>
                )}
              </div>

              {/* Question Text */}
              <p className="text-sm font-semibold text-slate-100 leading-snug">
                {q.question}
              </p>

              {/* Why it matters note */}
              <div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-400 bg-slate-950/50 rounded-lg p-2 border border-slate-800/60">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{q.whyItMatters}</span>
              </div>

              {/* Answer Input or Display */}
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={localVal}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Введите ответ или факт..."
                    className="flex-1 bg-[#0a0f1d] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveAnswer(q)}
                      disabled={!localVal.trim()}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        localVal.trim()
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{isAnswered ? 'Обновить' : 'Ответить'}</span>
                    </button>

                    {!isAnswered && (
                      <button
                        type="button"
                        onClick={() => handleMarkRisk(q)}
                        className="text-xs bg-slate-800/90 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700/80 transition-colors"
                        title="Пометить как неизвестный параметр (модель заложит повышенный риск)"
                      >
                        Заложить как риск
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
