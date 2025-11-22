const calendarEl = document.getElementById('calendar');
const dateTitleEl = document.getElementById('selected-date');
const remindersListEl = document.getElementById('reminders-list');
const yearSelect = document.getElementById('year-select');

// Получаем user_id из Telegram WebApp
const userId = window.telegramUserId || null;
console.log('User ID для API запросов:', userId);

// Настройка API
const API_BASE_URL = 'http://localhost:8000';
console.log('API Base URL:', API_BASE_URL);

// Функция для получения напоминаний пользователя
async function fetchReminders(userId, selectedDate) {
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
        
        // Фильтруем напоминания по выбранной дате
        const selectedDateStr = formatDateForFilter(selectedDate);
        const filteredReminders = allReminders.filter(reminder => {
            const reminderDate = new Date(reminder.remind_at);
            const reminderDateStr = formatDateForFilter(reminderDate);
            return reminderDateStr === selectedDateStr;
        });
        
        console.log('Напоминания на выбранную дату:', filteredReminders);
        return filteredReminders;
        
    } catch (error) {
        console.error('Ошибка при получении напоминаний:', error);
        return [];
    }
}

// Вспомогательная функция для форматирования даты для сравнения (YYYY-MM-DD)
function formatDateForFilter(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

function renderRemindersList() {
  // Пока просто "нет напоминаний"
  remindersListEl.innerHTML = '<li class="no-reminders">Нет напоминаний</li>';
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

function renderRemindersList() {
    remindersListEl.innerHTML = '<li class="no-reminders">Нет напоминаний</li>';
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
      // Переместить селектор внутрь календаря в шапку
      const monthEl = instance.calendarContainer.querySelector(".flatpickr-current-month");
      if (monthEl && !monthEl.querySelector('#year-select')) {
        monthEl.appendChild(yearSelect);
        yearSelect.style.display = '';
        yearSelect.style.marginLeft = '10px';
      }
    },
    onMonthChange: function(selectedDates, dateStr, instance) {
      yearSelect.value = instance.currentYear;
    },
    onYearChange: function(selectedDates, dateStr, instance) {
      yearSelect.value = instance.currentYear;
    },
    onChange: function(selectedDates) {
        if(selectedDates.length > 0) {
            selectedDate = selectedDates[0];
            yearSelect.value = selectedDate.getFullYear();
        }
        renderSelectedDateTitle();
        renderRemindersList();
    },
});

yearSelect.addEventListener('change', function() {
    const year = +this.value;
    fp.setDate(new Date(year, fp.currentMonth, 1), false);
});

document.querySelector('.calendar-controls').style.display = 'none'; // скрыть div-обёртку select вне календаря

renderSelectedDateTitle();
renderRemindersList();
