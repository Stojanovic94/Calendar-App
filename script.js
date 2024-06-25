document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    const eventDialog = document.getElementById('event-dialog');
    const eventForm = document.getElementById('event-form');
    const eventListEl = document.getElementById('event-list');
    const toggleThemeButton = document.getElementById('toggle-theme');
    const toggleEventListButton = document.getElementById('toggle-event-list');
    const saveEventsButton = document.getElementById('save-events');
    const loadEventsInput = document.getElementById('load-events');
    const monthYearEl = document.getElementById('month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const deleteEventButton = document.getElementById('delete-event');

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Array for day names
    let events = JSON.parse(localStorage.getItem('events')) || [];
    let currentDate = new Date();
    let darkTheme = false;
    let draggedEvent = null;

    function renderCalendar() {
        calendarEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearEl.textContent = `${monthNames[month]} ${year}`;

        // Render day names in the calendar
        dayNames.forEach(dayName => {
            const dayNameEl = document.createElement('div');
            dayNameEl.classList.add('day-name');
            dayNameEl.textContent = dayName;
            calendarEl.appendChild(dayNameEl);
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDayEl = document.createElement('div');
            emptyDayEl.classList.add('day');
            calendarEl.appendChild(emptyDayEl);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day');
            dayEl.innerHTML = `<div class="day-header">${day}</div>`;
            dayEl.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Highlight today's date
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayEl.classList.add('today');
            }

            dayEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('event')) {
                    openEventDialog({ date: dayEl.dataset.date });
                }
            });

            dayEl.addEventListener('dragover', (e) => e.preventDefault());
            dayEl.addEventListener('drop', handleDrop);

            const dayEvents = events.filter(event => new Date(event.date).toDateString() === new Date(dayEl.dataset.date).toDateString());
            dayEvents.forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.classList.add('event');
                eventEl.textContent = event.title;
                eventEl.dataset.id = event.id;
                eventEl.draggable = true;
                eventEl.addEventListener('dragstart', handleDragStart);
                eventEl.addEventListener('click', () => openEventDialog(event));
                dayEl.appendChild(eventEl);
            });

            calendarEl.appendChild(dayEl);
        }
    }

    function handleDragStart(e) {
        draggedEvent = events.find(event => event.id === e.target.dataset.id);
        e.target.classList.add('dragging');
    }

    function handleDrop(e) {
        e.target.classList.remove('dragging');
        const date = e.target.dataset.date || e.target.parentElement.dataset.date;
        if (draggedEvent && date) {
            draggedEvent.date = date;
            saveEvents();
            renderCalendar();
            renderEventList();
        }
    }

    function openEventDialog(event = null) {
        if (event) {
            eventForm['event-title'].value = event.title || '';
            eventForm['event-date'].value = event.date || '';
            eventForm['event-time'].value = event.time || '';
            eventForm['event-reminder'].checked = event.reminder || false;
            eventForm.dataset.id = event.id || '';
            deleteEventButton.style.display = 'block';
        } else {
            eventForm.reset();
            delete eventForm.dataset.id;
            deleteEventButton.style.display = 'none';
        }
        eventDialog.style.display = 'block';
    }

    function closeEventDialog() {
        eventDialog.style.display = 'none';
    }

    function saveEvent(e) {
        e.preventDefault();
        const title = eventForm['event-title'].value;
        const date = eventForm['event-date'].value;
        const time = eventForm['event-time'].value;
        const reminder = eventForm['event-reminder'].checked;
        const id = eventForm.dataset.id || Date.now().toString();

        const eventIndex = events.findIndex(event => event.id === id);
        if (eventIndex > -1) {
            events[eventIndex] = { id, title, date, time, reminder };
        } else {
            events.push({ id, title, date, time, reminder });
        }

        saveEvents();
        renderCalendar();
        renderEventList();
        closeEventDialog();
    }

    function deleteEvent() {
        const id = eventForm.dataset.id;
        if (id) {
            events = events.filter(event => event.id !== id);
            saveEvents();
            renderCalendar();
            renderEventList();
            closeEventDialog();
        }
    }

    function saveEvents() {
        localStorage.setItem('events', JSON.stringify(events));
    }

    function downloadEvents() {
        const blob = new Blob([JSON.stringify(events)], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'events.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadEvents(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                events = JSON.parse(event.target.result);
                saveEvents();
                renderCalendar();
                renderEventList();
            };
            reader.readAsText(file);
        }
    }

    function renderEventList() {
        eventListEl.innerHTML = '';
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.textContent = `${event.date}: ${event.title}`;
            eventItem.classList.add('event-item');
            eventItem.addEventListener('click', () => {
                currentDate = new Date(event.date);
                renderCalendar();
                highlightEvent(event.id);
            });
            eventListEl.appendChild(eventItem);
        });
    }

    function highlightEvent(eventId) {
        const eventEl = document.querySelector(`.event[data-id="${eventId}"]`);
        if (eventEl) {
            eventEl.classList.add('highlight');
            setTimeout(() => {
                eventEl.classList.remove('highlight');
            }, 2000);
        }
    }

    function toggleTheme() {
        darkTheme = !darkTheme;
        document.body.classList.toggle('dark-theme', darkTheme);
    }

    toggleThemeButton.addEventListener('click', toggleTheme);
    toggleEventListButton.addEventListener('click', () => {
        eventListEl.style.display = eventListEl.style.display === 'none' ? 'block' : 'none';
    });

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    eventForm.addEventListener('submit', saveEvent);
    document.getElementById('close-dialog').addEventListener('click', closeEventDialog);
    saveEventsButton.addEventListener('click', downloadEvents);
    loadEventsInput.addEventListener('change', loadEvents);
    deleteEventButton.addEventListener('click', deleteEvent);

    renderCalendar();
    renderEventList();
});
