import { Midi } from '@tonejs/midi';

/**
 * MIDI Parser Service
 * Parses MIDI files and converts them to app-friendly format
 */

/**
 * Convert MIDI note number to note name (e.g., 60 -> 'C4')
 * @param {number} midiNumber - MIDI note number (0-127)
 * @returns {string} Note name with octave
 */
function midiToNoteName(midiNumber) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = notes[midiNumber % 12];
  return `${noteName}${octave}`;
}

/**
 * Parse a MIDI file from URL or File object
 * @param {string|File} source - MIDI file URL or File object
 * @returns {Promise<Object>} Parsed song data
 */
export async function parseMidiFile(source) {
  try {
    let midiData;

    if (typeof source === 'string') {
      // Load from URL
      midiData = await Midi.fromUrl(source);
    } else if (source instanceof File) {
      // Load from File object
      const arrayBuffer = await source.arrayBuffer();
      midiData = new Midi(arrayBuffer);
    } else {
      throw new Error('Invalid source: must be URL string or File object');
    }

    // Extract song information
    const songData = {
      name: midiData.name || 'Untitled Song',
      duration: midiData.duration,
      tempo: midiData.header.tempos[0]?.bpm || 120,
      timeSignature: midiData.header.timeSignatures[0] || { timeSignature: [4, 4] },
      tracks: midiData.tracks.length,
      notes: [],
    };

    // Merge all tracks into single note sequence
    // Sort by time to ensure proper playback order
    const allNotes = [];

    midiData.tracks.forEach((track, trackIndex) => {
      track.notes.forEach(note => {
        allNotes.push({
          note: note.name, // e.g., 'C4', 'A#3'
          midi: note.midi, // MIDI note number
          time: note.time, // Start time in seconds
          duration: note.duration, // Duration in seconds
          velocity: note.velocity, // 0.0 to 1.0
          trackIndex,
        });
      });
    });

    // Sort by time
    allNotes.sort((a, b) => a.time - b.time);

    songData.notes = allNotes;
    songData.totalNotes = allNotes.length;

    console.log('MIDI parsed:', songData);
    return songData;

  } catch (error) {
    console.error('Error parsing MIDI file:', error);
    throw error;
  }
}

/**
 * Get difficulty estimate based on song characteristics
 * @param {Object} songData - Parsed song data
 * @returns {string} 'beginner' | 'intermediate' | 'advanced'
 */
export function estimateDifficulty(songData) {
  const { notes, duration } = songData;

  if (!notes || notes.length === 0) {
    return 'beginner';
  }

  // Calculate notes per second
  const notesPerSecond = notes.length / duration;

  // Check for simultaneous notes (chords)
  let maxSimultaneous = 1;
  for (let i = 0; i < notes.length; i++) {
    let simultaneous = 1;
    const currentTime = notes[i].time;

    for (let j = i + 1; j < notes.length; j++) {
      if (Math.abs(notes[j].time - currentTime) < 0.05) { // Within 50ms
        simultaneous++;
      } else {
        break;
      }
    }

    maxSimultaneous = Math.max(maxSimultaneous, simultaneous);
  }

  // Difficulty heuristics
  if (notesPerSecond < 2 && maxSimultaneous <= 2) {
    return 'beginner';
  } else if (notesPerSecond < 4 && maxSimultaneous <= 4) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

/**
 * Create a simple test MIDI song (for demo purposes)
 * @returns {Object} Simple song data
 */
export function createTestSong() {
  // Simple C major scale
  const notes = [
    { note: 'C4', midi: 60, time: 0.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 0.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 1.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 1.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 2.0, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 2.5, duration: 0.5, velocity: 0.8 },
    { note: 'B4', midi: 71, time: 3.0, duration: 0.5, velocity: 0.8 },
    { note: 'C5', midi: 72, time: 3.5, duration: 1.0, velocity: 0.8 },
  ];

  return {
    name: 'C Major Scale',
    duration: 4.5,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Twinkle Twinkle Little Star song
 * @returns {Object} Song data for Twinkle Twinkle
 */
export function createTwinkleSong() {
  const notes = [
    // Twinkle, twinkle, little star
    { note: 'C4', midi: 60, time: 0.0, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 0.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 1.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 1.5, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 2.0, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 2.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 3.0, duration: 1.0, velocity: 0.8 },

    // How I wonder what you are
    { note: 'F4', midi: 65, time: 4.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 4.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 5.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 5.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 6.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 6.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 7.0, duration: 1.0, velocity: 0.8 },

    // Up above the world so high
    { note: 'G4', midi: 67, time: 8.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 8.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 9.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 9.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 10.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 10.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 11.0, duration: 1.0, velocity: 0.8 },

    // Like a diamond in the sky
    { note: 'G4', midi: 67, time: 12.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 12.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 13.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 13.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 14.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 14.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 15.0, duration: 1.0, velocity: 0.8 },

    // Twinkle, twinkle, little star
    { note: 'C4', midi: 60, time: 16.0, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 16.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 17.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 17.5, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 18.0, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 18.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 19.0, duration: 1.0, velocity: 0.8 },

    // How I wonder what you are
    { note: 'F4', midi: 65, time: 20.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 20.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 21.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 21.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 22.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 22.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 23.0, duration: 1.5, velocity: 0.8 },
  ];

  return {
    name: 'Twinkle Twinkle Little Star',
    duration: 24.5,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Mary Had a Little Lamb song
 * @returns {Object} Song data for Mary Had a Little Lamb
 */
export function createMarySong() {
  const notes = [
    // Mary had a little lamb
    { note: 'E4', midi: 64, time: 0.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 0.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 1.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 1.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 3.0, duration: 1.0, velocity: 0.8 },

    // Little lamb, little lamb
    { note: 'D4', midi: 62, time: 4.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 4.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 5.0, duration: 1.0, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 6.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 6.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 7.0, duration: 1.0, velocity: 0.8 },

    // Mary had a little lamb
    { note: 'E4', midi: 64, time: 8.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 8.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 9.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 9.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 10.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 10.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 11.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 11.5, duration: 0.5, velocity: 0.8 },

    // Its fleece was white as snow
    { note: 'D4', midi: 62, time: 12.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 12.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 13.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 13.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 14.0, duration: 2.0, velocity: 0.8 },
  ];

  return {
    name: 'Mary Had a Little Lamb',
    duration: 16.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Ode to Joy song (Beethoven)
 * @returns {Object} Song data for Ode to Joy
 */
export function createOdeToJoySong() {
  const notes = [
    // Ode to Joy melody
    { note: 'E4', midi: 64, time: 0.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 0.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 1.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 1.5, duration: 0.5, velocity: 0.8 },

    { note: 'G4', midi: 67, time: 2.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 2.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 3.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 3.5, duration: 0.5, velocity: 0.8 },

    { note: 'C4', midi: 60, time: 4.0, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 4.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 5.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 5.5, duration: 0.5, velocity: 0.8 },

    { note: 'E4', midi: 64, time: 6.0, duration: 0.75, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 6.75, duration: 0.25, velocity: 0.7 },
    { note: 'D4', midi: 62, time: 7.0, duration: 1.0, velocity: 0.8 },

    // Repeat with variation
    { note: 'E4', midi: 64, time: 8.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 8.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 9.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 9.5, duration: 0.5, velocity: 0.8 },

    { note: 'G4', midi: 67, time: 10.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 10.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 11.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 11.5, duration: 0.5, velocity: 0.8 },

    { note: 'C4', midi: 60, time: 12.0, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 12.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 13.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 13.5, duration: 0.5, velocity: 0.8 },

    { note: 'D4', midi: 62, time: 14.0, duration: 0.75, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 14.75, duration: 0.25, velocity: 0.7 },
    { note: 'C4', midi: 60, time: 15.0, duration: 1.0, velocity: 0.8 },
  ];

  return {
    name: 'Ode to Joy',
    duration: 16.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Für Elise song (opening section)
 * @returns {Object} Song data for Für Elise
 */
export function createFurEliseSong() {
  const notes = [
    // Famous opening riff
    { note: 'E5', midi: 76, time: 0.0, duration: 0.25, velocity: 0.7 },
    { note: 'D#5', midi: 75, time: 0.25, duration: 0.25, velocity: 0.7 },
    { note: 'E5', midi: 76, time: 0.5, duration: 0.25, velocity: 0.7 },
    { note: 'D#5', midi: 75, time: 0.75, duration: 0.25, velocity: 0.7 },
    { note: 'E5', midi: 76, time: 1.0, duration: 0.25, velocity: 0.7 },
    { note: 'B4', midi: 71, time: 1.25, duration: 0.25, velocity: 0.7 },
    { note: 'D5', midi: 74, time: 1.5, duration: 0.25, velocity: 0.7 },
    { note: 'C5', midi: 72, time: 1.75, duration: 0.25, velocity: 0.7 },
    { note: 'A4', midi: 69, time: 2.0, duration: 0.5, velocity: 0.7 },

    // Bass notes
    { note: 'C3', midi: 48, time: 2.0, duration: 0.25, velocity: 0.6 },
    { note: 'E3', midi: 52, time: 2.25, duration: 0.25, velocity: 0.6 },
    { note: 'A3', midi: 57, time: 2.5, duration: 0.25, velocity: 0.6 },

    { note: 'B3', midi: 59, time: 3.0, duration: 0.5, velocity: 0.7 },
    { note: 'E3', midi: 52, time: 3.0, duration: 0.25, velocity: 0.6 },
    { note: 'G#3', midi: 56, time: 3.25, duration: 0.25, velocity: 0.6 },
    { note: 'B3', midi: 59, time: 3.5, duration: 0.25, velocity: 0.6 },

    { note: 'C4', midi: 60, time: 4.0, duration: 0.5, velocity: 0.7 },
    { note: 'E3', midi: 52, time: 4.0, duration: 0.25, velocity: 0.6 },
    { note: 'E4', midi: 64, time: 4.5, duration: 0.25, velocity: 0.7 },

    // Repeat opening riff
    { note: 'E5', midi: 76, time: 5.0, duration: 0.25, velocity: 0.7 },
    { note: 'D#5', midi: 75, time: 5.25, duration: 0.25, velocity: 0.7 },
    { note: 'E5', midi: 76, time: 5.5, duration: 0.25, velocity: 0.7 },
    { note: 'D#5', midi: 75, time: 5.75, duration: 0.25, velocity: 0.7 },
    { note: 'E5', midi: 76, time: 6.0, duration: 0.25, velocity: 0.7 },
    { note: 'B4', midi: 71, time: 6.25, duration: 0.25, velocity: 0.7 },
    { note: 'D5', midi: 74, time: 6.5, duration: 0.25, velocity: 0.7 },
    { note: 'C5', midi: 72, time: 6.75, duration: 0.25, velocity: 0.7 },
    { note: 'A4', midi: 69, time: 7.0, duration: 1.0, velocity: 0.7 },
  ];

  return {
    name: 'Für Elise',
    duration: 8.0,
    tempo: 100,
    timeSignature: { timeSignature: [3, 8] },
    tracks: 2,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Jingle Bells song
 * @returns {Object} Song data for Jingle Bells
 */
export function createJingleBellsSong() {
  const notes = [
    // Jingle bells, jingle bells
    { note: 'E4', midi: 64, time: 0.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 0.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 1.0, duration: 1.0, velocity: 0.8 },

    { note: 'E4', midi: 64, time: 2.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 3.0, duration: 1.0, velocity: 0.8 },

    // Jingle all the way
    { note: 'E4', midi: 64, time: 4.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 4.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 5.0, duration: 0.75, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 5.75, duration: 0.25, velocity: 0.7 },
    { note: 'E4', midi: 64, time: 6.0, duration: 2.0, velocity: 0.8 },

    // Oh what fun it is to ride
    { note: 'F4', midi: 65, time: 8.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 8.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 9.0, duration: 0.75, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 9.75, duration: 0.25, velocity: 0.7 },

    { note: 'F4', midi: 65, time: 10.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 10.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 11.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 11.5, duration: 0.5, velocity: 0.8 },

    // In a one horse open sleigh
    { note: 'E4', midi: 64, time: 12.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 12.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 13.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 13.5, duration: 0.5, velocity: 0.8 },

    { note: 'D4', midi: 62, time: 14.0, duration: 1.0, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 15.0, duration: 1.0, velocity: 0.8 },
  ];

  return {
    name: 'Jingle Bells',
    duration: 16.0,
    tempo: 140,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Canon in D song (Pachelbel) - Opening bass line with melody
 * @returns {Object} Song data for Canon in D
 */
export function createCanonInDSong() {
  const notes = [];

  // Define the bass progression (8 bars, repeating)
  const bassProgression = [
    { note: 'D3', midi: 50 }, { note: 'A2', midi: 45 },
    { note: 'B2', midi: 47 }, { note: 'F#2', midi: 42 },
    { note: 'G2', midi: 43 }, { note: 'D3', midi: 50 },
    { note: 'G2', midi: 43 }, { note: 'A2', midi: 45 },
  ];

  // Bass line plays throughout (10 repetitions = 80 beats)
  for (let rep = 0; rep < 10; rep++) {
    bassProgression.forEach((note, i) => {
      notes.push({
        note: note.note,
        midi: note.midi,
        time: rep * 8.0 + i,
        duration: 1.0,
        velocity: 0.65
      });
    });
  }

  // First voice melody (starts at measure 3)
  const melody1Start = 16.0;
  const melody1 = [
    { midi: 78, dur: 2 }, { midi: 76, dur: 2 }, { midi: 74, dur: 2 }, { midi: 73, dur: 2 },
    { midi: 71, dur: 2 }, { midi: 69, dur: 2 }, { midi: 71, dur: 2 }, { midi: 73, dur: 2 },
    { midi: 74, dur: 2 }, { midi: 69, dur: 2 }, { midi: 71, dur: 2 }, { midi: 66, dur: 2 },
    { midi: 67, dur: 2 }, { midi: 74, dur: 2 }, { midi: 67, dur: 2 }, { midi: 69, dur: 2 },
  ];

  let time = melody1Start;
  melody1.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: time, duration: n.dur, velocity: 0.75 });
    time += n.dur;
  });

  // Second voice (enters at measure 5, canon at 2-bar interval)
  const melody2Start = 32.0;
  time = melody2Start;
  melody1.forEach(n => {
    const midi = n.midi - 12;
    notes.push({ note: midiToNoteName(midi), midi: midi, time: time, duration: n.dur, velocity: 0.7 });
    time += n.dur;
  });

  // Third voice - eighth notes (enters at measure 7)
  const melody3Start = 48.0;
  const eighth = 0.5;
  const melody3Pattern = [
    78, 76, 74, 73, 71, 69, 71, 73, 74, 76, 78, 76, 74, 73, 71, 69,
    71, 69, 66, 69, 71, 73, 74, 76, 78, 76, 74, 73, 71, 69, 67, 66,
  ];

  melody3Pattern.forEach((midi, i) => {
    notes.push({
      note: midiToNoteName(midi),
      midi: midi,
      time: melody3Start + i * eighth,
      duration: eighth,
      velocity: 0.72
    });
  });

  // Fourth voice - more complex rhythm (enters at measure 9)
  const melody4Start = 64.0;
  const melody4Pattern = [
    { midi: 74, dur: 0.5 }, { midi: 78, dur: 0.5 }, { midi: 76, dur: 0.5 }, { midi: 74, dur: 0.5 },
    { midi: 73, dur: 0.5 }, { midi: 71, dur: 0.5 }, { midi: 69, dur: 1.0 }, { midi: 71, dur: 1.0 },
    { midi: 74, dur: 0.5 }, { midi: 76, dur: 0.5 }, { midi: 78, dur: 1.0 }, { midi: 76, dur: 1.0 },
    { midi: 74, dur: 0.5 }, { midi: 73, dur: 0.5 }, { midi: 71, dur: 0.5 }, { midi: 69, dur: 0.5 },
  ];

  time = melody4Start;
  melody4Pattern.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: time, duration: n.dur, velocity: 0.73 });
    time += n.dur;
  });

  return {
    name: 'Canon in D',
    duration: 80.0,
    tempo: 80,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 2,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Create Moonlight Sonata (opening) - Beethoven
 * @returns {Object} Song data for Moonlight Sonata
 */
export function createMoonlightSonataSong() {
  const notes = [];
  const triplet = 0.33;

  // Define the triplet arpeggio pattern
  const addArpeggio = (bass, chord, startTime, measures) => {
    for (let m = 0; m < measures; m++) {
      const t = startTime + m * 4.0;
      // Bass note
      notes.push({ note: midiToNoteName(bass), midi: bass, time: t, duration: 2.0, velocity: 0.5 });
      // Triplet arpeggios (12 triplets per measure)
      for (let i = 0; i < 12; i++) {
        const chordNote = chord[i % chord.length];
        notes.push({ note: midiToNoteName(chordNote), midi: chordNote, time: t + i * triplet, duration: triplet, velocity: 0.4 });
      }
    }
  };

  // Opening measures (C# minor arpeggio)
  addArpeggio(44, [49, 52, 49], 0, 2); // G# - C#, E, C#

  // A major arpeggio
  addArpeggio(45, [49, 52, 49], 8, 2); // A - C#, E, C#

  // E major arpeggio with melody
  const melodyStart = 16.0;
  addArpeggio(52, [56, 59, 56], melodyStart, 2); // E - G#, B, G#

  // Add melody over arpeggios
  const melody = [
    { midi: 68, time: melodyStart, dur: 2.0 }, // G#
    { midi: 66, time: melodyStart + 2, dur: 1.0 }, // F#
    { midi: 68, time: melodyStart + 3, dur: 1.0 }, // G#
    { midi: 69, time: melodyStart + 4, dur: 2.0 }, // A
    { midi: 66, time: melodyStart + 6, dur: 1.0 }, // F#
    { midi: 64, time: melodyStart + 7, dur: 1.0 }, // E

    { midi: 66, time: 24, dur: 2.0 }, // F#
    { midi: 64, time: 26, dur: 1.0 }, // E
    { midi: 61, time: 27, dur: 1.0 }, // C#
    { midi: 64, time: 28, dur: 3.0 }, // E
    { midi: 61, time: 31, dur: 1.0 }, // C#
  ];

  melody.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.65 });
  });

  // B minor section
  addArpeggio(47, [50, 54, 50], 32, 2); // B - D, F#, D

  // Return to C# minor with development
  addArpeggio(44, [49, 52, 49], 40, 4); // G# - C#, E, C#

  // Second melody phrase
  const melody2 = [
    { midi: 68, time: 40, dur: 1.5 }, { midi: 73, time: 41.5, dur: 0.5 },
    { midi: 76, time: 42, dur: 2.0 }, { midi: 73, time: 44, dur: 1.0 },
    { midi: 68, time: 45, dur: 1.0 }, { midi: 66, time: 46, dur: 2.0 },
    { midi: 68, time: 48, dur: 2.0 }, { midi: 69, time: 50, dur: 2.0 },
    { midi: 73, time: 52, dur: 1.5 }, { midi: 68, time: 53.5, dur: 0.5 },
    { midi: 66, time: 54, dur: 2.0 }, { midi: 64, time: 56, dur: 4.0 },
  ];

  melody2.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.68 });
  });

  // Final cadence
  addArpeggio(49, [52, 56, 52], 56, 2); // C# - E, G#, E
  notes.push({ note: midiToNoteName(61), midi: 61, time: 64, duration: 4.0, velocity: 0.6 }); // Final C#

  return {
    name: 'Moonlight Sonata',
    duration: 68.0,
    tempo: 60,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 2,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Create Hungarian Dance No. 5 (opening) - Brahms
 * @returns {Object} Song data for Hungarian Dance No. 5
 */
export function createHungarianDanceSong() {
  const notes = [];

  // Section A - Fast opening theme (D minor)
  const themeA = [
    { midi: 62, time: 0, dur: 0.25 }, { midi: 66, time: 0.25, dur: 0.25 },
    { midi: 69, time: 0.5, dur: 0.25 }, { midi: 74, time: 0.75, dur: 0.25 },
    { midi: 73, time: 1.0, dur: 0.375 }, { midi: 74, time: 1.375, dur: 0.125 },
    { midi: 76, time: 1.5, dur: 0.5 },

    { midi: 62, time: 2.0, dur: 0.25 }, { midi: 66, time: 2.25, dur: 0.25 },
    { midi: 69, time: 2.5, dur: 0.25 }, { midi: 74, time: 2.75, dur: 0.25 },
    { midi: 78, time: 3.0, dur: 0.5 }, { midi: 76, time: 3.5, dur: 0.5 },
  ];

  themeA.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.88 });
  });

  // Bass accompaniment for theme A
  const bassA = [
    { midi: 50, time: 0, dur: 0.5 }, { midi: 50, time: 0.5, dur: 0.5 },
    { midi: 57, time: 1.0, dur: 0.5 }, { midi: 57, time: 1.5, dur: 0.5 },
    { midi: 50, time: 2.0, dur: 0.5 }, { midi: 50, time: 2.5, dur: 0.5 },
    { midi: 57, time: 3.0, dur: 0.5 }, { midi: 57, time: 3.5, dur: 0.5 },
  ];

  bassA.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.7 });
  });

  // Repeat and develop theme A
  const themeA2 = [
    { midi: 74, time: 4, dur: 0.25 }, { midi: 73, time: 4.25, dur: 0.25 },
    { midi: 74, time: 4.5, dur: 0.25 }, { midi: 76, time: 4.75, dur: 0.25 },
    { midi: 78, time: 5.0, dur: 0.375 }, { midi: 76, time: 5.375, dur: 0.125 },
    { midi: 74, time: 5.5, dur: 0.5 },

    { midi: 73, time: 6.0, dur: 0.25 }, { midi: 71, time: 6.25, dur: 0.25 },
    { midi: 69, time: 6.5, dur: 0.5 }, { midi: 74, time: 7.0, dur: 1.0 },
  ];

  themeA2.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.86 });
  });

  bassA.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time + 4, duration: n.dur, velocity: 0.7 });
  });

  // Section B - Slower lyrical section (F# major)
  const themeB = [
    { midi: 73, time: 8, dur: 1.5 }, { midi: 78, time: 9.5, dur: 0.5 },
    { midi: 80, time: 10, dur: 1.0 }, { midi: 78, time: 11, dur: 1.0 },
    { midi: 73, time: 12, dur: 1.0 }, { midi: 75, time: 13, dur: 1.0 },
    { midi: 73, time: 14, dur: 1.5 }, { midi: 71, time: 15.5, dur: 0.5 },

    { midi: 69, time: 16, dur: 1.5 }, { midi: 73, time: 17.5, dur: 0.5 },
    { midi: 75, time: 18, dur: 1.0 }, { midi: 73, time: 19, dur: 1.0 },
    { midi: 71, time: 20, dur: 2.0 }, { midi: 69, time: 22, dur: 2.0 },
  ];

  themeB.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.75 });
  });

  // Bass for slower section
  const slowBass = [
    { midi: 49, time: 8 }, { midi: 54, time: 10 }, { midi: 49, time: 12 }, { midi: 54, time: 14 },
    { midi: 45, time: 16 }, { midi: 52, time: 18 }, { midi: 45, time: 20 }, { midi: 52, time: 22 },
  ];

  slowBass.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: 2.0, velocity: 0.65 });
  });

  // Section C - Return to fast theme with variation
  const themeC = [
    { midi: 74, time: 24, dur: 0.125 }, { midi: 76, time: 24.125, dur: 0.125 },
    { midi: 78, time: 24.25, dur: 0.125 }, { midi: 81, time: 24.375, dur: 0.125 },
    { midi: 83, time: 24.5, dur: 0.25 }, { midi: 81, time: 24.75, dur: 0.25 },
    { midi: 78, time: 25.0, dur: 0.5 }, { midi: 76, time: 25.5, dur: 0.5 },

    { midi: 74, time: 26, dur: 0.25 }, { midi: 73, time: 26.25, dur: 0.25 },
    { midi: 71, time: 26.5, dur: 0.25 }, { midi: 69, time: 26.75, dur: 0.25 },
    { midi: 74, time: 27.0, dur: 1.0 },
  ];

  themeC.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.9 });
  });

  // Fast bass pattern
  for (let i = 0; i < 4; i++) {
    notes.push({ note: midiToNoteName(50), midi: 50, time: 24 + i, duration: 0.5, velocity: 0.75 });
    notes.push({ note: midiToNoteName(57), midi: 57, time: 24.5 + i, duration: 0.5, velocity: 0.75 });
  }

  // Grand finale - accelerating to climax
  const finale = [
    { midi: 78, time: 28, dur: 0.25 }, { midi: 76, time: 28.25, dur: 0.25 },
    { midi: 74, time: 28.5, dur: 0.25 }, { midi: 73, time: 28.75, dur: 0.25 },
    { midi: 74, time: 29.0, dur: 0.5 }, { midi: 76, time: 29.5, dur: 0.5 },
    { midi: 78, time: 30.0, dur: 0.5 }, { midi: 81, time: 30.5, dur: 0.5 },
    { midi: 74, time: 31.0, dur: 1.0 },
  ];

  finale.forEach(n => {
    notes.push({ note: midiToNoteName(n.midi), midi: n.midi, time: n.time, duration: n.dur, velocity: 0.92 });
  });

  // Final bass chords
  notes.push({ note: midiToNoteName(50), midi: 50, time: 28, duration: 1.0, velocity: 0.8 });
  notes.push({ note: midiToNoteName(57), midi: 57, time: 29, duration: 1.0, velocity: 0.8 });
  notes.push({ note: midiToNoteName(50), midi: 50, time: 30, duration: 1.0, velocity: 0.85 });
  notes.push({ note: midiToNoteName(38), midi: 38, time: 31, duration: 1.0, velocity: 0.9 }); // Low D

  return {
    name: 'Hungarian Dance No. 5',
    duration: 32.0,
    tempo: 160,
    timeSignature: { timeSignature: [2, 4] },
    tracks: 2,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Create Hot Cross Buns song
 * @returns {Object} Song data for Hot Cross Buns
 */
export function createHotCrossBunsSong() {
  const notes = [
    // Hot cross buns
    { note: 'E4', midi: 64, time: 0.0,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 0.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 1.0,  duration: 1.0, velocity: 0.8 },
    // Hot cross buns
    { note: 'E4', midi: 64, time: 2.0,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 2.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 3.0,  duration: 1.0, velocity: 0.8 },
    // One a penny, two a penny
    { note: 'C4', midi: 60, time: 4.0,  duration: 0.25, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 4.25, duration: 0.25, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 4.5,  duration: 0.25, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 4.75, duration: 0.25, velocity: 0.75 },
    { note: 'D4', midi: 62, time: 5.0,  duration: 0.25, velocity: 0.75 },
    { note: 'D4', midi: 62, time: 5.25, duration: 0.25, velocity: 0.75 },
    { note: 'D4', midi: 62, time: 5.5,  duration: 0.25, velocity: 0.75 },
    { note: 'D4', midi: 62, time: 5.75, duration: 0.25, velocity: 0.75 },
    // Hot cross buns
    { note: 'E4', midi: 64, time: 6.0,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 6.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 7.0,  duration: 1.0, velocity: 0.8 },
  ];

  return {
    name: 'Hot Cross Buns',
    duration: 8.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Yankee Doodle song
 * @returns {Object} Song data for Yankee Doodle
 */
export function createYankeeDoodleSong() {
  const notes = [
    // Yan-kee Doo-dle went to town
    { note: 'C4', midi: 60, time: 0.0,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 0.5,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 1.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 1.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 2.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.5,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 3.0,  duration: 1.0, velocity: 0.8 },
    // A-ri-ding on a po-ny
    { note: 'C4', midi: 60, time: 4.0,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 4.5,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 5.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 5.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 6.0,  duration: 1.0, velocity: 0.8 },
    // Stuck a fea-ther in his cap
    { note: 'E4', midi: 64, time: 7.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 7.5,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 8.0,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 8.5,  duration: 1.0, velocity: 0.8 },
    // And called it mac-a-ro-ni
    { note: 'G4', midi: 67, time: 9.5,  duration: 0.25, velocity: 0.75 },
    { note: 'F4', midi: 65, time: 9.75, duration: 0.25, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 10.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 10.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 11.0, duration: 1.0, velocity: 0.8 },
    // Chorus: Yan-kee Doo-dle keep it up
    { note: 'G4', midi: 67, time: 12.0, duration: 0.5, velocity: 0.85 },
    { note: 'F4', midi: 65, time: 12.5, duration: 0.5, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 13.0, duration: 0.5, velocity: 0.85 },
    { note: 'D4', midi: 62, time: 13.5, duration: 0.5, velocity: 0.85 },
    // Yan-kee Doo-dle dan-dy
    { note: 'C4', midi: 60, time: 14.0, duration: 0.5, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 14.5, duration: 0.5, velocity: 0.85 },
    { note: 'G4', midi: 67, time: 15.0, duration: 0.5, velocity: 0.85 },
    { note: 'G4', midi: 67, time: 15.5, duration: 0.5, velocity: 0.85 },
    // Mind the mu-sic and the step
    { note: 'G4', midi: 67, time: 16.0, duration: 0.5, velocity: 0.85 },
    { note: 'F4', midi: 65, time: 16.5, duration: 0.5, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 17.0, duration: 0.5, velocity: 0.85 },
    { note: 'D4', midi: 62, time: 17.5, duration: 0.5, velocity: 0.85 },
    // And with the girls be han-dy
    { note: 'E4', midi: 64, time: 18.0, duration: 0.5, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 18.5, duration: 0.5, velocity: 0.85 },
    { note: 'D4', midi: 62, time: 19.0, duration: 0.5, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 19.5, duration: 0.5, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 20.0, duration: 2.0, velocity: 0.8 },
  ];

  return {
    name: 'Yankee Doodle',
    duration: 22.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create London Bridge song
 * @returns {Object} Song data for London Bridge
 */
export function createLondonBridgeSong() {
  const notes = [
    // Lon-don Bridge is fall-ing down
    { note: 'G4', midi: 67, time: 0.0,  duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 0.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 1.0,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 1.5,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.0,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 2.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 3.0,  duration: 1.0, velocity: 0.8 },
    // Fall-ing down, fall-ing down
    { note: 'D4', midi: 62, time: 4.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 4.5,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 5.0,  duration: 1.0, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 6.0,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 6.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 7.0,  duration: 1.0, velocity: 0.8 },
    // Lon-don Bridge is fall-ing down
    { note: 'G4', midi: 67, time: 8.0,  duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 8.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 9.0,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 9.5,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 10.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 10.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 11.0, duration: 1.0, velocity: 0.8 },
    // My fair la-dy
    { note: 'D4', midi: 62, time: 12.0, duration: 1.0, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 13.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 13.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 14.0, duration: 2.0, velocity: 0.8 },
  ];

  return {
    name: 'London Bridge',
    duration: 16.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Row Row Row Your Boat song
 * @returns {Object} Song data for Row Row Row Your Boat
 */
export function createRowYourBoatSong() {
  const notes = [
    // Row, row, row your boat
    { note: 'C4', midi: 60, time: 0.0,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 0.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 1.0,  duration: 0.375, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 1.375, duration: 0.125, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 1.5,  duration: 1.0, velocity: 0.8 },
    // Gent-ly down the stream
    { note: 'E4', midi: 64, time: 2.5,  duration: 0.375, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 2.875, duration: 0.125, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 3.0,  duration: 0.375, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 3.375, duration: 0.125, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 3.5,  duration: 1.5, velocity: 0.8 },
    // Mer-ri-ly, mer-ri-ly, mer-ri-ly, mer-ri-ly
    { note: 'C5', midi: 72, time: 5.0,  duration: 0.25, velocity: 0.75 },
    { note: 'C5', midi: 72, time: 5.25, duration: 0.25, velocity: 0.75 },
    { note: 'C5', midi: 72, time: 5.5,  duration: 0.25, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 5.75, duration: 0.25, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 6.0,  duration: 0.25, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 6.25, duration: 0.25, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 6.5,  duration: 0.25, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 6.75, duration: 0.25, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 7.0,  duration: 0.25, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 7.25, duration: 0.25, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 7.5,  duration: 0.25, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 7.75, duration: 0.25, velocity: 0.75 },
    // Life is but a dream
    { note: 'G4', midi: 67, time: 8.0,  duration: 0.375, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 8.375, duration: 0.125, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 8.5,  duration: 0.375, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 8.875, duration: 0.125, velocity: 0.75 },
    { note: 'C4', midi: 60, time: 9.0,  duration: 1.0, velocity: 0.8 },
  ];

  return {
    name: 'Row Row Row Your Boat',
    duration: 10.0,
    tempo: 120,
    timeSignature: { timeSignature: [3, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Old MacDonald Had a Farm song
 * @returns {Object} Song data for Old MacDonald
 */
export function createOldMacDonaldSong() {
  const notes = [
    // Old Mac-Don-ald had a farm
    { note: 'G4', midi: 67, time: 0.0,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 0.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 1.0,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 1.5,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 2.5,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 3.0,  duration: 1.0, velocity: 0.8 },
    // E-I-E-I-O
    { note: 'B4', midi: 71, time: 4.0,  duration: 0.5, velocity: 0.8 },
    { note: 'B4', midi: 71, time: 4.5,  duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 5.0,  duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 5.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 6.0,  duration: 1.0, velocity: 0.8 },
    // And on his farm he had some chicks
    { note: 'G4', midi: 67, time: 7.0,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 7.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 8.0,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 8.5,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 9.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 9.5,  duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 10.0, duration: 1.0, velocity: 0.8 },
    // E-I-E-I-O
    { note: 'B4', midi: 71, time: 11.0, duration: 0.5, velocity: 0.8 },
    { note: 'B4', midi: 71, time: 11.5, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 12.0, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 12.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 13.0, duration: 1.0, velocity: 0.8 },
    // With a chick-chick here, chick-chick there
    { note: 'D4', midi: 62, time: 14.0, duration: 0.5, velocity: 0.75 },
    { note: 'D4', midi: 62, time: 14.5, duration: 0.5, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 15.0, duration: 0.5, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 15.5, duration: 0.5, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 16.0, duration: 0.5, velocity: 0.75 },
    { note: 'D4', midi: 62, time: 16.5, duration: 0.5, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 17.0, duration: 0.5, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 17.5, duration: 0.5, velocity: 0.75 },
    // Old Mac-Don-ald had a farm, E-I-E-I-O
    { note: 'G4', midi: 67, time: 18.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 18.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 19.0, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 19.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 20.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 20.5, duration: 0.5, velocity: 0.8 },
    { note: 'D4', midi: 62, time: 21.0, duration: 0.5, velocity: 0.8 },
    { note: 'B4', midi: 71, time: 21.5, duration: 0.5, velocity: 0.8 },
    { note: 'B4', midi: 71, time: 22.0, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 22.5, duration: 0.5, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 23.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 23.5, duration: 1.5, velocity: 0.8 },
  ];

  return {
    name: 'Old MacDonald Had a Farm',
    duration: 25.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'beginner',
  };
}

/**
 * Create Amazing Grace song
 * @returns {Object} Song data for Amazing Grace
 */
export function createAmazingGraceSong() {
  // 3/4 time at 80 BPM: quarter = 0.75s, half = 1.5s, dotted half = 2.25s
  const q = 0.75;
  const h = 1.5;
  const dh = 2.25;
  const notes = [
    // A-maz-ing grace how sweet the sound
    { note: 'C4', midi: 60, time: 0*q,   duration: q,  velocity: 0.75 }, // pickup
    { note: 'F4', midi: 65, time: 1*q,   duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 3*q,   duration: q,  velocity: 0.75 },
    { note: 'C5', midi: 72, time: 4*q,   duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 6*q,   duration: q,  velocity: 0.75 },
    { note: 'C5', midi: 72, time: 7*q,   duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 9*q,   duration: q,  velocity: 0.75 },
    { note: 'F4', midi: 65, time: 10*q,  duration: dh, velocity: 0.8  },
    // That saved a wretch like me
    { note: 'F4', midi: 65, time: 13*q,  duration: q,  velocity: 0.75 },
    { note: 'A4', midi: 69, time: 14*q,  duration: h,  velocity: 0.8  },
    { note: 'C5', midi: 72, time: 16*q,  duration: q,  velocity: 0.75 },
    { note: 'A4', midi: 69, time: 17*q,  duration: h,  velocity: 0.8  },
    { note: 'F4', midi: 65, time: 19*q,  duration: dh, velocity: 0.8  },
    // I once was lost but now am found
    { note: 'C4', midi: 60, time: 22*q,  duration: q,  velocity: 0.75 },
    { note: 'F4', midi: 65, time: 23*q,  duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 25*q,  duration: q,  velocity: 0.75 },
    { note: 'C5', midi: 72, time: 26*q,  duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 28*q,  duration: q,  velocity: 0.75 },
    { note: 'C5', midi: 72, time: 29*q,  duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 31*q,  duration: q,  velocity: 0.75 },
    { note: 'F4', midi: 65, time: 32*q,  duration: dh, velocity: 0.8  },
    // Was blind but now I see
    { note: 'F4', midi: 65, time: 35*q,  duration: q,  velocity: 0.75 },
    { note: 'G4', midi: 67, time: 36*q,  duration: h,  velocity: 0.8  },
    { note: 'A4', midi: 69, time: 38*q,  duration: q,  velocity: 0.75 },
    { note: 'F4', midi: 65, time: 39*q,  duration: dh, velocity: 0.8  },
  ];

  return {
    name: 'Amazing Grace',
    duration: Math.round((39 + 3) * q * 100) / 100,
    tempo: 80,
    timeSignature: { timeSignature: [3, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Greensleeves song
 * @returns {Object} Song data for Greensleeves
 */
export function createGreensleevesSong() {
  // 3/4 time at 100 BPM: q=0.6s, e=0.3s, dq=0.9s, dh=1.8s
  // All times are explicit and sequential (each = previous time + previous duration)
  const notes = [
    // VERSE — "Alas my love, you do me wrong..."
    { note: 'A3',  midi: 57, time: 0.0,  duration: 0.6, velocity: 0.75 }, // pickup
    { note: 'C4',  midi: 60, time: 0.6,  duration: 0.9, velocity: 0.80 },
    { note: 'D4',  midi: 62, time: 1.5,  duration: 0.3, velocity: 0.75 },
    { note: 'E4',  midi: 64, time: 1.8,  duration: 0.6, velocity: 0.80 },
    { note: 'F4',  midi: 65, time: 2.4,  duration: 0.6, velocity: 0.78 },
    { note: 'E4',  midi: 64, time: 3.0,  duration: 0.9, velocity: 0.80 },
    { note: 'C4',  midi: 60, time: 3.9,  duration: 0.3, velocity: 0.75 },
    { note: 'D4',  midi: 62, time: 4.2,  duration: 0.9, velocity: 0.80 },
    { note: 'B3',  midi: 59, time: 5.1,  duration: 0.3, velocity: 0.75 },
    { note: 'G#3', midi: 56, time: 5.4,  duration: 1.8, velocity: 0.80 }, // held
    { note: 'B3',  midi: 59, time: 7.2,  duration: 0.6, velocity: 0.75 },
    { note: 'A3',  midi: 57, time: 7.8,  duration: 0.9, velocity: 0.80 },
    { note: 'G3',  midi: 55, time: 8.7,  duration: 0.3, velocity: 0.75 },
    { note: 'A3',  midi: 57, time: 9.0,  duration: 0.9, velocity: 0.80 },
    { note: 'B3',  midi: 59, time: 9.9,  duration: 0.3, velocity: 0.75 },
    { note: 'C4',  midi: 60, time: 10.2, duration: 1.8, velocity: 0.80 }, // held
    { note: 'A3',  midi: 57, time: 12.0, duration: 1.8, velocity: 0.80 }, // held — end verse
    // REFRAIN — "Greensleeves was all my joy..."
    { note: 'C4',  midi: 60, time: 13.8, duration: 0.9, velocity: 0.85 },
    { note: 'D4',  midi: 62, time: 14.7, duration: 0.3, velocity: 0.80 },
    { note: 'E4',  midi: 64, time: 15.0, duration: 0.6, velocity: 0.85 },
    { note: 'F4',  midi: 65, time: 15.6, duration: 0.6, velocity: 0.82 },
    { note: 'E4',  midi: 64, time: 16.2, duration: 0.9, velocity: 0.85 },
    { note: 'C4',  midi: 60, time: 17.1, duration: 0.3, velocity: 0.80 },
    { note: 'D4',  midi: 62, time: 17.4, duration: 0.9, velocity: 0.85 },
    { note: 'B3',  midi: 59, time: 18.3, duration: 0.3, velocity: 0.80 },
    { note: 'G#3', midi: 56, time: 18.6, duration: 1.8, velocity: 0.85 }, // held
    { note: 'B3',  midi: 59, time: 20.4, duration: 0.6, velocity: 0.80 },
    { note: 'A3',  midi: 57, time: 21.0, duration: 0.9, velocity: 0.85 },
    { note: 'G3',  midi: 55, time: 21.9, duration: 0.3, velocity: 0.80 },
    { note: 'A3',  midi: 57, time: 22.2, duration: 0.9, velocity: 0.85 },
    { note: 'B3',  midi: 59, time: 23.1, duration: 0.3, velocity: 0.80 },
    { note: 'C4',  midi: 60, time: 23.4, duration: 1.8, velocity: 0.85 }, // held
    { note: 'A3',  midi: 57, time: 25.2, duration: 1.8, velocity: 0.90 }, // final held
  ];

  return {
    name: 'Greensleeves',
    duration: 27.0,
    tempo: 100,
    timeSignature: { timeSignature: [3, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create When the Saints Go Marching In song
 * @returns {Object} Song data for When the Saints Go Marching In
 */
export function createSaintsGoMarchingSong() {
  // 4/4 time at 120 BPM: q=0.5s, e=0.25s, h=1.0s, dh=1.5s
  const notes = [
    // Oh when the saints (pickup)
    { note: 'C4', midi: 60, time: 0.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 0.5,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 1.0,  duration: 0.5, velocity: 0.8 },
    // go marching in
    { note: 'G4', midi: 67, time: 1.5,  duration: 2.0, velocity: 0.85 },
    // Oh when the saints go marching in
    { note: 'C4', midi: 60, time: 3.5,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 4.0,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 4.5,  duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 5.0,  duration: 2.0, velocity: 0.85 },
    // Oh Lord I want to be in that number
    { note: 'C4', midi: 60, time: 7.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 7.5,  duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 8.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 8.5,  duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 9.0,  duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 9.5,  duration: 1.0, velocity: 0.85 },
    { note: 'D4', midi: 62, time: 10.5, duration: 1.0, velocity: 0.85 },
    // When the saints go marching in
    { note: 'C4', midi: 60, time: 11.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 12.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 12.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 13.0, duration: 1.0, velocity: 0.85 },
    { note: 'F4', midi: 65, time: 14.0, duration: 2.0, velocity: 0.85 },
    // Second verse — Oh when the sun...
    { note: 'C4', midi: 60, time: 16.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 16.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 17.0, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 17.5, duration: 2.0, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 19.5, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 20.0, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 20.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 21.0, duration: 2.0, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 23.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 23.5, duration: 0.5, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 24.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 24.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 25.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 25.5, duration: 1.0, velocity: 0.85 },
    { note: 'D4', midi: 62, time: 26.5, duration: 1.0, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 27.5, duration: 0.5, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 28.0, duration: 0.5, velocity: 0.8 },
    { note: 'E4', midi: 64, time: 28.5, duration: 0.5, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 29.0, duration: 1.0, velocity: 0.85 },
    { note: 'F4', midi: 65, time: 30.0, duration: 2.0, velocity: 0.9 },
  ];

  return {
    name: 'When the Saints Go Marching In',
    duration: 32.0,
    tempo: 120,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Danny Boy song (Londonderry Air)
 * @returns {Object} Song data for Danny Boy
 */
export function createDannyBoySong() {
  // 4/4 time at 72 BPM: q=0.833s, e=0.417s, h=1.667s, dq=1.25s, dh=2.5s
  // Using rounded values: q=0.83, e=0.42, h=1.67, dq=1.25, dh=2.5
  const notes = [
    // Oh Dan-ny boy, the pipes the pipes are call-ing
    { note: 'G4', midi: 67, time: 0.0,  duration: 0.42, velocity: 0.75 }, // pickup
    { note: 'C5', midi: 72, time: 0.42, duration: 1.25, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 1.67, duration: 0.42, velocity: 0.75 },
    { note: 'D5', midi: 74, time: 2.09, duration: 0.83, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 2.92, duration: 0.83, velocity: 0.8  },
    { note: 'A4', midi: 69, time: 3.75, duration: 1.67, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 5.42, duration: 0.83, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 6.25, duration: 1.25, velocity: 0.78 },
    // From glen to glen and down the moun-tain side
    { note: 'G4', midi: 67, time: 7.5,  duration: 0.42, velocity: 0.75 },
    { note: 'A4', midi: 69, time: 7.92, duration: 0.83, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 8.75, duration: 1.25, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 10.0, duration: 0.42, velocity: 0.75 },
    { note: 'D5', midi: 74, time: 10.42, duration: 0.83, velocity: 0.8  },
    { note: 'E5', midi: 76, time: 11.25, duration: 0.83, velocity: 0.82 },
    { note: 'D5', midi: 74, time: 12.08, duration: 1.67, velocity: 0.82 },
    { note: 'C5', midi: 72, time: 13.75, duration: 0.83, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 14.58, duration: 2.5,  velocity: 0.8  },
    // The sum-mer's gone, and all the ro-ses fall-ing
    { note: 'G4', midi: 67, time: 17.08, duration: 0.42, velocity: 0.75 },
    { note: 'C5', midi: 72, time: 17.5,  duration: 1.25, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 18.75, duration: 0.42, velocity: 0.75 },
    { note: 'D5', midi: 74, time: 19.17, duration: 0.83, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 20.0,  duration: 0.83, velocity: 0.8  },
    { note: 'A4', midi: 69, time: 20.83, duration: 1.67, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 22.5,  duration: 0.83, velocity: 0.75 },
    { note: 'E4', midi: 64, time: 23.33, duration: 1.25, velocity: 0.78 },
    // 'Tis you, 'tis you must go and I must bide
    { note: 'G4', midi: 67, time: 24.58, duration: 0.42, velocity: 0.75 },
    { note: 'A4', midi: 69, time: 25.0,  duration: 0.83, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 25.83, duration: 0.83, velocity: 0.8  },
    { note: 'D5', midi: 74, time: 26.66, duration: 0.83, velocity: 0.82 },
    { note: 'E5', midi: 76, time: 27.49, duration: 0.83, velocity: 0.85 },
    { note: 'D5', midi: 74, time: 28.32, duration: 1.25, velocity: 0.82 },
    { note: 'C5', midi: 72, time: 29.57, duration: 0.42, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 29.99, duration: 3.33, velocity: 0.85 }, // final held
  ];

  return {
    name: 'Danny Boy',
    duration: 33.32,
    tempo: 72,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Simple Gifts song (Shaker hymn)
 * @returns {Object} Song data for Simple Gifts
 */
export function createSimpleGiftsSong() {
  // 4/4 time at 100 BPM: q=0.6s, e=0.3s, h=1.2s, dq=0.9s
  const notes = [
    // 'Tis the gift to be simple
    { note: 'C4', midi: 60, time: 0.0,  duration: 0.6, velocity: 0.8 },
    { note: 'C4', midi: 60, time: 0.6,  duration: 0.6, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 1.2,  duration: 0.6, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 1.8,  duration: 0.6, velocity: 0.8 },
    // 'tis the gift to be free
    { note: 'G4', midi: 67, time: 2.4,  duration: 0.6, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 3.0,  duration: 0.6, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 3.6,  duration: 1.2, velocity: 0.85 },
    // 'Tis the gift to come down where we ought to be
    { note: 'A4', midi: 69, time: 4.8,  duration: 0.6, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 5.4,  duration: 0.6, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 6.0,  duration: 0.6, velocity: 0.8 },
    { note: 'F4', midi: 65, time: 6.6,  duration: 0.6, velocity: 0.8 },
    { note: 'G4', midi: 67, time: 7.2,  duration: 0.6, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 7.8,  duration: 0.6, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 8.4,  duration: 0.6, velocity: 0.8 },
    { note: 'A4', midi: 69, time: 9.0,  duration: 0.6, velocity: 0.8 },
    // And when we find ourselves in the place just right
    { note: 'C5', midi: 72, time: 9.6,  duration: 0.6, velocity: 0.85 },
    { note: 'C5', midi: 72, time: 10.2, duration: 0.6, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 10.8, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 11.4, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 12.0, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 12.6, duration: 0.6, velocity: 0.8  },
    // 'twill be in the valley of love and delight
    { note: 'A4', midi: 69, time: 13.2, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 13.8, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 14.4, duration: 1.2, velocity: 0.85 },
    // When true simplicity is gain'd
    { note: 'F4', midi: 65, time: 15.6, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 16.2, duration: 0.6, velocity: 0.8  },
    { note: 'A4', midi: 69, time: 16.8, duration: 0.6, velocity: 0.8  },
    { note: 'A4', midi: 69, time: 17.4, duration: 0.6, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 18.0, duration: 0.6, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 18.6, duration: 0.6, velocity: 0.8  },
    { note: 'A4', midi: 69, time: 19.2, duration: 1.2, velocity: 0.85 },
    // To bow and to bend we shan't be asham'd
    { note: 'G4', midi: 67, time: 20.4, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 21.0, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 21.6, duration: 0.6, velocity: 0.8  },
    { note: 'A4', midi: 69, time: 22.2, duration: 0.6, velocity: 0.8  },
    { note: 'C5', midi: 72, time: 22.8, duration: 0.6, velocity: 0.85 },
    { note: 'C5', midi: 72, time: 23.4, duration: 0.6, velocity: 0.85 },
    // To turn, turn will be our delight
    { note: 'A4', midi: 69, time: 24.0, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 24.6, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 25.2, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 25.8, duration: 0.6, velocity: 0.8  },
    // Till by turning, turning we come 'round right
    { note: 'A4', midi: 69, time: 26.4, duration: 0.6, velocity: 0.8  },
    { note: 'G4', midi: 67, time: 27.0, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 27.6, duration: 1.2, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 28.8, duration: 0.6, velocity: 0.8  },
    { note: 'F4', midi: 65, time: 29.4, duration: 2.4, velocity: 0.9  }, // final held
  ];

  return {
    name: 'Simple Gifts',
    duration: 31.8,
    tempo: 100,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'intermediate',
  };
}

/**
 * Create Bach Prelude in C Major (BWV 846) — opening arpeggios
 * @returns {Object} Song data for Bach Prelude
 */
export function createBachPreludeSong() {
  // 4/4 at 72 BPM: each 16th note = 60/(72*4) = 0.208s ≈ 0.21s
  // Each measure = 16 sixteenth notes = 3.33s
  // Pattern: each chord is broken into 5 notes: bass, then 4 repeating upper notes
  // C major chord: C2 E3 G3 C4 E4 (repeated pattern)
  const s = 0.21; // sixteenth note duration

  function addMeasure(chordNotes, startTime) {
    // Bach's pattern: note[0](bass), note[1], note[2], note[3], note[4],
    //                 note[2], note[3], note[4], note[2], note[3], note[4],
    //                 note[2], note[3], note[4], note[2], note[3]
    // Simplified: bass(2s), then upper 4 notes cycling for 14 sixteenths
    const [bass, n1, n2, n3, n4] = chordNotes;
    const pattern = [n1, n2, n3, n4, n2, n3, n4, n2, n3, n4, n2, n3, n4, n2, n3, n4];
    const out = [];
    out.push({ note: midiToNoteName(bass), midi: bass, time: startTime, duration: s * 2, velocity: 0.55 });
    pattern.forEach((midi, i) => {
      out.push({ note: midiToNoteName(midi), midi, time: startTime + s * i, duration: s, velocity: 0.45 });
    });
    return out;
  }

  // BWV 846 chord progression (first 8 measures):
  // m1: C major  [36, 52, 55, 60, 64] (C2 E3 G3 C4 E4)
  // m2: C major  [36, 52, 57, 60, 64] (C2 A3 variation)
  // m3: D minor  [38, 53, 57, 62, 65] (D2 F3 A3 D4 F4)
  // m4: G dom7   [43, 50, 55, 59, 65] (G2 D3 G3 B3 F4)
  // m5: C major  [36, 52, 55, 60, 64]
  // m6: Am       [33, 52, 57, 60, 64] (A1 E3 A3 C4 E4)
  // m7: D7       [38, 50, 54, 60, 65] (D2 D3 F#3 C4 F4)
  // m8: G major  [43, 50, 55, 59, 67] (G2 D3 G3 B3 G4)

  const chords = [
    [36, 52, 55, 60, 64], // C maj
    [36, 52, 57, 60, 64], // C maj sus/add9
    [38, 53, 57, 62, 65], // D min
    [43, 50, 55, 59, 65], // G7
    [36, 52, 55, 60, 64], // C maj
    [33, 52, 57, 60, 64], // A min
    [38, 50, 54, 60, 65], // D7
    [43, 50, 55, 59, 67], // G maj
  ];

  const measureLen = s * 16; // 16 sixteenth notes per measure
  const notes = [];

  chords.forEach((chord, i) => {
    const measureNotes = addMeasure(chord, i * measureLen);
    measureNotes.forEach(n => notes.push(n));
  });

  // Sort by time
  notes.sort((a, b) => a.time - b.time);

  const duration = Math.round(chords.length * measureLen * 100) / 100;

  return {
    name: 'Bach Prelude in C Major',
    duration,
    tempo: 72,
    timeSignature: { timeSignature: [4, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Create Turkish March (Mozart Rondo alla Turca, K. 331)
 * @returns {Object} Song data for Turkish March
 */
export function createTurkishMarchSong() {
  // 2/4 time at 160 BPM: q=0.375s, e=0.1875s, dq=0.5625s
  // Using e=0.19s, q=0.38s for readability (slight rounding)
  const e = 0.19;
  const q = 0.38;

  const notes = [
    // Section A — opening 8-bar theme (A minor)
    // Bar 1-2: B4 A4 / B4 A4 B4 E4 D4 C4
    { note: 'B4', midi: 71, time: 0.0,  duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 0.19, duration: e, velocity: 0.80 },
    { note: 'B4', midi: 71, time: 0.38, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 0.57, duration: e, velocity: 0.80 },
    { note: 'B4', midi: 71, time: 0.76, duration: e, velocity: 0.80 },
    { note: 'E4', midi: 64, time: 0.95, duration: e, velocity: 0.80 },
    { note: 'D4', midi: 62, time: 1.14, duration: e, velocity: 0.80 },
    { note: 'C4', midi: 60, time: 1.33, duration: e, velocity: 0.80 },
    // Bar 3-4: A4 C4 E4 A4 / B4 E4 G#4 B4
    { note: 'A3', midi: 57, time: 1.52, duration: e, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 1.71, duration: e, velocity: 0.80 },
    { note: 'E4', midi: 64, time: 1.90, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 2.09, duration: q, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 2.47, duration: e, velocity: 0.80 },
    { note: 'G#4', midi: 68, time: 2.66, duration: e, velocity: 0.80 },
    { note: 'B4', midi: 71, time: 2.85, duration: q, velocity: 0.85 },
    // Bar 5-6: B4 A4 B4 A4 B4 E4 D4 C4
    { note: 'B4', midi: 71, time: 3.23, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 3.42, duration: e, velocity: 0.80 },
    { note: 'B4', midi: 71, time: 3.61, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 3.80, duration: e, velocity: 0.80 },
    { note: 'B4', midi: 71, time: 3.99, duration: e, velocity: 0.80 },
    { note: 'E4', midi: 64, time: 4.18, duration: e, velocity: 0.80 },
    { note: 'D4', midi: 62, time: 4.37, duration: e, velocity: 0.80 },
    { note: 'C4', midi: 60, time: 4.56, duration: e, velocity: 0.80 },
    // Bar 7-8: A3 C4 E4 A4 / E4 A4 C5 A4 E4
    { note: 'A3', midi: 57, time: 4.75, duration: e, velocity: 0.85 },
    { note: 'C4', midi: 60, time: 4.94, duration: e, velocity: 0.80 },
    { note: 'E4', midi: 64, time: 5.13, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 5.32, duration: e, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 5.51, duration: e, velocity: 0.80 },
    { note: 'C4', midi: 60, time: 5.70, duration: e, velocity: 0.80 },
    { note: 'A3', midi: 57, time: 5.89, duration: q, velocity: 0.85 },
    // Section B — A major (bright contrasting section)
    // Bar 9-10: A4 G#4 A4 E4 / A4 G#4 A4 B4
    { note: 'A4', midi: 69, time: 6.27, duration: e, velocity: 0.82 },
    { note: 'G#4', midi: 68, time: 6.46, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 6.65, duration: e, velocity: 0.82 },
    { note: 'E4', midi: 64, time: 6.84, duration: q, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 7.22, duration: e, velocity: 0.82 },
    { note: 'G#4', midi: 68, time: 7.41, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 7.60, duration: e, velocity: 0.82 },
    { note: 'B4', midi: 71, time: 7.79, duration: q, velocity: 0.85 },
    // Bar 11-12: C5 B4 A4 G#4 / A4 E4 A4 C5
    { note: 'C5', midi: 72, time: 8.17, duration: e, velocity: 0.85 },
    { note: 'B4', midi: 71, time: 8.36, duration: e, velocity: 0.82 },
    { note: 'A4', midi: 69, time: 8.55, duration: e, velocity: 0.82 },
    { note: 'G#4', midi: 68, time: 8.74, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 8.93, duration: e, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 9.12, duration: e, velocity: 0.80 },
    { note: 'C4', midi: 60, time: 9.31, duration: e, velocity: 0.80 },
    { note: 'A3', midi: 57, time: 9.50, duration: e, velocity: 0.80 },
    // Bar 13-14: A4 G#4 A4 E4 / A4 G#4 A4 B4
    { note: 'A4', midi: 69, time: 9.69, duration: e, velocity: 0.82 },
    { note: 'G#4', midi: 68, time: 9.88, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 10.07, duration: e, velocity: 0.82 },
    { note: 'E4', midi: 64, time: 10.26, duration: q, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 10.64, duration: e, velocity: 0.82 },
    { note: 'G#4', midi: 68, time: 10.83, duration: e, velocity: 0.80 },
    { note: 'A4', midi: 69, time: 11.02, duration: e, velocity: 0.82 },
    { note: 'B4', midi: 71, time: 11.21, duration: q, velocity: 0.85 },
    // Bar 15-16: C5 B4 A4 E4 / A4 (cadence)
    { note: 'C5', midi: 72, time: 11.59, duration: e, velocity: 0.88 },
    { note: 'B4', midi: 71, time: 11.78, duration: e, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 11.97, duration: e, velocity: 0.85 },
    { note: 'E4', midi: 64, time: 12.16, duration: e, velocity: 0.82 },
    { note: 'A4', midi: 69, time: 12.35, duration: q * 2, velocity: 0.9 }, // final
  ];

  return {
    name: 'Turkish March',
    duration: 13.11,
    tempo: 160,
    timeSignature: { timeSignature: [2, 4] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Create Chopin Nocturne Op. 9 No. 2 — opening phrase
 * @returns {Object} Song data for Chopin Nocturne
 */
export function createChopinNocturneSong() {
  // 12/8 time at 66 BPM: dotted quarter = 60/66 ≈ 0.909s, eighth = 0.303s
  // Using e=0.30s, dq=0.91s, q=0.61s
  const e = 0.30;

  const notes = [
    // Phrase 1 — Eb major, lyrical opening
    // B4 (starts, flowing ornamental melody)
    { note: 'Bb4', midi: 70, time: 0.0,  duration: 0.91, velocity: 0.72 },
    { note: 'C5',  midi: 72, time: 0.91, duration: 0.61, velocity: 0.70 },
    { note: 'Bb4', midi: 70, time: 1.52, duration: 0.30, velocity: 0.68 },
    { note: 'Ab4', midi: 68, time: 1.82, duration: 0.30, velocity: 0.68 },
    { note: 'G4',  midi: 67, time: 2.12, duration: 0.61, velocity: 0.70 },
    { note: 'Ab4', midi: 68, time: 2.73, duration: 0.91, velocity: 0.72 },
    { note: 'G4',  midi: 67, time: 3.64, duration: 0.61, velocity: 0.70 },
    { note: 'F4',  midi: 65, time: 4.25, duration: 0.30, velocity: 0.68 },
    { note: 'Eb4', midi: 63, time: 4.55, duration: 0.30, velocity: 0.68 },
    { note: 'F4',  midi: 65, time: 4.85, duration: 1.82, velocity: 0.72 }, // held

    // Phrase 2 — ascending answer
    { note: 'F4',  midi: 65, time: 6.67, duration: 0.91, velocity: 0.72 },
    { note: 'G4',  midi: 67, time: 7.58, duration: 0.61, velocity: 0.70 },
    { note: 'Ab4', midi: 68, time: 8.19, duration: 0.30, velocity: 0.68 },
    { note: 'Bb4', midi: 70, time: 8.49, duration: 0.30, velocity: 0.70 },
    { note: 'C5',  midi: 72, time: 8.79, duration: 0.61, velocity: 0.72 },
    { note: 'Db5', midi: 73, time: 9.40, duration: 0.91, velocity: 0.75 },
    { note: 'C5',  midi: 72, time: 10.31, duration: 0.61, velocity: 0.72 },
    { note: 'Bb4', midi: 70, time: 10.92, duration: 0.30, velocity: 0.70 },
    { note: 'Ab4', midi: 68, time: 11.22, duration: 0.30, velocity: 0.68 },
    { note: 'Bb4', midi: 70, time: 11.52, duration: 1.82, velocity: 0.72 }, // held

    // Phrase 3 — ornamental development
    { note: 'Bb4', midi: 70, time: 13.34, duration: 0.61, velocity: 0.72 },
    { note: 'C5',  midi: 72, time: 13.95, duration: 0.30, velocity: 0.70 },
    { note: 'Db5', midi: 73, time: 14.25, duration: 0.30, velocity: 0.72 },
    { note: 'Eb5', midi: 75, time: 14.55, duration: 0.61, velocity: 0.75 },
    { note: 'F5',  midi: 77, time: 15.16, duration: 0.91, velocity: 0.78 },
    { note: 'Eb5', midi: 75, time: 16.07, duration: 0.61, velocity: 0.75 },
    { note: 'Db5', midi: 73, time: 16.68, duration: 0.30, velocity: 0.72 },
    { note: 'C5',  midi: 72, time: 16.98, duration: 0.30, velocity: 0.70 },
    { note: 'Db5', midi: 73, time: 17.28, duration: 0.61, velocity: 0.72 },
    { note: 'C5',  midi: 72, time: 17.89, duration: 0.61, velocity: 0.70 },
    { note: 'Bb4', midi: 70, time: 18.50, duration: 0.61, velocity: 0.70 },
    { note: 'Ab4', midi: 68, time: 19.11, duration: 1.82, velocity: 0.72 }, // held

    // Phrase 4 — closing cadence
    { note: 'Bb4', midi: 70, time: 20.93, duration: 0.91, velocity: 0.72 },
    { note: 'G4',  midi: 67, time: 21.84, duration: 0.61, velocity: 0.70 },
    { note: 'Ab4', midi: 68, time: 22.45, duration: 0.61, velocity: 0.70 },
    { note: 'F4',  midi: 65, time: 23.06, duration: 0.61, velocity: 0.70 },
    { note: 'Eb4', midi: 63, time: 23.67, duration: 0.91, velocity: 0.72 },
    { note: 'F4',  midi: 65, time: 24.58, duration: 0.61, velocity: 0.70 },
    { note: 'Eb4', midi: 63, time: 25.19, duration: 0.61, velocity: 0.70 },
    { note: 'D4',  midi: 62, time: 25.80, duration: 0.61, velocity: 0.68 },
    { note: 'Eb4', midi: 63, time: 26.41, duration: 3.64, velocity: 0.75 }, // final held
  ];

  return {
    name: 'Nocturne Op. 9 No. 2',
    duration: 30.05,
    tempo: 66,
    timeSignature: { timeSignature: [12, 8] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Create Clair de Lune — Debussy, opening theme
 * @returns {Object} Song data for Clair de Lune
 */
export function createClairDeLuneSong() {
  // 9/8 time at 56 BPM: dotted quarter = 60/56 ≈ 1.071s, eighth = 0.357s
  // Using e=0.36s, dq=1.07s, q=0.71s
  const e = 0.36;
  const dq = 1.07;
  const q = 0.71;

  const notes = [
    // Opening — Db major, very slow and impressionistic
    // Phrase 1: high melody with long notes
    { note: 'Ab4', midi: 68, time: 0.0,   duration: dq,    velocity: 0.62 },
    { note: 'Gb4', midi: 66, time: dq,    duration: q,     velocity: 0.60 },
    { note: 'F4',  midi: 65, time: dq+q,  duration: e,     velocity: 0.58 },
    { note: 'Eb4', midi: 63, time: dq+q+e, duration: e,    velocity: 0.58 },
    { note: 'Db4', midi: 61, time: dq+q+2*e, duration: dq, velocity: 0.62 },
    { note: 'Eb4', midi: 63, time: 2*dq+q+2*e, duration: q, velocity: 0.60 },
    { note: 'F4',  midi: 65, time: 2*dq+2*q+2*e, duration: e, velocity: 0.60 },
    { note: 'Gb4', midi: 66, time: 2*dq+2*q+3*e, duration: dq, velocity: 0.62 },
    { note: 'Ab4', midi: 68, time: 3*dq+2*q+3*e, duration: q, velocity: 0.62 },
    { note: 'Bb4', midi: 70, time: 3*dq+3*q+3*e, duration: dq, velocity: 0.65 },

    // Phrase 2 — climbing
    { note: 'Db5', midi: 73, time: 4*dq+3*q+3*e, duration: dq,   velocity: 0.68 },
    { note: 'Bb4', midi: 70, time: 5*dq+3*q+3*e, duration: q,    velocity: 0.65 },
    { note: 'Ab4', midi: 68, time: 5*dq+4*q+3*e, duration: e,    velocity: 0.63 },
    { note: 'Gb4', midi: 66, time: 5*dq+4*q+4*e, duration: e,    velocity: 0.62 },
    { note: 'F4',  midi: 65, time: 5*dq+4*q+5*e, duration: dq,   velocity: 0.62 },
    { note: 'Ab4', midi: 68, time: 6*dq+4*q+5*e, duration: q,    velocity: 0.65 },
    { note: 'Gb4', midi: 66, time: 6*dq+5*q+5*e, duration: dq,   velocity: 0.63 },
    { note: 'Eb4', midi: 63, time: 7*dq+5*q+5*e, duration: q,    velocity: 0.62 },
    { note: 'Db4', midi: 61, time: 7*dq+6*q+5*e, duration: 2*dq, velocity: 0.65 }, // held

    // Phrase 3 — higher register
    { note: 'Eb5', midi: 75, time: 9*dq+6*q+5*e,  duration: dq,   velocity: 0.68 },
    { note: 'Db5', midi: 73, time: 10*dq+6*q+5*e, duration: q,    velocity: 0.65 },
    { note: 'Bb4', midi: 70, time: 10*dq+7*q+5*e, duration: e,    velocity: 0.63 },
    { note: 'Ab4', midi: 68, time: 10*dq+7*q+6*e, duration: e,    velocity: 0.62 },
    { note: 'Gb4', midi: 66, time: 10*dq+7*q+7*e, duration: dq,   velocity: 0.62 },
    { note: 'Ab4', midi: 68, time: 11*dq+7*q+7*e, duration: q,    velocity: 0.65 },
    { note: 'Gb4', midi: 66, time: 11*dq+8*q+7*e, duration: q,    velocity: 0.63 },
    { note: 'Eb4', midi: 63, time: 11*dq+9*q+7*e, duration: q,    velocity: 0.62 },
    { note: 'Db4', midi: 61, time: 11*dq+10*q+7*e, duration: 3*dq, velocity: 0.65 }, // final held
  ];

  // Compute total duration from last note
  const last = notes[notes.length - 1];
  const duration = Math.round((last.time + last.duration) * 10) / 10;

  return {
    name: 'Clair de Lune',
    duration,
    tempo: 56,
    timeSignature: { timeSignature: [9, 8] },
    tracks: 1,
    notes,
    totalNotes: notes.length,
    difficulty: 'advanced',
  };
}

/**
 * Get notes that should be playing at a specific time
 * @param {Array} notes - Array of note objects
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} lookAhead - How far ahead to look in seconds (default 0.1)
 * @returns {Array} Notes that should be playing
 */
export function getNotesAtTime(notes, currentTime, lookAhead = 0.1) {
  return notes.filter(note => {
    const noteStart = note.time;
    const noteEnd = note.time + note.duration;
    return (
      (noteStart >= currentTime && noteStart <= currentTime + lookAhead) ||
      (currentTime >= noteStart && currentTime <= noteEnd)
    );
  });
}

/**
 * Get the next note to be played
 * @param {Array} notes - Array of note objects
 * @param {number} currentTime - Current playback time in seconds
 * @returns {Object|null} Next note or null
 */
export function getNextNote(notes, currentTime) {
  return notes.find(note => note.time > currentTime) || null;
}

export default {
  parseMidiFile,
  estimateDifficulty,
  createTestSong,
  createTwinkleSong,
  createMarySong,
  getNotesAtTime,
  getNextNote,
};
