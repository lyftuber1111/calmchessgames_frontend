/**
 * Calm Chess Computers & Games — Kawaii 7-Row Mechanical Clicker Audio Engine
 * 100% Procedural Web Audio API synthesizer:
 *  - Realistic tactile mechanical keyboard switch DOWNSTROKE (crisp click-bar snap + creamy PBT thock + pink silicone gasket bass)
 *  - Realistic mechanical switch UPSTROKE (snappy spring-return top-out clack)
 *  - Optional dreamy pastel music-box / kalimba sparkle layer (pentatonic melody across the 7 rows)
 *  - Joyful row-complete rainbow wave & charm-jingle chimes
 */

export function createClickerAudioEngine() {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let reverbConvolver = null;
  let reverbSend = null;
  let noiseBuffer = null;
  let musicalChimesEnabled = true;

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
    const length = Math.floor(audioCtx.sampleRate * 1.5);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function buildImpulseResponse(audioCtx, duration = 0.85, decay = 3.1) {
    const rate = audioCtx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        channelData[i] = (Math.random() * 2 - 1) * env * 0.42;
      }
    }
    return impulse;
  }

  function ensureContext() {
    if (ctx) return ctx;
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

      reverbConvolver = ctx.createConvolver();
      reverbConvolver.buffer = buildImpulseResponse(ctx, 0.85, 3.1);

      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.18;

      compressor.connect(masterGain);
      reverbSend.connect(reverbConvolver);
      reverbConvolver.connect(masterGain);
      masterGain.connect(ctx.destination);

      noiseBuffer = buildNoiseBuffer(ctx);
      return ctx;
    } catch (err) {
      console.warn('[ClickerAudio] Web Audio unavailable:', err);
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

  function createPanOut(audioCtx, pan = 0) {
    const clamped = Math.max(-0.75, Math.min(0.75, Number(pan) || 0));
    if (typeof audioCtx.createStereoPanner === 'function') {
      const panner = audioCtx.createStereoPanner();
      panner.pan.value = clamped;
      panner.connect(compressor);
      return panner;
    }
    return compressor;
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
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime;
    const pan = cols > 1 ? ((col / (cols - 1)) * 2 - 1) * 0.55 : 0;
    const out = createPanOut(audioCtx, pan);
    const vol = soft ? 0.55 : 1.0;

    // Slight organic pitch fingerprint per switch + micro jitter so rapid clicking never sounds robotic
    const microVar = 0.96 + Math.random() * 0.08;
    const rowShift = 1.08 - row * 0.028; // top rows slightly brighter, bottom rows slightly deeper thock
    const pitchMul = rowShift * microVar;

    // 1. Tactile Click-Bar / Leaf Snap (sharp crisp click at actuation)
    const snapSrc = audioCtx.createBufferSource();
    snapSrc.buffer = noiseBuffer;
    const snapHp = audioCtx.createBiquadFilter();
    snapHp.type = 'highpass';
    snapHp.frequency.setValueAtTime(1900 * pitchMul, now);
    const snapBp = audioCtx.createBiquadFilter();
    snapBp.type = 'bandpass';
    snapBp.frequency.setValueAtTime(3950 * pitchMul, now);
    snapBp.Q.value = 2.6;
    const snapG = audioCtx.createGain();
    snapG.gain.setValueAtTime(0.0001, now);
    snapG.gain.linearRampToValueAtTime(0.72 * vol, now + 0.0014);
    snapG.gain.exponentialRampToValueAtTime(0.0008, now + 0.019);
    snapSrc.connect(snapHp);
    snapHp.connect(snapBp);
    snapBp.connect(snapG);
    snapG.connect(out);
    snapSrc.start(now, Math.random() * 0.8, 0.028);

    // Secondary crisp switch-click metallic ping (gives that addictive Blue/Box-Jade clicky snap!)
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

    // 2. Creamy Keycap Bottom-Out "THOCK" (~6ms after tactile bump!)
    const thockT = now + 0.0055;
    const thockOsc = audioCtx.createOscillator();
    thockOsc.type = 'triangle';
    thockOsc.frequency.setValueAtTime(370 * pitchMul, thockT);
    thockOsc.frequency.exponentialRampToValueAtTime(132 * pitchMul, thockT + 0.036);
    const thockLp = audioCtx.createBiquadFilter();
    thockLp.type = 'lowpass';
    thockLp.frequency.setValueAtTime(1400 * pitchMul, thockT);
    const thockG = audioCtx.createGain();
    thockG.gain.setValueAtTime(0.0001, thockT);
    thockG.gain.linearRampToValueAtTime(0.58 * vol, thockT + 0.0025);
    thockG.gain.exponentialRampToValueAtTime(0.0008, thockT + 0.048);
    thockOsc.connect(thockLp);
    thockLp.connect(thockG);
    thockG.connect(out);
    thockOsc.start(thockT);
    thockOsc.stop(thockT + 0.055);

    // Textured plastic bottom-out body burst
    const bodySrc = audioCtx.createBufferSource();
    bodySrc.buffer = noiseBuffer;
    const bodyBp = audioCtx.createBiquadFilter();
    bodyBp.type = 'bandpass';
    bodyBp.frequency.setValueAtTime(980 * pitchMul, thockT);
    bodyBp.Q.value = 1.9;
    const bodyG = audioCtx.createGain();
    bodyG.gain.setValueAtTime(0.0001, thockT);
    bodyG.gain.linearRampToValueAtTime(0.46 * vol, thockT + 0.002);
    bodyG.gain.exponentialRampToValueAtTime(0.0008, thockT + 0.026);
    bodySrc.connect(bodyBp);
    bodyBp.connect(bodyG);
    bodyG.connect(out);
    bodySrc.start(thockT, Math.random() * 0.8, 0.032);

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
    caseOsc.stop(thockT + 0.06);

    // 4. Optional Cute Pastel Toy Kalimba / Sparkle Pluck
    if (musicalChimesEnabled && !soft) {
      const noteIdx = (col + (6 - row)) % PENTATONIC_SCALE.length;
      const freq = PENTATONIC_SCALE[noteIdx];
      const chimeT = now + 0.008;

      const chime = audioCtx.createOscillator();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(freq, chimeT);

      const chimeOver = audioCtx.createOscillator();
      chimeOver.type = 'triangle';
      chimeOver.frequency.setValueAtTime(freq * 2.0, chimeT);

      const chimeG = audioCtx.createGain();
      chimeG.gain.setValueAtTime(0.0001, chimeT);
      chimeG.gain.linearRampToValueAtTime(0.11, chimeT + 0.006);
      chimeG.gain.exponentialRampToValueAtTime(0.0006, chimeT + 0.22);

      const overG = audioCtx.createGain();
      overG.gain.setValueAtTime(0.0001, chimeT);
      overG.gain.linearRampToValueAtTime(0.035, chimeT + 0.004);
      overG.gain.exponentialRampToValueAtTime(0.0006, chimeT + 0.09);

      chime.connect(chimeG);
      chimeOver.connect(overG);
      chimeG.connect(out);
      chimeG.connect(reverbSend);
      overG.connect(out);

      chime.start(chimeT);
      chimeOver.start(chimeT);
      chime.stop(chimeT + 0.24);
      chimeOver.stop(chimeT + 0.11);
    }
  }

  /**
   * Crisp Mechanical Switch UPSTROKE ("CLACK!" when releasing the keycap)
   */
  function playKeyUp(row = 0, col = 2, cols = 5) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime;
    const pan = cols > 1 ? ((col / (cols - 1)) * 2 - 1) * 0.55 : 0;
    const out = createPanOut(audioCtx, pan);
    const pitchMul = (1.06 - row * 0.022) * (0.97 + Math.random() * 0.06);

    // Tight high-pitched plastic housing top-out clack
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
    clackSrc.start(now, Math.random() * 0.8, 0.024);

    // Subtle hollow keycap rebound pop
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
    reb.stop(now + 0.026);
  }

  /**
   * Joyful Sparkle Arpeggio when completing a full row or triggering a Rainbow Wave!
   */
  function playRainbowWaveChime() {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.34);
      osc.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(t);
      osc.stop(t + 0.38);
    });
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
