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

    // ===== РАСПИСАНИЕ ИЗ GOOGLE КАЛЕНДАРЯ =====
    // Службы — обычные события со временем, праздник дня — событие «на весь день».
    const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const TIME_ZONE = 'Europe/Moscow';
    const DAYS_AHEAD = 60;

    // «2026-10-31» → дата в локальном времени
    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }

    function renderSchedule(container, events) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Группируем события по дням
        const days = new Map();
        events.forEach(ev => {
            if (!ev.summary || !ev.start) return;
            const allDay = !ev.start.dateTime;
            // dateTime приходит уже в московском времени: «2026-10-31T16:00:00+03:00»
            const raw = allDay ? ev.start.date : ev.start.dateTime;
            const key = raw.slice(0, 10);
            if (!days.has(key)) days.set(key, { date: parseDate(key), feast: '', services: [] });
            const day = days.get(key);
            if (allDay) {
                day.feast = day.feast ? day.feast + '. ' + ev.summary : ev.summary;
            } else {
                day.services.push({ time: raw.slice(11, 16), service: ev.summary });
            }
        });

        const sorted = Array.from(days.values())
            .filter(day => day.date >= today)
            .sort((a, b) => a.date - b.date);
        if (!sorted.length) {
            container.innerHTML = '<p class="schedule-status"><i class="fas fa-calendar-times"></i>Расписание на ближайшие дни пока не опубликовано.</p>';
            return;
        }

        container.innerHTML = sorted.map(day => {
            const d = day.date;
            const isToday = d.getTime() === today.getTime();
            const isFeast = d.getDay() === 0 || day.feast;
            day.services.sort((a, b) => a.time.localeCompare(b.time));
            return `
                <div class="schedule-day${isToday ? ' is-today' : ''}${isFeast ? ' is-feast' : ''}">
                    <div class="schedule-date">
                        <span class="schedule-daynum">${d.getDate()}</span>
                        <span class="schedule-month">${MONTHS[d.getMonth()]}</span>
                        <span class="schedule-weekday">${isToday ? 'Сегодня' : WEEKDAYS[d.getDay()]}</span>
                    </div>
                    <div class="schedule-body">
                        ${day.feast ? `<div class="schedule-feast">${escapeHTML(day.feast)}</div>` : ''}
                        ${day.services.map(s => `
                            <div class="schedule-service">
                                <span class="schedule-time">${escapeHTML(s.time)}</span>
                                <span>${escapeHTML(s.service)}</span>
                            </div>`).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    // Без API-ключа — встраиваем стандартный виджет календаря в режиме «Расписание»
    function embedCalendar(container, calendarId) {
        const src = 'https://calendar.google.com/calendar/embed'
            + '?src=' + encodeURIComponent(calendarId)
            + '&ctz=' + encodeURIComponent(TIME_ZONE)
            + '&mode=AGENDA&hl=ru&showTitle=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0';
        container.innerHTML = `<div class="schedule-embed"><iframe src="${src}" loading="lazy" title="Расписание богослужений"></iframe></div>`;
    }

    function loadSchedule() {
        const container = document.getElementById('schedule-list');
        if (!container) return;
        const calendarId = container.dataset.calendarId.trim();
        const apiKey = container.dataset.apiKey.trim();
        const showError = text => {
            container.innerHTML = `<p class="schedule-status"><i class="fas fa-exclamation-circle"></i>${text}</p>`;
        };

        if (!calendarId) {
            showError('Расписание ещё не подключено.');
            return;
        }
        if (!apiKey) {
            embedCalendar(container, calendarId);
            return;
        }

        const from = new Date();
        from.setHours(0, 0, 0, 0);
        const to = new Date(from.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);
        const params = new URLSearchParams({
            key: apiKey,
            timeMin: from.toISOString(),
            timeMax: to.toISOString(),
            timeZone: TIME_ZONE,
            singleEvents: 'true',   // разворачивает повторяющиеся службы
            orderBy: 'startTime',
            maxResults: '250'
        });
        fetch('https://www.googleapis.com/calendar/v3/calendars/'
              + encodeURIComponent(calendarId) + '/events?' + params)
            .then(res => {
                if (!res.ok) throw new Error(res.status);
                return res.json();
            })
            .then(data => renderSchedule(container, data.items || []))
            .catch(err => {
                console.error('Не удалось загрузить расписание:', err);
                // Если API недоступно — хотя бы показываем виджет календаря
                embedCalendar(container, calendarId);
            });
    }

    loadSchedule();

    // ===== ПОЖЕРТВОВАНИЯ: РЕКВИЗИТЫ И QR-КОД =====
    // Заполните реквизиты прихода — QR-код для оплаты построится автоматически.
    // Для QR нужны: name, account, bic, bankName, corrAccount. Пустые поля на сайте не показываются.
    const DONATION = {
        name: '',          // Получатель — полное наименование прихода, как в банке
        inn: '',           // ИНН
        kpp: '',           // КПП
        account: '',       // Расчётный счёт, 20 цифр
        bankName: '',      // Название банка
        bic: '',           // БИК, 9 цифр
        corrAccount: '',   // Корреспондентский счёт, 20 цифр
        purpose: 'Добровольное пожертвование на уставную деятельность',
        card: ''           // Номер карты (необязательно)
    };

    // Платёжный QR по стандарту банков РФ (ГОСТ Р 56042), кодировка UTF-8
    function buildPaymentString(d) {
        const fields = [
            ['Name', d.name], ['PersonalAcc', d.account], ['BankName', d.bankName],
            ['BIC', d.bic], ['CorrespAcc', d.corrAccount], ['PayeeINN', d.inn],
            ['KPP', d.kpp], ['Purpose', d.purpose]
        ];
        return 'ST00012|' + fields
            .filter(([, value]) => value)
            .map(([key, value]) => key + '=' + value.replace(/\|/g, ' '))
            .join('|');
    }

    function copyText(text, btn) {
        const done = () => {
            const original = btn.innerHTML;
            btn.classList.add('is-copied');
            btn.innerHTML = '<i class="fas fa-check"></i>Скопировано';
            setTimeout(() => {
                btn.classList.remove('is-copied');
                btn.innerHTML = original;
            }, 2000);
        };
        // Запасной вариант — для старых браузеров и если доступ к буферу запрещён
        const fallback = () => {
            const area = document.createElement('textarea');
            area.value = text;
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand('copy');
            area.remove();
            if (ok) done();
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, fallback);
        } else {
            fallback();
        }
    }

    function renderDonation() {
        const qrBox = document.getElementById('donate-qr-code');
        const caption = document.getElementById('donate-qr-caption');
        const details = document.getElementById('donate-details');
        if (!qrBox || !details) return;
        const d = DONATION;

        // QR-код
        const canQR = d.name && d.account && d.bic && d.bankName && d.corrAccount
                      && typeof qrcode === 'function';
        if (canQR) {
            qrcode.stringToBytes = str => Array.from(new TextEncoder().encode(str));
            const qr = qrcode(0, 'M');
            qr.addData(buildPaymentString(d), 'Byte');
            qr.make();
            qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
            caption.innerHTML = '<i class="fas fa-mobile-alt"></i> Отсканируйте в приложении своего банка и введите сумму';
        } else {
            qrBox.classList.add('is-empty');
            qrBox.innerHTML = '<i class="fas fa-qrcode"></i><span>QR-код появится<br>в ближайшее время</span>';
            caption.textContent = '';
        }

        // Реквизиты
        if (!d.account) {
            details.innerHTML = `
                <p class="donate-pending"><i class="fas fa-hourglass-half"></i>Реквизиты для перевода появятся в ближайшее время.</p>
                <p class="donate-pending"><i class="fas fa-church"></i>Пожертвовать можно и в храме.</p>`;
            return;
        }

        const rows = [
            ['Получатель', d.name], ['ИНН', d.inn], ['КПП', d.kpp],
            ['Расчётный счёт', d.account], ['Банк', d.bankName], ['БИК', d.bic],
            ['Корр. счёт', d.corrAccount], ['Назначение', d.purpose], ['Номер карты', d.card]
        ].filter(([, value]) => value);

        details.innerHTML = `
            <dl class="donate-rows">
                ${rows.map(([label, value]) => `
                    <div class="donate-row"><dt>${label}</dt><dd>${escapeHTML(value)}</dd></div>`).join('')}
            </dl>
            <button type="button" class="copy-btn" data-copy="details"><i class="far fa-copy"></i>Скопировать реквизиты</button>
            ${d.card ? '<button type="button" class="copy-btn" data-copy="card"><i class="far fa-credit-card"></i>Скопировать номер карты</button>' : ''}`;

        details.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.copy === 'card'
                    ? d.card.replace(/\s/g, '')
                    : rows.filter(([label]) => label !== 'Номер карты')
                          .map(([label, value]) => label + ': ' + value).join('\n');
                copyText(text, btn);
            });
        });
    }

    renderDonation();

    // ===== ДОПОЛНИТЕЛЬНАЯ ФУНКЦИЯ: АНИМАЦИЯ ПРИ ЗАГРУЗКЕ =====
    // Добавляем класс "loaded" для плавного появления
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

    console.log('✅ Сайт храма успешно загружен!');
    console.log('📌 Версия: 3.0 (раздельная структура)');

})();