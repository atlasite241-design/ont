class SoundService {
  private ctx: AudioContext | null = null;
  private _isMuted: boolean = false;
  private volume: number = Number(localStorage.getItem('volume')) / 100 || 0.5;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  toggleMute() {
    this._isMuted = !this._isMuted;
    return this._isMuted;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  isMuted() {
    return this._isMuted;
  }

  playClick() {
    if (this._isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.05 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.error(e);
    }
  }

  playSuccess() {
    if (this._isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = ctx.currentTime;
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + (i * 0.06);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.05 * this.volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) { console.error(e); }
  }
  
  playError() {
    if (this._isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const t = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = 'square';
      osc2.type = 'square';
      
      osc1.frequency.setValueAtTime(150, t);
      osc2.frequency.setValueAtTime(165, t); 
      
      gain.gain.setValueAtTime(0.08 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.3);
      osc2.stop(t + 0.3);
    } catch (e) { console.error(e); }
  }

  playHover() {
    if (this._isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.005 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {}
  }

  playNotification() {
    if (this._isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const notes = [660, 880]; // E5, A5
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + (i * 0.15);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1 * this.volume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) { console.error(e); }
  }
}

export const soundService = new SoundService();