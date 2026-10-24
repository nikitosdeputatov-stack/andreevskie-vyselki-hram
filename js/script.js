/* ============================================================
   СКРИПТЫ ДЛЯ САЙТА ХРАМА
   Версия: 1.0 (полное разделение)
   ============================================================ */

(function() {
    'use strict';

    // ===== ОСНОВНЫЕ ЭЛЕМЕНТЫ =====
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // ===== ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК =====
    function switchTab(tabId) {
        // Убираем активный класс у всех кнопок
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Убираем активный класс у всего контента
        contents.forEach(content => content.classList.remove('active'));

        // Добавляем активный класс нужной кнопке
        const activeBtn = Array.from(buttons).find(btn => btn.dataset.tab === tabId);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Показываем нужный контент
        const activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // ===== ОБРАБОТЧИКИ КЛИКОВ ПО КНОПКАМ =====
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tabId = this.dataset.tab;
            switchTab(tabId);
            
            // Меняем URL (для кнопок "Назад/Вперёд")
            history.pushState(null, '', '#' + tabId);
        });
    });

    // ===== ОБРАБОТКА ЗАГРУЗКИ СТРАНИЦЫ =====
    const hash = window.location.hash.replace('#', '');
    
    if (hash && document.getElementById(hash)) {
        // Если в URL есть якорь — открываем нужную вкладку
        switchTab(hash);
    } else {
        // Иначе оставляем активную вкладку (по умолчанию первая)
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) {
            switchTab(activeBtn.dataset.tab);
        }
    }

    // ===== ОБРАБОТКА КНОПОК "НАЗАД/ВПЕРЁД" =====
    window.addEventListener('hashchange', function() {
        const newHash = window.location.hash.replace('#', '');
        if (newHash && document.getElementById(newHash)) {
            switchTab(newHash);
        }
    });

    // ===== ДОПОЛНИТЕЛЬНАЯ ФУНКЦИЯ: ПЛАВНАЯ ПРОКРУТКА К ВЕРХУ ПРИ ПЕРЕКЛЮЧЕНИИ =====
    // (опционально, можно раскомментировать, если нужно)
    /*
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Добавляем прокрутку при клике на вкладку
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            setTimeout(scrollToTop, 100);
        });
    });
    */

    // ===== ДОПОЛНИТЕЛЬНАЯ ФУНКЦИЯ: АНИМАЦИЯ ПРИ ЗАГРУЗКЕ =====
    // Добавляем класс "loaded" для плавного появления
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

    console.log('✅ Сайт храма успешно загружен!');
    console.log('📌 Версия: 3.0 (раздельная структура)');

})();