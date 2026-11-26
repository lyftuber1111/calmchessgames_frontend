/**
 * Calm Chess Computers & Games — Cartoonish Mystery Box & Silver Foil Rip Audio Engine
 * 100% Procedural Web Audio API synthesizer:
 *  - Crisp metallic silver foil crinkle & rip-open tearing sounds
 *  - Cute tall mystery box pop-open whoosh & lid sparkle
 *  - Unmistakable warm cartoon Cow "MOOOOOOO!" vocal-tract synthesis
 *  - Satisfying tactile mechanical keyboard switch CLICK-CLACK ("thock") for won cartoon keys
 *  - Playful cartoon decoy sounds (duck quack, boing, kitty meow, bubble pop, frog ribbit, magic chime)
 *  - $1,000 Cash-Register Cha-Ching + Sparkly Fanfare
 */

export const DECOY_SOUNDS = [
  { id: 'quack', emoji: '🦆' },
  { id: 'boing', emoji: '🌀' },
  { id: 'meow', emoji: '🐱' },
  { id: 'bubbles', emoji: '🫧' },
  { id: 'ribbit', emoji: '🐸' },
  { id: 'chime', emoji: '✨' },
  { id: 'giggle', emoji: '⭐' }
];

export function createClickerAudioEngine() {
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let reverbConvolver = null;
  let reverbSend = null;
  let noiseBuffer = null;

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

  function buildImpulseResponse(audioCtx, duration = 1.25, decay = 2.6) {
    const rate = audioCtx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const env = Math.pow(1 - i / length, decay);
        channelData[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
    }
    return impulse;
  }

  function makeWarmSaturationCurve(amount = 14) {
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
      compressor.threshold.value = -13;
      compressor.knee.value = 18;
      compressor.ratio.value = 4.2;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.15;

      masterGain = ctx.createGain();
      masterGain.gain.value = 0.86;

      reverbConvolver = ctx.createConvolver();
      reverbConvolver.buffer = buildImpulseResponse(ctx, 1.25, 2.6);
      reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.22;

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
    const clamped = Math.max(-0.8, Math.min(0.8, Number(pan) || 0));
    if (typeof audioCtx.createStereoPanner === 'function') {
      const panner = audioCtx.createStereoPanner();
      panner.pan.value = clamped;
      panner.connect(compressor);
      return panner;
    }
    return compressor;
  }

  /**
   * Cute Tall Mystery Box lid pop + bouncy gift reveal chime
   */
  function playBoxPopOpen(pan = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const now = audioCtx.currentTime;
    const out = createPanOut(audioCtx, pan);

    // Cork/gift lid POP!
    const pop = audioCtx.createOscillator();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(190, now);
    pop.frequency.exponentialRampToValueAtTime(640, now + 0.09);
    const popG = audioCtx.createGain();
    popG.gain.setValueAtTime(0.001, now);
    popG.gain.linearRampToValueAtTime(0.42, now + 0.015);
    popG.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    pop.connect(popG);
    popG.connect(out);
    pop.start(now);
    pop.stop(now + 0.16);

    // Playful rising sparkle notes as the silver package floats out
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const t = now + 0.06 + i * 0.055;
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g);
      g.connect(out);
      g.connect(reverbSend);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /**
   * Realistic Crinkly Silver Foil Package Tear Sound!
   * stage = 1 (half rip crinkle) or stage = 2 (full rip tear open!)
   */
  function playFoilRip(stage = 2, pan = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const now = audioCtx.currentTime;
    const out = createPanOut(audioCtx, pan);

    const dur = stage === 1 ? 0.24 : 0.36;
    const pulses = stage === 1 ? 5 : 9;

    // 1. Metallic crinkle crackle bursts (high-Q sweeping highpass/bandpass noise)
    for (let i = 0; i < pulses; i++) {
      const t = now + (i / pulses) * dur * 0.82 + Math.random() * 0.012;
      const src = audioCtx.createBufferSource();
      src.buffer = noiseBuffer;

      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(3400 + i * 420 + Math.random() * 900, t);
      bp.Q.value = 2.8;

      const hp = audioCtx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(2200, t);

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.32 + Math.random() * 0.16, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.048);

      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 0.9, 0.06);
    }

    // 2. Continuous ripping seam tear sweep
    const tearSrc = audioCtx.createBufferSource();
    tearSrc.buffer = noiseBuffer;
    const tearFilt = audioCtx.createBiquadFilter();
    tearFilt.type = 'bandpass';
    tearFilt.frequency.setValueAtTime(1700, now);
    tearFilt.frequency.exponentialRampToValueAtTime(stage === 1 ? 4200 : 6800, now + dur);
    tearFilt.Q.value = 1.8;

    const tearG = audioCtx.createGain();
    tearG.gain.setValueAtTime(0.001, now);
    tearG.gain.linearRampToValueAtTime(stage === 1 ? 0.28 : 0.42, now + 0.025);
    tearG.gain.exponentialRampToValueAtTime(0.001, now + dur);

    tearSrc.connect(tearFilt);
    tearFilt.connect(tearG);
    tearG.connect(out);
    tearSrc.start(now, 0.2, dur + 0.04);

    // 3. Final full-rip cheerful pop when pouch bursts open
    if (stage >= 2) {
      const popT = now + dur * 0.65;
      const popOsc = audioCtx.createOscillator();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(280, popT);
      popOsc.frequency.exponentialRampToValueAtTime(840, popT + 0.08);
      const popG = audioCtx.createGain();
      popG.gain.setValueAtTime(0.001, popT);
      popG.gain.linearRampToValueAtTime(0.35, popT + 0.01);
      popG.gain.exponentialRampToValueAtTime(0.001, popT + 0.11);
      popOsc.connect(popG);
      popG.connect(out);
      popOsc.start(popT);
      popOsc.stop(popT + 0.13);
    }
  }

  /**
   * Super Satisfying Mechanical Toy Keyboard Clicker Key CLICK-CLACK ("Thock!")
   * Plus an optional playful character chirp based on the cartoon keycap type!
   */
  function playKeyboardKeyClick(characterId = 'cow', pitchOffset = 0) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const now = audioCtx.currentTime;
    const out = compressor;
    const pitchMul = Math.pow(1.06, pitchOffset);

    // 1. Sharp mechanical switch tactile click (downstroke)
    const clickSrc = audioCtx.createBufferSource();
    clickSrc.buffer = noiseBuffer;
    const clickBp = audioCtx.createBiquadFilter();
    clickBp.type = 'bandpass';
    clickBp.frequency.setValueAtTime(3600 * pitchMul, now);
    clickBp.Q.value = 2.4;
    const clickG = audioCtx.createGain();
    clickG.gain.setValueAtTime(0.001, now);
    clickG.gain.linearRampToValueAtTime(0.55, now + 0.002);
    clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    clickSrc.connect(clickBp);
    clickBp.connect(clickG);
    clickG.connect(out);
    clickSrc.start(now, 0.1, 0.035);

    // 2. Creamy bottom-out plastic "THOCK"
    const thock = audioCtx.createOscillator();
    thock.type = 'triangle';
    thock.frequency.setValueAtTime(340 * pitchMul, now);
    thock.frequency.exponentialRampToValueAtTime(115 * pitchMul, now + 0.045);
    const thockG = audioCtx.createGain();
    thockG.gain.setValueAtTime(0.45, now);
    thockG.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    thock.connect(thockG);
    thockG.connect(out);
    thock.start(now);
    thock.stop(now + 0.06);

    // 3. Upstroke switch return "CLACK" (~65ms later)
    const upT = now + 0.068;
    const clackSrc = audioCtx.createBufferSource();
    clackSrc.buffer = noiseBuffer;
    const clackBp = audioCtx.createBiquadFilter();
    clackBp.type = 'bandpass';
    clackBp.frequency.setValueAtTime(4600 * pitchMul, upT);
    clackBp.Q.value = 3.0;
    const clackG = audioCtx.createGain();
    clackG.gain.setValueAtTime(0.001, upT);
    clackG.gain.linearRampToValueAtTime(0.32, upT + 0.002);
    clackG.gain.exponentialRampToValueAtTime(0.001, upT + 0.022);
    clackSrc.connect(clackBp);
    clackBp.connect(clackG);
    clackG.connect(out);
    clackSrc.start(upT, 0.35, 0.03);

    // 4. Tiny adorable musical sparkle chirp matched to the cartoon keycap!
    const noteMap = {
      cow: 523.25,
      kitty: 659.25,
      unicorn: 783.99,
      bunny: 880.0,
      froggy: 587.33,
      teddy: 493.88,
      crown: 987.77,
      rainbow: 1046.5
    };
    const baseNote = noteMap[characterId] || 659.25;
    const chirp = audioCtx.createOscillator();
    chirp.type = 'sine';
    chirp.frequency.setValueAtTime(baseNote, now + 0.015);
    chirp.frequency.exponentialRampToValueAtTime(baseNote * 1.25, now + 0.12);
    const chirpG = audioCtx.createGain();
    chirpG.gain.setValueAtTime(0.001, now + 0.015);
    chirpG.gain.linearRampToValueAtTime(0.14, now + 0.028);
    chirpG.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    chirp.connect(chirpG);
    chirpG.connect(out);
    chirpG.connect(reverbSend);
    chirp.start(now + 0.015);
    chirp.stop(now + 0.18);
  }

  /**
   * THE STAR SOUND: Unmistakable, warm, hilarious Cow "MOOOOOOO!"
   * Multi-formant bovine vocal-tract synthesis (M -> OOO -> UUU)
   */
  function playMoo(pan = 0, mini = false) {
    const audioCtx = ensureContext();
    if (!audioCtx) return 1500;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + (mini ? 0.01 : 0.04);
    const dur = mini ? 0.65 : 1.48;
    const out = createPanOut(audioCtx, pan);
    const pitchScale = mini ? 1.25 : 1.0;

    const voiceBus = audioCtx.createGain();
    voiceBus.gain.setValueAtTime(0.0001, now);
    voiceBus.gain.linearRampToValueAtTime(mini ? 0.24 : 0.34, now + dur * 0.10);
    voiceBus.gain.linearRampToValueAtTime(mini ? 0.56 : 0.90, now + dur * 0.24);
    voiceBus.gain.setValueAtTime(mini ? 0.52 : 0.85, now + dur * 0.64);
    voiceBus.gain.exponentialRampToValueAtTime(0.001, now + dur);

    const shaper = audioCtx.createWaveShaper();
    shaper.curve = makeWarmSaturationCurve(13);
    shaper.oversample = '2x';

    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(126 * pitchScale, now);
    osc1.frequency.exponentialRampToValueAtTime(158 * pitchScale, now + dur * 0.24);
    osc1.frequency.exponentialRampToValueAtTime(146 * pitchScale, now + dur * 0.58);
    osc1.frequency.exponentialRampToValueAtTime(104 * pitchScale, now + dur);

    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(127.2 * pitchScale, now);
    osc2.frequency.exponentialRampToValueAtTime(159.3 * pitchScale, now + dur * 0.24);
    osc2.frequency.exponentialRampToValueAtTime(147.2 * pitchScale, now + dur * 0.58);
    osc2.frequency.exponentialRampToValueAtTime(105.0 * pitchScale, now + dur);

    const oscSub = audioCtx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(63 * pitchScale, now);
    oscSub.frequency.exponentialRampToValueAtTime(79 * pitchScale, now + dur * 0.24);
    oscSub.frequency.exponentialRampToValueAtTime(52 * pitchScale, now + dur);

    const vibLfo = audioCtx.createOscillator();
    vibLfo.type = 'sine';
    vibLfo.frequency.setValueAtTime(5.3, now);
    const vibGain = audioCtx.createGain();
    vibGain.gain.setValueAtTime(1.8, now);
    vibGain.gain.linearRampToValueAtTime(3.6, now + dur * 0.42);
    vibGain.gain.linearRampToValueAtTime(1.2, now + dur);
    vibLfo.connect(vibGain);
    vibGain.connect(osc1.frequency);
    vibGain.connect(osc2.frequency);

    const breathSrc = audioCtx.createBufferSource();
    breathSrc.buffer = noiseBuffer;
    const breathFilt = audioCtx.createBiquadFilter();
    breathFilt.type = 'bandpass';
    breathFilt.frequency.setValueAtTime(920, now);
    breathFilt.Q.value = 1.2;
    const breathGain = audioCtx.createGain();
    breathGain.gain.setValueAtTime(0.055, now);

    const glottalMix = audioCtx.createGain();
    glottalMix.gain.value = 0.55;
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.48;
    const subGain = audioCtx.createGain();
    subGain.gain.value = 0.26;

    osc1.connect(glottalMix);
    osc2.connect(osc2Gain);
    osc2Gain.connect(glottalMix);
    oscSub.connect(subGain);
    subGain.connect(glottalMix);
    breathSrc.connect(breathFilt);
    breathFilt.connect(breathGain);
    breathGain.connect(glottalMix);

    const formants = [
      { fStart: 255, fPeak: 475, fEnd: 315, q: 5.0, gain: 1.35 },
      { fStart: 630, fPeak: 970, fEnd: 700, q: 6.2, gain: 0.92 },
      { fStart: 1980, fPeak: 2380, fEnd: 1840, q: 7.2, gain: 0.34 }
    ];
    const formantSum = audioCtx.createGain();
    formantSum.gain.value = 1.05;

    formants.forEach((fm) => {
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = fm.q;
      bp.frequency.setValueAtTime(fm.fStart, now);
      bp.frequency.exponentialRampToValueAtTime(fm.fPeak, now + dur * 0.20);
      bp.frequency.setValueAtTime(fm.fPeak * 0.96, now + dur * 0.58);
      bp.frequency.exponentialRampToValueAtTime(fm.fEnd, now + dur);

      const fg = audioCtx.createGain();
      fg.gain.value = fm.gain;
      glottalMix.connect(bp);
      bp.connect(fg);
      fg.connect(formantSum);
    });

    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(2900, now);

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

    const stopAt = now + dur + 0.06;
    osc1.stop(stopAt);
    osc2.stop(stopAt);
    oscSub.stop(stopAt);
    vibLfo.stop(stopAt);
    breathSrc.stop(stopAt);

    return Math.round(dur * 1000);
  }

  /**
   * Playful cartoon decoy sounds when a ripped silver package does NOT say moo
   */
  function playDecoySound(decoyIndex, pan = 0) {
    const audioCtx = ensureContext();
    const meta = DECOY_SOUNDS[((decoyIndex % DECOY_SOUNDS.length) + DECOY_SOUNDS.length) % DECOY_SOUNDS.length];
    if (!audioCtx) return meta;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + 0.05;
    const out = createPanOut(audioCtx, pan);

    switch (meta.id) {
      case 'quack': {
        [0, 0.16].forEach((offset) => {
          const t = now + offset;
          const osc = audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(360, t);
          osc.frequency.exponentialRampToValueAtTime(270, t + 0.11);
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1500, t);
          bp.frequency.exponentialRampToValueAtTime(880, t + 0.11);
          bp.Q.value = 4.2;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.42, t + 0.018);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          osc.connect(bp);
          bp.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + 0.15);
        });
        break;
      }
      case 'boing': {
        const osc = audioCtx.createOscillator();
        const mod = audioCtx.createOscillator();
        const modG = audioCtx.createGain();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(185, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.44);
        mod.frequency.setValueAtTime(20, now);
        modG.gain.setValueAtTime(65, now);
        modG.gain.exponentialRampToValueAtTime(5, now + 0.44);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        mod.connect(modG);
        modG.connect(osc.frequency);
        osc.connect(g);
        g.connect(out);
        osc.start(now);
        mod.start(now);
        osc.stop(now + 0.5);
        mod.stop(now + 0.5);
        break;
      }
      case 'meow': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.17);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.46);
        const bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1350, now);
        bp.frequency.exponentialRampToValueAtTime(2200, now + 0.17);
        bp.frequency.exponentialRampToValueAtTime(1020, now + 0.46);
        bp.Q.value = 4.5;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.34, now + 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        osc.connect(bp);
        bp.connect(g);
        g.connect(out);
        g.connect(reverbSend);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      case 'bubbles': {
        [0, 0.08, 0.17, 0.26].forEach((offset, i) => {
          const t = now + offset;
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          const f = 380 + i * 150;
          osc.frequency.setValueAtTime(f, t);
          osc.frequency.exponentialRampToValueAtTime(f * 2.1, t + 0.065);
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.26, t + 0.012);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
          osc.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + 0.09);
        });
        break;
      }
      case 'ribbit': {
        [0, 0.19].forEach((offset) => {
          const t = now + offset;
          const osc = audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, t);
          osc.frequency.exponentialRampToValueAtTime(360, t + 0.095);
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(660, t);
          bp.frequency.exponentialRampToValueAtTime(1400, t + 0.095);
          bp.Q.value = 4.8;
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.36, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(bp);
          bp.connect(g);
          g.connect(out);
          osc.start(t);
          osc.stop(t + 0.14);
        });
        break;
      }
      case 'giggle': {
        [660, 880, 740, 987, 1174].forEach((freq, i) => {
          const t = now + i * 0.06;
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.05);
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.22, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          osc.connect(g);
          g.connect(out);
          g.connect(reverbSend);
          osc.start(t);
          osc.stop(t + 0.11);
        });
        break;
      }
      case 'chime':
      default: {
        [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
          const t = now + i * 0.05;
          const osc = audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          const g = audioCtx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.18, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
          osc.connect(g);
          g.connect(out);
          g.connect(reverbSend);
          osc.start(t);
          osc.stop(t + 0.45);
        });
        break;
      }
    }

    return meta;
  }

  /**
   * Magical Sparkle + Cash-Register $1,000 Jackpot Fanfare!
   */
  function playJackpotFanfare() {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const now = audioCtx.currentTime + 0.38;

    // Cash-register Cha-Ching!
    [1760, 2637.02, 3520].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.014);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, now + i * 0.014);
      g.gain.linearRampToValueAtTime(0.22 / (i + 1), now + i * 0.014 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      osc.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(now + i * 0.014);
      osc.stop(now + 0.78);
    });

    // Cheerful glittery major arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((freq, idx) => {
      const t = now + 0.12 + idx * 0.068;
      const osc = audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.58);
      osc.connect(g);
      g.connect(compressor);
      g.connect(reverbSend);
      osc.start(t);
      osc.stop(t + 0.62);
    });
  }

  return {
    unlock,
    playBoxPopOpen,
    playFoilRip,
    playKeyboardKeyClick,
    playMoo,
    playDecoySound,
    playJackpotFanfare,
    getContextState: () => (ctx ? ctx.state : 'uninitialized'),
    DECOY_SOUNDS
  };
}
