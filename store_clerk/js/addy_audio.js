/**
 * Calm Chess Games — Addy's Walmart Store Clerk XR Audio Engine
 * 100% Procedural Web Audio API + Web Speech API PA Microphone Intercom
 */

export function createAddyAudioEngine() {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let noiseBuffer = null;
  let muted = false;

  if (typeof navigator !== 'undefined' && navigator.audioSession && 'type' in navigator.audioSession) {
    try {
      navigator.audioSession.type = 'playback';
    } catch (_) {}
  }

  function buildNoiseBuffer(audioCtx) {
    const length = Math.floor(audioCtx.sampleRate * 1.2);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function ensureContext() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx({ latencyHint: 'interactive' });
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 4.0;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.14;

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 0.85;

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);
      noiseBuffer = buildNoiseBuffer(ctx);
      return ctx;
    } catch (_) {
      return null;
    }
  }

  function unlock() {
    const audioCtx = ensureContext();
    if (!audioCtx) return false;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return true;
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.02);
    }
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function playTone(freq, duration, type = 'sine', volume = 0.22, delay = 0, freqEnd = null) {
    const audioCtx = ensureContext();
    if (!audioCtx || muted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(compressor);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playNoiseBurst(duration = 0.06, filterFreq = 1800, filterType = 'bandpass', volume = 0.25, delay = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx || !noiseBuffer || muted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + delay;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.value = 2.0;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(compressor);
    src.start(now, Math.random() * 0.5, duration + 0.02);
  }

  function speakPhrase(phrase, delayMs = 450, pitch = 1.06, rate = 0.99) {
    if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase);
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = 0.95;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) {
        const preferred = voices.find((v) => /en-US/i.test(v.lang) && /(Jenny|Aria|Zira|Samantha|Google US English)/i.test(v.name))
          || voices.find((v) => /en/i.test(v.lang));
        if (preferred) utter.voice = preferred;
      }
      setTimeout(() => {
        if (!muted) {
          try { window.speechSynthesis.speak(utter); } catch (_) {}
        }
      }, delayMs);
    } catch (_) {}
  }

  // Item-specific tactile procedural sounds
  function playSquish(isJumbo = false) {
    const base = isJumbo ? 195 : 275;
    playTone(base, 0.16, 'sine', 0.28, 0, base * 1.72);
    playTone(base * 1.6, 0.14, 'triangle', 0.16, 0.09, base * 0.92);
    playNoiseBurst(0.11, isJumbo ? 680 : 1120, 'bandpass', 0.14, 0.01);
  }

  function playClicker() {
    playNoiseBurst(0.02, 3900, 'bandpass', 0.44, 0);
    playTone(2450, 0.018, 'triangle', 0.24, 0, 1180);
    playTone(230, 0.045, 'sine', 0.28, 0.004, 95);
    playNoiseBurst(0.015, 4600, 'highpass', 0.22, 0.055);
    playTone(1760, 0.016, 'triangle', 0.14, 0.055, 920);
  }

  function playCupClink() {
    playTone(1180, 0.12, 'sine', 0.22, 0, 1140);
    playTone(1760, 0.14, 'triangle', 0.14, 0.02, 1680);
    playNoiseBurst(0.035, 3200, 'bandpass', 0.12, 0);
  }

  function playFabricRustle(isAdult = false) {
    playNoiseBurst(0.14, isAdult ? 820 : 1150, 'bandpass', 0.24, 0);
    playTone(isAdult ? 240 : 320, 0.1, 'sine', 0.14, 0.02, isAdult ? 310 : 410);
  }

  function playPickup(itemType) {
    if (itemType === 'needoh') playSquish(false);
    else if (itemType === 'squishy') playSquish(true);
    else if (itemType === 'clicker') playClicker();
    else if (itemType === 'cup') playCupClink();
    else if (itemType === 'sweatshirt_kids') playFabricRustle(false);
    else if (itemType === 'sweatshirt_adult') playFabricRustle(true);
    else playTone(460, 0.1, 'sine', 0.2, 0, 640);
  }

  function playRestockSuccess(combo = 1) {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1174.66, 1318.51];
    const baseIdx = Math.min(combo - 1, 3);
    playTone(notes[baseIdx], 0.14, 'triangle', 0.22, 0);
    playTone(notes[baseIdx + 1], 0.16, 'triangle', 0.22, 0.065);
    playTone(notes[baseIdx + 2], 0.26, 'sine', 0.25, 0.13);
  }

  function playErrorBump() {
    playTone(190, 0.12, 'sawtooth', 0.12, 0, 145);
    playTone(150, 0.14, 'sine', 0.16, 0.05, 110);
  }

  // Checkout barcode scanner crisp laser BEEP!
  function playBarcodeBeep() {
    playTone(2380, 0.085, 'square', 0.15, 0);
    playTone(2380, 0.09, 'sine', 0.22, 0);
  }

  // Cash Register Drawer Pop + KA-CHING!
  function playCashRegisterKaChing() {
    playNoiseBurst(0.06, 2600, 'bandpass', 0.3, 0);
    playTone(1318.51, 0.12, 'triangle', 0.24, 0.03);
    playTone(2093.0, 0.34, 'sine', 0.26, 0.1);
    playTone(2637.02, 0.42, 'sine', 0.2, 0.16);
  }

  // PA Microphone Intercom Chime + Speech for Lost Kids!
  function playMicAnnouncement(kidName) {
    // Mic switch click + subtle intercom pop
    playNoiseBurst(0.025, 1900, 'bandpass', 0.32, 0);
    playTone(180, 0.04, 'square', 0.11, 0, 120);

    // Classic Walmart 3-tone PA Chime: Bing - Bong - Bing!
    playTone(659.25, 0.26, 'sine', 0.26, 0.08);
    playTone(523.25, 0.26, 'sine', 0.24, 0.32);
    playTone(783.99, 0.44, 'sine', 0.28, 0.56);
    playNoiseBurst(0.07, 1300, 'bandpass', 0.08, 0.9);

    const phrase = kidName
      ? `Attention Walmart shoppers, we have found ${kidName}! Please come to the front mic to meet Addy!`
      : `Welcome to Walmart! Check out our fresh NeeDohs, squishies, clickers, cups, and sweatshirts!`;
    speakPhrase(phrase, 700, 1.07, 0.98);
  }

  // Parent arrives -> $100,000.00 Golden Tip + Free Food Celebration!
  function playBigTipAndFreeFood(kidName) {
    // Sparkling money jackpot arpeggio!
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    chord.forEach((f, idx) => {
      playTone(f, 0.36, 'triangle', 0.22, idx * 0.065);
    });
    // Crisp cash register bell at peak!
    playTone(2093.0, 0.45, 'sine', 0.26, 0.42);
    playNoiseBurst(0.08, 4200, 'highpass', 0.16, 0.42);

    if (kidName) {
      speakPhrase(`Thank you Addy for finding ${kidName}! Here is a one hundred thousand dollar tip, and thank you for the free food!`, 320, 1.02, 1.02);
    }
  }

  function playLostKidCue() {
    playTone(587.33, 0.14, 'sine', 0.16, 0, 698.46);
    playTone(698.46, 0.18, 'sine', 0.16, 0.15, 587.33);
  }

  // 11:00 PM Lunch Break Chime
  function playLunchBell() {
    playTone(783.99, 0.25, 'sine', 0.26, 0);
    playTone(987.77, 0.25, 'sine', 0.26, 0.18);
    playTone(1174.66, 0.45, 'triangle', 0.26, 0.36);
  }

  function playEatBite(isDrink = false) {
    if (isDrink) {
      playTone(320, 0.14, 'sine', 0.2, 0, 680);
      playTone(520, 0.12, 'sine', 0.16, 0.1, 860);
    } else {
      playNoiseBurst(0.055, 2200, 'bandpass', 0.34, 0);
      playNoiseBurst(0.045, 1600, 'bandpass', 0.26, 0.065);
      playTone(260, 0.06, 'triangle', 0.14, 0.02, 180);
    }
  }

  // Sliding glass entrance doors whoosh
  function playDoorSlide() {
    playNoiseBurst(0.28, 620, 'lowpass', 0.16, 0);
    playTone(210, 0.22, 'sine', 0.09, 0, 290);
  }

  // 11:46 AM Key Jingle + Heavy Deadbolt Lock Clunk + Going Home Fanfare!
  function playKeyLockDoors() {
    // Metallic key jingle
    playTone(3400, 0.06, 'sine', 0.16, 0, 3900);
    playTone(4150, 0.07, 'sine', 0.15, 0.05, 3600);
    playTone(2950, 0.08, 'triangle', 0.14, 0.11, 3300);
    // Heavy satisfying deadbolt CLUNK!
    playNoiseBurst(0.05, 1200, 'bandpass', 0.45, 0.2);
    playTone(145, 0.14, 'square', 0.22, 0.2, 72);
    playTone(95, 0.18, 'sine', 0.3, 0.24, 58);

    // Going home triumph fanfare!
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, idx) => {
      playTone(n, 0.36, 'triangle', 0.22, 0.46 + idx * 0.09);
    });
  }

  function playShiftReadyBell() {
    playTone(659.25, 0.22, 'triangle', 0.24, 0);
    playTone(880.0, 0.24, 'triangle', 0.24, 0.16);
    playTone(1046.5, 0.42, 'sine', 0.26, 0.32);
  }

  function playFootstep(isAsphalt = false) {
    playNoiseBurst(0.028, isAsphalt ? 620 : 920, 'bandpass', 0.075, 0);
  }

  return {
    unlock,
    setMuted,
    isMuted,
    playSquish,
    playClicker,
    playCupClink,
    playFabricRustle,
    playPickup,
    playRestockSuccess,
    playErrorBump,
    playBarcodeBeep,
    playCashRegisterKaChing,
    playMicAnnouncement,
    playBigTipAndFreeFood,
    playLostKidCue,
    playLunchBell,
    playEatBite,
    playDoorSlide,
    playKeyLockDoors,
    playShiftReadyBell,
    playFootstep
  };
}
