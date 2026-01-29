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
