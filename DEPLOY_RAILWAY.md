# Деплой Bifurcation Engine v5 на Railway

## 1. Подготовка

1. Создайте репозиторий на GitHub и загрузите **содержимое этого архива** (не вложенную папку лишним уровнем, если можно).
2. **Не коммитьте** файл `.env` с ключом.

```bash
git init
git add .
git commit -m "Bifurcation Engine v5 — Railway ready"
git branch -M main
git remote add origin https://github.com/YOUR_USER/bifurcation-engine.git
git push -u origin main
```

## 2. Railway

1. Откройте https://railway.app → войти через GitHub.
2. **New Project** → **Deploy from GitHub repo** → выберите репозиторий.
3. Дождитесь первого деплоя (может упасть без ключа — это нормально).
4. Откройте сервис → **Variables** → добавьте:
   - `GEMINI_API_KEY` = ваш ключ Google AI
   - `NODE_ENV` = `production`
5. **Settings → Networking → Generate Domain** — получите HTTPS-URL.
6. Redeploy при необходимости (Railway подхватит переменные).

## 3. Проверка

- Откройте `https://YOUR_APP.up.railway.app`
- Должен появиться экран про конфиденциальность
- `https://YOUR_APP.up.railway.app/api/health` → `"hasKey": true`

## 4. Планшет

1. Откройте HTTPS-URL в Chrome (Android) или Safari (iPad).
2. «Добавить на главный экран» / «На экран Домой».
3. Запускайте как приложение.

## 5. Команды, которые использует Railway

| Этап | Команда |
|------|---------|
| Build | `npm install && npm run build` |
| Start | `npm start` → `NODE_ENV=production tsx server.ts` |

Порт берётся из `process.env.PORT` (Railway выставляет сам).

## 6. Если билд падает

- Убедитесь, что Node ≥ 20.
- В логах смотрите, прошла ли `vite build` (папка `dist/`).
- Ключ API нужен только в runtime Variables, не на этапе build.
