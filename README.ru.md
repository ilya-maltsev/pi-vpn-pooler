🌐 [English](README.md) | **Русский**

# pi-vpn-pooler

Менеджер пулов VPN IP-адресов для [privacyIDEA](https://www.privacyidea.org/).

Автономное Django-приложение, которое управляет пулами VPN IP-адресов и
назначает адреса пользователям через пользовательские атрибуты privacyIDEA.
Работает как отдельный Docker-сервис рядом со стеком privacyIDEA — **не
изменяет кодовую базу privacyIDEA**.

---

## Возможности

- **Управление пулами** — определение VPN-пулов по имени и CIDR-подсети (например, `172.20.50.0/24`)
- **Выделение IP** — назначение свободного IP из пула пользователю privacyIDEA
- **Глобальная уникальность** — два пользователя не могут владеть одним и тем же IP-адресом ни в одном пуле
- **Несколько адресов** — пользователь может иметь IP из разных пулов (например, `VPN1-IP`, `VPN2-IP`)
- **Освобождение** — освобождение IP и удаление пользовательского атрибута из privacyIDEA
- **Актуальные данные** — без локального кэша; состояние аллокаций всегда считывается напрямую из privacyIDEA
- **2FA-аутентификация** — challenge-response TOTP полностью через privacyIDEA `/auth` (оба шага), пароль не хранится в сессии; опциональный строгий режим (`PI_REQUIRE_OTP`)
- **Дашборд** — строка статистики, карточки пулов с визуализацией сетки подсети, последние аллокации, состояние пула
- **Карта подсети** — сетка по пулу, одна ячейка на хост (`gateway` выделен предупреждением, `used` — акцентом, свободные — нейтральным цветом)
- **Просмотр аллокаций по всем пулам** — поиск, фильтр по пулу, пагинация
- **Сортируемые и фильтруемые таблицы** — нативные (без DataTables), поля фильтрации по столбцам
- **Палитра команд** — `⌘K` / `Ctrl+K` / `/` открывает; `g o / g p / g a / g s` переход к экранам
- **Копирование по клику** — ячейки IP / CIDR / gateway мигают «✓ copied» при клике
- **Тёмная и светлая темы** — на основе токенов, oklch-акценты, сохраняются в localStorage
- **i18n** — русский / английский

---

## Архитектура

```
Browser ──> [ pi-vpn-pooler :5000 ] ── PI REST API ──> [ reverse_proxy :8443 ] ──> [ privacyidea :8080 ]
                   │                                                                        │
              [ pools.yaml ]                                                          [ PostgreSQL ]
              pool definitions                                                  - customuserattribute
              (Docker volume)                                                   (source of truth)
```

| Компонент | Роль |
|-----------|------|
| **pi-vpn-pooler** | Django 4.2+, управляет пулами и аллокациями |
| **pools.yaml** | YAML-файл с определениями пулов (Docker volume, потокобезопасная запись) |
| **privacyIDEA** | Источник истины для пользовательских атрибутов (все аллокации) |

Локальная база данных отсутствует. Определения пулов хранятся в YAML-файле.
Аллокации всегда запрашиваются в реальном времени из privacyIDEA — pooler
никогда не кэширует состояние аллокаций. Pooler не записывает напрямую в базу
PI. Все мутации проходят через PI REST API (`POST /user/attribute`,
`DELETE /user/attribute/…`).

---

## Технологический стек

| Уровень | Технология |
|---------|------------|
| Бэкенд | Python 3.13, Django 4.2+ |
| Хранилище | YAML-файл (пулы), подписанные cookies (сессии), без базы данных |
| Интеграция с PI | библиотека `requests`, PI REST API с JWT-аутентификацией |
| Фронтенд | Серверные Django-шаблоны |
| WSGI-сервер | Gunicorn (продакшн) |
| Обратный прокси | Nginx (самоподписанный TLS, продакшн) |
| CSS | Токенизированная дизайн-система (oklch-акценты, тёмная тема по умолчанию + светлая), без Bootstrap / Tailwind |
| Таблицы | Нативные — серверный рендеринг + vanilla JS для сортировки/фильтрации (`static/pooler/table.js`) |
| Иконки | Встроенный SVG-спрайт (`static/pooler/icons.svg`) с `<use href="#name"/>` |
| Клиентский JS | ~1 КБ каждый — `app.js`, `palette.js`, `table.js`, `subnet.js`, `toast.js`. Без jQuery, без React. |
| Статические файлы | WhiteNoise (разработка), Nginx (продакшн) |
| Контейнеризация | Docker, Docker Compose |
| Инструмент сборки | GNU Make |

---

## Команды Makefile

Все операции доступны через `make`:

```bash
make help         # Показать все доступные цели
```

| Цель | Описание |
|------|----------|
| `make cert` | Сгенерировать самоподписанные SSL-сертификаты (10 лет) |
| `make secrets` | Сгенерировать случайный `DJANGO_SECRET_KEY` |
| `make dev` | Запустить стек разработки (gunicorn + hot-reload) |
| `make stack` | Запустить продакшн-стек (gunicorn + nginx SSL) |
| `make build` | Собрать Docker-образ |
| `make stop` | Остановить продакшн-стек |
| `make stop-dev` | Остановить стек разработки |
| `make logs` | Показать логи продакшн-приложения |
| `make logs-dev` | Показать логи приложения разработки |
| `make shell` | Открыть Django shell в dev-контейнере |
| `make clean` | Остановить и удалить все контейнеры (тома сохраняются) |
| `make distclean` | Удалить контейнеры **и** тома (потеря данных!) |

---

## Быстрый старт (разработка)

### Предварительные требования

- Docker Engine 24+ и Docker Compose v2
- Работающий экземпляр privacyIDEA (стандартный Docker-стек на порту 8443)

### 1. Клонирование и запуск

```bash
cd privacyidea-docker/pi-vpn-pooler

make dev
# или вручную:
# docker compose -f docker-compose.dev.yaml up -d
```

### 2. Открытие интерфейса

Перейдите по адресу **http://localhost:5000** и войдите с **учётными данными
администратора privacyIDEA** (те же логин/пароль, что и для панели
администрирования PI).

Если у пользователя зарегистрирован TOTP-токен и настроена политика
`challenge_response`, на втором шаге будет запрошен 6-значный OTP-код.

### 3. Настройка политик privacyIDEA

Прежде чем pooler сможет устанавливать пользовательские атрибуты и использовать
challenge-response 2FA, в PI необходимо настроить соответствующие политики.
В панели администрирования PI создайте:

**Политика администратора** (для пользовательских атрибутов):

| Поле | Значение |
|------|----------|
| **Scope** | `admin` |
| **Action** | `set_custom_user_attributes` = `*: *` |
| **Action** | `delete_custom_user_attributes` = `*` |
| **Admin realm** | *(ваш административный realm)* |

Это разрешает любой ключ атрибута с любым значением. Для более строгого контроля
можно ограничить конкретными ключами (например, `VPN1-IP: *, VPN2-IP: *`).

**Политика аутентификации** (для challenge-response 2FA):

| Поле | Значение |
|------|----------|
| **Scope** | `authentication` |
| **Action** | `challenge_response` = `totp` |
| **Action** | `otppin` = `userstore` |
| **Action** | `passOnNoToken` = `true` |

Это включает двухшаговый процесс входа: пароль инициирует TOTP-challenge,
затем пользователь вводит OTP-код для завершения аутентификации. Пользователи
без зарегистрированного TOTP-токена допускаются (если не установлено
`PI_REQUIRE_OTP=true`).

### 4. Создание пула и выделение адреса

1. **Pools > Create Pool** — введите имя (`VPN1`), CIDR (`172.20.50.0/24`),
   ключ атрибута (`VPN1-IP`), опционально шлюз.
2. Откройте страницу деталей пула.
3. Выберите realm, пользователя, IP-адрес (или оставьте «Следующий доступный»),
   нажмите **Allocate**.
4. Убедитесь на странице деталей пользователя в PI, что пользовательский атрибут появился.

---

## Развёртывание в продакшне (автономный режим)

Продакшн-стек запускает два контейнера: **Django + Gunicorn** и **Nginx**
(терминация SSL). Без базы данных.

```
Browser ──HTTPS──> [ nginx :5443 ] ──HTTP──> [ gunicorn :8000 ]
                   (self-signed TLS)          (3 workers)
```

### 1. Генерация сертификатов и секретов

```bash
make cert      # создаёт templates/pi.pem + templates/pi.key (самоподписанный, 10 лет)
make secrets   # выводит случайный DJANGO_SECRET_KEY
```

### 2. Настройка окружения

Отредактируйте `environment/application-pooler.env` и замените значения `changeme`:

```env
DJANGO_SECRET_KEY=<из make secrets>
PI_API_URL=https://reverse_proxy    # или адрес вашего PI
PI_REQUIRE_OTP=true                 # запретить вход пользователям без TOTP
PROXY_PORT=5443                     # внешний HTTPS-порт
SERVERNAME=vpn-pooler.example.com   # для nginx server_name
CSRF_TRUSTED_ORIGINS=https://vpn-pooler.example.com
```

### 3. Запуск стека

```bash
make stack
```

Перейдите по адресу **https://localhost:5443** и войдите с учётными данными администратора PI.

### 4. Остановка / очистка

```bash
make stop       # остановить контейнеры
make clean      # остановить + удалить контейнеры (данные сохраняются)
make distclean  # удалить контейнеры + тома (требуется подтверждение)
```

### Альтернатива: встроить в основной стек PI

Вы также можете добавить pooler как сервис в основной
`privacyidea-docker/docker-compose.yaml` (без собственного nginx). См. файл
`docker-compose.yaml` в этой директории для определений сервисов, которые
нужно скопировать.

---

## Переменные окружения

### Django

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `DJANGO_SECRET_KEY` | небезопасный dev-ключ | Ключ подписи сессий (замените в продакшне!) |
| `DJANGO_DEBUG` | `true` | Режим отладки |
| `DJANGO_ALLOWED_HOSTS` | `*` | Разрешённые имена хостов через запятую |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:*` | Доверенные источники для CSRF через запятую |
| `DJANGO_LOG_LEVEL` | `INFO` | Уровень логирования для логгера `pooler` |
| `DJANGO_LANGUAGE_CODE` | `en` | Язык интерфейса по умолчанию, когда у посетителя нет выбора в сессии/cookie и нет подходящего заголовка `Accept-Language`. Допустимые значения: `en`, `ru`. |
| `SYSLOG_ENABLED` | `false` | Включить удалённую пересылку syslog из Django. При `false` логи идут только в stdout / логи контейнера. |
| `SYSLOG_HOST` | (пусто) | Удалённый хост rsyslog. Обязателен при `SYSLOG_ENABLED=true`. |
| `SYSLOG_PORT` | `514` | Порт удалённого rsyslog |
| `SYSLOG_PROTO` | `udp` | Транспорт для удалённого rsyslog: `udp` или `tcp` |
| `SYSLOG_FACILITY` | `local0` | Syslog facility |
| `SYSLOG_TAG` | `pi-vpn-pooler` | Имя программы / ident в syslog |
| `SYSLOG_LEVEL` | `INFO` | Минимальный уровень пересылки: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`. Установите `DEBUG` для записи полных HTTP-пакетов запросов/ответов к API privacyIDEA. |

### Хранилище пулов

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `POOLS_FILE` | `/app/data/pools.yaml` | Путь к YAML-файлу с определениями пулов |

### privacyIDEA

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PI_API_URL` | `https://localhost:8443` | Базовый URL API privacyIDEA |
| `PI_VERIFY_SSL` | `false` | Проверять TLS-сертификат PI |
| `PI_REQUIRE_OTP` | `false` | Строгий режим 2FA. При `true` пользователи без зарегистрированного TOTP-токена не допускаются ко входу. При `false` пользователи без TOTP допускаются после аутентификации по паролю. |

---

## Процесс аутентификации

У pooler нет локальной базы пользователей. Вся аутентификация делегируется
privacyIDEA с использованием двухшагового challenge-response потока полностью
через `/auth`. Пароль используется ровно один раз (шаг 1) и никогда не
сохраняется в сессию, не кэшируется на клиенте и не передаётся обратно
в браузер.

### Шаг 1 — Пароль + инициация challenge

```
User submits username + password
  → POST /auth { username, password }
     ├─ result.value = { token: JWT }           → no TOTP enrolled (passOnNoToken)
     │                                            └─ if PI_REQUIRE_OTP=true → denied
     │                                            └─ else → login complete, store JWT
     ├─ result.value = false, detail.transaction_id  → TOTP challenge triggered
     │                                            └─ store transaction_id in session
     │                                               (no password!), redirect to OTP
     └─ error                                    → wrong password, re-render
```

### Шаг 2 — Верификация OTP

```
User submits 6-digit TOTP code
  → POST /auth { transaction_id, password=OTP }
     ├─ result.value.token → JWT returned → login complete → redirect to dashboard
     └─ error             → invalid code → retry
```

`transaction_id` связывает два запроса — PI запоминает проверку пароля
из шага 1. Шаг 2 отправляет только `transaction_id` + `password=<OTP>`,
поле `username` не требуется. Ключ сессии `pi_password`, который предыдущая
реализация передавала между шагами, был удалён; передаётся только
`pi_transaction_id`, и он очищается в момент получения JWT.

### Строгий режим OTP (`PI_REQUIRE_OTP`)

| `PI_REQUIRE_OTP` | У пользователя есть TOTP | Результат |
|-------------------|--------------------------|-----------|
| `false` (по умолчанию) | Нет | Вход разрешён после пароля |
| `false` | Да | Необходимо пройти OTP-challenge |
| `true` | Нет | **Вход запрещён** — «обратитесь к администратору» |
| `true` | Да | Необходимо пройти OTP-challenge |

### Защита сессии

Все защищённые представления используют декоратор `@pi_auth_required`, который проверяет:
1. `pi_token` в сессии → если отсутствует, перенаправление на `/login/`
2. `pi_2fa_ok` в сессии → если `False`, перенаправление на `/login/otp/`

---

## Структура проекта

```
pi-vpn-pooler/
├── Makefile                        # Цели сборки/деплоя (cert, secrets, dev, stack…)
├── manage.py
├── requirements.txt                # Django, whitenoise, requests, gunicorn, pyyaml
├── Dockerfile                      # Python 3.13 + gunicorn (продакшн CMD)
├── docker-compose.yaml             # Продакшн: gunicorn + nginx SSL
├── docker-compose.dev.yaml         # Разработка: gunicorn с --reload
├── environment/
│   └── application-pooler.env      # Шаблон переменных окружения (автономный режим)
├── templates/
│   └── nginx.conf.template         # Конфигурация обратного прокси Nginx (терминация SSL)
├── data/
│   └── pools.yaml                  # Определения пулов (YAML, Docker volume)
├── config/
│   ├── settings.py                 # Настройки Django (из переменных окружения, без БД)
│   ├── urls.py                     # Корневая конфигурация URL
│   └── wsgi.py                     # Точка входа WSGI
├── pooler/                         # Основное Django-приложение
│   ├── pi_client.py                # REST API клиент privacyIDEA (/auth с transaction_id)
│   ├── views.py                    # Функциональные представления (логин, 2FA, пулы, аллокации)
│   ├── urls.py                     # Маршрутизация URL (15 маршрутов)
│   ├── pool_store.py               # YAML-хранилище пулов (потокобезопасное, с блокировкой файла)
│   ├── pool_service.py             # Бизнес-логика (выделение, освобождение, валидация)
│   ├── live.py                     # Запросы аллокаций в реальном времени из PI (без локального кэша)
│   ├── ip_utils.py                 # Утилиты CIDR / IP
│   ├── decorators.py               # @pi_auth_required (защита JWT + 2FA)
│   ├── context_processors.py       # Внедрение статуса PI (состояние аутентификации, имя пользователя)
│   ├── view_helpers.py             # Построители контекста для сетки подсети / палитры
│   ├── models.py                   # Пустой (без ORM-моделей)
│   ├── templates/pooler/
│   │   ├── base.html               # Макет (боковая панель + верхняя панель + слот палитры)
│   │   ├── _sidebar.html           # Левая навигация с счётчиками разделов
│   │   ├── _topbar.html            # Хлебные крошки, индикатор среды, поиск, переключатель языка, выход
│   │   ├── _palette.html           # Точка монтирования палитры команд + JSON-данные
│   │   ├── _badge.html             # Примитив бейджа (тона: accent/ok/warn/bad)
│   │   ├── _progress.html          # Тонкий линейный индикатор 3px (авто-тон по процентам)
│   │   ├── _status_dot.html        # Точка статуса 6px с мягким кольцом
│   │   ├── _subnet_grid.html       # Сетка хостов подсети (рендер на клиенте)
│   │   ├── _icon.html              # Обёртка <use href="#name"/> для SVG-спрайта
│   │   ├── login.html              # Карточка входа (логин + пароль)
│   │   ├── login_otp.html          # Шаг OTP (6-значный TOTP-код)
│   │   ├── dashboard.html          # Обзор: статистика + карточки пулов + сетки подсетей
│   │   ├── pool_list.html          # Сортируемая таблица с фильтрами по столбцам
│   │   ├── pool_detail.html        # Статистика + карта подсети + форма выделения + аллокации
│   │   ├── pool_form.html          # Создание / редактирование пула
│   │   └── allocation_list.html    # Кросс-пуловый поиск + пагинация
│   └── static/pooler/
│       ├── style.css               # Токенизированная дизайн-система
│       ├── icons.svg               # SVG-спрайт (стиль lucide, обводка 1.6)
│       ├── favicon.svg             # Фавикон
│       ├── app.js                  # Переключатель боковой панели, g-аккорды, модал подтверждения, копирование по клику
│       ├── palette.js              # Палитра команд ⌘K
│       ├── table.js                # Сортируемые заголовки + фильтр по столбцам
│       ├── subnet.js               # Рендерер ячеек сетки подсети
│       └── toast.js                # Преобразование сообщений Django в всплывающие уведомления
└── locale/                         # Переводы i18n (ru, en)
```

---

## URL-маршруты

| Метод | Путь | Представление | Описание |
|-------|------|---------------|----------|
| GET/POST | `/login/` | `login_view` | Аутентификация по паролю через PI JWT |
| GET/POST | `/login/otp/` | `login_otp_view` | Верификация OTP (challenge-response, шаг 2) |
| GET | `/logout/` | `logout_view` | Очистка сессии |
| GET | `/` | `dashboard_view` | Обзор пулов с карточками утилизации |
| GET | `/pools/` | `pool_list_view` | Список всех пулов |
| GET/POST | `/pools/create/` | `pool_create_view` | Создание нового пула |
| GET | `/pools/<id>/` | `pool_detail_view` | Детали пула + аллокации + форма выделения |
| GET/POST | `/pools/<id>/edit/` | `pool_edit_view` | Редактирование метаданных пула |
| POST | `/pools/<id>/delete/` | `pool_delete_view` | Удаление пула (только если пустой) |
| POST | `/pools/<id>/allocate/` | `allocate_view` | Выделение IP пользователю |
| POST | `/pools/<id>/release/` | `release_view` | Освобождение IP пользователя |
| GET | `/allocations/` | `allocation_list_view` | Кросс-пуловый поиск + пагинация |
| GET | `/api/users/?realm=X` | `api_users` | JSON: имена пользователей для автодополнения |
| GET | `/api/pools/<id>/free-ips/` | `api_free_ips` | JSON: свободные IP в пуле |

---

## Как это работает

### Процесс выделения IP

```
1. Admin selects pool, realm, username, IP (or "Next available")
2. Live PI check ── query all users in realm ─── IP already used? REJECT
3. Live PI check ── user already has IP in pool? ─────────────── REJECT
4. Cross-realm PI scan ── GET /user/ for ALL realms ── IP found? REJECT
5. PI API call ── POST /user/attribute {user, realm, key, value}
6. Success ── redirect back, fresh live query confirms allocation
```

Каждая проверка аллокации запрашивает privacyIDEA в реальном времени. Нет
локального кэша, который мог бы устареть. Кросс-realm сканирование (шаг 4)
обеспечивает глобальную уникальность IP, даже если атрибуты были установлены
напрямую в панели администрирования PI.

### Хранилище пулов

Пулы хранятся в `/app/data/pools.yaml` (смонтирован как Docker volume).
Запись использует `fcntl.flock()` для потокобезопасности между воркерами gunicorn.

```yaml
pools:
  - id: a1b2c3d4
    name: VPN1
    cidr: 172.20.50.0/24
    attr_key: VPN1-IP
    description: Main VPN pool
    gateway_ip: 172.20.50.1
    created_at: '2024-01-15T10:30:00+00:00'
```

---

## Правила валидации

| Правило | Реализация |
|---------|------------|
| Глобальная уникальность IP | Кросс-realm сканирование PI в реальном времени перед каждым выделением |
| Один IP на пользователя в пуле | Проверка текущих пользовательских атрибутов PI в реальном времени |
| Предотвращение пересечения CIDR | `ipaddress.ip_network.overlaps()` проверяется при создании пула |
| Исключение сетевого/широковещательного адресов | `ipaddress.ip_network.hosts()` пропускает их автоматически |
| Исключение шлюза | Удаляется из списка свободных IP, если настроен |
| Ограничение размера подсети | Максимум `/16` (65534 хоста) для предотвращения случайного создания огромных пулов |
| Требуется политика PI | Выделение завершается с понятной ошибкой, если политика `set_custom_user_attributes` отсутствует |

---

## Устранение неполадок

### «Authentication failed» при входе

- Проверьте работу PI: `curl -k https://localhost:8443/healthz/`
- Убедитесь, что переменная `PI_API_URL` указывает на правильный адрес
- Из Docker-сети PI доступен по `https://reverse_proxy`
- С хоста PI доступен по `https://localhost:8443`

### «OTP is required but you have no TOTP token enrolled»

Эта ошибка появляется, когда `PI_REQUIRE_OTP=true`, а у пользователя нет
TOTP-токена. Либо зарегистрируйте TOTP-токен для пользователя, либо установите
`PI_REQUIRE_OTP=false`.

### «Failed to set attribute» при выделении

- Убедитесь, что политика администратора PI `set_custom_user_attributes` настроена
  (Config > Policies > создайте политику со scope `admin`)
- Политика должна разрешать ключ атрибута, используемый пулом (например, `VPN1-IP: *`)

### Challenge не срабатывает (нет запроса OTP)

- Убедитесь, что политика `authentication` настроена с `challenge_response: totp`
  и `otppin: userstore` (см. [Настройка политик privacyIDEA](#3-настройка-политик-privacyidea))
- Убедитесь, что у пользователя есть активный, не отозванный TOTP-токен

### Контейнер не запускается

```bash
docker compose -f docker-compose.dev.yaml logs app
```

Частые проблемы:
- Порт 5000 уже занят — измените `PROXY_PORT` в переменных окружения
- PI недоступен — проверьте `PI_API_URL`

---

## Логирование и syslog

Логирование в консоль (stdout) всегда включено. Удалённая пересылка rsyslog включается через `SYSLOG_ENABLED=true` + указание `SYSLOG_HOST`. Всё настраивается через переменные окружения `SYSLOG_*`, описанные в таблице [переменных Django](#django) выше. Значения по умолчанию: транспорт `udp`, порт `514`, уровень `INFO`.

### Два уровня логирования

| Уровень | Что вы получаете |
|---------|------------------|
| `INFO` (по умолчанию) | Однострочные операционные события: успех/неудача входа, выход, инициация/верификация OTP-challenge, создание/удаление пула, выделение/освобождение IP, ошибки API PI. Безопасно для продакшна. |
| `DEBUG` | Всё из INFO, плюс полные дампы HTTP-пакетов запросов/ответов для каждого вызова API privacyIDEA (см. ниже). Подробно -- предназначено для диагностики. |

### Полные DEBUG-дампы пакетов

При `SYSLOG_LEVEL=DEBUG` (или `DJANGO_DEBUG=true`) `PIClient` логирует полные дампы пакетов для каждого вызова API privacyIDEA:

| Префикс лога | Источник | Когда |
|---------------|----------|-------|
| `PI HTTP >>> <method> <url> headers=… params=… body=…` | Исходящий HTTP-запрос | Перед `requests.request()` |
| `PI HTTP <<< <status> <reason> headers=… body=…` | Входящий HTTP-ответ | После `requests.request()` |

### Редактирование секретов (всегда включено)

Дампы пакетов **редактируются по умолчанию** -- это не переключаемая опция. `PIClient` удаляет значения любого атрибута, заголовка, URL-параметра или JSON-поля, имя которого (без учёта регистра) содержит:

`password`, `pass`, `authorization`, `cookie`, `token`, `secret`, `pi-authorization`

Совпавшие значения заменяются на `***` перед отправкой сообщения. JSON-тела ответов парсятся и редактируются рекурсивно; тела, которые не удалось распарсить, логируются как есть.

### Быстрая проверка

Запустите UDP-слушатель на хосте и настройте переменные окружения:

```
nc -u -l 1514
```

```env
SYSLOG_ENABLED=true
SYSLOG_HOST=host.docker.internal
SYSLOG_PORT=1514
SYSLOG_LEVEL=DEBUG
```

---

## Разработка

### Запуск среды разработки

```bash
make dev        # запуск dev-стека (gunicorn с --reload на :5000)
make logs-dev   # просмотр логов
make stop-dev   # остановка
```

### Выполнение команд Django

Все Python-команды выполняются внутри Docker (никогда на хосте):

```bash
make shell      # Интерактивная оболочка Django

# Или напрямую:
docker compose -f docker-compose.dev.yaml exec app python manage.py collectstatic --noinput
```

### Горячая перезагрузка

Dev-конфигурация compose монтирует директорию проекта как том, поэтому изменения
кода подхватываются автоматически через gunicorn `--reload`.

### Пересборка после изменения зависимостей

```bash
make build
make dev
```

---

## Лицензия

AGPL-3.0-or-later (в соответствии с privacyIDEA).
