/**
 * Virtual Keyboard Controller
 * Handles visual interactions, physical keyboard syncing, text field manipulation,
 * responsive scaling, and mechanical wooden audio triggering.
 */

document.addEventListener('DOMContentLoaded', () => {
  const displayField = document.getElementById('text-display');
  const keyboardEl = document.getElementById('virtual-keyboard');
  const charCountEl = document.getElementById('char-count');
  const wordCountEl = document.getElementById('word-count');
  const keyPressCountEl = document.getElementById('keypress-count');
  const capsLed = document.getElementById('caps-led');
  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');
  const copyBtn = document.getElementById('copy-btn');
  const clearBtn = document.getElementById('clear-btn');
  const demoBtn = document.getElementById('demo-btn');
  const woodSelect = document.getElementById('wood-select');
  const toast = document.getElementById('toast');

  let isShiftActive = false;
  let isCapsLockActive = false;
  let totalKeyPresses = 0;

  // Key mapping definition for rendering and physical sync
  // Each key: { code: 'KeyQ', key: 'q', shiftKey: 'Q', label: 'Q', type: 'standard', width: 1 }
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

  // SVG Icons library for keys
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

  // Render the keyboard grid
  function renderKeyboard() {
    keyboardEl.innerHTML = '';

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

        // Keycap inner structure with wood grain SVG overlay & bevel styling
        const keyCap = document.createElement('div');
        keyCap.className = 'key-cap';

        // Add special LED indicator to CapsLock
        if (keyData.code === 'CapsLock') {
          const led = document.createElement('span');
          led.className = 'caps-indicator-dot';
          keyCap.appendChild(led);
        }

        // Key content (icon or glyphs)
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

        // Store in lookup map
        keyElementsMap.set(keyData.code, { el: keyBtn, data: keyData });

        // Touch & Click event handling
        setupKeyListeners(keyBtn, keyData);
      });

      keyboardEl.appendChild(rowEl);
    });
  }

  // Setup interactions for virtual keys
  function setupKeyListeners(keyBtn, keyData) {
    const handleDown = (e) => {
      // Prevent default to stop mobile OS from focusing/summoning native virtual keyboard
      if (e.cancelable) {
        e.preventDefault();
      }
      pressKey(keyData.code, true);
    };

    const handleUp = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      releaseKey(keyData.code, true);
    };

    const handleCancel = () => {
      releaseKey(keyData.code, false);
    };

    keyBtn.addEventListener('pointerdown', handleDown);
    keyBtn.addEventListener('pointerup', handleUp);
    keyBtn.addEventListener('pointerleave', handleCancel);
    keyBtn.addEventListener('pointercancel', handleCancel);
  }

  // Handle key press logic
  function pressKey(code, isVirtual = false) {
    const entry = keyElementsMap.get(code);
    if (!entry) return;

    const { el, data } = entry;
    el.classList.add('is-pressed');

    // Trigger wooden click sound
    window.woodAudio.playKeyPress(data.type);

    totalKeyPresses++;
    if (keyPressCountEl) {
      keyPressCountEl.textContent = totalKeyPresses.toString();
    }

    // Process key input
    processKeyInput(data);
  }

  // Handle key release logic
  function releaseKey(code, triggerReleaseSound = true) {
    const entry = keyElementsMap.get(code);
    if (!entry) return;

    const { el, data } = entry;
    el.classList.remove('is-pressed');

    if (triggerReleaseSound) {
      window.woodAudio.playKeyRelease(data.type);
    }
  }

  // Insert or handle key actions on the display field
  function processKeyInput(keyData) {
    const field = displayField;
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

        // If shift was active for a single tap, reset it
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
          clearText();
        } else if (keyData.code === 'CopyKey') {
          copyText();
        }
        break;
      }
    }

    updateStats();
    if (document.activeElement !== field) {
      field.focus({ preventScroll: true });
    }
    if ('virtualKeyboard' in navigator) {
      try { navigator.virtualKeyboard.hide(); } catch (_) {}
    }
    field.scrollTop = field.scrollHeight;
  }

  // Update statistics (character and word counters)
  function updateStats() {
    const text = displayField.value;
    charCountEl.textContent = text.length;

    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    wordCountEl.textContent = words;
  }

  // Update Shift visual state on keys
  function updateShiftVisuals() {
    const shiftLeft = keyElementsMap.get('ShiftLeft');
    const shiftRight = keyElementsMap.get('ShiftRight');

    [shiftLeft, shiftRight].forEach(s => {
      if (s) {
        if (isShiftActive) {
          s.el.classList.add('is-active-modifier');
        } else {
          s.el.classList.remove('is-active-modifier');
        }
      }
    });

    // Update standard keys display
    keyElementsMap.forEach(entry => {
      const { el, data } = entry;
      if (data.type === 'standard') {
        const glyphEl = el.querySelector('.main-glyph');
        if (glyphEl) {
          const isLetter = /^[a-zA-Z]$/.test(data.key);
          if (isLetter) {
            const shouldBeUpper = isShiftActive ? !isCapsLockActive : isCapsLockActive;
            glyphEl.textContent = shouldBeUpper ? data.shiftKey : data.key;
          }
        }
      }
    });
  }

  // Update Caps Lock visual state
  function updateCapsLockVisuals() {
    const capsEntry = keyElementsMap.get('CapsLock');
    if (capsEntry) {
      if (isCapsLockActive) {
        capsEntry.el.classList.add('is-active-modifier');
      } else {
        capsEntry.el.classList.remove('is-active-modifier');
      }
    }

    if (capsLed) {
      if (isCapsLockActive) {
        capsLed.classList.add('lit');
      } else {
        capsLed.classList.remove('lit');
      }
    }

    updateShiftVisuals();
  }

  // Copy text to clipboard with notification
  function copyText() {
    if (!displayField.value) {
      showToast('Display is empty');
      return;
    }
    navigator.clipboard.writeText(displayField.value)
      .then(() => {
        showToast('Text copied to clipboard! ✨');
      })
      .catch(() => {
        displayField.select();
        document.execCommand('copy');
        showToast('Text copied! ✨');
      });
  }

  // Clear text with confirmation
  function clearText() {
    if (!displayField.value) return;
    displayField.value = '';
    updateStats();
    showToast('Display cleared');
  }

  // Demo typewriter animation
  let demoTimer = null;
  function runDemo() {
    if (demoTimer) clearInterval(demoTimer);
    displayField.value = '';
    updateStats();

    const sampleQuote = "Every keystroke carved from solid walnut.\nListen to the satisfying mechanical click!";
    let index = 0;

    demoTimer = setInterval(() => {
      if (index >= sampleQuote.length) {
        clearInterval(demoTimer);
        demoTimer = null;
        return;
      }
      const char = sampleQuote[index];
      let codeToHighlight = null;

      // Find code corresponding to char
      for (const [code, entry] of keyElementsMap.entries()) {
        if (entry.data.key.toLowerCase() === char.toLowerCase()) {
          codeToHighlight = code;
          break;
        } else if (char === ' ' && entry.data.type === 'space') {
          codeToHighlight = 'Space';
          break;
        } else if (char === '\n' && entry.data.type === 'enter') {
          codeToHighlight = 'Enter';
          break;
        } else if (entry.data.shiftKey === char || entry.data.key === char) {
          codeToHighlight = code;
          break;
        }
      }

      if (codeToHighlight) {
        const entry = keyElementsMap.get(codeToHighlight);
        if (entry) {
          entry.el.classList.add('is-pressed');
          window.woodAudio.playKeyPress(entry.data.type);
          setTimeout(() => {
            entry.el.classList.remove('is-pressed');
            window.woodAudio.playKeyRelease(entry.data.type);
          }, 70);
        }
      } else {
        window.woodAudio.playKeyPress('standard');
      }

      displayField.value += char;
      displayField.selectionStart = displayField.selectionEnd = displayField.value.length;
      displayField.scrollTop = displayField.scrollHeight;
      updateStats();
      totalKeyPresses++;
      if (keyPressCountEl) keyPressCountEl.textContent = totalKeyPresses.toString();
      index++;
    }, 110);
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2400);
  }

  // PHYSICAL KEYBOARD SYNCHRONIZATION
  window.addEventListener('keydown', (e) => {
    // If typing directly into text display field, let default behavior handle text,
    // but trigger the visual key press & wooden click!
    const code = e.code;
    const entry = keyElementsMap.get(code);

    if (entry && !e.repeat) {
      entry.el.classList.add('is-pressed');
      window.woodAudio.playKeyPress(entry.data.type);
      totalKeyPresses++;
      if (keyPressCountEl) keyPressCountEl.textContent = totalKeyPresses.toString();
    }

    if (e.key === 'CapsLock') {
      isCapsLockActive = e.getModifierState('CapsLock');
      updateCapsLockVisuals();
    } else if (e.key === 'Shift') {
      isShiftActive = true;
      updateShiftVisuals();
    }

    // If focused on display field, update stats shortly after
    setTimeout(updateStats, 10);
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code;
    const entry = keyElementsMap.get(code);

    if (entry) {
      entry.el.classList.remove('is-pressed');
      window.woodAudio.playKeyRelease(entry.data.type);
    }

    if (e.key === 'CapsLock') {
      isCapsLockActive = e.getModifierState('CapsLock');
      updateCapsLockVisuals();
    } else if (e.key === 'Shift') {
      isShiftActive = false;
      updateShiftVisuals();
    }

    setTimeout(updateStats, 10);
  });

  // Track physical CapsLock changes
  window.addEventListener('blur', () => {
    keyElementsMap.forEach(entry => entry.el.classList.remove('is-pressed'));
  });

  // Display field direct input syncing & native mobile keyboard suppression
  displayField.addEventListener('input', updateStats);
  displayField.addEventListener('focus', () => {
    if ('virtualKeyboard' in navigator) {
      try { navigator.virtualKeyboard.hide(); } catch (_) {}
    }
  });
  displayField.addEventListener('touchstart', () => {
    if ('virtualKeyboard' in navigator) {
      try { navigator.virtualKeyboard.hide(); } catch (_) {}
    }
  }, { passive: true });

  if ('virtualKeyboard' in navigator) {
    try { navigator.virtualKeyboard.overlaysContent = false; } catch (_) {}
  }

  // Audio & UI Controls
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      window.woodAudio.setVolume(vol);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = window.woodAudio.toggleMute();
      muteBtn.classList.toggle('is-muted', isMuted);
      showToast(isMuted ? 'Muted 🔇' : 'Sound Enabled 🔊');
    });
  }

  if (woodSelect) {
    woodSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      window.woodAudio.setWoodType(type);
      document.body.dataset.wood = type;
      showToast(`Selected: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  if (copyBtn) copyBtn.addEventListener('click', copyText);
  if (clearBtn) clearBtn.addEventListener('click', clearText);
  if (demoBtn) demoBtn.addEventListener('click', runDemo);

  // Initialize
  renderKeyboard();
  updateStats();
  document.body.dataset.wood = 'walnut';
});
