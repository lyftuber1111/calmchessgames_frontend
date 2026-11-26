/**
 * Calm Chess Games — Target Night Shift XR Audio Engine
 * 100% Procedural Web Audio API + Web Speech API PA Intercom
 *  - Squishy squeeze & rubbery pop sounds (Jumbo Squishies & NeeDohs)
 *  - Crisp tactile mechanical clicker thock/snap
 *  - Sleek futuristic chime for Large & Small VRs
 *  - Target Store PA Intercom ("Ding-dong-ding!" + "Attention shoppers, we have found <Name>!")
 *  - 9:00 PM Lunch bell + bite crunch & drink sip SFX
 *  - 3:00 AM Time Clock punch-out & going home celebration fanfare
 */

export function createWorkAudioEngine() {
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

  // Squishy squeeze & bounce (Jumbo Squishy or NeeDoh)
  function playSquish(isJumbo = true) {
    const base = isJumbo ? 190 : 280;
    playTone(base, 0.16, 'sine', 0.28, 0, base * 1.75);
    playTone(base * 1.65, 0.14, 'triangle', 0.16, 0.09, base * 0.92);
    playNoiseBurst(0.11, isJumbo ? 650 : 1100, 'bandpass', 0.14, 0.01);
  }

  // Mechanical fidget clicker crisp tactile click + thock
  function playClicker() {
    playNoiseBurst(0.022, 3900, 'bandpass', 0.45, 0);
    playTone(2450, 0.018, 'triangle', 0.24, 0, 1180);
    playTone(230, 0.045, 'sine', 0.28, 0.004, 95);
    // spring return clack
    playNoiseBurst(0.016, 4600, 'highpass', 0.22, 0.055);
    playTone(1750, 0.016, 'triangle', 0.14, 0.055, 920);
  }

  // VR headset sleek tech pickup/place
  function playVrTech(isLarge = true) {
    const f1 = isLarge ? 330 : 495;
    const f2 = isLarge ? 495 : 740;
    playTone(f1, 0.11, 'sine', 0.2, 0, f1 * 1.04);
    playTone(f2, 0.16, 'triangle', 0.16, 0.06, f2 * 1.06);
    playNoiseBurst(0.03, 2400, 'bandpass', 0.1, 0);
  }

  function playPickup(itemType) {
    if (itemType === 'jumbo_squishy') playSquish(true);
    else if (itemType === 'needoh') playSquish(false);
    else if (itemType === 'clicker') playClicker();
    else if (itemType === 'vr_large') playVrTech(true);
    else if (itemType === 'vr_small') playVrTech(false);
    else playTone(440, 0.1, 'sine', 0.2, 0, 620);
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

  // Big Red Phone Pickup + Store PA Intercom Chime + Speech!
  function playBigRedPhoneAnnouncement(kidName) {
    // Handset lift click
    playNoiseBurst(0.03, 1900, 'bandpass', 0.3, 0);
    playTone(180, 0.04, 'square', 0.12, 0, 120);

    // Classic 3-tone retail PA chime: Bing - Bong - Bing!
    playTone(659.25, 0.28, 'sine', 0.26, 0.09);
    playTone(523.25, 0.28, 'sine', 0.24, 0.34);
    playTone(783.99, 0.45, 'sine', 0.28, 0.58);

    // Subtle intercom mic static open
    playNoiseBurst(0.08, 1200, 'bandpass', 0.08, 0.92);

    if (!muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const phrase = kidName
          ? `Attention shoppers, we have found ${kidName}. Please come to the front aisle to meet Addyson!`
          : `Attention shoppers, fresh squishies, NeeDohs, clickers, and VRs are now stocked!`;
        const utter = new SpeechSynthesisUtterance(phrase);
        utter.rate = 0.98;
        utter.pitch = 1.08;
        utter.volume = 0.95;

        // Prefer a clear English voice when available
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
        }, 720);
      } catch (_) {}
    }
  }

  function playLostKidCue() {
    playTone(587.33, 0.14, 'sine', 0.16, 0, 698.46);
    playTone(698.46, 0.18, 'sine', 0.16, 0.15, 587.33);
  }

  function playReunionCheer() {
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((f, idx) => {
      playTone(f, 0.34, 'triangle', 0.2, idx * 0.07);
    });
    playTone(1318.51, 0.42, 'sine', 0.22, 0.3);
  }

  // 9:00 PM Lunch Break Chime
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

  // 3:00 AM Clock-Out & Going Home Fanfare!
  function playClockOutFanfare() {
    // Punch-card mechanical ding!
    playTone(1240, 0.18, 'triangle', 0.28, 0);
    playTone(1660, 0.28, 'sine', 0.26, 0.12);
    // Warm cheerful going-home arpeggio
    const melody = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5, 1318.51];
    const times = [0.32, 0.46, 0.60, 0.74, 0.92, 1.06, 1.22];
    melody.forEach((f, i) => {
      playTone(f, 0.34, i % 2 === 0 ? 'triangle' : 'sine', 0.22, times[i]);
    });
  }

  function playFootstep() {
    playNoiseBurst(0.024, 520, 'lowpass', 0.06, 0);
  }

  return {
    unlock,
    setMuted,
    isMuted,
    playPickup,
    playSquish,
    playClicker,
    playVrTech,
    playRestockSuccess,
    playErrorBump,
    playBigRedPhoneAnnouncement,
    playLostKidCue,
    playReunionCheer,
    playLunchBell,
    playEatBite,
    playClockOutFanfare,
    playFootstep
  };
}
