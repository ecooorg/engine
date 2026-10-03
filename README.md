# Bifurcation Engine v5.0-foundation (Railway-ready)

Персональный Decision Cockpit: двухфазный протокол, без фейкового fallback.

## Локальный запуск

```bash
cp .env.example .env
# GEMINI_API_KEY=...
npm install
npm run dev
```

## Деплой на Railway

См. **DEPLOY_RAILWAY.md** — пошаговая инструкция.

Кратко:
1. Залить в GitHub
2. Railway → Deploy from GitHub
3. Variables: `GEMINI_API_KEY`, `NODE_ENV=production`
4. Generate Domain → открыть HTTPS на планшете → «На экран Домой»

## Что исправлено vs v3

- Нет heuristic fallback с выдуманными цифрами
- Фаза 1 `/api/radar` → стоп → Фаза 2 `/api/analyze-full`
- Журнал калибровки (каркас)
- Privacy notice
- PORT из env, listen `0.0.0.0` (готово к облаку)

## Что ещё предстоит

См. `WHAT_REMAINS_v5.docx` в корне архива.
