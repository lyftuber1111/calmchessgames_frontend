/**
 * Contact Portal Wooden Mechanical Keyboard Integration
 * Provides acoustic wooden tactile typing, automatic mobile rotation,
 * repeating Backspace on hold, and direct message dispatch to Brian Berry.
 */

(function (global) {
  'use strict';

  // Keyboard Layout matching wood_keyboard0 & wood_keyboard1
  const KEYBOARD_LAYOUT = [
    // ROW 1
    [
      { code: 'Backquote', key: '`', shiftKey: '~', label: '`', shiftLabel: '~', type: 'standard' },
      { code: 'Digit1', key: '1', shiftKey: '!', label: '1', shiftLabel: '!', type: 'standard' },
      { code: 'Digit2', key: '2', shiftKey: '@', label: '2', shiftLabel: '@', type: 'standard' },
      { code: 'Digit3', key: '3', shiftKey: '#', label: '3', shiftLabel: '#', type: 'standard' },
      { code: 'Digit4', key: '4', shiftKey: '$', label: '4', shiftLabel: '$', type: 'standard' },
      { code: 'Digit5', key: '5', shiftKey: '%', label: '5', shiftLabel: '%', type: 'standard' },
      { code: 'Digit6', key: '6', shiftKey: '^', label: '6', shiftLabel: '^', type: 'standard' },
      { code: 'Digit7', key: '7', shiftKey: '&', label: '7', shiftLabel: '&', type: 'standard' },
      { code: 'Digit8', key: '8', shiftKey: '*', label: '8', shiftLabel: '*', type: 'standard' },
      { code: 'Digit9', key: '9', shiftKey: '(', label: '9', shiftLabel: '(', type: 'standard' },
      { code: 'Digit0', key: '0', shiftKey: ')', label: '0', shiftLabel: ')', type: 'standard' },
      { code: 'Minus', key: '-', shiftKey: '_', label: '-', shiftLabel: '_', type: 'standard' },
      { code: 'Equal', key: '=', shiftKey: '+', label: '=', shiftLabel: '+', type: 'standard' },
      { code: 'Backspace', key: 'Backspace', shiftKey: 'Backspace', label: 'Backspace', icon: 'backspace', type: 'backspace', flex: 1.6 }
    ],
    // ROW 2
    [
      { code: 'Tab', key: 'Tab', shiftKey: 'Tab', label: 'Tab', icon: 'tab', type: 'modifier', flex: 1.4 },
      { code: 'KeyQ', key: 'q', shiftKey: 'Q', label: 'Q', type: 'standard' },
      { code: 'KeyW', key: 'w', shiftKey: 'W', label: 'W', type: 'standard' },
      { code: 'KeyE', key: 'e', shiftKey: 'E', label: 'E', type: 'standard' },
      { code: 'KeyR', key: 'r', shiftKey: 'R', label: 'R', type: 'standard' },
      { code: 'KeyT', key: 't', shiftKey: 'T', label: 'T', type: 'standard' },
      { code: 'KeyY', key: 'y', shiftKey: 'Y', label: 'Y', type: 'standard' },
      { code: 'KeyU', key: 'u', shiftKey: 'U', label: 'U', type: 'standard' },
      { code: 'KeyI', key: 'i', shiftKey: 'I', label: 'I', type: 'standard' },
      { code: 'KeyO', key: 'o', shiftKey: 'O', label: 'O', type: 'standard' },
      { code: 'KeyP', key: 'p', shiftKey: 'P', label: 'P', type: 'standard' },
      { code: 'BracketLeft', key: '[', shiftKey: '{', label: '[', shiftLabel: '{', type: 'standard' },
      { code: 'BracketRight', key: ']', shiftKey: '}', label: ']', shiftLabel: '}', type: 'standard' },
      { code: 'Backslash', key: '\\', shiftKey: '|', label: '\\', shiftLabel: '|', type: 'standard', flex: 1.2 }
    ],
    // ROW 3
    [
      { code: 'CapsLock', key: 'CapsLock', shiftKey: 'CapsLock', label: 'Caps Lock', icon: 'caps', type: 'caps', flex: 1.75 },
      { code: 'KeyA', key: 'a', shiftKey: 'A', label: 'A', type: 'standard' },
      { code: 'KeyS', key: 's', shiftKey: 'S', label: 'S', type: 'standard' },
      { code: 'KeyD', key: 'd', shiftKey: 'D', label: 'D', type: 'standard' },
      { code: 'KeyF', key: 'f', shiftKey: 'F', label: 'F', type: 'standard' },
      { code: 'KeyG', key: 'g', shiftKey: 'G', label: 'G', type: 'standard' },
      { code: 'KeyH', key: 'h', shiftKey: 'H', label: 'H', type: 'standard' },
      { code: 'KeyJ', key: 'j', shiftKey: 'J', label: 'J', type: 'standard' },
      { code: 'KeyK', key: 'k', shiftKey: 'K', label: 'K', type: 'standard' },
      { code: 'KeyL', key: 'l', shiftKey: 'L', label: 'L', type: 'standard' },
      { code: 'Semicolon', key: ';', shiftKey: ':', label: ';', shiftLabel: ':', type: 'standard' },
      { code: 'Quote', key: "'", shiftKey: '"', label: "'", shiftLabel: '"', type: 'standard' },
      { code: 'Enter', key: 'Enter', shiftKey: 'Enter', label: 'Enter', icon: 'enter', type: 'enter', flex: 2.05 }
    ],
    // ROW 4
    [
      { code: 'ShiftLeft', key: 'Shift', shiftKey: 'Shift', label: 'Shift', icon: 'shift', type: 'shift', flex: 2.25 },
      { code: 'KeyZ', key: 'z', shiftKey: 'Z', label: 'Z', type: 'standard' },
      { code: 'KeyX', key: 'x', shiftKey: 'X', label: 'X', type: 'standard' },
      { code: 'KeyC', key: 'c', shiftKey: 'C', label: 'C', type: 'standard' },
      { code: 'KeyV', key: 'v', shiftKey: 'V', label: 'V', type: 'standard' },
      { code: 'KeyB', key: 'b', shiftKey: 'B', label: 'B', type: 'standard' },
      { code: 'KeyN', key: 'n', shiftKey: 'N', label: 'N', type: 'standard' },
      { code: 'KeyM', key: 'm', shiftKey: 'M', label: 'M', type: 'standard' },
      { code: 'Comma', key: ',', shiftKey: '<', label: ',', shiftLabel: '<', type: 'standard' },
      { code: 'Period', key: '.', shiftKey: '>', label: '.', shiftLabel: '>', type: 'standard' },
      { code: 'Slash', key: '/', shiftKey: '?', label: '/', shiftLabel: '?', type: 'standard' },
      { code: 'ShiftRight', key: 'Shift', shiftKey: 'Shift', label: 'Shift', icon: 'shift', type: 'shift', flex: 2.45 }
    ],
    // ROW 5
    [
      { code: 'ControlLeft', key: 'Ctrl', label: 'Ctrl', type: 'modifier', flex: 1.3 },
      { code: 'AltLeft', key: 'Alt', label: 'Alt', type: 'modifier', flex: 1.2 },
      { code: 'Space', key: ' ', shiftKey: ' ', label: 'Space', type: 'space', flex: 6.2 },
      { code: 'AltRight', key: 'Alt', label: 'Alt', type: 'modifier', flex: 1.2 },
      { code: 'ClearKey', key: 'Clear', label: 'Clear', icon: 'clear', type: 'action', flex: 1.3 },
      { code: 'CopyKey', key: 'Copy', label: 'Copy', icon: 'copy', type: 'action', flex: 1.3 }
    ]
  ];

  const SVG_ICONS = {
    backspace: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
        <line x1="18" y1="9" x2="12" y2="15"/>
        <line x1="12" y1="9" x2="18" y2="15"/>
      </svg>
    `,
    enter: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 10 4 15 9 20"/>
        <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
      </svg>
    `,
    shift: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 3 4 11 9 11 9 21 15 21 15 11 20 11 12 3"/>
      </svg>
    `,
    caps: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 4 5 11 9 11 9 16 15 16 15 11 19 11 12 4"/>
        <line x1="6" y1="20" x2="18" y2="20"/>
      </svg>
    `,
    tab: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="5 8 9 12 5 16"/>
        <line x1="9" y1="12" x2="19" y2="12"/>
        <line x1="19" y1="7" x2="19" y2="17"/>
      </svg>
    `,
    copy: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    `,
    clear: `
      <svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `
  };

  const keyElementsMap = new Map();
  let isShiftActive = false;
  let isCapsLockActive = false;
  let isKeyboardOpen = false;
  let manualRotatePreference = null;
  let backspaceRepeatTimer = null;
  let backspaceInterval = null;

  function stopBackspaceRepeat() {
    if (backspaceRepeatTimer) {
      clearTimeout(backspaceRepeatTimer);
      backspaceRepeatTimer = null;
    }
    if (backspaceInterval) {
      clearInterval(backspaceInterval);
      backspaceInterval = null;
    }
  }

  // Audio helper
  function playKeySound(type, isPress = true) {
    if (window.woodAudio) {
      try {
        if (window.woodAudio.ctx && window.woodAudio.ctx.state === 'suspended') {
          window.woodAudio.ctx.resume();
        }
        if (isPress) {
          window.woodAudio.playKeyPress(type);
        } else {
          window.woodAudio.playKeyRelease(type);
        }
      } catch (_) {}
    }
  }

  // Render the keyboard grid into container
  function renderKeyboardGrid() {
    const gridEl = document.getElementById('contact-virtual-keyboard');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    keyElementsMap.clear();

    KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = `keyboard-row row-${rowIndex + 1}`;

      row.forEach(keyData => {
        const keyBtn = document.createElement('button');
        keyBtn.type = 'button';
        keyBtn.className = `wood-key key-type-${keyData.type}`;
        keyBtn.dataset.code = keyData.code;
        keyBtn.dataset.type = keyData.type;
        keyBtn.setAttribute('aria-label', keyData.label);

        if (keyData.flex) {
          keyBtn.style.flex = `${keyData.flex} 1 0px`;
        } else {
          keyBtn.style.flex = `1 1 0px`;
        }

        const keyCap = document.createElement('div');
        keyCap.className = 'key-cap';

        if (keyData.code === 'CapsLock') {
          const led = document.createElement('span');
          led.className = 'caps-indicator-dot';
          keyCap.appendChild(led);
        }

        const contentSpan = document.createElement('span');
        contentSpan.className = 'key-label-wrapper';

        if (keyData.icon && SVG_ICONS[keyData.icon]) {
          contentSpan.innerHTML = SVG_ICONS[keyData.icon] + `<span class="icon-label-text">${keyData.label}</span>`;
        } else if (keyData.shiftLabel) {
          contentSpan.innerHTML = `
            <span class="shift-glyph">${keyData.shiftLabel}</span>
            <span class="main-glyph">${keyData.label}</span>
          `;
        } else {
          contentSpan.innerHTML = `<span class="main-glyph">${keyData.label}</span>`;
        }

        keyCap.appendChild(contentSpan);
        keyBtn.appendChild(keyCap);
        rowEl.appendChild(keyBtn);

        keyElementsMap.set(keyData.code, { el: keyBtn, data: keyData });
        setupKeyListeners(keyBtn, keyData);
      });

      gridEl.appendChild(rowEl);
    });
  }

  // Listeners on virtual buttons with repeating Backspace
  function setupKeyListeners(keyBtn, keyData) {
    const handleDown = (e) => {
      if (e.cancelable) e.preventDefault();
      pressKey(keyData.code, true);

      // Backspace repeat when held down
      if (keyData.code === 'Backspace') {
        stopBackspaceRepeat();
        backspaceRepeatTimer = setTimeout(() => {
          backspaceInterval = setInterval(() => {
            pressKey('Backspace', true);
            releaseKey('Backspace', false);
          }, 60);
        }, 360);
      }
    };

    const handleUp = (e) => {
      if (e.cancelable) e.preventDefault();
      if (keyData.code === 'Backspace') {
        stopBackspaceRepeat();
      }
      releaseKey(keyData.code, true);
    };

    const handleCancel = () => {
      if (keyData.code === 'Backspace') {
        stopBackspaceRepeat();
      }
      releaseKey(keyData.code, false);
    };

    keyBtn.addEventListener('pointerdown', handleDown);
    keyBtn.addEventListener('pointerup', handleUp);
    keyBtn.addEventListener('pointerleave', handleCancel);
    keyBtn.addEventListener('pointercancel', handleCancel);
  }

  window.addEventListener('pointerup', stopBackspaceRepeat);
  window.addEventListener('pointercancel', stopBackspaceRepeat);

  function pressKey(code, isVirtual = false) {
    const entry = keyElementsMap.get(code);
    if (!entry) return;

    const { el, data } = entry;
    el.classList.add('is-pressed');
    playKeySound(data.type, true);

    processKeyInput(data);
  }

  function releaseKey(code, triggerReleaseSound = true) {
    const entry = keyElementsMap.get(code);
    if (!entry) return;

    const { el, data } = entry;
    el.classList.remove('is-pressed');
    if (triggerReleaseSound) {
      playKeySound(data.type, false);
    }
  }

  function processKeyInput(keyData) {
    const field = document.getElementById('wood-kb-textarea');
    const contactMessage = document.getElementById('contactMessage');
    if (!field) return;

    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    let val = field.value;

    switch (keyData.type) {
      case 'standard': {
        let charToInsert = '';
        const shouldBeUpper = isShiftActive ? !isCapsLockActive : isCapsLockActive;

        if (keyData.shiftLabel) {
          charToInsert = isShiftActive ? keyData.shiftKey : keyData.key;
        } else {
          charToInsert = shouldBeUpper ? keyData.shiftKey : keyData.key;
        }

        field.value = val.substring(0, start) + charToInsert + val.substring(end);
        field.selectionStart = field.selectionEnd = start + charToInsert.length;

        if (isShiftActive) {
          isShiftActive = false;
          updateShiftVisuals();
        }
        break;
      }

      case 'space': {
        field.value = val.substring(0, start) + ' ' + val.substring(end);
        field.selectionStart = field.selectionEnd = start + 1;
        break;
      }

      case 'enter': {
        field.value = val.substring(0, start) + '\n' + val.substring(end);
        field.selectionStart = field.selectionEnd = start + 1;
        break;
      }

      case 'backspace': {
        if (start === end) {
          if (start > 0) {
            field.value = val.substring(0, start - 1) + val.substring(end);
            field.selectionStart = field.selectionEnd = start - 1;
          }
        } else {
          field.value = val.substring(0, start) + val.substring(end);
          field.selectionStart = field.selectionEnd = start;
        }
        break;
      }

      case 'shift': {
        isShiftActive = !isShiftActive;
        updateShiftVisuals();
        break;
      }

      case 'caps': {
        isCapsLockActive = !isCapsLockActive;
        updateCapsLockVisuals();
        break;
      }

      case 'modifier': {
        if (keyData.code === 'Tab') {
          field.value = val.substring(0, start) + '  ' + val.substring(end);
          field.selectionStart = field.selectionEnd = start + 2;
        }
        break;
      }

      case 'action': {
        if (keyData.code === 'ClearKey') {
          clearKeyboardText();
        } else if (keyData.code === 'CopyKey') {
          copyKeyboardText();
        }
        break;
      }
    }

    // Sync to main form message
    if (contactMessage) {
      contactMessage.value = field.value;
    }
    updateKeyboardStats();
  }

  function updateKeyboardStats() {
    const field = document.getElementById('wood-kb-textarea');
    if (!field) return;
    const text = field.value;

    const charCountEl = document.getElementById('kb-char-count');
    const wordCountEl = document.getElementById('kb-word-count');
    if (charCountEl) charCountEl.textContent = text.length;
    if (wordCountEl) {
      const trimmed = text.trim();
      wordCountEl.textContent = trimmed ? trimmed.split(/\s+/).length : 0;
    }
  }

  function updateShiftVisuals() {
    const shiftLeft = keyElementsMap.get('ShiftLeft');
    const shiftRight = keyElementsMap.get('ShiftRight');
    [shiftLeft, shiftRight].forEach(s => {
      if (s) {
        s.el.classList.toggle('is-active-modifier', isShiftActive);
      }
    });

    keyElementsMap.forEach(entry => {
      const { el, data } = entry;
      if (data.type === 'standard') {
        const glyphEl = el.querySelector('.main-glyph');
        if (glyphEl && /^[a-zA-Z]$/.test(data.key)) {
          const shouldBeUpper = isShiftActive ? !isCapsLockActive : isCapsLockActive;
          glyphEl.textContent = shouldBeUpper ? data.shiftKey : data.key;
        }
      }
    });
  }

  function updateCapsLockVisuals() {
    const capsEntry = keyElementsMap.get('CapsLock');
    if (capsEntry) {
      capsEntry.el.classList.toggle('is-active-modifier', isCapsLockActive);
      const dot = capsEntry.el.querySelector('.caps-indicator-dot');
      if (dot) dot.classList.toggle('lit', isCapsLockActive);
    }
    updateShiftVisuals();
  }

  function copyKeyboardText() {
    const field = document.getElementById('wood-kb-textarea');
    if (!field || !field.value) {
      alert('Message display is empty.');
      return;
    }
    navigator.clipboard.writeText(field.value).then(() => {
      alert('✔ Message copied to clipboard!');
    }).catch(() => {
      field.select();
      document.execCommand('copy');
      alert('✔ Message copied to clipboard!');
    });
  }

  function clearKeyboardText() {
    const field = document.getElementById('wood-kb-textarea');
    const contactMessage = document.getElementById('contactMessage');
    if (field) field.value = '';
    if (contactMessage) contactMessage.value = '';
    updateKeyboardStats();
  }

  // Mobile Auto-Rotate handler
  function checkMobileAutoRotate() {
    if (!isKeyboardOpen) return;
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 900);
    const isPortrait = window.matchMedia('(orientation: portrait)').matches || (window.innerHeight > window.innerWidth);

    if (manualRotatePreference !== null) {
      if (manualRotatePreference) {
        document.body.classList.add('mobile-auto-rotate');
      } else {
        document.body.classList.remove('mobile-auto-rotate');
      }
    } else {
      if (isMobile && isPortrait) {
        document.body.classList.add('mobile-auto-rotate');
        try {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        } catch (_) {}
      } else {
        document.body.classList.remove('mobile-auto-rotate');
      }
    }
  }

  // Open the wooden keyboard modal
  function openWoodKeyboard() {
    const modal = document.getElementById('woodKeyboardModal');
    if (!modal) return;

    isKeyboardOpen = true;
    modal.style.display = 'flex';
    document.body.classList.add('wood-kb-open');

    // Sync current message from contact form
    const contactMessage = document.getElementById('contactMessage');
    const field = document.getElementById('wood-kb-textarea');
    if (contactMessage && field) {
      field.value = contactMessage.value || '';
    }

    renderKeyboardGrid();
    updateKeyboardStats();
    checkMobileAutoRotate();

    if (window.woodAudio && window.woodAudio.init) {
      window.woodAudio.init();
    }
  }

  // Close the wooden keyboard modal
  function closeWoodKeyboard() {
    const modal = document.getElementById('woodKeyboardModal');
    if (!modal) return;

    isKeyboardOpen = false;
    modal.style.display = 'none';
    document.body.classList.remove('wood-kb-open');
    document.body.classList.remove('mobile-auto-rotate');
    stopBackspaceRepeat();

    // Sync back
    const field = document.getElementById('wood-kb-textarea');
    const contactMessage = document.getElementById('contactMessage');
    if (field && contactMessage) {
      contactMessage.value = field.value;
    }
  }

  // Send Message button handler on the wooden keyboard
  async function handleKeyboardSendMessage() {
    const field = document.getElementById('wood-kb-textarea');
    const contactMessage = document.getElementById('contactMessage');
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    const contactSubject = document.getElementById('contactSubject');

    const msg = field ? field.value.trim() : '';
    if (!msg) {
      alert('Please type a message before sending.');
      return;
    }

    if (contactMessage) contactMessage.value = msg;

    // Check if name is provided
    let nameVal = contactName ? contactName.value.trim() : '';
    if (!nameVal) {
      nameVal = prompt('Please enter your Name for Brian Berry:');
      if (!nameVal || !nameVal.trim()) {
        alert('Your name is required to dispatch the message.');
        return;
      }
      if (contactName) contactName.value = nameVal.trim();
    }

    // Check if email is provided
    let emailVal = contactEmail ? contactEmail.value.trim() : '';
    if (!emailVal || !emailVal.includes('@')) {
      emailVal = prompt('Please enter your Email Address so Brian can respond:');
      if (!emailVal || !emailVal.trim() || !emailVal.includes('@')) {
        alert('A valid email address is required.');
        return;
      }
      if (contactEmail) contactEmail.value = emailVal.trim();
    }

    // Check if subject is provided
    let subjVal = contactSubject ? contactSubject.value.trim() : '';
    if (!subjVal) {
      subjVal = 'Direct Inquiry via Wooden Mechanical Keyboard';
      if (contactSubject) contactSubject.value = subjVal;
    }

    const sendBtn = document.getElementById('send-kb-btn');
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '⏳ Sending...';
    }

    try {
      if (typeof window.handleContactSubmit === 'function') {
        const dummyForm = document.getElementById('contactForm');
        const fakeEvent = new Event('submit', { cancelable: true });
        await window.handleContactSubmit(fakeEvent);
      }
      alert('✔ Your message has been securely delivered to Brian Berry (bberry@calmchessgames.com)!');
      clearKeyboardText();
      closeWoodKeyboard();
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = '✉️ Send Message';
      }
    }
  }

  // Physical keyboard synchronization while wooden keyboard modal is open
  window.addEventListener('keydown', (e) => {
    if (!isKeyboardOpen) return;
    const code = e.code;
    const entry = keyElementsMap.get(code);

    if (entry) {
      if (!e.repeat) {
        entry.el.classList.add('is-pressed');
        playKeySound(entry.data.type, true);
      } else if (code === 'Backspace') {
        playKeySound('backspace', true);
      }
    }

    if (e.key === 'CapsLock') {
      isCapsLockActive = e.getModifierState('CapsLock');
      updateCapsLockVisuals();
    } else if (e.key === 'Shift') {
      isShiftActive = true;
      updateShiftVisuals();
    }

    setTimeout(() => {
      const field = document.getElementById('wood-kb-textarea');
      const contactMessage = document.getElementById('contactMessage');
      if (field && contactMessage) contactMessage.value = field.value;
      updateKeyboardStats();
    }, 10);
  });

  window.addEventListener('keyup', (e) => {
    if (!isKeyboardOpen) return;
    const code = e.code;
    const entry = keyElementsMap.get(code);

    if (entry) {
      entry.el.classList.remove('is-pressed');
      playKeySound(entry.data.type, false);
    }

    if (e.key === 'CapsLock') {
      isCapsLockActive = e.getModifierState('CapsLock');
      updateCapsLockVisuals();
    } else if (e.key === 'Shift') {
      isShiftActive = false;
      updateShiftVisuals();
    }

    setTimeout(updateKeyboardStats, 10);
  });

  // Setup DOM bindings when ready
  function initContactKeyboard() {
    const contactMessage = document.getElementById('contactMessage');
    const btnOpen = document.getElementById('btnOpenWoodKeyboard');
    const btnClose = document.getElementById('close-keyboard-btn');
    const btnSend = document.getElementById('send-kb-btn');
    const btnCopy = document.getElementById('copy-kb-btn');
    const btnClear = document.getElementById('clear-kb-btn');
    const btnRotate = document.getElementById('rotate-btn-contact');
    const woodSelect = document.getElementById('wood-select-contact');
    const volSlider = document.getElementById('volume-slider-contact');
    const muteBtn = document.getElementById('mute-btn-contact');
    const field = document.getElementById('wood-kb-textarea');

    if (btnOpen) btnOpen.addEventListener('click', openWoodKeyboard);
    if (btnClose) btnClose.addEventListener('click', closeWoodKeyboard);
    if (btnSend) btnSend.addEventListener('click', handleKeyboardSendMessage);
    if (btnCopy) btnCopy.addEventListener('click', copyKeyboardText);
    if (btnClear) btnClear.addEventListener('click', clearKeyboardText);

    // Auto-open when user clicks or focuses contact message textarea
    if (contactMessage) {
      contactMessage.addEventListener('focus', () => {
        openWoodKeyboard();
      });
      contactMessage.addEventListener('click', () => {
        openWoodKeyboard();
      });
    }

    if (field) {
      field.addEventListener('input', () => {
        if (contactMessage) contactMessage.value = field.value;
        updateKeyboardStats();
      });
    }

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        const isCurrentlyRotated = document.body.classList.contains('mobile-auto-rotate');
        manualRotatePreference = !isCurrentlyRotated;
        if (manualRotatePreference) {
          document.body.classList.add('mobile-auto-rotate');
        } else {
          document.body.classList.remove('mobile-auto-rotate');
        }
      });
    }

    if (woodSelect) {
      woodSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (window.woodAudio && window.woodAudio.setWoodType) {
          window.woodAudio.setWoodType(val);
        }
        const container = document.querySelector('.wood-kb-container');
        if (container) container.dataset.wood = val;
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        if (window.woodAudio && window.woodAudio.setVolume) {
          window.woodAudio.setVolume(parseFloat(e.target.value));
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.woodAudio && window.woodAudio.toggleMute) {
          const isMuted = window.woodAudio.toggleMute();
          muteBtn.classList.toggle('is-muted', isMuted);
          muteBtn.textContent = isMuted ? '🔇' : '🔊';
        }
      });
    }

    window.addEventListener('resize', checkMobileAutoRotate);
    window.addEventListener('orientationchange', checkMobileAutoRotate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactKeyboard);
  } else {
    initContactKeyboard();
  }

  global.openWoodKeyboard = openWoodKeyboard;
  global.closeWoodKeyboard = closeWoodKeyboard;

})(window);
