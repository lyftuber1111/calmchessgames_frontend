/**
 * Calm Chess Computers & Games — Kawaii 7-Row Mechanical Clicker Audio Engine
 * 100% Procedural Web Audio API synthesizer (Mobile-Optimized):
 *  - Realistic tactile mechanical keyboard switch DOWNSTROKE (crisp click-bar snap + creamy PBT thock + pink silicone gasket bass)
 *  - Realistic mechanical switch UPSTROKE (snappy spring-return top-out clack)
 *  - Optional dreamy pastel music-box / kalimba sparkle layer (pentatonic melody across the 7 rows)
 *  - Joyful row-complete rainbow wave & charm-jingle chimes
 *  - Mobile optimizations: reusable stereo column panners, lightweight shimmer delay (no heavy FFT convolver on mobile),
 *    voice polyphony cap & wave throttling, and autoplay-policy-safe gesture gating.
 */

export function createClickerAudioEngine() {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let reverbSend = null;
  let noiseBuffer = null;
  let columnPanners = null;
  let musicalChimesEnabled = true;
  let unlockedByGesture = false;
  let lastSoftVoiceAt = 0;
  let lastKeyDownAt = 0;
  let lastKeyUpAt = 0;
  let activeVoices = 0;

  const isMobile = typeof window !== 'undefined' && (
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    /Android|iPhone|iPad|iPod|Mobile/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '')
  );
  const MAX_VOICES = isMobile ? 10 : 18;

  if (typeof navigator !== 'undefined' && navigator.audioSession && 'type' in navigator.audioSession) {
    try {
      navigator.audioSession.type = 'playback';
    } catch (_) {}
  }

  // Cheerful C-major pentatonic frequencies spanning 2+ octaves for the 7 rows x 5 cols
  const PENTATONIC_SCALE = [
    523.25, 587.33, 659.25, 783.99, 880.0,
    1046.5, 1174.66, 1318.51, 1567.98, 1760.0
  ];

  function buildNoiseBuffer(audioCtx) {
    // 0.35s is plenty for 25ms switch transients and initializes 4x faster on mobile
    const length = Math.floor(audioCtx.sampleRate * 0.35);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function buildImpulseResponse(audioCtx, duration = 0.42, decay = 3.2) {
    const rate = audioCtx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        channelData[i] = (Math.random() * 2 - 1) * env * 0.38;
      }
    }
    return impulse;
  }

  function canActivateAudio() {
    if (unlockedByGesture) return true;
    if (typeof navigator !== 'undefined' && navigator.userActivation) {
      return Boolean(navigator.userActivation.hasBeenActive);
    }
    return false;
  }

  function ensureContext() {
    if (ctx) return ctx;
    if (!canActivateAudio()) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx({ latencyHint: 'interactive' });

      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 16;
      compressor.ratio.value = 4.0;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.12;

      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;

      reverbSend = ctx.createGain();
      reverbSend.gain.value = isMobile ? 0.16 : 0.18;

      if (isMobile) {
        // Ultra-lightweight dreamy pastel shimmer delay (avoids heavy stereo FFT convolution on mobile CPU)
        const delay = ctx.createDelay(0.25);
        delay.delayTime.value = 0.078;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.26;
        const damp = ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 2600;
        reverbSend.connect(delay);
        delay.connect(damp);
        damp.connect(feedback);
        feedback.connect(delay);
        damp.connect(masterGain);
      } else {
        const reverbConvolver = ctx.createConvolver();
        reverbConvolver.buffer = buildImpulseResponse(ctx, 0.42, 3.2);
        reverbSend.connect(reverbConvolver);
        reverbConvolver.connect(masterGain);
      }

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Pre-allocate 5 reusable stereo panners (1 per board column) — zero per-click panner allocations!
      if (typeof ctx.createStereoPanner === 'function') {
        columnPanners = [];
        for (let c = 0; c < 5; c++) {
          const panner = ctx.createStereoPanner();
          panner.pan.value = ((c / 4) * 2 - 1) * 0.55;
          panner.connect(compressor);
          columnPanners.push(panner);
        }
      }

      noiseBuffer = buildNoiseBuffer(ctx);
      return ctx;
    } catch (err) {
      console.warn('[ClickerAudio] Web Audio unavailable:', err);
      return null;
    }
  }

  function unlock() {
    unlockedByGesture = true;
    const audioCtx = ensureContext();
    if (!audioCtx) return false;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return true;
  }

  function getPanOut(col = 2, cols = 5) {
    if (columnPanners && columnPanners.length > 0) {
      const idx = cols > 1
        ? Math.max(0, Math.min(columnPanners.length - 1, Math.round((col / (cols - 1)) * (columnPanners.length - 1))))
        : 2;
      return columnPanners[idx];
    }
    return compressor;
  }

  function trackVoice(durationSec) {
    activeVoices += 1;
    setTimeout(() => {
      activeVoices = Math.max(0, activeVoices - 1);
    }, Math.max(25, Math.ceil(durationSec * 1000)));
  }

  /**
   * Satisfying Mechanical Keyboard Key DOWNSTROKE!
   * Layers:
   *  1) Crisp tactile click-jacket / click-bar metallic-plastic snap (2ms transient)
   *  2) Creamy PBT keycap bottom-out "THOCK" (resonant woody body drop)
   *  3) Soft pink silicone case dampened bass cushion (~98Hz gasket thump)
   *  4) Optional dreamy pastel kalimba/sparkle chime (if musical mode is active)
   */
  function playKeyDown(row = 0, col = 2, cols = 5, soft = false) {
    const audioCtx = ensureContext();
    if (!audioCtx || audioCtx.state !== 'running') return;

    const now = audioCtx.currentTime;
    // Throttle dense rainbow-wave soft hits & cap polyphony so mobile audio never crackles or stalls
    if (soft) {
      const minGap = isMobile ? 0.042 : 0.022;
      if (now - lastSoftVoiceAt < minGap || activeVoices >= MAX_VOICES) return;
      lastSoftVoiceAt = now;
    } else {
      if (now - lastKeyDownAt < 0.012 && activeVoices >= MAX_VOICES) return;
      lastKeyDownAt = now;
      if (activeVoices >= MAX_VOICES + 4) return;
    }

    const out = getPanOut(col, cols);
    const vol = soft ? 0.52 : 1.0;

    // Slight organic pitch fingerprint per switch + micro jitter so rapid clicking never sounds robotic
    const microVar = 0.96 + Math.random() * 0.08;
    const rowShift = 1.08 - row * 0.028;
    const pitchMul = rowShift * microVar;
    const noiseOff = Math.random() * 0.25;

    // Streamlined lightweight voice for rainbow wave ripples
    if (soft) {
      trackVoice(0.06);
      const snapSrc = audioCtx.createBufferSource();
      snapSrc.buffer = noiseBuffer;
      const snapBp = audioCtx.createBiquadFilter();
      snapBp.type = 'bandpass';
      snapBp.frequency.setValueAtTime(3600 * pitchMul, now);
      snapBp.Q.value = 2.4;
      const snapG = audioCtx.createGain();
      snapG.gain.setValueAtTime(0.0001, now);
      snapG.gain.linearRampToValueAtTime(0.45 * vol, now + 0.0015);
      snapG.gain.exponentialRampToValueAtTime(0.0008, now + 0.018);
      snapSrc.connect(snapBp);
      snapBp.connect(snapG);
      snapG.connect(out);
      snapSrc.start(now, noiseOff, 0.022);

      const thockOsc = audioCtx.createOscillator();
      thockOsc.type = 'triangle';
      thockOsc.frequency.setValueAtTime(360 * pitchMul, now + 0.004);
      thockOsc.frequency.exponentialRampToValueAtTime(132 * pitchMul, now + 0.036);
      const thockG = audioCtx.createGain();
      thockG.gain.setValueAtTime(0.0001, now + 0.004);
      thockG.gain.linearRampToValueAtTime(0.38 * vol, now + 0.007);
      thockG.gain.exponentialRampToValueAtTime(0.0008, now + 0.044);
      thockOsc.connect(thockG);
      thockG.connect(out);
      thockOsc.start(now + 0.004);
      thockOsc.stop(now + 0.05);
      return;
    }

    trackVoice(musicalChimesEnabled ? 0.22 : 0.065);

    // 1. Tactile Click-Bar / Leaf Snap (sharp crisp click at actuation)
    const snapSrc = audioCtx.createBufferSource();
    snapSrc.buffer = noiseBuffer;
    const snapBp = audioCtx.createBiquadFilter();
    snapBp.type = 'bandpass';
    snapBp.frequency.setValueAtTime(3950 * pitchMul, now);
    snapBp.Q.value = 2.5;
    const snapG = audioCtx.createGain();
    snapG.gain.setValueAtTime(0.0001, now);
    snapG.gain.linearRampToValueAtTime(0.72 * vol, now + 0.0014);
    snapG.gain.exponentialRampToValueAtTime(0.0008, now + 0.019);
    snapSrc.connect(snapBp);
    snapBp.connect(snapG);
    snapG.connect(out);
    snapSrc.start(now, noiseOff, 0.025);

    // Secondary crisp switch-click metallic ping (Box-Jade clicky snap!)
    const clickPing = audioCtx.createOscillator();
    clickPing.type = 'triangle';
    clickPing.frequency.setValueAtTime(2650 * pitchMul, now);
    clickPing.frequency.exponentialRampToValueAtTime(1250 * pitchMul, now + 0.012);
    const pingG = audioCtx.createGain();
    pingG.gain.setValueAtTime(0.28 * vol, now);
    pingG.gain.exponentialRampToValueAtTime(0.0008, now + 0.015);
    clickPing.connect(pingG);
    pingG.connect(out);
    clickPing.start(now);
    clickPing.stop(now + 0.018);

    // 2. Creamy Keycap Bottom-Out "THOCK" (~5.5ms after tactile bump!)
    const thockT = now + 0.0055;
    const thockOsc = audioCtx.createOscillator();
    thockOsc.type = 'triangle';
    thockOsc.frequency.setValueAtTime(370 * pitchMul, thockT);
    thockOsc.frequency.exponentialRampToValueAtTime(132 * pitchMul, thockT + 0.036);
    const thockG = audioCtx.createGain();
    thockG.gain.setValueAtTime(0.0001, thockT);
    thockG.gain.linearRampToValueAtTime(0.56 * vol, thockT + 0.0025);
    thockG.gain.exponentialRampToValueAtTime(0.0008, thockT + 0.048);
    if (isMobile) {
      thockOsc.connect(thockG);
    } else {
      const thockLp = audioCtx.createBiquadFilter();
      thockLp.type = 'lowpass';
      thockLp.frequency.setValueAtTime(1400 * pitchMul, thockT);
      thockOsc.connect(thockLp);
      thockLp.connect(thockG);
    }
    thockG.connect(out);
    thockOsc.start(thockT);
    thockOsc.stop(thockT + 0.055);

    // Textured plastic bottom-out body burst (desktop or low voice load)
    if (!isMobile || activeVoices <= 6) {
      const bodySrc = audioCtx.createBufferSource();
      bodySrc.buffer = noiseBuffer;
      const bodyBp = audioCtx.createBiquadFilter();
      bodyBp.type = 'bandpass';
      bodyBp.frequency.setValueAtTime(980 * pitchMul, thockT);
      bodyBp.Q.value = 1.9;
      const bodyG = audioCtx.createGain();
      bodyG.gain.setValueAtTime(0.0001, thockT);
      bodyG.gain.linearRampToValueAtTime(0.44 * vol, thockT + 0.002);
      bodyG.gain.exponentialRampToValueAtTime(0.0008, thockT + 0.025);
      bodySrc.connect(bodyBp);
      bodyBp.connect(bodyG);
      bodyG.connect(out);
      bodySrc.start(thockT, (noiseOff + 0.05) % 0.25, 0.028);
    }

    // 3. Soft Pink Silicone Case Gasket Thump (warm damped sub-resonance)
    const caseOsc = audioCtx.createOscillator();
    caseOsc.type = 'sine';
    caseOsc.frequency.setValueAtTime(128 * pitchMul, thockT);
    caseOsc.frequency.exponentialRampToValueAtTime(74, thockT + 0.045);
    const caseG = audioCtx.createGain();
    caseG.gain.setValueAtTime(0.26 * vol, thockT);
    caseG.gain.exponentialRampToValueAtTime(0.0008, thockT + 0.052);
    caseOsc.connect(caseG);
    caseG.connect(out);
    caseOsc.start(thockT);
    caseOsc.stop(thockT + 0.058);

    // 4. Optional Cute Pastel Toy Kalimba / Sparkle Pluck
    if (musicalChimesEnabled) {
      const noteIdx = (col + (6 - row)) % PENTATONIC_SCALE.length;
      const freq = PENTATONIC_SCALE[noteIdx];
      const chimeT = now + 0.008;

      const chime = audioCtx.createOscillator();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, chimeT);

      const chimeG = audioCtx.createGain();
      chimeG.gain.setValueAtTime(0.0001, chimeT);
      chimeG.gain.linearRampToValueAtTime(0.11, chimeT + 0.006);
      chimeG.gain.exponentialRampToValueAtTime(0.0006, chimeT + 0.21);

      chime.connect(chimeG);
      chimeG.connect(out);
      chimeG.connect(reverbSend);
      chime.start(chimeT);
      chime.stop(chimeT + 0.23);

      if (!isMobile || activeVoices <= 5) {
        const chimeOver = audioCtx.createOscillator();
        chimeOver.type = 'triangle';
        chimeOver.frequency.setValueAtTime(freq * 2.0, chimeT);
        const overG = audioCtx.createGain();
        overG.gain.setValueAtTime(0.0001, chimeT);
        overG.gain.linearRampToValueAtTime(0.035, chimeT + 0.004);
        overG.gain.exponentialRampToValueAtTime(0.0006, chimeT + 0.085);
        chimeOver.connect(overG);
        overG.connect(out);
        chimeOver.start(chimeT);
        chimeOver.stop(chimeT + 0.1);
      }
    }
  }

  /**
   * Crisp Mechanical Switch UPSTROKE ("CLACK!" when releasing the keycap)
   */
  function playKeyUp(row = 0, col = 2, cols = 5) {
    const audioCtx = ensureContext();
    if (!audioCtx || audioCtx.state !== 'running') return;

    const now = audioCtx.currentTime;
    if (now - lastKeyUpAt < 0.015 || activeVoices >= MAX_VOICES + 2) return;
    lastKeyUpAt = now;
    trackVoice(0.03);

    const out = getPanOut(col, cols);
    const pitchMul = (1.06 - row * 0.022) * (0.97 + Math.random() * 0.06);

    const clackSrc = audioCtx.createBufferSource();
    clackSrc.buffer = noiseBuffer;
    const clackBp = audioCtx.createBiquadFilter();
    clackBp.type = 'bandpass';
    clackBp.frequency.setValueAtTime(4850 * pitchMul, now);
    clackBp.Q.value = 3.1;
    const clackG = audioCtx.createGain();
    clackG.gain.setValueAtTime(0.0001, now);
    clackG.gain.linearRampToValueAtTime(0.38, now + 0.0015);
    clackG.gain.exponentialRampToValueAtTime(0.0008, now + 0.018);
    clackSrc.connect(clackBp);
    clackBp.connect(clackG);
    clackG.connect(out);
    clackSrc.start(now, Math.random() * 0.25, 0.022);

    const reb = audioCtx.createOscillator();
    reb.type = 'triangle';
    reb.frequency.setValueAtTime(520 * pitchMul, now);
    reb.frequency.exponentialRampToValueAtTime(260 * pitchMul, now + 0.018);
    const rebG = audioCtx.createGain();
    rebG.gain.setValueAtTime(0.16, now);
    rebG.gain.exponentialRampToValueAtTime(0.0008, now + 0.022);
    reb.connect(rebG);
    rebG.connect(out);
    reb.start(now);
    reb.stop(now + 0.025);
  }

  /**
   * Joyful Sparkle Arpeggio when completing a full row or triggering a Rainbow Wave!
   */
  function playRainbowWaveChime() {
    const audioCtx = ensureContext();
    if (!audioCtx || audioCtx.state !== 'running') return;

    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    trackVoice(0.6);
    for (let idx = 0; idx < notes.length; idx++) {
      const freq = notes[idx];
      const t = now + idx * 0.045;
      const osc = audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.32);
      osc.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(t);
      osc.stop(t + 0.35);
    }
  }

  function setMusicalChimes(enabled) {
    musicalChimesEnabled = Boolean(enabled);
  }

  function getMusicalChimes() {
    return musicalChimesEnabled;
  }

  return {
    unlock,
    playKeyDown,
    playKeyUp,
    playRainbowWaveChime,
    setMusicalChimes,
    getMusicalChimes,
    getContextState: () => (ctx ? ctx.state : 'uninitialized')
  };
}
