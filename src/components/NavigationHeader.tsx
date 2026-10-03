import React from 'react';
import {
  Compass,
  PlusCircle,
  Archive,
  Download,
  Smartphone,
  Cpu,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface NavigationHeaderProps {
  currentModel: string;
  onNewDecision: () => void;
  onOpenJournal: () => void;
  onOpenBackup: () => void;
  onOpenManifesto: () => void;
  isInstallable: boolean;
  onInstallPWA: () => void;
  decisionTitle: string;
  revisitDate: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentModel,
  onNewDecision,
  onOpenJournal,
  onOpenBackup,
  onOpenManifesto,
  isInstallable,
  onInstallPWA,
  decisionTitle,
  revisitDate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Active Decision Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-[#0c1220] rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>Decision Cockpit</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Bifurcation Engine
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md font-medium" title={decisionTitle}>
              {decisionTitle || 'Новое стратегическое решение'}
            </p>
          </div>
        </div>

        {/* Model Badge & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active Model Indicator */}
          <div
            className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 px-2.5 py-1.5 rounded-lg text-xs text-slate-300"
            title="Каскад моделей: 1. Gemini 3.1 Pro -> 2. Gemini 3.8 Flash -> 3. Flash-Lite"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-300 truncate max-w-[150px]">
              {currentModel || 'Gemini 3.1 Pro'}
            </span>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onNewDecision}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/30"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Новое решение</span>
          </button>

          <button
            onClick={onOpenManifesto}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all"
            title="Посмотреть Decision Memo в формате Amazon / Bridgewater"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Меморандум</span>
          </button>

          <button
            onClick={onOpenJournal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all"
            title="Журнал калибровки решений"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Журнал</span>
          </button>

          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all"
            title="Выгрузить полный ZIP архив базы и решений"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>ZIP-Архив</span>
          </button>

          {isInstallable && (
            <button
              onClick={onInstallPWA}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg shadow-sm transition-all"
              title="Добавить на рабочий стол планшета"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>На экран</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
