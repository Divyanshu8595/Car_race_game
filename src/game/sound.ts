export class RaceAudioEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private muted = false;
  private gestureUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.gestureUnlocked = true;
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || !this.gestureUnlocked) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute) {
      this.stopEngineLoop();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public updateEngineRpm(rpm: number, nitroActive: boolean, playing: boolean): void {
    if (this.muted || !playing) {
      this.stopEngineLoop();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.engineOsc || !this.engineGain) {
      try {
        this.engineOsc = ctx.createOscillator();
        this.engineGain = ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 65;
        this.engineGain.gain.value = 0.025;
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(ctx.destination);
        this.engineOsc.start();
      } catch {
        return;
      }
    }

    const baseFreq = 52 + ((rpm - 1200) / 7800) * 140 + (nitroActive ? 28 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, ctx.currentTime, 0.04);
    this.engineGain.gain.setTargetAtTime(
      nitroActive ? 0.036 : 0.022,
      ctx.currentTime,
      0.05
    );
  }

  public stopEngineLoop(): void {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // Ignore already stopped oscillator
      }
      this.engineOsc = null;
    }
    if (this.engineGain) {
      try {
        this.engineGain.disconnect();
      } catch {
        // Ignore
      }
      this.engineGain = null;
    }
  }

  public playNitroBurst(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const now = ctx.currentTime;
      const pitchShift = 0.94 + Math.random() * 0.12;
      osc.frequency.setValueAtTime(180 * pitchShift, now);
      osc.frequency.exponentialRampToValueAtTime(520 * pitchShift, now + 0.18);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Ignore audio errors
    }
  }

  public playCollisionImpact(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(115, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.16);
      gain.gain.setValueAtTime(0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore
    }
  }

  public playOvertakeChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const now = ctx.currentTime;
      const pitchShift = 0.95 + Math.random() * 0.1;
      osc.frequency.setValueAtTime(440 * pitchShift, now);
      osc.frequency.setValueAtTime(660 * pitchShift, now + 0.06);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  public playOutcomeSting(outcome: 'victory' | 'gameover'): void {
    this.stopEngineLoop();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const notes =
        outcome === 'victory' ? [523.25, 659.25, 783.99, 1046.5] : [392.0, 349.23, 311.13, 261.63];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = outcome === 'victory' ? 'triangle' : 'sawtooth';
        const start = ctx.currentTime + i * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.055, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // Ignore
    }
  }
}

export const raceAudio = new RaceAudioEngine();
