# Безопасность RuFact

Дата аудита: 2 октября 2026 года.

## Границы доверия

```text
браузер → POST /api/analyze (Next.js) → POST /predict (FastAPI)
                                      ↘ Gemini API (только по согласию)
```

Браузер считается недоверенным. FastAPI принимает prediction только от Next.js.
Gemini и ML credentials не входят в клиентский bundle. JWT здесь защищает связь
между сервисами; это не регистрация и не аутентификация конечного пользователя.

## Реализованные меры

| Риск | Защита |
| --- | --- |
| Массовые запросы и исчерпание quota | Upstash sliding-window rate limit, 10 запросов за 60 секунд по умолчанию; `429` и `Retry-After` |
| Обход лимита между serverless-инстансами | единое Redis-хранилище обязательно в production; конфигурация fail-closed |
| Хранение IP в Redis | HMAC-SHA256 с отдельным `RATE_LIMIT_HASH_SECRET` |
| Прямой вызов дорогого `/predict` | HS256 JWT на 30 секунд, issuer/audience/subject, request ID и SHA-256 точного тела |
| Подмена тела после подписи | `bodySha256` проверяется constant-time сравнением |
| CSRF/cross-site вызов | same-origin/fetch-site проверка и только `application/json` |
| Большое или неправильное тело | 24 KB limit до анализа, 5000 символов в схеме, строгие типы |
| XSS/clickjacking/MIME confusion | CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, restrictive Permissions Policy |
| Downgrade HTTP в production | HSTS и требование HTTPS для внешних endpoint в release checklist |
| Утечка topology и секретов | server-only env, same-origin proxy, credential scan, generic upstream errors |
| Компрометация контейнера | non-root user, минимальный slim image, без dev dependencies, скрытые docs и server banner |
| CPU exhaustion ML | rate limit на входе и per-instance semaphore для prediction |
| Повреждение модели | checksum из `artifact-manifest.json` проверяется при startup |
| Supply-chain известные CVE | `npm audit --omit=dev` и `pip-audit` runtime-набора перед выпуском |

JWT подписывается общим `ML_API_JWT_SECRET` длиной не менее 32 байт. FastAPI
принимает только точный header `{ "alg": "HS256", "typ": "JWT" }`, ожидаемые
claims и lifetime не более 60 секунд. Ошибки не раскрывают, какая часть подписи или
claims была неверна.

## Rate limiting простыми словами

Rate limit — это счётчик запросов за окно времени. При настройке `10/60s` один
клиент может начать десять анализов за минуту. Следующий запрос получает `429`, а
`Retry-After` сообщает, когда повторить попытку. Это защищает доступность и бюджет,
но не доказывает личность пользователя: общий NAT может объединить людей под одним
IP, а атакующий может менять IP. Поэтому лимит выбран умеренным и дополняется WAF,
provider quotas и наблюдаемостью.

Development limiter хранится в памяти одного процесса. Он удобен для локальной
работы, но непригоден для Vercel. В production отсутствие Redis или отдельного
hash secret приводит к `503`, чтобы дорогостоящий endpoint не оказался случайно
открыт без защиты.

## Web-атаки и platform-защита

- CORS не включён: browser-клиенты используют только same-origin Next.js route.
- Параметры хоста FastAPI ограничиваются `RUFACT_ALLOWED_HOSTS`.
- OpenAPI в контейнере выключен, если `RUFACT_API_DOCS_ENABLED` не равен `true`.
- Next.js удаляет `X-Powered-By` и не кэширует приватные результаты анализа.
- CSP запрещает frames, plugins, внешние scripts, media и внешние connections.
  Next.js hydration пока требует `'unsafe-inline'` для scripts/styles; это известный
  остаточный риск. Пользовательский HTML не рендерится, но nonce-based CSP остаётся
  подходящим будущим усилением.
- Vercel предоставляет автоматическую DDoS-защиту. Дополнительные WAF rules нужно
  вводить через `log → preview → production`, чтобы не заблокировать нормальных
  пользователей.

## N+1 и производительность

N+1 возникает, когда код сначала получает N объектов, а затем делает отдельный
запрос к базе или API для каждого. В текущем RuFact нет базы данных, ORM, списка
объектов с вложенными fetch или цикла сетевых запросов, поэтому N+1 отсутствует.

На один анализ выполняются максимум два независимых внешних действия:

1. одно предсказание FastAPI;
2. один необязательный запрос Gemini.

Они запускаются одновременно через `Promise.all`, поэтому последовательного
waterfall нет. Scikit-learn inference выполняется вне event loop, а semaphore не
даёт одному контейнеру создать неограниченное число CPU-задач. Если позже появится
база данных, CI следует дополнить query-count тестом и запретить запросы внутри
циклов без batch/prefetch.

## Что намеренно не реализовано

- Нет user accounts и пользовательских JWT: публичному образовательному MVP они не
  нужны. Добавлять их стоит только вместе с реальной моделью ролей и authorization.
- Нет автоматического фактчекинга по внешним источникам. Gemini не использует search
  grounding и не меняет основной ML-результат.
- Нет CAPTCHA или device fingerprinting. Их следует вводить только после данных о
  злоупотреблениях.
- WAF custom rule не публикуется кодом: сначала требуется production traffic в
  режиме `log` и подтверждение владельца проекта.
- Полноценный error drain/SIEM требует выбора production-провайдера наблюдаемости.

## Release-аудит

Перед каждым production-релизом:

```bash
npm run check
npm run test:e2e
npm audit --omit=dev
```

Python runtime нужно экспортировать без dev group и проверить `pip-audit`; тестовые
инструменты не входят в Docker image. Затем выполните container smoke-test из
[`DEPLOYMENT.md`](DEPLOYMENT.md).

## Реакция на инцидент

1. Отключить Gemini через `GEMINI_REVIEW_ENABLED=false`, если растёт расход quota.
2. Перевести подготовленное WAF rule в rate-limit/challenge после проверки scope.
3. Отозвать скомпрометированный provider token.
4. Согласованно заменить `ML_API_JWT_SECRET` на обоих сервисах.
5. Проверить логи по request ID, не записывая текст, JWT или API keys.
6. Откатить Vercel deployment и ML image на последний проверенный commit/tag.
