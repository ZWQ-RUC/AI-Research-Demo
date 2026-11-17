// ============================================================================
// Procedural Web Audio API Cave Soundscape
// Synthesizes echoing water droplets, underground river flow, karst resonance,
// soft dog paw steps, and playful sniffing sounds (Zero external audio files)
// ============================================================================
(function(global) {
  'use strict';

  class CaveAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.riverGain = null;
      this.dripTimer = 0;
      this.stepTimer = 0;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Continuous filtered brown-pink noise for underground river & cave breeze
      const bufSize = this.ctx.sampleRate * 3;
      const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 0.35;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuf;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 340;
      filter.Q.value = 1.2;

      this.riverGain = this.ctx.createGain();
      this.riverGain.gain.value = 0.0;

      whiteNoise.connect(filter);
      filter.connect(this.riverGain);
      this.riverGain.connect(this.ctx.destination);
      whiteNoise.start(0);
    }

    toggle() {
      if (!this.ctx) this.init();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.enabled = !this.enabled;
      if (this.riverGain) {
        this.riverGain.gain.setTargetAtTime(this.enabled ? 0.08 : 0.0, this.ctx.currentTime, 0.25);
      }
      if (this.enabled) {
        this.playWaterDrip(1100);
      }
      return this.enabled;
    }

    playWaterDrip(baseFreq) {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f = baseFreq || (850 + Math.random() * 750);
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.48, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    playPawStep() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135 + Math.random() * 25, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.055);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }

    update(dt, splineT, speedFactor) {
      if (!this.enabled || !this.ctx) return;
      // Louder underground river murmur in Hall 2 (t ~ 0.46..0.72) and Front Hall pool
      const nearRiver = (splineT > 0.46 && splineT < 0.72) ? 0.16 : ((splineT > 0.08 && splineT < 0.18) ? 0.11 : 0.06);
      if (this.riverGain) {
        this.riverGain.gain.setTargetAtTime(nearRiver, this.ctx.currentTime, 0.2);
      }

      // Random cave water drips
      this.dripTimer += dt;
      if (this.dripTimer > 1.8 + Math.random() * 2.5) {
        this.dripTimer = 0;
        this.playWaterDrip();
      }

      // Soft paw step rhythm when Dahuang walks/trots
      if (speedFactor > 0.1) {
        this.stepTimer += dt * speedFactor;
        if (this.stepTimer > 0.34) {
          this.stepTimer = 0;
          this.playPawStep();
        }
      }
    }
  }

  global.CaveAudioEngine = CaveAudioEngine;
})(window);
