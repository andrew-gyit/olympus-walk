/**
 * Procedural field audio. No external assets: wind, suit hum, footsteps and
 * instrument tones are synthesised with the Web Audio API.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private humGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private started = false;
  private volume = 0.65;
  private muted = false;
  private lastFootstep = 0;
  private lastBeep = 0;

  async unlock() {
    if (this.started) {
      if (this.ctx?.state === 'suspended') await this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(ctx.destination);

      // Noise bed used for wind and footsteps.
      const len = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.96 + white * 0.04;
        data[i] = last * 2.6;
      }
      this.noiseBuffer = buffer;

      const wind = ctx.createBufferSource();
      wind.buffer = buffer;
      wind.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.8;
      const gain = ctx.createGain();
      gain.gain.value = 0.055;
      wind.connect(filter).connect(gain).connect(this.master);
      wind.start();
      this.windGain = gain;
      this.windFilter = filter;

      const hum = ctx.createOscillator();
      hum.type = 'sine';
      hum.frequency.value = 57;
      const humGain = ctx.createGain();
      humGain.gain.value = 0.018;
      hum.connect(humGain).connect(this.master);
      hum.start();
      this.humGain = humGain;

      this.started = true;
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {
      this.started = false;
    }
  }

  setVolume(volume: number, muted: boolean) {
    this.volume = volume;
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : volume, this.ctx.currentTime, 0.08);
    }
  }

  update(windMs: number, dust: number, speed: number, storm: boolean) {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const t = this.ctx.currentTime;
    const base = Math.min(0.22, 0.025 + windMs * 0.0054 + dust * 0.09);
    this.windGain.gain.setTargetAtTime(storm ? base * 2.6 : base, t, 0.5);
    this.windFilter.frequency.setTargetAtTime(260 + windMs * 34 + dust * 240, t, 0.5);
    if (this.humGain) {
      this.humGain.gain.setTargetAtTime(0.012 + Math.min(0.012, speed * 0.002), t, 0.3);
    }
  }

  private tone(freq: number, duration: number, type: OscillatorType, gainValue: number, glideTo?: number) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.04);
  }

  private noiseBurst(duration: number, cutoff: number, gainValue: number) {
    if (!this.ctx || !this.master || !this.noiseBuffer || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.7 + Math.random() * 0.5;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainValue, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + duration + 0.02);
  }

  footstep(running: boolean) {
    const now = performance.now();
    if (now - this.lastFootstep < 130) return;
    this.lastFootstep = now;
    this.noiseBurst(running ? 0.12 : 0.16, 320 + Math.random() * 180, running ? 0.1 : 0.07);
  }

  scan() {
    this.tone(520, 0.35, 'sine', 0.06, 1480);
    window.setTimeout(() => this.tone(1180, 0.26, 'triangle', 0.04, 760), 120);
  }

  analyze() {
    this.tone(320, 0.22, 'triangle', 0.05, 620);
    window.setTimeout(() => this.tone(700, 0.3, 'sine', 0.04, 940), 100);
  }

  shutter() {
    this.noiseBurst(0.06, 3800, 0.16);
    this.tone(180, 0.08, 'square', 0.025, 90);
  }

  ui() {
    const now = performance.now();
    if (now - this.lastBeep < 45) return;
    this.lastBeep = now;
    this.tone(740, 0.06, 'sine', 0.028, 880);
  }

  success() {
    this.tone(520, 0.12, 'sine', 0.04);
    window.setTimeout(() => this.tone(780, 0.16, 'sine', 0.04), 100);
    window.setTimeout(() => this.tone(1040, 0.24, 'sine', 0.035), 210);
  }

  alert(level: 'info' | 'caution' | 'warning' | 'critical' | 'success') {
    if (level === 'critical' || level === 'warning') {
      this.tone(level === 'critical' ? 190 : 250, 0.2, 'sawtooth', 0.035, 170);
      window.setTimeout(() => this.tone(level === 'critical' ? 190 : 250, 0.2, 'sawtooth', 0.03, 160), 260);
      return;
    }
    if (level === 'success') {
      this.success();
      return;
    }
    this.tone(600, 0.1, 'sine', 0.025);
  }

  land(impact: number) {
    this.noiseBurst(0.24, 180, Math.min(0.22, 0.05 + impact * 0.02));
  }

  dispose() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.started = false;
  }
}

export const audioManager = new AudioManager();
