// Audio Manager for background music and sound effects
import * as Tone from 'tone';

export class AudioManager {
  constructor() {
    this.bgMusic = null;
    this.musicLoaded = false;
    this.isPlaying = false;
    this.volume = 0.5; // Default volume
    this.sfxVolume = 0.7; // Sound effects volume
    
    // Initialize Tone.js synths for sound effects
    this.initializeSynths();
  }

  initializeSynths() {
    // Fire extinguisher spray sound
    this.extinguisherSynth = new Tone.Noise('white').toDestination();
    this.extinguisherSynth.volume.value = -20;
    
    // Fire crackling sound
    this.fireSynth = new Tone.Noise('pink').toDestination();
    this.fireSynth.volume.value = -25;
    
    // Generator/mechanical sounds
    this.mechanicalSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        release: 0.2
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    this.mechanicalSynth.volume.value = -15;
    
    // Gas leak hiss
    this.gasLeakSynth = new Tone.Noise('brown').toDestination();
    this.gasLeakSynth.volume.value = -22;
    
    // Water spray
    this.waterSynth = new Tone.Noise('white').toDestination();
    this.waterSynth.volume.value = -18;
    
    // Success/completion sound
    this.successSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5
      }
    }).toDestination();
    this.successSynth.volume.value = -10;
    
    // Alarm/warning sound
    this.alarmSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.1
      }
    }).toDestination();
    this.alarmSynth.volume.value = -12;
  }

  async loadMusic(url) {
    try {
      this.bgMusic = new Audio(url);
      this.bgMusic.loop = true;
      this.bgMusic.volume = this.volume;
      
      // Wait for music to be ready
      await new Promise((resolve, reject) => {
        this.bgMusic.addEventListener('canplaythrough', resolve, { once: true });
        this.bgMusic.addEventListener('error', reject, { once: true });
      });
      
      this.musicLoaded = true;
      console.log('Background music loaded successfully');
    } catch (error) {
      console.error('Failed to load background music:', error);
      this.musicLoaded = false;
    }
  }

  playMusic() {
    if (this.bgMusic && this.musicLoaded && !this.isPlaying) {
      this.bgMusic.play().then(() => {
        this.isPlaying = true;
        console.log('Background music started');
      }).catch(error => {
        console.error('Failed to play music:', error);
      });
    }
  }

  pauseMusic() {
    if (this.bgMusic && this.isPlaying) {
      this.bgMusic.pause();
      this.isPlaying = false;
    }
  }

  stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
      this.isPlaying = false;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp 0-1
    if (this.bgMusic) {
      this.bgMusic.volume = this.volume;
    }
  }

  fadeOut(duration = 1000) {
    if (!this.bgMusic || !this.isPlaying) return;

    const startVolume = this.bgMusic.volume;
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.bgMusic.volume = startVolume * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        this.stopMusic();
        this.bgMusic.volume = this.volume; // Restore original volume
      }
    };

    fade();
  }

  fadeIn(duration = 1000) {
    if (!this.bgMusic || !this.musicLoaded) return;

    this.bgMusic.volume = 0;
    this.playMusic();

    const targetVolume = this.volume;
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.bgMusic.volume = targetVolume * progress;
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    fade();
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  // Sound Effects

  async playFireExtinguisher(duration = 2) {
    // Ensure Tone.js audio context is started
    await Tone.start();
    
    // Spray sound (white noise with envelope)
    const now = Tone.now();
    this.extinguisherSynth.start(now);
    this.extinguisherSynth.stop(now + duration);
    
    // Add some variation with envelope
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.1,
      decay: 0.2,
      sustain: 0.8,
      release: 0.3
    }).toDestination();
    
    this.extinguisherSynth.connect(envelope);
    envelope.triggerAttackRelease(duration);
  }

  async playFireCrackle() {
    await Tone.start();
    
    // Continuous crackling sound
    const now = Tone.now();
    this.fireSynth.start(now);
    
    // Auto-modulate for crackling effect
    const lfo = new Tone.LFO(8, -30, -15).start();
    lfo.connect(this.fireSynth.volume);
    
    return () => {
      this.fireSynth.stop();
      lfo.stop();
      lfo.dispose();
    };
  }

  async playGeneratorStart() {
    await Tone.start();
    
    // Mechanical startup sound
    this.mechanicalSynth.triggerAttackRelease('C2', '0.5');
    
    setTimeout(() => {
      this.mechanicalSynth.triggerAttackRelease('E2', '0.3');
    }, 300);
    
    setTimeout(() => {
      this.mechanicalSynth.triggerAttackRelease('G2', '0.2');
    }, 500);
  }

  async playValveWrench() {
    await Tone.start();
    
    // Metal clanking sound
    const times = [0, 0.15, 0.3, 0.45];
    times.forEach((time, i) => {
      setTimeout(() => {
        this.mechanicalSynth.triggerAttackRelease('A1', '0.1');
      }, time * 1000);
    });
  }

  async playGasLeak() {
    await Tone.start();
    
    // Hissing gas sound
    const now = Tone.now();
    this.gasLeakSynth.start(now);
    
    return () => {
      this.gasLeakSynth.stop();
    };
  }

  async playWaterSpray(duration = 2) {
    await Tone.start();
    
    // Water spray sound
    const now = Tone.now();
    this.waterSynth.start(now);
    this.waterSynth.stop(now + duration);
    
    // Add water-like modulation
    const lfo = new Tone.LFO(12, -25, -15).start();
    lfo.connect(this.waterSynth.volume);
    
    setTimeout(() => {
      lfo.stop();
      lfo.dispose();
    }, duration * 1000);
  }

  async playDisasterAlarm() {
    await Tone.start();
    
    // Alarm sound pattern
    const pattern = ['E4', 'E4', 'E4', 'C4', 'E4', 'E4', 'E4', 'C4'];
    const durations = ['8n', '8n', '8n', '8n', '8n', '8n', '8n', '8n'];
    
    const sequence = new Tone.Sequence((time, note) => {
      this.alarmSynth.triggerAttackRelease(note, '8n', time);
    }, pattern, '8n');
    
    sequence.start(0);
    Tone.Transport.start();
    
    setTimeout(() => {
      sequence.stop();
      Tone.Transport.stop();
      sequence.dispose();
    }, 2000);
  }

  async playSuccess() {
    await Tone.start();
    
    // Success jingle
    const notes = ['C4', 'E4', 'G4', 'C5'];
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.successSynth.triggerAttackRelease(note, '8n');
      }, i * 100);
    });
  }

  async playFailure() {
    await Tone.start();
    
    // Failure sound (descending)
    const notes = ['G4', 'F4', 'D4', 'C4'];
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.alarmSynth.triggerAttackRelease(note, '8n');
      }, i * 150);
    });
  }

  async playPickupItem() {
    await Tone.start();
    
    // Quick pickup sound
    this.successSynth.triggerAttackRelease('E5', '16n');
    setTimeout(() => {
      this.successSynth.triggerAttackRelease('A5', '16n');
    }, 50);
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update all synth volumes (convert 0-1 to dB)
    const dbVolume = Tone.gainToDb(this.sfxVolume);
    
    if (this.extinguisherSynth) this.extinguisherSynth.volume.value = dbVolume - 20;
    if (this.fireSynth) this.fireSynth.volume.value = dbVolume - 25;
    if (this.mechanicalSynth) this.mechanicalSynth.volume.value = dbVolume - 15;
    if (this.gasLeakSynth) this.gasLeakSynth.volume.value = dbVolume - 22;
    if (this.waterSynth) this.waterSynth.volume.value = dbVolume - 18;
    if (this.successSynth) this.successSynth.volume.value = dbVolume - 10;
    if (this.alarmSynth) this.alarmSynth.volume.value = dbVolume - 12;
  }
}
