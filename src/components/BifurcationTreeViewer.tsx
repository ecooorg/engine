BifurcationTreeViewer.tsx

import React, { useState } from 'react';
import {
  GitFork,
  Sliders,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  DoorClosed,
  DoorOpen,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { DecisionAlternative, SensitivitySliders, BifurcationPoint } from '../types/decision';

interface BifurcationTreeViewerProps {
  alternatives: DecisionAlternative[];
  bifurcationPoints: BifurcationPoint[];
  sliders: SensitivitySliders;
  onUpdateSliders: (sliders: SensitivitySliders) => void;
}

type Horizon = 'sixMonths' | 'eighteenMonths' | 'threeYears';

export const BifurcationTreeViewer: React.FC<BifurcationTreeViewerProps> = ({
  alternatives,
  bifurcationPoints,
  sliders,
  onUpdateSliders,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<Horizon>('sixMonths');
  const [activeTabOption, setActiveTabOption] = useState<string>('ALL'); // 'ALL' or option id

  /** Read numeric estimate if model provided one; otherwise undefined (no fake %). */
  const readProb = (point: { probability?: number; probabilityEstimate?: number } | undefined): number | undefined => {
    if (!point) return undefined;
    const raw = point.probabilityEstimate ?? point.probability;
    if (typeof raw !== 'number' || Number.isNaN(raw)) return undefined;
    return Math.min(100, Math.max(0, raw));
  };

  const formatProb = (point: { probability?: number; probabilityEstimate?: number; confidenceNote?: string } | undefined): string => {
    const p = readProb(point);
    if (p === undefined) return '—';
    return `~${Math.round(p)}%`;
  };

  // Dynamic sensitivity: works with or without model probabilities
  const calculateOptionScore = (alt: DecisionAlternative) => {
    const sc = alt.scenarios?.[selectedHorizon];

    // Base score by door type (epistemically honest when no %)
    let score = alt.doorType === 'TWO_WAY' ? 68 : 48;
    if (alt.isSyntheticHybrid) score += 8;

    const bullP = readProb(sc?.bull);
    const baseP = readProb(sc?.base);
    const bearP = readProb(sc?.bear);

    if (bullP !== undefined && baseP !== undefined && bearP !== undefined) {
      const shift = (sliders.pessimismWeight / 100) * 20;
      const b = Math.max(5, bullP - shift);
      const r = Math.min(85, bearP + shift);
      const m = Math.max(10, 100 - b - r);
      score = b * 1.0 + m * 0.6 + r * 0.1;
    } else {
      // Qualitative shift from sliders only
      score -= (sliders.pessimismWeight / 100) * 18;
      score += ((sliders.riskTolerance - 5) / 5) * 8;
    }

    if (alt.doorType === 'ONE_WAY' && sliders.runwayMonths < 6) {
      score -= 15;
    } else if (sliders.runwayMonths >= 9) {
      score += 5;
    }

    if (Number.isNaN(score)) return 50;
    return Math.round(Math.min(100, Math.max(5, score)));
  };

  const getHorizonLabel = (h: Horizon) => {
    switch (h) {
      case 'sixMonths':
        return 'Горизонт 6 месяцев';
      case 'eighteenMonths':
        return 'Горизонт 1.5 года';
      case 'threeYears':
        return 'Горизонт 3 года';
    }
  };

  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative backdrop-blur-sm">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <GitFork className="w-3 h-3" /> Сценарное дерево и бифуркации
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-100 mt-1">
            Сравнение альтернатив и расчет вероятностей
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Переключайте горизонты времени и регулируйте параметры чувствительности — модель пересчитает устойчивость каждого пути.
          </p>
        </div>

        {/* Horizon Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          {(['sixMonths', 'eighteenMonths', 'threeYears'] as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedHorizon === h
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {h === 'sixMonths' ? '6 месяцев' : h === 'eighteenMonths' ? '1.5 года' : '3 года'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sensitivity Sliders Box */}
      <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Калибровка чувствительности («Что, если?»)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Пересчитывает вероятности в реальном времени
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Slider 1: Runway in months */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Подушка безопасности:</span>
              <span className="font-bold text-cyan-400 font-mono">
                {sliders.runwayMonths} мес.
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              step="0.5"
              value={sliders.runwayMonths}
              onChange={(e) =>
                onUpdateSliders({ ...sliders, runwayMonths: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 мес (критично)</span>
              <span>12+ мес (комфорт)</span>
            </div>
          </div>

          {/* Slider 2: Risk Tolerance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Толерантность к риску:</span>
              <span className="font-bold text-indigo-400 font-mono">
                {sliders.riskTolerance} из 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={sliders.riskTolerance}
              onChange={(e) =>
                onUpdateSliders({ ...sliders, riskTolerance: parseInt(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 (консерватор)</span>
              <span>10 (авантюрист)</span>
            </div>
          </div>

          {/* Slider 3: Pessimism Weight */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Стресс-фильтр (пессимизм):</span>
              <span className="font-bold text-amber-400 font-mono">
                {sliders.pessimismWeight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={sliders.pessimismWeight}
              onChange={(e) =>
                onUpdateSliders({ ...sliders, pessimismWeight: parseInt(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (базовый расчет)</span>
              <span>100% (черные лебеди)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Cards Grid (Responsive 1 col on mobile, 3 cols on tablet/desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {alternatives.map((alt) => {
          const score = calculateOptionScore(alt);
          const sc = alt.scenarios?.[selectedHorizon];
          const isSynthetic = alt.isSyntheticHybrid;

          return (
            <div
              key={alt.id}
              className={`rounded-2xl border p-4 md:p-5 flex flex-col justify-between transition-all relative ${
                isSynthetic
                  ? 'bg-gradient-to-b from-[#131b2e] to-[#0e1422] border-cyan-500/50 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-[#0e1424]/90 border-slate-800 shadow-md'
              }`}
            >
              {/* Option Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                        alt.letter === 'A'
                          ? 'bg-slate-800 text-slate-200'
                          : alt.letter === 'B'
                          ? 'bg-indigo-900/80 text-indigo-200'
                          : 'bg-cyan-900/80 text-cyan-200'
                      }`}
                    >
                      {alt.letter}
                    </span>
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-slate-100 leading-snug">
                        {alt.title}
                      </h4>
                      {isSynthetic && (
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Синтетический гибрид
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Door Type Badge */}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                      alt.doorType === 'ONE_WAY'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                    }`}
                    title={
                      alt.doorType === 'ONE_WAY'
                        ? 'Дверь в одну сторону: решение необратимо, откат крайне затруднен'
                        : 'Дверь в две стороны: решение обратимо с минимальными потерями'
                    }
                  >
                    {alt.doorType === 'ONE_WAY' ? (
                      <>
                        <DoorClosed className="w-3 h-3" /> One-Way
                      </>
                    ) : (
                      <>
                        <DoorOpen className="w-3 h-3" /> Two-Way
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-400 italic mb-4">"{alt.tagline}"</p>

                {/* Weighted Score Index Bar */}
                <div className="bg-[#080c16] rounded-xl p-3 border border-slate-800 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Индекс устойчивости:</span>
                    <span
                      className={`font-bold font-mono text-sm ${
                        score >= 70
                          ? 'text-emerald-400'
                          : score >= 45
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {Number.isFinite(score) ? score : 50} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        score >= 70
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : score >= 45
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500 to-red-400'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {/* Scenario details for selected horizon */}
                {sc && (
                  <div className="space-y-2.5">
                    {/* Bull Case */}
                    <div className="bg-[#080d1a] border border-emerald-900/30 rounded-xl p-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Bull Case: {sc.bull.title}
                        </span>
                        <span className="font-mono text-[11px] text-emerald-400/90 font-semibold">
                          {formatProb(sc?.bull)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-1">
                        {sc.bull.narrative}
                      </p>
                      <div className="text-[11px] text-emerald-300/80 font-medium">
                        Выигрыш: {sc.bull.keyMetric}
                      </div>
                    </div>

                    {/* Base Case */}
                    <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300">
                          Base Case: {sc.base.title}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 font-semibold">
                          {formatProb(sc?.base)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-1">
                        {sc.base.narrative}
                      </p>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Трение: {sc.base.keyMetric}
                      </div>
                    </div>

                    {/* Stress / Bear Case */}
                    <div className="bg-[#080d1a] border border-rose-900/30 rounded-xl p-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Stress Case: {sc.bear.title}
                        </span>
                        <span className="font-mono text-[11px] text-rose-400/90 font-semibold">
                          {formatProb(sc?.bear)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-1">
                        {sc.bear.narrative}
                      </p>
                      <div className="text-[11px] text-rose-300/90 font-medium">
                        Угроза: {sc.bear.failureCascadeOrPayoff}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom tag */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{getHorizonLabel(selectedHorizon)}</span>
                <span className="font-mono">{alt.doorType === 'ONE_WAY' ? '⚠️ Высокий риск' : '🛡️ Обратимо'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bifurcation Points Timeline */}
      {bifurcationPoints && bifurcationPoints.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Точки бифуркации и рубежи невозврата
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bifurcationPoints.map((bp) => (
              <div
                key={bp.id}
                className="bg-[#0a0f1d] border border-amber-900/40 rounded-xl p-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded-md font-mono">
                    {bp.timing}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      bp.isIrreversible
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {bp.isIrreversible ? 'Точка невозврата' : 'Управляемый рубеж'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200 mb-1">
                  Триггер: {bp.triggerEvent}
                </p>
                <p className="text-xs text-slate-400 mb-2">
                  Следствие: {bp.consequence}
                </p>
                <div className="text-[11px] bg-slate-900/80 text-cyan-300 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Что сделать до рубежа: </span>
                  {bp.preemptiveAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
