import React from 'react';
import {
  Skull,
  AlertOctagon,
  Hourglass,
  EyeOff,
  Flame,
  CheckSquare
} from 'lucide-react';
import { PreMortemAudit } from '../types/decision';

interface PreMortemStressTestProps {
  preMortem: PreMortemAudit;
}

export const PreMortemStressTest: React.FC<PreMortemStressTestProps> = ({ preMortem }) => {
  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/70 border border-rose-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Skull className="w-3 h-3" /> Стресс-тест «Pre-Mortem»
        </span>
      </div>
      <h3 className="text-lg md:text-xl font-bold text-slate-100">
        Вскрытие до катастрофы: взгляд из будущего сбоя
      </h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-5">
        Моделируем ситуацию: наступил {preMortem.catastropheFutureDate}, решение провалилось с треском. Что сломалось первым?
      </p>

      {/* Catastrophe Narrative Box */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 md:p-5 mb-5">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wide mb-1">
              Сценарий крушения ({preMortem.catastropheFutureDate}):
            </div>
            <p className="text-sm text-slate-200 leading-relaxed italic">
              "{preMortem.worstCaseNarrative}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Failure Points */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Первопричины возможного сбоя:
            </h4>
          </div>
          <ul className="space-y-2">
            {preMortem.primaryFailurePoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cost of Inaction */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hourglass className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Цена бездействия (Cost of Inaction):
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {preMortem.costOfInactionAnnual}
            </p>
          </div>
          <div className="text-[11px] bg-slate-900/90 text-amber-300/90 p-2.5 rounded-lg border border-slate-800/80">
            Остаться на месте не означает избежать риска. Бездействие имеет измеримую цену в деньгах и здоровье.
          </div>
        </div>
      </div>

      {/* Sunk Cost & Blindspots */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {preMortem.sunkCostTrapAlert && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-1.5">
              Ловушка невозвратных затрат (Sunk Cost Fallacy):
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {preMortem.sunkCostTrapAlert}
            </p>
          </div>
        )}

        {preMortem.confirmationBiasBlindspots && preMortem.confirmationBiasBlindspots.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1.5">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Слепые зоны подтверждения (Confirmation Bias):</span>
            </div>
            <ul className="space-y-1.5">
              {preMortem.confirmationBiasBlindspots.map((b, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
