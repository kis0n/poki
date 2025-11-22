# История разработки проекта Toki Mini App

## Общее описание проекта
Telegram Mini App для управления напоминаниями с календарём, интеграцией с backend API и автоматической отправкой напоминаний через Telegram Bot.

---

## Структура проекта

```
project/
  backend/
    app/
      __init__.py
      main.py          # FastAPI приложение с CORS
      api.py           # API endpoints (GET, POST, DELETE для reminders и users)
      database.py      # SQLAlchemy настройки (SQLite)
      models.py        # Модели User и Reminder с relationship
      scheduler.py     # (пустой, для будущей реализации)
    requirements.txt   # fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings
    reminders.db       # SQLite база данных

  bot/
    bot.py            # (пустой, для будущей реализации)
    handlers.py       # (пустой)
    config.py         # (пустой)
    requirements.txt  # (пустой)

  webapp/
    index.html        # HTML структура с Flatpickr календарём
    style.css         # Стили для Telegram Mini App
    script.js         # Основная логика календаря и API интеграция
    telegram.js       # Интеграция с Telegram WebApp SDK
```

---

## Этапы разработки

### 1. Создание структуры проекта
**Действия:**
- Создана структура папок и файлов
- Инициализирован git репозиторий
- Создан первый коммит "Initial backend implementation and API ready"
- Создана ветка `feature/frontend` для разработки фронтенда

---

### 2. Backend разработка

#### 2.1. Базовая настройка
**Файлы:**
- `backend/requirements.txt`: fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings
- `backend/app/database.py`: SQLite база данных, SessionLocal, Base
- `backend/app/models.py`: Модели User и Reminder

**Модели:**
```python
# User модель
- id (Integer, primary_key)
- name (String, nullable)
- reminders (relationship с cascade="all, delete", back_populates="user")

# Reminder модель
- id (Integer, primary_key)
- user_id (Integer, ForeignKey("users.id"))
- text (String)
- remind_at (DateTime)
- user (relationship с back_populates="reminders")
```

#### 2.2. API Endpoints
**Файл:** `backend/app/api.py`

**Endpoints:**
- `GET /reminders/{user_id}` - получить все напоминания пользователя
  - Проверяет существование пользователя (404 если не найден)
- `POST /reminders` - создать напоминание
  - Параметры: user_id, text, remind_at
  - Проверяет дубликаты (user_id, text, remind_at) - обновляет существующее вместо создания нового
- `DELETE /reminders/{reminder_id}` - удалить напоминание
  - 404 если напоминание не найдено
- `POST /users` - создать пользователя
  - Параметры: name (опционально)
  - Возвращает созданного пользователя
- `DELETE /users/{user_id}` - удалить пользователя и все его напоминания (каскадное удаление)

#### 2.3. Main приложение
**Файл:** `backend/app/main.py`
- FastAPI приложение
- CORS middleware настроен (allow_origins=["*"])
- Создание таблиц через Base.metadata.create_all()

**Запуск:**
```bash
cd project/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### 3. Frontend разработка

#### 3.1. Базовая структура
**Файл:** `webapp/index.html`
- Базовая HTML разметка
- Подключение Flatpickr календаря через CDN
- Подключение Telegram WebApp SDK
- Структура: календарь сверху, список напоминаний снизу

#### 3.2. Календарь (Flatpickr)
**Библиотека:** Flatpickr (inline режим, русская локализация)

**Особенности:**
- Inline календарь (всегда видимый)
- Русская локализация
- Диапазон дат: 2023-2030
- Кастомный селектор года (встроен в шапку календаря)
- Скрыт стандартный год в шапке Flatpickr
- Убраны hover-эффекты для селекторов месяца и года
- Фон селекторов прозрачный (сливаются с шапкой календаря)

**Стили:**
- Размер шрифта месяца и года: 14px
- Высота селекторов: 28px
- Цвет выбранного дня: #ff8200 (оранжевый)
- Адаптивный дизайн для Telegram Mini App

#### 3.3. Стилизация
**Файл:** `webapp/style.css`
- Максимальная ширина: 450px (для Telegram Mini App)
- Белый фон календаря с тенью
- Стили для списка напоминаний
- Адаптивность для мобильных устройств

**Важные стили:**
- `.flatpickr-current-month #year-select` - прозрачный фон, белая стрелка
- `.flatpickr-current-month .flatpickr-monthDropdown-months` - прозрачный фон
- Скрыт `.flatpickr-input` элемент

#### 3.4. JavaScript логика
**Файл:** `webapp/script.js`

**Основные функции:**
- `formatDateTitle(date)` - форматирование даты для заголовка ("Ноябрь 20")
- `renderSelectedDateTitle()` - обновление заголовка выбранной даты
- `renderRemindersList()` - отображение списка напоминаний (пока статично)
- `fillYearDropdown(min, max, current)` - заполнение селектора года
- Flatpickr инициализация с обработчиками onChange, onMonthChange, onYearChange

**Переменные:**
- `selectedDate` - текущая выбранная дата
- `userId` - ID пользователя из Telegram WebApp
- `API_BASE_URL` - базовый URL API (http://localhost:8000)

---

### 4. Интеграция с Telegram WebApp

#### 4.1. Telegram WebApp SDK
**Файл:** `webapp/telegram.js`

**Реализация:**
- Подключение Telegram WebApp SDK через CDN
- Получение user_id из `window.Telegram.WebApp.initDataUnsafe.user.id`
- Fallback для разработки: тестовый user_id = 12345
- Экспорт user_id в `window.telegramUserId`

**Проверка:**
- В консоли должен отображаться user_id
- Работает как в Telegram, так и в браузере (с тестовым ID)

---

### 5. Интеграция с Backend API

#### 5.1. Настройка API
**Файл:** `webapp/script.js`

**Константы:**
- `API_BASE_URL = 'http://localhost:8000'`

#### 5.2. Функция получения напоминаний
**Функция:** `fetchReminders(userId, selectedDate)`

**Логика:**
1. Проверка наличия userId
2. GET запрос к `/reminders/{user_id}`
3. Обработка ответа:
   - 404 → возвращает [] (пользователь не найден)
   - Успех → фильтрует напоминания по выбранной дате
4. Возвращает массив напоминаний для выбранной даты

**Вспомогательная функция:**
- `formatDateForFilter(date)` - форматирует дату в YYYY-MM-DD для сравнения

**Обработка ошибок:**
- Сетевые ошибки → возвращает []
- Все ошибки логируются в консоль

**Проверка:**
- Функция работает корректно
- CORS настроен правильно
- 404 обрабатывается без критических ошибок

---

## Текущее состояние проекта

### ✅ Реализовано:
1. Backend API полностью функционален
2. База данных с моделями User и Reminder
3. Календарь с Flatpickr (inline, русская локализация)
4. Кастомный селектор года (2023-2030)
5. Интеграция с Telegram WebApp SDK
6. Функция получения напоминаний из API
7. CORS настроен для работы фронтенда

### 🔄 В процессе:
- Этап 4: Отображение напоминаний в списке

### 📋 Следующие шаги:
1. Отображение напоминаний в списке (этап 4)
2. Обновление списка при выборе даты (этап 5)
3. Индикаторы на календаре для дней с напоминаниями (этап 6)
4. Обработка ошибок и edge cases (этап 7)
5. Создание напоминаний через UI
6. Удаление напоминаний
7. Парсинг времени из текста
8. Scheduler для автоматической отправки напоминаний
9. Telegram Bot интеграция

---

## Важные детали и решения

### Backend:
- SQLite база данных (reminders.db)
- Каскадное удаление: при удалении пользователя удаляются все его напоминания
- Проверка дубликатов при создании напоминания
- CORS настроен для всех источников (в продакшене нужно ограничить)

### Frontend:
- Flatpickr календарь в inline режиме
- Кастомный селектор года встроен в шапку календаря
- Прозрачные фоны для селекторов (сливаются с шапкой)
- Размер шрифта: 14px для месяца и года
- Высота селекторов: 28px

### API:
- Базовый URL: http://localhost:8000
- Endpoints используют user_id из Telegram WebApp
- Все endpoints возвращают JSON

---

## Git ветки

- `main` - основная ветка с backend
- `feature/frontend` - ветка с фронтендом (закоммичена)
- `feature/frontend-api-integration` - текущая ветка для интеграции с API

---

## Команды для запуска

### Backend:
```bash
cd project/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend:
Открыть `project/webapp/index.html` в браузере или через локальный сервер

---

## Тестовые данные

- Тестовый user_id для разработки: 12345
- API Base URL: http://localhost:8000

---

## Примечания

- Backend должен быть запущен для работы API
- В реальном Telegram Mini App будет использоваться реальный user_id
- Для тестирования можно создать пользователя через POST /users
- CORS настроен для разработки (в продакшене нужно ограничить домены)

---

**Последнее обновление:** После этапа 3 интеграции с API
**Текущий этап:** Готов к этапу 4 (отображение напоминаний в списке)

