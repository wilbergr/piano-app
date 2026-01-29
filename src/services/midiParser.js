import { Midi } from '@tonejs/midi';

/**
 * MIDI Parser Service
 * Parses MIDI files and converts them to app-friendly format
 */

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
  const notes = [
    // Bass line (left hand)
    { note: 'D3', midi: 50, time: 0.0, duration: 1.0, velocity: 0.7 },
    { note: 'A2', midi: 45, time: 1.0, duration: 1.0, velocity: 0.7 },
    { note: 'B2', midi: 47, time: 2.0, duration: 1.0, velocity: 0.7 },
    { note: 'F#2', midi: 42, time: 3.0, duration: 1.0, velocity: 0.7 },
    { note: 'G2', midi: 43, time: 4.0, duration: 1.0, velocity: 0.7 },
    { note: 'D3', midi: 50, time: 5.0, duration: 1.0, velocity: 0.7 },
    { note: 'G2', midi: 43, time: 6.0, duration: 1.0, velocity: 0.7 },
    { note: 'A2', midi: 45, time: 7.0, duration: 1.0, velocity: 0.7 },

    // Melody (right hand) - starting after intro
    { note: 'F#5', midi: 78, time: 8.0, duration: 0.5, velocity: 0.75 },
    { note: 'E5', midi: 76, time: 8.5, duration: 0.5, velocity: 0.75 },
    { note: 'D5', midi: 74, time: 9.0, duration: 0.5, velocity: 0.75 },
    { note: 'C#5', midi: 73, time: 9.5, duration: 0.5, velocity: 0.75 },

    { note: 'B4', midi: 71, time: 10.0, duration: 0.5, velocity: 0.75 },
    { note: 'A4', midi: 69, time: 10.5, duration: 0.5, velocity: 0.75 },
    { note: 'B4', midi: 71, time: 11.0, duration: 0.5, velocity: 0.75 },
    { note: 'C#5', midi: 73, time: 11.5, duration: 0.5, velocity: 0.75 },

    { note: 'D5', midi: 74, time: 12.0, duration: 0.5, velocity: 0.75 },
    { note: 'A4', midi: 69, time: 12.5, duration: 0.5, velocity: 0.75 },
    { note: 'B4', midi: 71, time: 13.0, duration: 0.5, velocity: 0.75 },
    { note: 'F#4', midi: 66, time: 13.5, duration: 0.5, velocity: 0.75 },

    { note: 'G4', midi: 67, time: 14.0, duration: 0.5, velocity: 0.75 },
    { note: 'D5', midi: 74, time: 14.5, duration: 0.5, velocity: 0.75 },
    { note: 'G4', midi: 67, time: 15.0, duration: 0.5, velocity: 0.75 },
    { note: 'A4', midi: 69, time: 15.5, duration: 0.5, velocity: 0.75 },

    // Continue bass line
    { note: 'D3', midi: 50, time: 8.0, duration: 1.0, velocity: 0.6 },
    { note: 'A2', midi: 45, time: 9.0, duration: 1.0, velocity: 0.6 },
    { note: 'B2', midi: 47, time: 10.0, duration: 1.0, velocity: 0.6 },
    { note: 'F#2', midi: 42, time: 11.0, duration: 1.0, velocity: 0.6 },
    { note: 'G2', midi: 43, time: 12.0, duration: 1.0, velocity: 0.6 },
    { note: 'D3', midi: 50, time: 13.0, duration: 1.0, velocity: 0.6 },
    { note: 'G2', midi: 43, time: 14.0, duration: 1.0, velocity: 0.6 },
    { note: 'A2', midi: 45, time: 15.0, duration: 1.0, velocity: 0.6 },
  ];

  return {
    name: 'Canon in D',
    duration: 16.0,
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
  const notes = [
    // Triplet arpeggios in right hand with bass notes
    { note: 'G#2', midi: 44, time: 0.0, duration: 0.5, velocity: 0.5 },
    { note: 'C#3', midi: 49, time: 0.0, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 0.33, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 0.66, duration: 0.33, velocity: 0.4 },

    { note: 'C#3', midi: 49, time: 1.0, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 1.33, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 1.66, duration: 0.33, velocity: 0.4 },

    { note: 'E3', midi: 52, time: 2.0, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 2.33, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 2.66, duration: 0.33, velocity: 0.4 },

    { note: 'C#3', midi: 49, time: 3.0, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 3.33, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 3.66, duration: 0.33, velocity: 0.4 },

    // Second measure
    { note: 'A2', midi: 45, time: 4.0, duration: 0.5, velocity: 0.5 },
    { note: 'C#3', midi: 49, time: 4.0, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 4.33, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 4.66, duration: 0.33, velocity: 0.4 },

    { note: 'C#3', midi: 49, time: 5.0, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 5.33, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 5.66, duration: 0.33, velocity: 0.4 },

    // Melody enters
    { note: 'G#4', midi: 68, time: 6.0, duration: 0.5, velocity: 0.6 },
    { note: 'E3', midi: 52, time: 6.0, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 6.33, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 6.66, duration: 0.33, velocity: 0.4 },

    { note: 'F#4', midi: 66, time: 7.0, duration: 0.5, velocity: 0.6 },
    { note: 'C#3', midi: 49, time: 7.0, duration: 0.33, velocity: 0.4 },
    { note: 'E3', midi: 52, time: 7.33, duration: 0.33, velocity: 0.4 },
    { note: 'C#3', midi: 49, time: 7.66, duration: 0.33, velocity: 0.4 },
  ];

  return {
    name: 'Moonlight Sonata',
    duration: 8.0,
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
  const notes = [
    // Fast opening phrase
    { note: 'D4', midi: 62, time: 0.0, duration: 0.25, velocity: 0.9 },
    { note: 'F#4', midi: 66, time: 0.25, duration: 0.25, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 0.5, duration: 0.25, velocity: 0.8 },
    { note: 'D5', midi: 74, time: 0.75, duration: 0.25, velocity: 0.9 },

    { note: 'C#5', midi: 73, time: 1.0, duration: 0.375, velocity: 0.85 },
    { note: 'D5', midi: 74, time: 1.375, duration: 0.125, velocity: 0.7 },
    { note: 'E5', midi: 76, time: 1.5, duration: 0.5, velocity: 0.8 },

    { note: 'D4', midi: 62, time: 2.0, duration: 0.25, velocity: 0.9 },
    { note: 'F#4', midi: 66, time: 2.25, duration: 0.25, velocity: 0.85 },
    { note: 'A4', midi: 69, time: 2.5, duration: 0.25, velocity: 0.8 },
    { note: 'D5', midi: 74, time: 2.75, duration: 0.25, velocity: 0.9 },

    { note: 'F#5', midi: 78, time: 3.0, duration: 0.5, velocity: 0.9 },
    { note: 'E5', midi: 76, time: 3.5, duration: 0.5, velocity: 0.85 },

    // Second phrase with bass
    { note: 'D5', midi: 74, time: 4.0, duration: 0.25, velocity: 0.85 },
    { note: 'D3', midi: 50, time: 4.0, duration: 0.5, velocity: 0.7 },
    { note: 'C#5', midi: 73, time: 4.25, duration: 0.25, velocity: 0.8 },
    { note: 'D5', midi: 74, time: 4.5, duration: 0.25, velocity: 0.85 },
    { note: 'E5', midi: 76, time: 4.75, duration: 0.25, velocity: 0.8 },

    { note: 'F#5', midi: 78, time: 5.0, duration: 0.375, velocity: 0.9 },
    { note: 'A3', midi: 57, time: 5.0, duration: 0.5, velocity: 0.7 },
    { note: 'E5', midi: 76, time: 5.375, duration: 0.125, velocity: 0.75 },
    { note: 'D5', midi: 74, time: 5.5, duration: 0.5, velocity: 0.85 },

    { note: 'C#5', midi: 73, time: 6.0, duration: 0.25, velocity: 0.8 },
    { note: 'A3', midi: 57, time: 6.0, duration: 0.5, velocity: 0.7 },
    { note: 'B4', midi: 71, time: 6.25, duration: 0.25, velocity: 0.75 },
    { note: 'A4', midi: 69, time: 6.5, duration: 0.5, velocity: 0.8 },

    { note: 'D5', midi: 74, time: 7.0, duration: 1.0, velocity: 0.9 },
    { note: 'D3', midi: 50, time: 7.0, duration: 1.0, velocity: 0.7 },
    { note: 'A3', midi: 57, time: 7.0, duration: 1.0, velocity: 0.7 },
  ];

  return {
    name: 'Hungarian Dance No. 5',
    duration: 8.0,
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
