/**
 * Calm Chess Computers & Games — Tall Mystery Box XR Clicker Audio Engine
 * 100% Procedural Web Audio API synthesizer:
 *  - Multi-formant resonant Cow "MOOOOOOO!" vocal-tract synthesis
 *  - Heavy tactile Tall Clicker mechanical snap, hydraulic hiss & coil spring boing
 *  - 8 playful Mystery Box decoy sounds so listening for the MOO is suspenseful & fun
 *  - $1,000 Cash-Register Cha-Ching + Triumphant Brass & Chime Jackpot Fanfare
 *  - Mobile / Safari / WebXR seamless gesture audio unlock
 */

const STORAGE_MUTE_KEY = 'calmchess_clicker_muted_v1';
const STORAGE_VOL_KEY = 'calmchess_clicker_volume_v1';

export const DECOY_SOUNDS = [
  { id: 'boing', label: 'Spring Boing', emoji: '🌀', caption: 'Boing-oing-oing! (Not a moo...)' },
  { id: 'quack', label: 'Rubber Duck', emoji: '🦆', caption: 'Quack-quack! (Wrong barnyard friend!)' },
  { id: 'chime', label: 'Vault Chime', emoji: '✨', caption: 'Mystic vault chime... listen closer!' },
  { id: 'clockwork', label: 'Clockwork Tick', emoji: '⚙️', caption: 'Tick-tock-clack! Gears turning inside...' },
  { id: 'ribbit', label: 'Pond Frog', emoji: '🐸', caption: 'Ribbit-ribbit! (Close, still no moo!)' },
  { id: 'laser', label: 'Neon Zing', emoji: '⚡', caption: 'Zzzing-pew! High-voltage mystery!' },
  { id: 'meow', label: 'Sneaky Cat', emoji: '🐱', caption: 'Meeeow~! (Cheeky decoy!)' },
  { id: 'tuba', label: 'Brass Honk', emoji: '🎺', caption: 'Bwomp-bwomp! Try another tall clicker!' }
];

export function createClickerAudioEngine() {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let reverbConvolver = null;
  let reverbSend = null;
  let noiseBuffer = null;

  let muted = false;
  let volume = 0.82;

  try {
    muted = localStorage.getItem(STORAGE_MUTE_KEY) === '1';
    const savedVol = parseFloat(localStorage.getItem(STORAGE_VOL_KEY));
    if (Number.isFinite(savedVol) && savedVol >= 0 && savedVol <= 1) {
      volume = savedVol;
    }
  } catch (_) {}

  if (typeof navigator !== 'undefined' && navigator.audioSession && 'type' in navigator.audioSession) {
    try {
      navigator.audioSession.type = 'playback';
    } catch (_) {}
  }

  function buildNoiseBuffer(audioCtx) {
    const length = Math.floor(audioCtx.sampleRate * 2.0);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function buildImpulseResponse(audioCtx, duration = 1.35, decay = 2.6) {
    const rate = audioCtx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        channelData[i] = (Math.random() * 2 - 1) * env * 0.55;
      }
    }
    return impulse;
  }

  function makeWarmSaturationCurve(amount = 18) {
    const samples = 512;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
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
      compressor.ratio.value = 4.5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.16;

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;

      reverbConvolver = ctx.createConvolver();
      reverbConvolver.buffer = buildImpulseResponse(ctx, 1.4, 2.5);
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.24;

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
    const clampedPan = Math.max(-0.85, Math.min(0.85, Number(pan) || 0));
    if (typeof audioCtx.createStereoPanner === 'function') {
      const panner = audioCtx.createStereoPanner();
      panner.pan.value = clampedPan;
      panner.connect(compressor);
      return panner;
    }
    return compressor;
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    try {
      localStorage.setItem(STORAGE_MUTE_KEY, muted ? '1' : '0');
    } catch (_) {}
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02);
    }
    return muted;
  }

  function setVolume(nextVol) {
    const clamped = Math.max(0, Math.min(1, Number(nextVol)));
    if (!Number.isFinite(clamped)) return volume;
    volume = clamped;
    if (volume > 0 && muted) {
      muted = false;
      try {
        localStorage.setItem(STORAGE_MUTE_KEY, '0');
      } catch (_) {}
    }
    try {
      localStorage.setItem(STORAGE_VOL_KEY, String(volume));
    } catch (_) {}
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02);
    }
    return volume;
  }

  /**
   * Tactile heavy Tall Clicker mechanical switch + hydraulic burst + coil recoil
   */
  function playClickerPress(pillarIndex = 2, chargeRatio = 0, pan = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime;
    const out = createPanOut(audioCtx, pan);
    const pitchBase = 180 + pillarIndex * 28 + chargeRatio * 55;

    // 1. Crisp micro-switch mechanical snap (high-passed short noise burst)
    const snapSrc = audioCtx.createBufferSource();
    snapSrc.buffer = noiseBuffer;
    const snapFilter = audioCtx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(2400 + pillarIndex * 180, now);
    snapFilter.Q.value = 1.6;
    const snapGain = audioCtx.createGain();
    snapGain.gain.setValueAtTime(0.001, now);
    snapGain.gain.linearRampToValueAtTime(0.45, now + 0.003);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
    snapSrc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(out);
    snapSrc.start(now);
    snapSrc.stop(now + 0.05);

    // 2. Heavy plunger bottom-out thump
    const thumpOsc = audioCtx.createOscillator();
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(pitchBase * 0.95, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(58, now + 0.085);
    const thumpGain = audioCtx.createGain();
    thumpGain.gain.setValueAtTime(0.42, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(out);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.11);

    // 3. Tall coil spring upward recoil ping
    const recoilOsc = audioCtx.createOscillator();
    recoilOsc.type = 'sine';
    recoilOsc.frequency.setValueAtTime(pitchBase * 1.45, now + 0.055);
    recoilOsc.frequency.exponentialRampToValueAtTime(pitchBase * 2.35, now + 0.16);
    const recoilGain = audioCtx.createGain();
    recoilGain.gain.setValueAtTime(0.001, now + 0.05);
    recoilGain.gain.linearRampToValueAtTime(0.16, now + 0.068);
    recoilGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    recoilOsc.connect(recoilGain);
    recoilGain.connect(out);
    recoilOsc.start(now + 0.05);
    recoilOsc.stop(now + 0.21);
  }

  /**
   * Subtle mystery vault lid hydraulic whoosh
   */
  function playLidCreak(openWide = false, pan = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const out = createPanOut(audioCtx, pan);
    const dur = openWide ? 0.38 : 0.16;

    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(openWide ? 600 : 900, now);
    filt.frequency.exponentialRampToValueAtTime(openWide ? 2400 : 1600, now + dur);
    filt.Q.value = 3.2;

    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(openWide ? 0.22 : 0.09, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filt);
    filt.connect(g);
    g.connect(out);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  /**
   * THE STAR SOUND: Unmistakable, resonant, organically articulated Cow "MOOOOOOO!"
   * Uses dual glottal oscillators + subtle vocal vibrato + breathy throat noise
   * routed through 3 sweeping cow vocal-tract formant filters (M -> OOO -> UUU)
   * with warm saturation and spatial vault reverb.
   */
  function playMoo(pan = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx) return 1550;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + 0.03;
    const dur = 1.52;
    const out = createPanOut(audioCtx, pan);

    // Master envelope for the moo vocalization
    const voiceBus = audioCtx.createGain();
    voiceBus.gain.setValueAtTime(0.0001, now);
    // Soft closed-mouth "Mmm..." onset -> open resonant "OOOOO..." -> gentle falloff
    voiceBus.gain.linearRampToValueAtTime(0.32, now + 0.14);
    voiceBus.gain.linearRampToValueAtTime(0.88, now + 0.34);
    voiceBus.gain.setValueAtTime(0.84, now + 0.96);
    voiceBus.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // Warm organic vocal-fold saturation
    const shaper = audioCtx.createWaveShaper();
    shaper.curve = makeWarmSaturationCurve(14);
    shaper.oversample = '2x';

    // Pitch contour: starts low (~124 Hz), swells gently to ~154 Hz, then droops down to ~104 Hz
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(124, now);
    osc1.frequency.exponentialRampToValueAtTime(154, now + 0.36);
    osc1.frequency.exponentialRampToValueAtTime(144, now + 0.88);
    osc1.frequency.exponentialRampToValueAtTime(102, now + dur);

    // Slightly detuned second vocal fold + subtle octave body
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(125.1, now);
    osc2.frequency.exponentialRampToValueAtTime(155.3, now + 0.36);
    osc2.frequency.exponentialRampToValueAtTime(145.1, now + 0.88);
    osc2.frequency.exponentialRampToValueAtTime(103.0, now + dur);

    const oscSub = audioCtx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(62, now);
    oscSub.frequency.exponentialRampToValueAtTime(77, now + 0.36);
    oscSub.frequency.exponentialRampToValueAtTime(51, now + dur);

    // Natural throat vibrato LFO
    const vibLfo = audioCtx.createOscillator();
    vibLfo.type = 'sine';
    vibLfo.frequency.setValueAtTime(5.1, now);
    const vibGain = audioCtx.createGain();
    vibGain.gain.setValueAtTime(1.8, now);
    vibGain.gain.linearRampToValueAtTime(3.6, now + 0.6);
    vibGain.gain.linearRampToValueAtTime(1.4, now + dur);
    vibLfo.connect(vibGain);
    vibGain.connect(osc1.frequency);
    vibGain.connect(osc2.frequency);

    // Subtle vocal cord breathiness
    const breathSrc = audioCtx.createBufferSource();
    breathSrc.buffer = noiseBuffer;
    const breathFilt = audioCtx.createBiquadFilter();
    breathFilt.type = 'bandpass';
    breathFilt.frequency.setValueAtTime(900, now);
    breathFilt.Q.value = 1.2;
    const breathGain = audioCtx.createGain();
    breathGain.gain.setValueAtTime(0.06, now);

    // Mix raw glottal sources before formant bank
    const glottalMix = audioCtx.createGain();
    glottalMix.gain.value = 0.55;
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.48;
    const subGain = audioCtx.createGain();
    subGain.gain.value = 0.28;

    osc1.connect(glottalMix);
    osc2.connect(osc2Gain);
    osc2Gain.connect(glottalMix);
    oscSub.connect(subGain);
    subGain.connect(glottalMix);
    breathSrc.connect(breathFilt);
    breathFilt.connect(breathGain);
    breathGain.connect(glottalMix);

    // 3 Parallel Bovine Vocal-Tract Formant Filters:
    // Transitions smoothly from nasal closed 'M' (0..0.18s) -> resonant open 'OO' (0.28..1.05s) -> warm 'UH/OO' tail
    const formants = [
      { fStart: 250, fPeak: 470, fEnd: 310, q: 5.2, gain: 1.35 }, // F1 chest/jaw
      { fStart: 620, fPeak: 960, fEnd: 690, q: 6.4, gain: 0.92 }, // F2 tongue/mouth cavity ("oo")
      { fStart: 1950, fPeak: 2350, fEnd: 1820, q: 7.5, gain: 0.34 } // F3 nasal resonance
    ];

    const formantSum = audioCtx.createGain();
    formantSum.gain.value = 1.05;

    formants.forEach((fm) => {
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = fm.q;
      bp.frequency.setValueAtTime(fm.fStart, now);
      bp.frequency.exponentialRampToValueAtTime(fm.fPeak, now + 0.30);
      bp.frequency.setValueAtTime(fm.fPeak * 0.96, now + 0.86);
      bp.frequency.exponentialRampToValueAtTime(fm.fEnd, now + dur);

      const fg = audioCtx.createGain();
      fg.gain.value = fm.gain;

      glottalMix.connect(bp);
      bp.connect(fg);
      fg.connect(formantSum);
    });

    // Warm low-pass polish to remove harsh fizz
    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(2900, now);
    lpf.Q.value = 0.8;

    formantSum.connect(shaper);
    shaper.connect(lpf);
    lpf.connect(voiceBus);
    voiceBus.connect(out);
    voiceBus.connect(reverbSend);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);
    vibLfo.start(now);
    breathSrc.start(now);

    const stopAt = now + dur + 0.08;
    osc1.stop(stopAt);
    osc2.stop(stopAt);
    oscSub.stop(stopAt);
    vibLfo.stop(stopAt);
    breathSrc.stop(stopAt);

    return Math.round(dur * 1000);
  }

  /**
   * Play one of 8 playful mystery decoy sounds
   */
  function playDecoySound(decoyIndex, pan = 0) {
    const audioCtx = ensureContext();
    const meta = DECOY_SOUNDS[((decoyIndex % DECOY_SOUNDS.length) + DECOY_SOUNDS.length) % DECOY_SOUNDS.length];
    if (!audioCtx) return meta;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + 0.045;
    const out = createPanOut(audioCtx, pan);

    switch (meta.id) {
      case 'boing': {
        const osc = audioCtx.createOscillator();
        const mod = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(210, now + 0.45);
        mod.frequency.setValueAtTime(19, now);
        modGain.gain.setValueAtTime(65, now);
        modGain.gain.exponentialRampToValueAtTime(4, now + 0.45);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(g);
        g.connect(out);
        osc.start(now);
        mod.start(now);
        osc.stop(now + 0.5);
        mod.stop(now + 0.5);
        break;
      }
      case 'quack': {
        [0, 0.17].forEach((offset) => {
          const t = now + offset;
          const osc = audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(340, t);
          osc.frequency.exponentialRampToValueAtTime(260, t + 0.12);
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1450, t);
          bp.frequency.exponentialRampToValueAtTime(860, t + 0.12);
          bp.Q.value = 4.2;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.45, t + 0.018);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          osc.connect(bp);
          bp.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + 0.15);
        });
        break;
      }
      case 'chime': {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const t = now + i * 0.055;
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.18, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
          osc.connect(g);
          g.connect(out);
          g.connect(reverbSend);
          osc.start(t);
          osc.stop(t + 0.52);
        });
        break;
      }
      case 'clockwork': {
        [0, 0.11, 0.22].forEach((offset, i) => {
          const t = now + offset;
          const osc = audioCtx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 1150 : 880, t);
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1600;
          bp.Q.value = 3.5;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.28, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
          osc.connect(bp);
          bp.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + 0.055);
        });
        break;
      }
      case 'ribbit': {
        [0, 0.20].forEach((offset) => {
          const t = now + offset;
          const osc = audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(145, t);
          osc.frequency.exponentialRampToValueAtTime(340, t + 0.095);
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(620, t);
          bp.frequency.exponentialRampToValueAtTime(1350, t + 0.095);
          bp.Q.value = 5.0;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.38, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          osc.connect(bp);
          bp.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + 0.15);
        });
        break;
      }
      case 'laser': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1380, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.28);
        const lpf = audioCtx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(2600, now);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.24, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(out);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
      }
      case 'meow': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(410, now + 0.50);
        const bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1250, now);
        bp.frequency.exponentialRampToValueAtTime(2150, now + 0.18);
        bp.frequency.exponentialRampToValueAtTime(980, now + 0.50);
        bp.Q.value = 4.6;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.36, now + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        osc.connect(bp);
        bp.connect(g);
        g.connect(out);
        g.connect(reverbSend);
        osc.start(now);
        osc.stop(now + 0.55);
        break;
      }
      case 'tuba':
      default: {
        [
          { f: 116.54, t: 0, d: 0.18 },
          { f: 98.0, t: 0.20, d: 0.28 }
        ].forEach((n) => {
          const st = now + n.t;
          const osc = audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(n.f, st);
          const lp = audioCtx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(440, st);
          lp.Q.value = 2.4;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, st);
          g.gain.linearRampToValueAtTime(0.35, st + 0.025);
          g.gain.exponentialRampToValueAtTime(0.001, st + n.d);
          osc.connect(lp);
          lp.connect(g);
          g.connect(out);
          osc.start(st);
          osc.stop(st + n.d + 0.03);
        });
        break;
      }
    }

    return meta;
  }

  /**
   * $1,000 Jackpot Fanfare: Cash-register cha-ching + ascending golden brass/chime chord
   */
  function playJackpotFanfare() {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + 0.42;

    // 1. Cash Register "Cha-Ching!" bell
    [1760, 2637.02, 3520].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.012);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now + i * 0.012);
      g.gain.linearRampToValueAtTime(0.22 / (i + 1), now + i * 0.012 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      osc.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(now + i * 0.012);
      osc.stop(now + 0.78);
    });

    // 2. Celebratory golden major-9th arpeggio fanfare
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const t = now + 0.14 + idx * 0.075;
      const osc = audioCtx.createOscillator();
      osc.type = idx >= 4 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(3200, t);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(lp);
      lp.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  }

  /**
   * Subtle ascending mystery shuffle chime when starting a new round
   */
  function playRoundReset() {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime;
    [330, 440, 554.37, 659.25].forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  return {
    unlock,
    setMuted,
    isMuted: () => muted,
    setVolume,
    getVolume: () => volume,
    playClickerPress,
    playLidCreak,
    playMoo,
    playDecoySound,
    playJackpotFanfare,
    playRoundReset,
    getContextState: () => (ctx ? ctx.state : 'uninitialized'),
    DECOY_SOUNDS
  };
}
