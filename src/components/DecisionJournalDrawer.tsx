import React, { useState } from 'react';
import {
  X,
  Archive,
  Calendar,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquarePlus,
  Clock
} from 'lucide-react';
import { Decision } from '../types/decision';

interface DecisionJournalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decisions: Decision[];
  activeDecisionId: string;
  onSelectDecision: (id: string) => void;
  onDeleteDecision: (id: string) => void;
  onAddReflectionNote: (decisionId: string, noteText: string) => void;
}

export const DecisionJournalDrawer: React.FC<DecisionJournalDrawerProps> = ({
  isOpen,
  onClose,
  decisions,
  activeDecisionId,
  onSelectDecision,
  onDeleteDecision,
  onAddReflectionNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [noteDecisionId, setNoteDecisionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddNote = (id: string) => {
    if (!newNote.trim()) return;
    onAddReflectionNote(id, newNote.trim());
    setNewNote('');
    setNoteDecisionId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              Журнал калибровки решений
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Decisions List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="text-xs text-slate-400 mb-2">
            Фиксируйте реальные результаты со временем, чтобы бороться с эффектом «заднего ума» (Hindsight Bias) и калибровать интуицию.
          </div>

          {decisions.map((dec) => {
            const isActive = dec.id === activeDecisionId;
            return (
              <div
                key={dec.id}
                className={`rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'bg-slate-900 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isActive ? 'Активное решение' : dec.status}
                  </span>

                  <div className="flex items-center gap-1">
                    {!isActive && (
                      <button
                        onClick={() => onSelectDecision(dec.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded hover:bg-slate-800"
                      >
                        Открыть
                      </button>
                    )}
                    {decisions.length > 1 && (
                      <button
                        onClick={() => onDeleteDecision(dec.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 line-clamp-2 mb-1.5">
                  {dec.title}
                </h3>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(dec.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3 h-3" />
                    Сверка: {dec.revisitDate}
                  </span>
                </div>

                {/* Reflection Notes */}
                {dec.userReflectionNotes && dec.userReflectionNotes.length > 0 && (
                  <div className="space-y-1.5 mb-3 border-t border-slate-800/80 pt-2">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Заметки сверки с реальностью:
                    </div>
                    {dec.userReflectionNotes.map((note) => (
                      <div
                        key={note.id}
                        className="text-xs bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 text-slate-300"
                      >
                        <div className="text-[10px] text-slate-500 mb-0.5">
                          {new Date(note.timestamp).toLocaleDateString('ru-RU')}
                        </div>
                        {note.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Note Button */}
                {noteDecisionId === dec.id ? (
                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-800">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Что изменилось в реальности? Совпали ли ожидания?"
                      rows={2}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setNoteDecisionId(null)}
                        className="text-xs text-slate-400 px-2 py-1"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleAddNote(dec.id)}
                        className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-2.5 py-1 rounded"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNoteDecisionId(dec.id)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 mt-1"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Добавить заметку калибровки</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
