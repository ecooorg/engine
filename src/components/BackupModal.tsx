import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  Archive,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Decision } from '../types/decision';
import { generateFullZipBackup, downloadBlob } from '../utils/exportZip';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisions: Decision[];
  onRestoreDecisions: (decisions: Decision[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  decisions,
  onRestoreDecisions,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportDynamicZip = async () => {
    try {
      setIsExporting(true);
      const blob = await generateFullZipBackup(decisions);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `bifurcation_engine_backup_${dateStr}.zip`);
    } catch (e: any) {
      console.error('Export failed:', e);
      alert('Ошибка при создании архива: ' + e?.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onRestoreDecisions(parsed);
          setRestoreMessage(`Успешно восстановлено ${parsed.length} решений!`);
        } else {
          setRestoreMessage('Ошибка: в файле не найден массив решений.');
        }
      } catch (err: any) {
        setRestoreMessage('Ошибка парсинга JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-xl rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Резервное копирование и экспорт в ZIP
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Локальная приватность данных</strong>
              Все решения, страхи, финансовые параметры и заметки хранятся исключительно в памяти вашего устройства (IndexedDB/LocalStorage). Экспорт в ZIP создает автономный файл для переноса или архивации.
            </div>
          </div>

          {/* Primary Action: Download Dynamic ZIP */}
          <div className="bg-[#0a0f1d] border border-indigo-950 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Выгрузить полный ZIP-архив решений
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Содержит: базу `decisions_data.json`, манифесты в Markdown (.md) и презентационные HTML-страницы (.html).
                </p>
              </div>
            </div>

            <button
              onClick={handleExportDynamicZip}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Формирование архива...' : 'Скачать ZIP-архив решений (.zip)'}</span>
            </button>
          </div>

          {/* Secondary Action: Static Source Backup */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-slate-200">
                Полный исходный код и ТЗ приложения (ZIP)
              </div>
              <div className="text-slate-400 text-[11px]">
                Резервная копия проекта для автономного запуска
              </div>
            </div>
            <a
              href="/api/download-zip"
              download="bifurcation_engine_backup.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать код</span>
            </a>
          </div>

          {/* Restore Section */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Восстановление данных
            </h3>
            <p className="text-xs text-slate-400">
              Загрузите файл `decisions_data.json` из ранее скачанного архива для восстановления на другом планшете или компьютере.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Выбрать файл decisions_data.json для восстановления</span>
            </button>

            {restoreMessage && (
              <div className="text-xs text-emerald-400 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{restoreMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
