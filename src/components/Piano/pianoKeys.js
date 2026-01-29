/**
 * Piano keyboard configuration for 88 keys (A0 to C8)
 */

// Note names in one octave
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Black keys (sharps/flats) in an octave
const BLACK_KEYS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

/**
 * Generate all 88 piano keys from A0 to C8
 * @returns {Array} Array of key objects with note, octave, isBlack, midiNote
 */
export function generatePianoKeys() {
  const keys = [];

  // Start from A0 (MIDI note 21) to C8 (MIDI note 108)
  // This gives us 88 keys total

  // First, add A0, A#0, B0 (starts at MIDI 21)
  keys.push({ note: 'A', octave: 0, fullNote: 'A0', isBlack: false, midiNote: 21 });
  keys.push({ note: 'A#', octave: 0, fullNote: 'A#0', isBlack: true, midiNote: 22 });
  keys.push({ note: 'B', octave: 0, fullNote: 'B0', isBlack: false, midiNote: 23 });

  // Then add complete octaves from C1 to C7
  for (let octave = 1; octave <= 7; octave++) {
    for (let i = 0; i < 12; i++) {
      const note = NOTE_NAMES[i];
      const midiNote = 24 + (octave - 1) * 12 + i; // MIDI note number

      keys.push({
        note,
        octave,
        fullNote: `${note}${octave}`,
        isBlack: BLACK_KEYS.has(note),
        midiNote
      });
    }
  }

  // Finally, add the last C8 (MIDI note 108)
  keys.push({ note: 'C', octave: 8, fullNote: 'C8', isBlack: false, midiNote: 108 });

  return keys;
}

/**
 * Get the key index by note name
 * @param {string} fullNote - Full note name (e.g., 'C4', 'A#3')
 * @returns {number} Index in the keys array, or -1 if not found
 */
export function getKeyIndex(fullNote) {
  const keys = generatePianoKeys();
  return keys.findIndex(key => key.fullNote === fullNote);
}

/**
 * Get octave range for display
 * @param {number} startKey - Starting key index
 * @param {number} count - Number of keys to show
 * @returns {Array} Subset of keys to display
 */
export function getKeyRange(startKey = 0, count = 24) {
  const allKeys = generatePianoKeys();
  return allKeys.slice(startKey, startKey + count);
}

/**
 * Find the key index for a specific note (e.g., 'C4')
 * @param {string} note - Note to find
 * @returns {number} Key index or -1
 */
export function findNoteIndex(note) {
  const keys = generatePianoKeys();
  return keys.findIndex(k => k.fullNote === note);
}

// Middle C (C4) is around key index 39 (MIDI 60)
export const MIDDLE_C_INDEX = findNoteIndex('C4');

export default generatePianoKeys;
