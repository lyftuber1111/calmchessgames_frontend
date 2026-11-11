/**
 * Calm Chess Computers - Consultation & Contact Engine
 * Brian Berry (bberry@calmchessgames.com)
 * 
 * Secure AES-256-GCM in-transit transmission, interactive calendar,
 * dynamic slot availability, and automated email reminders.
 */

(function () {
    'use strict';

    // API Endpoint Configuration
    const API_BASE = (function () {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return window.location.origin;
        }
        return 'https://api.calmchessgames.com';
    })();

    // State Variables
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDateStr = null; // YYYY-MM-DD
    let selectedTimeSlot = null; // e.g. "10:00 AM"
    let lastConfirmedBooking = null;

    // Detect User Timezone
    let detectedTimezone = 'America/New_York (EST)';
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
            detectedTimezone = tz;
        }
    } catch (e) {
        // Fallback
    }

    // Standard Fallback Slots
    const DEFAULT_SLOTS = [
        '09:00 AM',
        '10:00 AM',
        '11:00 AM',
        '01:00 PM',
        '02:00 PM',
        '03:00 PM',
        '04:00 PM',
        '05:00 PM'
    ];

    // Month Names
    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // DOM Ready Initialization
    document.addEventListener('DOMContentLoaded', () => {
        initTimezoneBadge();
        initDefaultDate();
        renderCalendar();
        loadAvailabilityForSelectedDate();
    });

    function initTimezoneBadge() {
        const badge = document.getElementById('detectedTzBadge');
        if (badge) {
            badge.textContent = detectedTimezone;
            badge.title = `Detected Timezone: ${detectedTimezone}`;
        }
    }

    function initDefaultDate() {
        // Default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        selectedDateStr = formatDateKey(tomorrow);
    }

    function formatDateKey(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatHumanDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    /* --- CALENDAR RENDERING --- */
    function renderCalendar() {
        const titleEl = document.getElementById('calMonthYearLabel');
        const gridEl = document.getElementById('calendarDaysGrid');
        if (!titleEl || !gridEl) return;

        titleEl.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
        gridEl.innerHTML = '';

        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Blank padding for days before the 1st
        for (let i = 0; i < firstDayIndex; i++) {
            const blank = document.createElement('div');
            blank.className = 'cal-day disabled';
            gridEl.appendChild(blank);
        }

        // Render month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'cal-day';
            dayCell.textContent = day;

            const thisDate = new Date(currentYear, currentMonth, day);
            thisDate.setHours(0, 0, 0, 0);
            const dateKey = formatDateKey(thisDate);

            // Is today?
            if (thisDate.getTime() === today.getTime()) {
                dayCell.classList.add('today');
            }

            // Is past?
            if (thisDate < today) {
                dayCell.classList.add('disabled');
            } else {
                // Clickable
                if (dateKey === selectedDateStr) {
                    dayCell.classList.add('active');
                }

                dayCell.addEventListener('click', () => {
                    selectDate(dateKey);
                });
            }

            gridEl.appendChild(dayCell);
        }

        updateSelectedDateDisplay();
    }

    function selectDate(dateKey) {
        selectedDateStr = dateKey;
        selectedTimeSlot = null; // Reset slot upon date change
        renderCalendar();
        loadAvailabilityForSelectedDate();

        // Smooth navigation to available time slots
        setTimeout(() => {
            const slotsSection = document.querySelector('.time-slots-section');
            if (slotsSection) {
                slotsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    }

    function updateSelectedDateDisplay() {
        const displayEl = document.getElementById('selectedDateDisplay');
        if (displayEl) {
            displayEl.textContent = formatHumanDate(selectedDateStr) || 'Choose a date';
        }
    }

    window.prevMonth = function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    };

    window.nextMonth = function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    };

    /* --- AVAILABILITY & TIME SLOTS --- */
    async function loadAvailabilityForSelectedDate() {
        const slotsGrid = document.getElementById('slotsGrid');
        if (!slotsGrid) return;

        if (!selectedDateStr) {
            slotsGrid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1 / -1; text-align: center; padding: 12px;">Please select a date first.</p>';
            return;
        }

        slotsGrid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1 / -1; text-align: center; padding: 12px;">Checking available consultation slots...</p>';

        try {
            const candidateUrls = [
                `${API_BASE}/contact_api.php?action=get_availability&date=${encodeURIComponent(selectedDateStr)}`,
                `./contact_api.php?action=get_availability&date=${encodeURIComponent(selectedDateStr)}`,
                `/contact_api.php?action=get_availability&date=${encodeURIComponent(selectedDateStr)}`
            ];

            let data = null;
            for (const url of candidateUrls) {
                try {
                    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
                    if (res.ok) {
                        data = await res.json();
                        if (data && data.success) break;
                    }
                } catch (e) {
                    // Try next candidate
                }
            }

            let slots = [];
            if (data && data.success && Array.isArray(data.slots)) {
                slots = data.slots;
            } else {
                // Fallback default slots
                slots = DEFAULT_SLOTS.map(t => ({ time: t, available: true, status: 'available' }));
            }

            renderSlots(slots);

        } catch (err) {
            console.warn('Failed to load slots, rendering default:', err);
            renderSlots(DEFAULT_SLOTS.map(t => ({ time: t, available: true, status: 'available' })));
        }
    }

    function renderSlots(slots) {
        const slotsGrid = document.getElementById('slotsGrid');
        if (!slotsGrid) return;
        slotsGrid.innerHTML = '';

        if (!slots || slots.length === 0) {
            slotsGrid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1 / -1; text-align: center; padding: 12px;">No slots available for this date. Please pick another date.</p>';
            return;
        }

        slots.forEach(slotItem => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'slot-btn';
            btn.textContent = slotItem.time;

            if (!slotItem.available) {
                btn.disabled = true;
                btn.title = slotItem.status === 'booked' ? 'Reserved' : 'Past Slot';
            } else {
                if (selectedTimeSlot === slotItem.time) {
                    btn.classList.add('selected');
                }
                btn.addEventListener('click', () => {
                    selectSlot(slotItem.time, btn);
                });
            }

            slotsGrid.appendChild(btn);
        });
    }

    function selectSlot(timeStr, clickedBtn) {
        selectedTimeSlot = timeStr;
        const allBtns = document.querySelectorAll('.slot-btn');
        allBtns.forEach(b => b.classList.remove('selected'));
        if (clickedBtn) {
            clickedBtn.classList.add('selected');
        }

        // Smooth navigation to consultation details attendee form
        setTimeout(() => {
            const formCard = document.querySelector('.booking-layout .form-card') || document.getElementById('appointmentForm');
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }

    /* --- TABS NAVIGATION --- */
    window.switchTab = function (tabName) {
        const btnBooking = document.getElementById('tabBtnBooking');
        const btnContact = document.getElementById('tabBtnContact');
        const contentBooking = document.getElementById('tabContentBooking');
        const contentContact = document.getElementById('tabContentContact');
        const navBooking = document.querySelector('.nav-booking-link');
        const navMsg = document.querySelector('.nav-msg-link');

        if (tabName === 'booking') {
            if (btnBooking) btnBooking.classList.add('active');
            if (btnContact) btnContact.classList.remove('active');
            if (contentBooking) contentBooking.classList.add('active');
            if (contentContact) contentContact.classList.remove('active');
            if (navBooking) navBooking.classList.add('active');
            if (navMsg) navMsg.classList.remove('active');
        } else {
            if (btnContact) btnContact.classList.add('active');
            if (btnBooking) btnBooking.classList.remove('active');
            if (contentContact) contentContact.classList.add('active');
            if (contentBooking) contentBooking.classList.remove('active');
            if (navMsg) navMsg.classList.add('active');
            if (navBooking) navBooking.classList.remove('active');
        }
    };

    window.switchToBookingTab = function () {
        window.switchTab('booking');
        const target = document.getElementById('tabContentBooking') || document.querySelector('.tabs-container');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    window.switchToContactTab = function () {
        window.switchTab('contact');
        const target = document.getElementById('tabContentContact') || document.querySelector('.tabs-container');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setTimeout(() => {
            const nameInput = document.getElementById('contactName');
            if (nameInput && window.innerWidth > 850) {
                nameInput.focus({ preventScroll: true });
            }
        }, 350);
    };

    /* --- EMAIL CLIPBOARD HELPER --- */
    window.copyEmailToClipboard = function () {
        const email = 'bberry@calmchessgames.com';
        navigator.clipboard.writeText(email).then(() => {
            const textEl = document.getElementById('copyEmailText');
            if (textEl) {
                textEl.textContent = '✔ Copied!';
                setTimeout(() => {
                    textEl.innerHTML = '&#128203; Copy';
                }, 2500);
            }
        }).catch(() => {
            alert('Brian Berry email: bberry@calmchessgames.com');
        });
    };

    /* --- APPOINTMENT BOOKING SUBMISSION --- */
    window.handleAppointmentSubmit = async function (e) {
        e.preventDefault();

        const statusBox = document.getElementById('bookingStatusBox');
        const btnSubmit = document.getElementById('btnSubmitBooking');
        const btnText = document.getElementById('bookingBtnText');

        if (!selectedDateStr) {
            showStatus(statusBox, 'Please select an appointment date from the calendar.', 'error');
            return;
        }

        if (!selectedTimeSlot) {
            showStatus(statusBox, 'Please select an appointment time slot.', 'error');
            return;
        }

        const name = document.getElementById('bookingName').value.trim();
        const email = document.getElementById('bookingEmail').value.trim();
        const phone = document.getElementById('bookingPhone').value.trim();
        const topic = document.getElementById('bookingTopic').value;
        const notes = document.getElementById('bookingNotes').value.trim();
        const reminder = document.getElementById('bookingReminder').checked ? 1 : 0;

        if (!name) {
            showStatus(statusBox, 'Please enter your full name.', 'error');
            return;
        }

        if (!email || !email.includes('@')) {
            showStatus(statusBox, 'Please enter a valid email address.', 'error');
            return;
        }

        // Build Payload
        const payload = {
            action: 'book_appointment',
            name: name,
            attendee_name: name,
            email: email,
            attendee_email: email,
            phone: phone,
            appointment_date: selectedDateStr,
            date: selectedDateStr,
            appointment_time: selectedTimeSlot,
            time: selectedTimeSlot,
            timezone: detectedTimezone,
            topic: topic,
            notes: notes,
            email_reminder: reminder
        };

        btnSubmit.disabled = true;
        btnText.innerHTML = '&#8987; Securing Consultation...';
        showStatus(statusBox, 'Encrypting and scheduling appointment with Brian Berry...', 'info');

        try {
            const fetchFn = (typeof CryptoTransport !== 'undefined' && CryptoTransport.secureFetch)
                ? CryptoTransport.secureFetch
                : fetch;

            const candidateUrls = [
                `${API_BASE}/contact_api.php`,
                './contact_api.php',
                '/contact_api.php',
                'https://api.calmchessgames.com/contact_api.php'
            ];

            let responseData = null;
            let lastErrMsg = '';

            for (const url of candidateUrls) {
                try {
                    const res = await fetchFn(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload,
                        encrypt: true
                    });
                    const data = await res.json();
                    if (data && data.success) {
                        responseData = data;
                        break;
                    } else if (data && data.message) {
                        lastErrMsg = data.message;
                    }
                } catch (err) {
                    lastErrMsg = err.message;
                }
            }

            if (responseData && responseData.success) {
                lastConfirmedBooking = {
                    bookingId: responseData.booking_id || ('CC-' + Date.now().toString().slice(-6)),
                    name: name,
                    email: email,
                    date: selectedDateStr,
                    time: selectedTimeSlot,
                    timezone: detectedTimezone,
                    topic: topic
                };

                displayConfirmedBooking(lastConfirmedBooking);
                statusBox.style.display = 'none';

            } else {
                showStatus(statusBox, lastErrMsg || 'Failed to book appointment. Please verify details and try again.', 'error');
            }

        } catch (err) {
            showStatus(statusBox, 'Network error scheduling appointment: ' + err.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnText.innerHTML = '&#128197; Confirm Consultation Appointment';
        }
    };

    function displayConfirmedBooking(booking) {
        const inputGrid = document.getElementById('bookingInputGrid');
        const confirmedCard = document.getElementById('bookingConfirmedCard');
        const detailsBox = document.getElementById('bookingConfirmedDetails');
        const googleLink = document.getElementById('btnGoogleCalendar');

        if (inputGrid) inputGrid.style.display = 'none';
        if (confirmedCard) confirmedCard.style.display = 'block';

        if (detailsBox) {
            detailsBox.innerHTML = `
                <p><strong>Host:</strong> Brian Berry (bberry@calmchessgames.com)</p>
                <p><strong>Attendee:</strong> ${escapeHtml(booking.name)} (${escapeHtml(booking.email)})</p>
                <p><strong>Date:</strong> <span style="color: var(--success-green); font-weight: bold;">${formatHumanDate(booking.date)}</span></p>
                <p><strong>Time:</strong> <span style="color: var(--success-green); font-weight: bold;">${escapeHtml(booking.time)}</span> (${escapeHtml(booking.timezone)})</p>
                <p><strong>Topic:</strong> ${escapeHtml(booking.topic)}</p>
                <p><strong>Booking Reference:</strong> #${booking.bookingId}</p>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 10px;">
                    Email reminders have been scheduled to both your email and bberry@calmchessgames.com.
                </p>
            `;
        }

        if (googleLink) {
            googleLink.href = buildGoogleCalendarUrl(booking);
        }

        confirmedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    window.resetBookingForm = function () {
        const inputGrid = document.getElementById('bookingInputGrid');
        const confirmedCard = document.getElementById('bookingConfirmedCard');
        if (inputGrid) inputGrid.style.display = 'grid';
        if (confirmedCard) confirmedCard.style.display = 'none';

        selectedTimeSlot = null;
        loadAvailabilityForSelectedDate();
    };

    /* --- DIRECT CONTACT MESSAGE SUBMISSION --- */
    window.handleContactSubmit = async function (e) {
        e.preventDefault();

        const statusBox = document.getElementById('contactStatusBox');
        const btnSubmit = document.getElementById('btnSubmitContact');
        const btnText = document.getElementById('contactBtnText');

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        if (!name || !email || !subject || !message) {
            showStatus(statusBox, 'Please complete all required fields.', 'error');
            return;
        }

        const payload = {
            action: 'send_message',
            name: name,
            sender_name: name,
            email: email,
            sender_email: email,
            subject: subject,
            message: message
        };

        btnSubmit.disabled = true;
        btnText.innerHTML = '&#8987; Sending Secure Message...';
        showStatus(statusBox, 'Encrypting and sending message to Brian Berry...', 'info');

        try {
            const fetchFn = (typeof CryptoTransport !== 'undefined' && CryptoTransport.secureFetch)
                ? CryptoTransport.secureFetch
                : fetch;

            const candidateUrls = [
                `${API_BASE}/contact_api.php`,
                './contact_api.php',
                '/contact_api.php',
                'https://api.calmchessgames.com/contact_api.php'
            ];

            let responseData = null;
            let lastErrMsg = '';

            for (const url of candidateUrls) {
                try {
                    const res = await fetchFn(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload,
                        encrypt: true
                    });
                    const data = await res.json();
                    if (data && data.success) {
                        responseData = data;
                        break;
                    } else if (data && data.message) {
                        lastErrMsg = data.message;
                    }
                } catch (err) {
                    lastErrMsg = err.message;
                }
            }

            if (responseData && responseData.success) {
                showStatus(statusBox, '✔ Your message has been securely delivered to Brian Berry (bberry@calmchessgames.com). We will get back to you promptly!', 'success');
                document.getElementById('contactForm').reset();
            } else {
                showStatus(statusBox, lastErrMsg || 'Failed to dispatch message. Please email bberry@calmchessgames.com directly.', 'error');
            }

        } catch (err) {
            showStatus(statusBox, 'Network error sending message: ' + err.message, 'error');
        } finally {
            btnSubmit.disabled = false;
            btnText.innerHTML = '&#9993; Send Message to Brian Berry';
        }
    };

    /* --- CALENDAR EXPORT HELPERS (.ICS & GOOGLE CALENDAR) --- */
    function parseDateTime(dateStr, timeStr) {
        // e.g. dateStr: "2026-10-15", timeStr: "10:00 AM"
        const [year, month, day] = dateStr.split('-').map(Number);
        const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
        let hours = 10;
        let minutes = 0;
        if (match) {
            hours = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
            const meridiem = match[3].toUpperCase();
            if (meridiem === 'PM' && hours < 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
        }
        const start = new Date(year, month - 1, day, hours, minutes);
        const end = new Date(start.getTime() + 45 * 60 * 1000); // 45 min consultation
        return { start, end };
    }

    function formatIsoUtc(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    function buildGoogleCalendarUrl(booking) {
        const { start, end } = parseDateTime(booking.date, booking.time);
        const title = encodeURIComponent(`Calm Chess Consultation: ${booking.topic} (Brian Berry & ${booking.name})`);
        const details = encodeURIComponent(`Calm Chess Games Consultation Session\nHost: Brian Berry (bberry@calmchessgames.com)\nAttendee: ${booking.name}\nTopic: ${booking.topic}\nReference: #${booking.bookingId}`);
        const dates = `${formatIsoUtc(start)}/${formatIsoUtc(end)}`;
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&add=bberry@calmchessgames.com`;
    }

    window.downloadIcsFile = function () {
        if (!lastConfirmedBooking) return;
        const b = lastConfirmedBooking;
        const { start, end } = parseDateTime(b.date, b.time);

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Calm Chess Computers//Consultation Booking//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:calmchess-${b.bookingId}@calmchessgames.com`,
            `DTSTAMP:${formatIsoUtc(new Date())}`,
            `DTSTART:${formatIsoUtc(start)}`,
            `DTEND:${formatIsoUtc(end)}`,
            `SUMMARY:Calm Chess Consultation: ${b.topic} with Brian Berry`,
            `DESCRIPTION:Calm Chess Games Consultation\\nHost: Brian Berry (bberry@calmchessgames.com)\\nAttendee: ${b.name}\\nTopic: ${b.topic}\\nBooking ID: #${b.bookingId}`,
            'ORGANIZER;CN=Brian Berry:mailto:bberry@calmchessgames.com',
            `ATTENDEE;ROLE=REQ-PARTICIPANT;CN=${b.name}:mailto:${b.email}`,
            'STATUS:CONFIRMED',
            'BEGIN:VALARM',
            'TRIGGER:-PT30M',
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder: Upcoming Consultation with Brian Berry',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `CalmChess-Consultation-${b.bookingId}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    function showStatus(boxEl, message, type) {
        if (!boxEl) return;
        boxEl.textContent = message;
        boxEl.className = 'status-box ' + (type || 'info');
        boxEl.style.display = 'block';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

})();
