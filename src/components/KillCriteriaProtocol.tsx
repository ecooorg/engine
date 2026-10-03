import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { KillCriterion } from '../types/decision';

interface KillCriteriaProtocolProps {
  killCriteria: KillCriterion[];
  onAddCriterion: (criterion: Omit<KillCriterion, 'id'>) => void;
  onDeleteCriterion: (id: string) => void;
}

export const KillCriteriaProtocol: React.FC<KillCriteriaProtocolProps> = ({
  killCriteria,
  onAddCriterion,
  onDeleteCriterion,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [threshold, setThreshold] = useState('');
  const [deadline, setDeadline] = useState('');
  const [action, setAction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threshold.trim() || !action.trim()) return;
    onAddCriterion({
      thresholdCondition: threshold.trim(),
      deadlineOrMetric: deadline.trim() || 'По наступлению события',
      actionProtocol: action.trim(),
    });
    setThreshold('');
    setDeadline('');
    setAction('');
    setIsAdding(false);
  };

  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/70 border border-rose-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Точки отката (Kill-Criteria)
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-100 mt-1">
            Правила безопасного выхода из сценария
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Заранее зафиксированные триггеры капитуляции: при наступлении этих условий вы выходите без чувства вины.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Отмена' : 'Добавить критерий'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-[#0a0f1d] border border-slate-700 p-4 rounded-xl mb-4 space-y-3">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Новое правило выхода:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Условие (например: Выручка ниже $1000)"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Срок/дедлайн (например: Через 90 дней)"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <input
            type="text"
            placeholder="Протокол действий (например: Немедленно возвращаюсь к поиску работы в найме)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!threshold.trim() || !action.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-1.5 rounded-lg transition-colors"
            >
              Сохранить правило
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {killCriteria.map((kc, i) => (
          <div
            key={kc.id}
            className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-200">
                  Правило {i + 1}:
                </span>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  Дедлайн: {kc.deadlineOrMetric}
                </span>
              </div>
              <p className="text-xs text-rose-300 font-medium">
                Порог: {kc.thresholdCondition}
              </p>
              <p className="text-xs text-slate-300">
                <span className="text-slate-500">Протокол выхода: </span>
                {kc.actionProtocol}
              </p>
            </div>

            <button
              onClick={() => onDeleteCriterion(kc.id)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors shrink-0"
              title="Удалить правило"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
