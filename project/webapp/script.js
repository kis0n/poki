const calendarEl = document.getElementById('calendar');
const dateTitleEl = document.getElementById('selected-date');
const remindersListEl = document.getElementById('reminders-list');
const yearSelect = document.getElementById('year-select');

// Получаем user_id из Telegram WebApp
let userId = window.telegramUserId || null;
console.log('User ID для API запросов:', userId);

// Блок выбора пользователя для разработки
const devUserSelector = document.getElementById('dev-user-selector');
const userIdInput = document.getElementById('user-id-input');
const applyUserBtn = document.getElementById('apply-user-btn');

// Показываем блок выбора пользователя, если используем тестовый ID (режим разработки)
if (userId === 12345 || !window.Telegram || !window.Telegram.WebApp) {
    devUserSelector.style.display = 'block';
    if (userId === 12345) {
        userIdInput.value = userId;
    }
}

// Глобальная переменная для instance Flatpickr
let flatpickrInstance = null;

// Обработчик кнопки "Применить"
applyUserBtn.addEventListener('click', async () => {
    const newUserId = parseInt(userIdInput.value);
    if (newUserId && newUserId > 0) {
        userId = newUserId;
        console.log('User ID изменён на:', userId);
        // Перезагружаем напоминания для текущей даты
        renderRemindersList(null); // Показываем индикатор загрузки
        const reminders = await fetchReminders(userId, selectedDate);
        renderRemindersList(reminders);
        // Обновляем индикаторы на календаре
        if (flatpickrInstance) {
            await loadCalendarIndicators(flatpickrInstance);
        }
    } else {
        alert('Введите корректный User ID (число больше 0)');
    }
});

// Настройка API
const API_BASE_URL = 'http://localhost:8000';
console.log('API Base URL:', API_BASE_URL);

// Функция для получения всех напоминаний пользователя (без фильтрации)
async function fetchAllReminders(userId) {
    if (!userId) {
        console.warn('User ID не найден, пропускаем запрос к API');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reminders/${userId}`);
        
        if (response.status === 404) {
            console.log('Пользователь не найден или нет напоминаний');
            return [];
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allReminders = await response.json();
        console.log('Все напоминания получены:', allReminders);
        return allReminders;
        
    } catch (error) {
        console.error('Ошибка при получении напоминаний:', error);
        return [];
    }
}

// Функция для получения напоминаний пользователя (с фильтрацией по дате)
async function fetchReminders(userId, selectedDate) {
    const allReminders = await fetchAllReminders(userId);
    
    // Фильтруем напоминания по выбранной дате
    const selectedDateStr = formatDateForFilter(selectedDate);
    const filteredReminders = allReminders.filter(reminder => {
        const reminderDate = new Date(reminder.remind_at);
        const reminderDateStr = formatDateForFilter(reminderDate);
        return reminderDateStr === selectedDateStr;
    });
    
    console.log('Напоминания на выбранную дату:', filteredReminders);
    return filteredReminders;
}

// Вспомогательная функция для форматирования даты для сравнения (YYYY-MM-DD)
function formatDateForFilter(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Функция для определения дней с напоминаниями в месяце
function getDaysWithReminders(reminders, year, month) {
    const daysWithReminders = new Set();
    
    reminders.forEach(reminder => {
        const reminderDate = new Date(reminder.remind_at);
        if (reminderDate.getFullYear() === year && reminderDate.getMonth() === month) {
            daysWithReminders.add(reminderDate.getDate());
        }
    });
    
    return daysWithReminders;
}

// Функция для обновления индикаторов на календаре
function updateCalendarIndicators(daysWithReminders, currentYear, currentMonth) {
    // Находим все дни в календаре Flatpickr (только дни текущего месяца)
    const calendarDays = document.querySelectorAll('.flatpickr-day:not(.flatpickr-disabled)');
    
    calendarDays.forEach(day => {
        // Пропускаем дни из других месяцев (серые)
        if (day.classList.contains('flatpickr-other-month')) {
            // Убираем индикаторы с дней других месяцев
            day.classList.remove('has-reminder');
            return;
        }
        
        const dayNumber = parseInt(day.textContent.trim());
        if (!isNaN(dayNumber) && dayNumber > 0 && dayNumber <= 31) {
            if (daysWithReminders.has(dayNumber)) {
                // Добавляем только класс - точка будет через CSS ::after
                day.classList.add('has-reminder');
            } else {
                // Убираем класс
                day.classList.remove('has-reminder');
            }
        }
    });
}

// Переменная для хранения последних загруженных напоминаний
let cachedReminders = [];

// Функция для загрузки и обновления индикаторов на календаре
async function loadCalendarIndicators(instance) {
    if (!userId) {
        return;
    }
    
    try {
        const allReminders = await fetchAllReminders(userId);
        cachedReminders = allReminders; // Сохраняем для быстрого восстановления
        const currentYear = instance.currentYear;
        const currentMonth = instance.currentMonth;
        const daysWithReminders = getDaysWithReminders(allReminders, currentYear, currentMonth);
        
        // Небольшая задержка, чтобы календарь успел отрендериться
        setTimeout(() => {
            updateCalendarIndicators(daysWithReminders, currentYear, currentMonth);
        }, 100);
    } catch (error) {
        console.error('Ошибка при загрузке индикаторов:', error);
    }
}

// Функция для быстрого восстановления индикаторов без перезагрузки данных
function restoreCalendarIndicators(instance) {
    if (!userId || cachedReminders.length === 0) {
        return;
    }
    
    const currentYear = instance.currentYear;
    const currentMonth = instance.currentMonth;
    const daysWithReminders = getDaysWithReminders(cachedReminders, currentYear, currentMonth);
    
    // Используем requestAnimationFrame для синхронизации с перерисовкой браузера
    requestAnimationFrame(() => {
        updateCalendarIndicators(daysWithReminders, currentYear, currentMonth);
        
        // Дополнительная попытка через небольшую задержку на случай, если календарь ещё обновляется
        setTimeout(() => {
            updateCalendarIndicators(daysWithReminders, currentYear, currentMonth);
        }, 10);
    });
}

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function pad(num) { return (num < 10 ? '0' : '') + num; }

function renderCalendar(year, month) {
  calendarEl.innerHTML = '';
  // Дни недели
  for (let i = 0; i < 7; i++) {
    const nameEl = document.createElement('div');
    nameEl.className = 'day-name';
    nameEl.innerText = dayNames[i];
    calendarEl.appendChild(nameEl);
  }
  // Первый день месяца
  const firstDay = new Date(year, month, 1);
  let firstWeekDay = firstDay.getDay();
  if (firstWeekDay === 0) firstWeekDay = 7; // Воскресенье
  // Количество дней в месяце
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Пустые ячейки до 1го дня
  for (let i = 1; i < firstWeekDay; i++) {
    calendarEl.appendChild(document.createElement('div'));
  }
  // Дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    if (
      i === selectedDate.getDate() &&
      year === selectedDate.getFullYear() &&
      month === selectedDate.getMonth()
    ) {
      dayEl.classList.add('selected');
    }
    dayEl.innerText = i;
    dayEl.addEventListener('click', () => {
      selectedDate = new Date(year, month, i);
      renderCalendar(year, month);
      renderSelectedDateTitle();
      renderRemindersList();
    });
    calendarEl.appendChild(dayEl);
  }
}

// Функция для форматирования времени (HH:MM)
function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Функция для показа индикатора загрузки
function showLoadingIndicator() {
    remindersListEl.innerHTML = '<li class="loading-indicator"><div class="spinner"></div></li>';
}

// Функция для отображения списка напоминаний
function renderRemindersList(reminders = []) {
    if (reminders === null) {
        // null означает, что нужно показать загрузку
        showLoadingIndicator();
        return;
    }
    
    if (!reminders || reminders.length === 0) {
        remindersListEl.innerHTML = '<li class="no-reminders">Нет напоминаний</li>';
        return;
    }
    
    remindersListEl.innerHTML = '';
    reminders.forEach(reminder => {
        const li = document.createElement('li');
        const time = formatTime(reminder.remind_at);
        li.innerHTML = `<span style="color: #ff8200; font-weight: 600; margin-right: 8px;">${time}</span>${reminder.text}`;
        remindersListEl.appendChild(li);
    });
}

function renderSelectedDateTitle() {
  dateTitleEl.innerText = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
}

let selectedDate = new Date();

function formatDateTitle(date) {
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function renderSelectedDateTitle() {
    dateTitleEl.innerText = formatDateTitle(selectedDate);
}


function fillYearDropdown(min, max, current) {
  yearSelect.innerHTML = '';
  for (let y = min; y <= max; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.text = y;
    if (y === current) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

const MIN_YEAR = 2023;
const MAX_YEAR = 2030;
fillYearDropdown(MIN_YEAR, MAX_YEAR, selectedDate.getFullYear());

let fp = flatpickr("#calendar", {
    inline: true,
    locale: "ru",
    defaultDate: selectedDate,
    minDate: "2023-01",
    maxDate: "2030-12-31",
    onReady: function(selectedDates, dateStr, instance) {
      flatpickrInstance = instance; // Сохраняем instance
      // Переместить селектор внутрь календаря в шапку
      const monthEl = instance.calendarContainer.querySelector(".flatpickr-current-month");
      if (monthEl && !monthEl.querySelector('#year-select')) {
        monthEl.appendChild(yearSelect);
        yearSelect.style.display = '';
        yearSelect.style.marginLeft = '10px';
      }
      // Загружаем индикаторы для текущего месяца
      loadCalendarIndicators(instance);
      
      // MutationObserver для автоматического восстановления индикаторов при изменениях в календаре
      const calendarContainer = instance.calendarContainer;
      let restoreTimeout = null;
      const observer = new MutationObserver(() => {
        // Debounce: восстанавливаем индикаторы только после небольшой задержки
        if (cachedReminders.length > 0) {
          if (restoreTimeout) {
            clearTimeout(restoreTimeout);
          }
          restoreTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
              restoreCalendarIndicators(instance);
            });
          }, 50);
        }
      });
      
      // Наблюдаем за изменениями в контейнере календаря
      observer.observe(calendarContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    },
    onMonthChange: async function(selectedDates, dateStr, instance) {
      yearSelect.value = instance.currentYear;
      // Обновляем индикаторы при смене месяца
      setTimeout(async () => {
        await loadCalendarIndicators(instance);
      }, 200);
    },
    onYearChange: async function(selectedDates, dateStr, instance) {
      yearSelect.value = instance.currentYear;
      // Обновляем индикаторы при смене года
      setTimeout(async () => {
        await loadCalendarIndicators(instance);
      }, 200);
    },
    onChange: async function(selectedDates) {
        if(selectedDates.length > 0) {
            selectedDate = selectedDates[0];
            yearSelect.value = selectedDate.getFullYear();
        }
        renderSelectedDateTitle();
        
        // Загружаем напоминания для выбранной даты
        renderRemindersList(null); // Показываем индикатор загрузки
        const reminders = await fetchReminders(userId, selectedDate);
        renderRemindersList(reminders);
        
        // Восстанавливаем индикаторы после выбора даты (без перезагрузки данных)
        if (flatpickrInstance) {
            restoreCalendarIndicators(flatpickrInstance);
        }
    },
});

yearSelect.addEventListener('change', async function() {
    const year = +this.value;
    fp.setDate(new Date(year, fp.currentMonth, 1), false);
    
    // Обновляем индикаторы после смены года
    if (flatpickrInstance) {
        setTimeout(async () => {
            await loadCalendarIndicators(flatpickrInstance);
        }, 200);
    }
});

document.querySelector('.calendar-controls').style.display = 'none'; // скрыть div-обёртку select вне календаря

// Инициализация: загружаем напоминания для текущей даты
renderSelectedDateTitle();
(async () => {
    renderRemindersList(null); // Показываем индикатор загрузки
    const reminders = await fetchReminders(userId, selectedDate);
    renderRemindersList(reminders);
    
    // Обновляем индикаторы на календаре после загрузки
    if (flatpickrInstance) {
        setTimeout(async () => {
            await loadCalendarIndicators(flatpickrInstance);
        }, 300);
    }
})();
