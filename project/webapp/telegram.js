// Telegram WebApp интеграция
let telegramUserId = null;

// Инициализация Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Получаем user_id из initDataUnsafe
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUserId = tg.initDataUnsafe.user.id;
        console.log('Telegram User ID получен:', telegramUserId);
    } else {
        console.warn('Telegram User ID не найден. Работаем в режиме разработки.');
        // Для тестирования вне Telegram можно использовать тестовый ID
        telegramUserId = 12345; // Тестовый ID для разработки
        console.log('Используется тестовый User ID:', telegramUserId);
    }
} else {
    console.warn('Telegram WebApp SDK не загружен. Работаем в режиме разработки.');
    // Для тестирования вне Telegram
    telegramUserId = 12345;
    console.log('Используется тестовый User ID:', telegramUserId);
}

// Экспортируем user_id для использования в других скриптах
window.telegramUserId = telegramUserId;

