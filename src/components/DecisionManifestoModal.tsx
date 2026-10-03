import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Calendar,
  Cpu
} from 'lucide-react';
import { Decision } from '../types/decision';

interface DecisionManifestoModalProps {
  decision: Decision;
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionManifestoModal: React.FC<DecisionManifestoModalProps> = ({
  decision,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const text = `# DECISION MEMO: ${decision.title}
Дата анализа: ${new Date(decision.createdAt).toLocaleDateString('ru-RU')}
Контрольная точка: ${decision.revisitDate}
Вычислительный движок: ${decision.modelUsed}

## ИСХОДНЫЙ КОНТЕКСТ
"${decision.rawInput}"

## ВАРИАНТЫ
${decision.alternatives
  .map(
    (a) => `### Вариант ${a.letter}: ${a.title} (${a.doorType === 'ONE_WAY' ? 'Необратимое / One-Way' : 'Обратимое / Two-Way'})
${a.tagline}
`
  )
  .join('\n')}

## PRE-MORTEM (Стресс-сценарий)
${decision.preMortem.worstCaseNarrative}

## KILL-CRITERIA (Точки выхода)
${decision.killCriteria.map((k) => `- ${k.thresholdCondition} -> ${k.actionProtocol}`).join('\n')}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Decision Memo (Меморандум Решения)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать MD'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Memo Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-200 leading-relaxed font-sans print:bg-white print:text-black print:p-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-[11px] text-cyan-300">
                {decision.status}
              </span>
              <span>Модель: {decision.modelUsed}</span>
              <span>•</span>
              <span>Дата: {new Date(decision.createdAt).toLocaleDateString('ru-RU')}</span>
              <span>•</span>
              <span className="text-amber-400">Ревизия: {decision.revisitDate}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              {decision.title}
            </h1>
          </div>

          <div className="border-l-4 border-cyan-500 bg-[#0a0f1d] p-4 rounded-r-xl italic text-slate-300 text-sm">
            "{decision.rawInput}"
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1">
              Альтернативы и классификация обратимости
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {decision.alternatives.map((alt) => (
                <div key={alt.id} className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <div className="font-bold text-sm text-cyan-300 mb-1">
                    Вариант {alt.letter}: {alt.title}
                  </div>
                  <div className="text-xs text-slate-400 mb-2 italic">
                    {alt.tagline}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Тип: <strong>{alt.doorType === 'ONE_WAY' ? 'Необратимое (One-Way)' : 'Обратимое (Two-Way)'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1">
              Стресс-сценарий Pre-Mortem ({decision.preMortem.catastropheFutureDate})
            </h3>
            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl text-xs space-y-2">
              <p className="text-slate-200 leading-relaxed font-medium">
                "{decision.preMortem.worstCaseNarrative}"
              </p>
              <div className="text-amber-300">
                <strong>Цена бездействия: </strong>{decision.preMortem.costOfInactionAnnual}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-800 pb-1">
              Правила выхода (Kill-Criteria)
            </h3>
            <div className="space-y-2">
              {decision.killCriteria.map((kc, i) => (
                <div key={kc.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                  <span className="font-bold text-slate-200">Условие {i + 1}: </span>
                  <span className="text-rose-300 font-medium">{kc.thresholdCondition}</span>
                  <span className="text-slate-400"> ({kc.deadlineOrMetric})</span>
                  <div className="mt-1 text-slate-300">
                    <strong>Протокол: </strong>{kc.actionProtocol}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
