// Web Audio API Synth Engine for AetherGraph Spatial Audio Nodes & Interactive Feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSpatialClick(freq = 880, duration = 0.04) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export function playConnectChord() {
  try {
    const ctx = getAudioContext();
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C Major Chord
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.03);

      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35 + idx * 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.03);
      osc.stop(ctx.currentTime + 0.4 + idx * 0.03);
    });
  } catch (_) {}
}

export class SpatialAudioPlayer {
  private ctx: AudioContext;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  public analyser: AnalyserNode;
  public isPlaying = false;

  constructor() {
    this.ctx = getAudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
  }

  start(freq = 440, type: OscillatorType = 'sawtooth', volume = 0.15) {
    if (this.isPlaying) this.stop();
    this.ctx.resume();

    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();

    this.osc.type = type;
    this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Warm Low-Pass Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, this.ctx.currentTime);

    this.gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.08);

    this.osc.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.osc.start();
    this.isPlaying = true;
  }

  setFrequency(freq: number) {
    if (this.osc && this.isPlaying) {
      this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    if (this.gain && this.osc) {
      this.gain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
      setTimeout(() => {
        try {
          this.osc?.stop();
          this.osc?.disconnect();
          this.osc = null;
        } catch (_) {}
      }, 60);
    }
    this.isPlaying = false;
  }

  getFrequencyData(): Uint8Array {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
}
