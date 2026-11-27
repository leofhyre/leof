// Synthesized TV game-show sound effects using Web Audio API (no external audio assets required)

const STRIKE_AUDIO_SRC =
  '/assets/aistudio/AudioTranscriberAI_Fahh_Sound_Effect_e1292b30.mp3';
const REVEAL_AUDIO_SRC =
  '/assets/aistudio/check-mark_oPG7Xo5_2b4f5e40.mp3';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private strikeAudio: HTMLAudioElement | null = null;
  private revealAudio: HTMLAudioElement | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playSynthDing() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const oscHarm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.06); // E6

    oscHarm.type = 'triangle';
    oscHarm.frequency.setValueAtTime(2093, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    oscHarm.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    oscHarm.start(now);
    osc.stop(now + 0.56);
    oscHarm.stop(now + 0.56);
  }

  public playDing() {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if (!this.revealAudio) {
        this.revealAudio = new Audio(REVEAL_AUDIO_SRC);
        this.revealAudio.preload = 'auto';
      }
      this.revealAudio.currentTime = 0;
      const playPromise = this.revealAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          this.playSynthDing();
        });
      }
    } catch {
      this.playSynthDing();
    }
  }

  private playSynthStrike() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(115, now);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(108, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.setValueAtTime(0.22, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.66);
    osc2.stop(now + 0.66);
  }

  public playStrike() {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if (!this.strikeAudio) {
        this.strikeAudio = new Audio(STRIKE_AUDIO_SRC);
        this.strikeAudio.preload = 'auto';
      }
      this.strikeAudio.currentTime = 0;
      const playPromise = this.strikeAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          this.playSynthStrike();
        });
      }
    } catch {
      this.playSynthStrike();
    }
  }

  public playWinRound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    });
  }

  public playTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const soundFx = new SoundEngine();
