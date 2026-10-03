/**
 * Bifurcation Engine v5 — Decision Cockpit
 * Critical fixes vs v3:
 * - No heuristic fallback that invents analysis
 * - Two-phase flow: /api/radar (questions only) → stop → /api/analyze-full (after answers)
 * - No sample probability anchors (25/55/20)
 * - Honest errors only
 * - Better prompts aligned with Decision Cockpit article
 */
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'bifurcation-engine-v5' },
    },
  });
}

// Cascade for resilience only — not a substitute for multi-provider critique
const MODEL_CASCADE = [
  'gemini-3.5-flash-lite',   // рекомендуют для новых проектов, обычно меньше 503
  'gemini-3.1-flash-lite',   // запасной «рабочий» Flash-Lite
  'gemini-3.8-flash',        // основной сильный Flash 3.8
  'gemini-3.6-flash',        // ещё один стабильный Flash 3.x
  'gemini-2.5-flash-lite',   // старый, но часто ещё доступен
  'gemini-2.5-flash',        // последний запасной
];

const SYSTEM_RADAR = `Ты — Bifurcation Engine, эпистемически честный аналитик Decision Cockpit.
Главный принцип: НЕ ВЫДУМЫВАЙ цифры, сроки, суммы и вероятности.
Если данных нет — задай вопрос. Не генерируй полные сценарии и не ставь вероятности.
Твоя задача СЕЙЧАС — только:
1) Кратко понять дилемму
2) Сформулировать 4–7 точечных диагностических вопросов (FINANCIAL, IRREVERSIBILITY, LEGAL, PSYCHOLOGICAL, EXTERNAL)
3) Набросать черновик Варианта C (гибрид / Two-Way Door / пилот) БЕЗ сценариев и чисел
Отвечай строго валидным JSON.`;

const SYSTEM_ANALYSIS = `Ты — Bifurcation Engine, критичный аналитик Decision Cockpit.
Принципы:
- Не соглашайся слепо. Атакуй предпосылки.
- Не выдумывай факты. Если чего-то нет в ответах пользователя — так и пиши.
- Вероятности и точные цифры допустимы ТОЛЬКО если они опираются на ответы пользователя или явно помечены как «оценка модели, не прогноз».
- Обязателен Вариант C (Two-Way Door / пилот / гибрид).
- Pre-Mortem и Kill-Criteria — обязательны.
- Разделяй: факты из слов пользователя / общие закономерности / твои догадки.
Отвечай строго валидным JSON.`;

async function generateWithCascade(
  prompt: string,
  systemInstruction: string
): Promise<{ text: string; modelUsed: string }> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY не настроен. Укажите ключ в .env');
  }

  let lastError: any = null;

  for (const modelName of MODEL_CASCADE) {
    try {
      console.log(`[v5] Trying model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          // Vendor guidance for Gemini 2.x/3: avoid forcing very low temp for complex reasoning
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        console.log(`[v5] Success: ${modelName}`);
        return { text: response.text, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`[v5] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Все модели в каскаде недоступны');
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Модель вернула невалидный JSON');
  }
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '5.0-foundation',
    hasKey: Boolean(apiKey),
    cascadeModels: MODEL_CASCADE,
    phases: ['radar', 'analyze-full'],
  });
});

// ---------- PHASE 1: RADAR ONLY (questions + draft Option C, no scenarios) ----------
app.post('/api/radar', async (req, res) => {
  try {
    const { rawInput } = req.body;
    if (!rawInput || typeof rawInput !== 'string' || rawInput.trim().length < 10) {
      res.status(400).json({ success: false, error: 'Нужен текст дилеммы (минимум 10 символов)' });
      return;
    }

    if (!apiKey || !ai) {
      res.status(503).json({
        success: false,
        error: 'API-ключ не настроен. Укажите GEMINI_API_KEY в .env и перезапустите сервер.',
      });
      return;
    }

    const prompt = `Дилемма пользователя:
"""
${rawInput.trim()}
"""

Сформируй JSON строго такой структуры (БЕЗ сценариев, БЕЗ вероятностей, БЕЗ выдуманных цифр):
{
  "title": "Краткое название решения (до 60 знаков)",
  "identifiedAssets": ["актив 1", "актив 2"],
  "coreFears": ["страх 1", "страх 2"],
  "clarificationQuestions": [
    {
      "id": "q1",
      "category": "FINANCIAL",
      "question": "Точный вопрос без домыслов",
      "whyItMatters": "Почему ответ критически меняет картину",
      "criticality": "HIGH",
      "status": "UNRESOLVED"
    }
  ],
  "draftOptionC": {
    "title": "Черновик Варианта C (гибрид/пилот)",
    "tagline": "Как проверить гипотезу без сжигания мостов",
    "description": "Краткое описание обратимого шага",
    "doorType": "TWO_WAY"
  }
}

Правила:
- 4–7 вопросов. Хотя бы 2 с criticality HIGH.
- Категории: FINANCIAL, IRREVERSIBILITY, LEGAL, PSYCHOLOGICAL, EXTERNAL.
- Не придумывай суммы, сроки и проценты.
- Не генерируй сценарии bull/base/bear.`;

    const { text, modelUsed } = await generateWithCascade(prompt, SYSTEM_RADAR);
    const parsed = safeJsonParse(text);

    // Normalize questions
    const questions = (parsed.clarificationQuestions || []).map((q: any, i: number) => ({
      id: q.id || `q${i + 1}`,
      category: q.category || 'EXTERNAL',
      question: q.question || '',
      whyItMatters: q.whyItMatters || '',
      criticality: q.criticality || 'MEDIUM',
      status: 'UNRESOLVED' as const,
    }));

    res.json({
      success: true,
      modelUsed,
      phase: 'RADAR',
      data: {
        title: parsed.title || 'Разбор дилеммы',
        identifiedAssets: parsed.identifiedAssets || [],
        coreFears: parsed.coreFears || [],
        clarificationQuestions: questions,
        draftOptionC: parsed.draftOptionC || null,
      },
    });
  } catch (err: any) {
    console.error('[v5 /api/radar]', err);
    res.status(503).json({
      success: false,
      error: err.message || 'Не удалось выполнить фазу вопросов. Попробуйте ещё раз.',
    });
  }
});

// ---------- PHASE 2: FULL ANALYSIS (only after answers) ----------
app.post('/api/analyze-full', async (req, res) => {
  try {
    const { rawInput, title, clarificationQuestions, draftOptionC, identifiedAssets, coreFears } = req.body;

    if (!rawInput || typeof rawInput !== 'string') {
      res.status(400).json({ success: false, error: 'rawInput обязателен' });
      return;
    }

    const answered = (clarificationQuestions || []).filter(
      (q: any) => q.status === 'ANSWERED' || q.status === 'ASSUMED_RISK'
    );
    const highUnresolved = (clarificationQuestions || []).filter(
      (q: any) => q.criticality === 'HIGH' && q.status === 'UNRESOLVED'
    );

    if (highUnresolved.length > 0) {
      res.status(400).json({
        success: false,
        error: `Остались неотвеченные HIGH-вопросы (${highUnresolved.length}). Ответьте или отметьте «принимаю риск неизвестности».`,
        unresolvedHigh: highUnresolved.map((q: any) => q.id),
      });
      return;
    }

    if (!apiKey || !ai) {
      res.status(503).json({
        success: false,
        error: 'API-ключ не настроен. Укажите GEMINI_API_KEY в .env.',
      });
      return;
    }

    const answersBlock = (clarificationQuestions || [])
      .map((q: any) => `[${q.criticality}] ${q.question}\nОтвет: ${q.userAnswer || (q.status === 'ASSUMED_RISK' ? 'ПРИНЯТ РИСК НЕИЗВЕСТНОСТИ' : '—')}`)
      .join('\n\n');

    const prompt = `Исходная дилемма пользователя:
"""
${rawInput.trim()}
"""

Название: ${title || '—'}

Ответы на диагностические вопросы:
${answersBlock || 'Ответов нет (пользователь принял риски).'}

Черновик Варианта C: ${JSON.stringify(draftOptionC || null)}

Активы (из фазы 1): ${JSON.stringify(identifiedAssets || [])}
Страхи (из фазы 1): ${JSON.stringify(coreFears || [])}

Сформируй JSON:
{
  "title": "Уточнённое название",
  "alternatives": [
    {
      "id": "opt-a",
      "letter": "A",
      "title": "...",
      "tagline": "...",
      "description": "...",
      "doorType": "ONE_WAY | TWO_WAY",
      "scenarios": {
        "sixMonths": {
          "bull": { "title": "...", "narrative": "...", "keyMetric": "...", "failureCascadeOrPayoff": "...", "confidenceNote": "оценка модели на основе ответов пользователя" },
          "base": { ... },
          "bear": { ... }
        },
        "eighteenMonths": { "bull": {...}, "base": {...}, "bear": {...} },
        "threeYears": { "bull": {...}, "base": {...}, "bear": {...} }
      }
    },
    { "id": "opt-b", "letter": "B", ... },
    { "id": "opt-c", "letter": "C", "isSyntheticHybrid": true, "doorType": "TWO_WAY", ... }
  ],
  "bifurcationPoints": [
    {
      "id": "b1",
      "timing": "...",
      "triggerEvent": "...",
      "consequence": "...",
      "isIrreversible": true,
      "preemptiveAction": "..."
    }
  ],
  "preMortem": {
    "catastropheFutureDate": "...",
    "worstCaseNarrative": "...",
    "primaryFailurePoints": ["..."],
    "sunkCostTrapAlert": "...",
    "costOfInactionAnnual": "...",
    "confirmationBiasBlindspots": ["..."]
  },
  "killCriteria": [
    {
      "id": "k1",
      "deadlineOrMetric": "...",
      "thresholdCondition": "...",
      "actionProtocol": "..."
    }
  ],
  "executiveComment": "Краткий вывод: что изменили ответы, что всё ещё неизвестно, какой следующий шаг даст максимум информации",
  "suggestedCalibration": [
    {
      "horizonDays": 30,
      "hypothesis": "Что проверить через 30 дней",
      "estimate": "качественная или осторожная оценка",
      "rationale": "На чём основано"
    }
  ]
}

Правила:
- Обязателен Вариант C (Two-Way Door).
- НЕ вставляй голые вероятности 25/55/20. Если указываешь число — только с confidenceNote «оценка модели, не прогноз» и только опираясь на ответы.
- Предпочитай качественные формулировки («что должно случиться», «что проверить»).
- Явно отделяй факты из ответов пользователя от догадок.`;

    const { text, modelUsed } = await generateWithCascade(prompt, SYSTEM_ANALYSIS);
    const parsed = safeJsonParse(text);

    res.json({
      success: true,
      modelUsed,
      phase: 'ANALYSIS',
      data: parsed,
    });
  } catch (err: any) {
    console.error('[v5 /api/analyze-full]', err);
    res.status(503).json({
      success: false,
      error: err.message || 'Не удалось выполнить полный анализ. Попробуйте ещё раз.',
    });
  }
});

// Download endpoints (same as v3 — correct MIME)
app.get(['/api/download-zip', '/bifurcation_engine_backup.zip'], (req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'bifurcation_engine_backup.zip');
  if (!fs.existsSync(zipPath)) {
    res.status(404).send('ZIP not found');
    return;
  }
  const stat = fs.statSync(zipPath);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="bifurcation_engine_backup.zip"');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  fs.createReadStream(zipPath).pipe(res);
});

app.get(['/api/download-docx', '/TZ_Bifurcation_Engine.docx'], (req, res) => {
  const docxPath = path.resolve(__dirname, 'public', 'TZ_Bifurcation_Engine.docx');
  if (!fs.existsSync(docxPath)) {
    res.status(404).send('DOCX not found');
    return;
  }
  const stat = fs.statSync(docxPath);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="TZ_Bifurcation_Engine.docx"');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  fs.createReadStream(docxPath).pipe(res);
});

// Vite middleware / static
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bifurcation Engine v5] http://0.0.0.0:${PORT}`);
    console.log(`[Bifurcation Engine v5] NODE_ENV=${process.env.NODE_ENV || 'undefined'}`);
    console.log(`[Bifurcation Engine v5] API key: ${apiKey ? 'configured' : 'MISSING'}`);
  });
}

start();
