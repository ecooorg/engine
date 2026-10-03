import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Loader2
} from 'lucide-react';

interface FreeformInputSectionProps {
  onAnalyze: (rawInput: string) => Promise<void>;
  isLoading: boolean;
  statusMessage?: string;
}

const PRESET_SCENARIOS = [
  {
    title: 'Корпорация vs Стартап',
    text: 'Работаю руководителем 6 лет ($4000), тошнит от политики компании. Друг зовёт делать стартап в логистике, предлагает долю 30%, но денег первые полгода не будет. У меня семья, двое детей, накоплений $15,000, жена пока насторожена. Боюсь потерять статус и остаться без денег, но боюсь упустить шанс.'
  },
  {
    title: 'Релокация vs Текущий дом',
    text: 'Получил оффер в Берлин на €75,000 в год. Сейчас в Москве своя 3-комнатная квартира, друзья, пожилые родители, доход $3,500. Жена работает удаленно, ребенок идет в 3 класс. Боимся языкового барьера, бытового даунгрейда и изоляции, но хотим европейское образование и международный опыт.'
  },
  {
    title: 'Покупка квартиры в ипотеку vs Аренда + Инвестиции',
    text: 'Накоплен первоначальный взнос $40,000. Банк одобряет ипотеку на 20 лет с платежом $1,200 в месяц. Сейчас арендуем отличную квартиру за $700. Если купить — привяжемся к месту на 10 лет, но будет свое. Если инвестировать остаток — капитал работает, но инфляция и тревога за будущее.'
  }
];

export const FreeformInputSection: React.FC<FreeformInputSectionProps> = ({
  onAnalyze,
  isLoading,
  statusMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ru-RU';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInputText((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
      setSpeechSupported(false);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onAnalyze(inputText.trim());
  };

  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded-full">
            Фаза 1: Свободный интейк
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 mt-1">
            Опишите вашу дилемму своими словами
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Наговорите голосом или напишите как есть: факты, эмоции, страхи, цифры подушки и сомнения. Не думайте о структуре.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Примеры:
          </span>
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(p.text)}
              disabled={isLoading}
              className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-md border border-slate-700/60 transition-colors"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            rows={5}
            placeholder="Пример: Работаю руководителем 6 лет, платят $4000. Друг зовет в стартап на долю 30%, но денег первые 6 месяцев не будет. У меня семья, дети, подушка на $15,000. Боюсь проесть заначку и разрушить семью, но боюсь застрять в рутине..."
            className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-y leading-relaxed font-sans"
          />

          {/* Voice Input Button inside textarea */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading}
              className={`absolute right-3 bottom-3 p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
              }`}
              title={isRecording ? 'Остановить запись' : 'Наговорить голосом'}
            >
              {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-cyan-400" />}
              <span>{isRecording ? 'Слушаю...' : 'Голос'}</span>
            </button>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              ИИ декомпозирует монолог, найдет скрытый Вариант В и задаст точечные диагностические вопросы.
            </span>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg active:scale-95 ${
              !inputText.trim() || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-indigo-500/25'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{statusMessage || 'Моделирование сценариев...'}</span>
              </>
            ) : (
              <>
                <span>Запустить глубокий разбор</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
