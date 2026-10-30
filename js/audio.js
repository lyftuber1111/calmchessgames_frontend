/**
 * WoodKeyboardAudio - Web Audio API synthesizer for realistic mechanical wooden keyboard sounds.
 * Generates tactile mechanical switch clicks and organic resonant wooden acoustic strikes.
 */
class WoodKeyboardAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.85;
    this.muted = false;
    this.woodType = 'walnut'; // 'walnut', 'oak', 'teak'

    // Acoustic resonance profiles for different wood species
    this.profiles = {
      walnut: {
        name: 'Dark Walnut',
        baseFreq: 640,
        subFreq: 210,
        snapFreq: 3400,
        decay: 0.055,
        bodyQ: 10,
        color: '#5c3826'
      },
      oak: {
        name: 'Solid Oak',
        baseFreq: 820,
        subFreq: 260,
        snapFreq: 4200,
        decay: 0.042,
        bodyQ: 12,
        color: '#8b5a2b'
      },
      teak: {
        name: 'Acoustic Teak',
        baseFreq: 520,
        subFreq: 175,
        snapFreq: 2900,
        decay: 0.075,
        bodyQ: 8,
        color: '#6e4720'
      }
    };

    // Pre-calculated excitation impulse buffer
    this.impulseBuffer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Master subtle warmth compressor to glue the acoustic components
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(3, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.001, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.04, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      this._createImpulseBuffer();
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  _createImpulseBuffer() {
    if (!this.ctx) return;
    const length = Math.floor(this.ctx.sampleRate * 0.008); // 8ms noise/impulse burst
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      // Exponential decaying noise burst simulating mechanical switch impact
      const decay = Math.exp(-i / (length * 0.25));
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    this.impulseBuffer = buffer;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  setWoodType(type) {
    if (this.profiles[type]) {
      this.woodType = type;
    }
  }

  /**
   * Play realistic mechanical wooden keypress click
   * @param {string} keyType - 'standard', 'space', 'enter', 'backspace', 'modifier'
   */
  playKeyPress(keyType = 'standard') {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.impulseBuffer) return;

    const now = this.ctx.currentTime;
    const profile = this.profiles[this.woodType] || this.profiles.walnut;

    // Organic random variations (±4% pitch jitter, slight velocity drift)
    const pitchJitter = 1 + (Math.random() * 0.08 - 0.04);
    const velocity = 0.85 + Math.random() * 0.25;

    // Key-specific tuning
    let pitchMod = 1.0;
    let subGainLevel = 0.35;
    let decayMultiplier = 1.0;

    switch (keyType) {
      case 'space':
        pitchMod = 0.58; // deep, resonant wooden spacebar thud
        subGainLevel = 0.65;
        decayMultiplier = 1.35;
        break;
      case 'enter':
        pitchMod = 0.72;
        subGainLevel = 0.45;
        decayMultiplier = 1.15;
        break;
      case 'backspace':
        pitchMod = 0.82;
        subGainLevel = 0.40;
        break;
      case 'modifier':
      case 'caps':
      case 'shift':
        pitchMod = 0.90;
        subGainLevel = 0.30;
        break;
      default:
        pitchMod = 1.0;
        break;
    }

    const currentBaseFreq = profile.baseFreq * pitchMod * pitchJitter;
    const currentSubFreq = profile.subFreq * pitchMod * pitchJitter;
    const currentSnapFreq = profile.snapFreq * pitchJitter;
    const totalDecay = profile.decay * decayMultiplier;

    // 1. MECHANICAL SWITCH CLICK TRANSIENT (sharp leaf snap)
    const snapSource = this.ctx.createBufferSource();
    snapSource.buffer = this.impulseBuffer;

    const snapFilter = this.ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(currentSnapFreq, now);
    snapFilter.Q.setValueAtTime(5, now);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.55 * velocity, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    snapSource.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapSource.start(now);
    snapSource.stop(now + 0.015);

    // 2. PRIMARY WOODEN BODY IMPACT (modal resonance of wooden keycap)
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(currentBaseFreq, now);
    // Slight downward pitch drop simulating physical deceleration of impact
    bodyOsc.frequency.exponentialRampToValueAtTime(currentBaseFreq * 0.88, now + totalDecay);

    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(currentBaseFreq, now);
    bodyFilter.Q.setValueAtTime(profile.bodyQ, now);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.7 * velocity, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDecay);

    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(this.masterGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + totalDecay + 0.01);

    // 3. OVERTONE HIGH WOOD RING
    const highRingOsc = this.ctx.createOscillator();
    highRingOsc.type = 'sine';
    highRingOsc.frequency.setValueAtTime(currentBaseFreq * 2.38, now);

    const highRingGain = this.ctx.createGain();
    highRingGain.gain.setValueAtTime(0.22 * velocity, now);
    highRingGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDecay * 0.6);

    highRingOsc.connect(highRingGain);
    highRingGain.connect(this.masterGain);
    highRingOsc.start(now);
    highRingOsc.stop(now + totalDecay * 0.7);

    // 4. LOW WOODEN CHASSIS HOLLOW THUMP
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(currentSubFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(currentSubFreq * 0.75, now + totalDecay * 1.2);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(subGainLevel * velocity, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDecay * 1.1);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + totalDecay * 1.2);
  }

  /**
   * Play subtle key release clack (switch reset spring return)
   */
  playKeyRelease(keyType = 'standard') {
    if (this.muted) return;
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const profile = this.profiles[this.woodType] || this.profiles.walnut;
    const releaseFreq = (profile.baseFreq * 1.35) * (1 + (Math.random() * 0.08 - 0.04));

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(releaseFreq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(releaseFreq, now);
    filter.Q.setValueAtTime(8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

// Export singleton instance
window.woodAudio = new WoodKeyboardAudio();
