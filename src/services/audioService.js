import * as Tone from 'tone';

/**
 * Audio Service for managing piano sound playback using Tone.js
 * Handles sampler initialization, note playback, and sound bank switching
 */
class AudioService {
  constructor() {
    this.sampler = null;
    this.isInitialized = false;
    this.currentSoundBank = 'piano'; // Default to realistic piano samples
  }

  /**
   * Preload samples without starting audio context (no user interaction required)
   * @param {string} soundBank - 'synth' for synthesized piano, 'piano' for realistic samples
   */
  async preload(soundBank = 'piano') {
    try {
      if (this.sampler && this.currentSoundBank === soundBank) {
        console.log('Samples already preloaded');
        return true;
      }

      console.log('Preloading samples (no audio context start)...');
      const samplerLoaded = await this.loadSampler(soundBank);

      if (!samplerLoaded) {
        console.error('Failed to preload sampler');
        return false;
      }

      console.log('Samples preloaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to preload samples:', error);
      return false;
    }
  }

  /**
   * Initialize the audio context and load sound bank
   * @param {string} soundBank - 'synth' for synthesized piano, 'piano' for realistic samples
   */
  async init(soundBank = 'piano') {
    try {
      // Preload samples if not already loaded
      if (!this.sampler || this.currentSoundBank !== soundBank) {
        await this.preload(soundBank);
      }

      // Start Tone.js audio context (requires user interaction)
      await Tone.start();
      console.log('Audio context started');

      this.isInitialized = true;
      console.log('Audio initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  /**
   * Load a sound bank (synth or samples)
   * @param {string} soundBank - 'synth' or 'piano'
   */
  async loadSampler(soundBank = 'piano') {
    try {
      // Dispose of existing sampler if any
      if (this.sampler) {
        this.sampler.dispose();
      }

      this.currentSoundBank = soundBank;

      if (soundBank === 'synth') {
        // Use Tone.js's PolySynth (lightweight, no audio files needed)
        // This creates a piano-like sound using synthesis
        this.sampler = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 128, // Increase from default 32 to handle complex songs
          oscillator: {
            type: 'triangle'
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.8 // Slightly faster release to free up voices
          }
        }).toDestination();

        // Adjust volume
        this.sampler.volume.value = -8;

        console.log('Synthesized piano loaded with 128 voice polyphony');
        return true;
      } else if (soundBank === 'piano') {
        // Use Salamander Grand Piano samples hosted online
        // This provides realistic piano sound using actual audio samples
        console.log('Loading Salamander Grand Piano samples...');

        // Sample every 3rd note (multi-sampling) - Tone.js interpolates the rest
        const baseUrl = 'https://tonejs.github.io/audio/salamander/';
        const notes = {};

        // Create sample map for piano range (A0 to C8)
        // Sample every 3 notes to reduce loading time while maintaining quality
        const sampledNotes = [
          'A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2',
          'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4',
          'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6',
          'C7', 'Ds7', 'Fs7', 'A7', 'C8'
        ];

        sampledNotes.forEach(note => {
          // The Salamander samples use 's' for sharp instead of '#'
          // Map note name with # to Tone.js format, but use file name without #
          const fileName = note.replace('#', 's');
          const toneName = note.replace('s', '#');
          notes[toneName] = `${baseUrl}${fileName}.mp3`;
        });

        // Create a promise to wait for the sampler to load
        return new Promise((resolve, reject) => {
          this.sampler = new Tone.Sampler({
            urls: notes,
            baseUrl: '',
            onload: () => {
              console.log('Salamander Grand Piano samples loaded successfully');
              // Adjust volume for samples
              this.sampler.volume.value = -5;
              resolve(true);
            },
            onerror: (error) => {
              console.error('Error loading piano samples:', error);
              reject(error);
            },
            attack: 0,
            release: 1,
            curve: 'exponential'
          }).toDestination();

          console.log('Piano sampler configured, loading samples...');
        });
      } else {
        console.error('Unknown sound bank:', soundBank);
        return false;
      }
    } catch (error) {
      console.error('Error loading sampler:', error);
      return false;
    }
  }

  /**
   * Play a piano note
   * @param {string} note - Note name (e.g., 'C4', 'A#3', 'Db5')
   * @param {number} velocity - Note velocity (0.0 to 1.0), defaults to 0.8
   * @param {string} duration - Note duration in Tone.js format ('8n', '4n', etc.) or null for manual release
   */
  playNote(note, velocity = 0.8, duration = '4n') {
    if (!this.isInitialized || !this.sampler) {
      console.warn('Audio not initialized');
      return;
    }

    try {
      // Trigger note with velocity-based volume
      const volumeDb = Tone.gainToDb(velocity);

      if (duration) {
        // Trigger attack and release automatically
        this.sampler.triggerAttackRelease(note, duration, undefined, velocity);
      } else {
        // Just trigger attack (for manual release)
        this.sampler.triggerAttack(note, undefined, velocity);
      }
    } catch (error) {
      console.error(`Error playing note ${note}:`, error);
    }
  }

  /**
   * Stop/release a note
   * @param {string} note - Note name to release
   */
  stopNote(note) {
    if (!this.isInitialized || !this.sampler) {
      return;
    }

    try {
      this.sampler.triggerRelease(note);
    } catch (error) {
      console.error(`Error stopping note ${note}:`, error);
    }
  }

  /**
   * Stop all currently playing notes
   */
  stopAllNotes() {
    if (!this.isInitialized || !this.sampler) {
      return;
    }

    try {
      this.sampler.releaseAll();
    } catch (error) {
      console.error('Error stopping all notes:', error);
    }
  }

  /**
   * Set master volume
   * @param {number} level - Volume level (0.0 to 1.0)
   */
  setVolume(level) {
    if (!this.sampler) {
      return;
    }

    // Convert 0-1 range to dB (-40 to 0)
    const db = level === 0 ? -Infinity : Tone.gainToDb(level);
    this.sampler.volume.rampTo(db, 0.1);
  }

  /**
   * Get current volume level
   * @returns {number} Volume level (0.0 to 1.0)
   */
  getVolume() {
    if (!this.sampler) {
      return 0;
    }
    return Tone.dbToGain(this.sampler.volume.value);
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
    this.isInitialized = false;
  }

  /**
   * Check if audio is initialized
   * @returns {boolean}
   */
  getIsInitialized() {
    return this.isInitialized;
  }
}

// Create singleton instance
const audioService = new AudioService();

export default audioService;
