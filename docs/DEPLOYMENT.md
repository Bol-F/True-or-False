# Развёртывание RuFact

RuFact состоит из двух сервисов:

1. Next.js-приложение: интерфейс и same-origin route `POST /api/analyze`.
2. FastAPI-контейнер: модель и закрытый endpoint `POST /predict`.

Браузер обращается только к Next.js. Адрес ML-сервиса и ключ Gemini остаются серверными переменными.

## 1. ML-сервис

Соберите контейнер из каталога `ml`:

```bash
docker build -t rufact-ml ./ml
docker run --rm -p 8000:8000 rufact-ml
```

Платформа контейнерного хостинга должна запускать порт из команды Dockerfile и иметь достаточно памяти для загрузки `artifacts/model.joblib`.

Проверки после запуска:

```bash
curl https://YOUR-ML-HOST/health
curl https://YOUR-ML-HOST/model-info
```

Ожидается `ready: true` и версия `tfidf-logreg-ru-v1`. Endpoint `/predict` не должен публиковать ключи или внутренние трассировки ошибок.

## 2. Next.js на Vercel

Подключите GitHub-репозиторий как Next.js-проект. Для preview и production задайте серверные переменные:

```dotenv
ML_API_URL=https://YOUR-ML-HOST/predict
GEMINI_REVIEW_ENABLED=true
GEMINI_API_KEY=NEW_SERVER_ONLY_KEY
GEMINI_MODEL=gemini-3.5-flash-lite
```

- Не добавляйте префикс `NEXT_PUBLIC_` к этим переменным.
- Не переносите `.env.local` в репозиторий или настройки сборки как файл.
- Для production используйте новый ключ, ограниченный только нужным API и проектом.
- Если Gemini не нужен, задайте `GEMINI_REVIEW_ENABLED=false` и не добавляйте ключ.

Каждый push в ветку создаёт preview при включённой Git-интеграции Vercel. После проверки preview можно продвигать без повторной сборки:

```bash
vercel promote DEPLOYMENT_URL
```

Откат:

```bash
vercel rollback
```

## 3. Проверка перед публикацией

```bash
npm ci
uv sync --project ml --frozen
npm run check
npx playwright install chromium
npm run test:e2e
npm run check:gemini
```

Последняя команда делает реальный запрос и расходует квоту. Она нужна только при настроенном Gemini; CI использует подставной `fetch` и не получает секрет.

Ручной smoke-тест:

1. Открыть главную страницу на desktop и телефоне.
2. Выбрать пример «Новость» и получить ответ основной ML-модели.
3. Отдельно включить Gemini и убедиться, что появились утверждения или понятное сообщение о недоступности.
4. Проверить скачивание отчёта, мобильное меню, FAQ и страницу `/model`.
5. Убедиться, что DevTools не показывает `GEMINI_API_KEY`, `ML_API_URL` или необработанные ошибки провайдеров.

## 4. Эксплуатационные ограничения

- Встроенная история хранится только в браузере пользователя.
- Gemini вызывается только после явного включения для текущего текста.
- Автоматический Google Search grounding не используется; ссылки поиска открываются только пользователем.
- Для публичной нагрузки добавьте общий rate limit перед Gemini через выбранное внешнее хранилище. Локальный in-memory limiter не подходит для нескольких serverless-инстансов.
- Следите отдельно за доступностью `/health`, ошибками `/api/analyze`, задержкой Gemini и расходом квоты.

## 5. Критерии готовности

- CI зелёный на commit, который разворачивается.
- ML `/health` возвращает `ready: true`.
- `ML_API_URL` указывает на HTTPS endpoint `/predict`.
- Gemini выключен или реальный health-check успешен.
- В репозитории и browser bundle нет ключей.
- На странице модели остаётся честная внешняя accuracy 71,97%; её не заменяет уверенность отдельного ответа.
