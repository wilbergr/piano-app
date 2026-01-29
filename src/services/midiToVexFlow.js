/**
 * MIDI to VexFlow Converter
 * Properly transforms MIDI data into VexFlow notation format
 */

/**
 * Convert seconds to beats based on tempo
 */
function secondsToBeats(seconds, tempo) {
  const beatsPerSecond = tempo / 60;
  return seconds * beatsPerSecond;
}

/**
 * Quantize a beat duration to the nearest standard note value
 * Returns [duration, dots] where duration is like 'q', 'h', etc.
 * and dots is the number of dots (0, 1, or 2)
 */
function quantizeDuration(beats) {
  // Clamp very small durations to minimum
  if (beats < 0.1) {
    beats = 0.125; // thirty-second note minimum
  }

  const durations = [
    { beats: 4, duration: 'w', dots: 0 },      // whole
    { beats: 3, duration: 'h', dots: 1 },      // dotted half
    { beats: 2, duration: 'h', dots: 0 },      // half
    { beats: 1.5, duration: 'q', dots: 1 },    // dotted quarter
    { beats: 1, duration: 'q', dots: 0 },      // quarter
    { beats: 0.75, duration: '8', dots: 1 },   // dotted eighth
    { beats: 0.5, duration: '8', dots: 0 },    // eighth
    { beats: 0.375, duration: '16', dots: 1 }, // dotted sixteenth
    { beats: 0.25, duration: '16', dots: 0 },  // sixteenth
    { beats: 0.125, duration: '32', dots: 0 }, // thirty-second
    { beats: 0.0625, duration: '64', dots: 0 }, // sixty-fourth
  ];

  // Find closest duration with preference for exact matches
  let closest = durations[durations.length - 1]; // Default to smallest
  let minDiff = Math.abs(beats - closest.beats);

  for (const d of durations) {
    const diff = Math.abs(beats - d.beats);
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
    // Prefer exact match
    if (diff < 0.01) {
      break;
    }
  }

  return closest;
}

/**
 * Convert MIDI note number to VexFlow key format
 */
function midiToKey(midiNote) {
  const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}/${octave}`;
}

/**
 * Check if note has accidental
 */
function hasAccidental(noteName) {
  return noteName.includes('#') || noteName.includes('b');
}

/**
 * Get accidental type
 */
function getAccidental(noteName) {
  if (noteName.includes('#')) return '#';
  if (noteName.includes('b')) return 'b';
  return null;
}

/**
 * Group simultaneous notes (within 50ms) into chords
 */
function groupChords(notes) {
  if (notes.length === 0) return [];

  const groups = [];
  let currentGroup = [notes[0]];

  for (let i = 1; i < notes.length; i++) {
    // If this note starts within 50ms of the group's start, add to group
    if (Math.abs(notes[i].startBeat - currentGroup[0].startBeat) < 0.1) {
      currentGroup.push(notes[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [notes[i]];
    }
  }

  groups.push(currentGroup);
  return groups;
}

/**
 * Split notes between treble and bass clef
 * Notes below middle C (C4 = MIDI 60) go to bass clef
 */
function splitClefs(noteGroups) {
  const trebleGroups = [];
  const bassGroups = [];

  noteGroups.forEach(group => {
    const trebleNotes = [];
    const bassNotes = [];

    group.forEach(note => {
      if (note.midi >= 60) { // C4 and above = treble
        trebleNotes.push(note);
      } else { // Below C4 = bass
        bassNotes.push(note);
      }
    });

    if (trebleNotes.length > 0) {
      trebleGroups.push(trebleNotes);
    }
    if (bassNotes.length > 0) {
      bassGroups.push(bassNotes);
    }
  });

  return { trebleGroups, bassGroups };
}

/**
 * Convert MIDI song data to VexFlow measures
 */
export function convertMidiToVexFlow(song) {
  const tempo = song.tempo || 120;
  const timeSignature = song.timeSignature?.timeSignature || [4, 4];
  const beatsPerMeasure = timeSignature[0];

  // Convert all notes from seconds to beats
  const notesInBeats = song.notes.map(note => ({
    ...note,
    startBeat: secondsToBeats(note.time, tempo),
    durationBeats: secondsToBeats(note.duration, tempo),
  }));

  // Sort by start time, then by pitch (for chords)
  notesInBeats.sort((a, b) => {
    if (Math.abs(a.startBeat - b.startBeat) < 0.01) {
      return a.midi - b.midi; // Lower notes first in chords
    }
    return a.startBeat - b.startBeat;
  });

  // Group simultaneous notes into chords
  const noteGroups = groupChords(notesInBeats);

  // Split between treble and bass clef
  const { trebleGroups, bassGroups } = splitClefs(noteGroups);

  // Helper function to group note groups into measures
  const groupIntoMeasures = (groups) => {
    const measures = [];
    let currentMeasure = [];
    let currentMeasureStart = 0;
    let currentBeat = 0;

    groups.forEach((group) => {
    const noteStartBeat = group[0].startBeat;
    const measureNumber = Math.floor(noteStartBeat / beatsPerMeasure);
    const measureStart = measureNumber * beatsPerMeasure;

    // If we've moved to a new measure
    while (currentMeasureStart < measureStart) {
      // Fill remaining beats in current measure with rest if needed
      const remainingBeats = currentMeasureStart + beatsPerMeasure - currentBeat;
      if (remainingBeats > 0.1) { // Small threshold to avoid tiny rests
        const restDuration = quantizeDuration(remainingBeats);
        currentMeasure.push({
          type: 'rest',
          duration: restDuration.duration,
          dots: restDuration.dots,
        });
      }

      if (currentMeasure.length > 0) {
        measures.push(currentMeasure);
      } else {
        // Add a whole measure rest if measure is empty
        const wholeMeasureRest = beatsPerMeasure === 4 ? 'w' : 'h';
        currentMeasure.push({
          type: 'rest',
          duration: wholeMeasureRest,
          dots: 0,
        });
        measures.push(currentMeasure);
      }
      currentMeasure = [];
      currentMeasureStart += beatsPerMeasure;
      currentBeat = currentMeasureStart;
    }

    // Add rest if there's a gap before this note/chord
    const gap = noteStartBeat - currentBeat;
    if (gap > 0.1) { // Threshold to avoid tiny rests
      const restDuration = quantizeDuration(gap);
      currentMeasure.push({
        type: 'rest',
        duration: restDuration.duration,
        dots: restDuration.dots,
      });
      currentBeat += restDuration.beats;
    }

    // Add the note or chord
    // Use the duration of the first note (they should be similar in a chord)
    const noteDuration = quantizeDuration(group[0].durationBeats);

    // If it's a chord, include all keys
    const keys = group.map(n => midiToKey(n.midi));
    const accidentals = group.map(n => getAccidental(n.note)).filter(a => a !== null);

    currentMeasure.push({
      type: 'note',
      keys: keys,
      duration: noteDuration.duration,
      dots: noteDuration.dots,
      accidentals: accidentals.length > 0 ? accidentals : null,
    });

      currentBeat = noteStartBeat + noteDuration.beats;
    });

    // Add final measure if it has content
    if (currentMeasure.length > 0) {
      // Fill remaining beats in last measure
      const remainingBeats = currentMeasureStart + beatsPerMeasure - currentBeat;
      if (remainingBeats > 0.1) { // Threshold to avoid tiny rests
        const restDuration = quantizeDuration(remainingBeats);
        currentMeasure.push({
          type: 'rest',
          duration: restDuration.duration,
          dots: restDuration.dots,
        });
      }
      measures.push(currentMeasure);
    }

    return measures;
  };

  // Group treble and bass notes into measures
  const trebleMeasures = groupIntoMeasures(trebleGroups);
  const bassMeasures = groupIntoMeasures(bassGroups);

  // Ensure both have the same number of measures (pad with rests if needed)
  const maxMeasures = Math.max(trebleMeasures.length, bassMeasures.length);
  while (trebleMeasures.length < maxMeasures) {
    trebleMeasures.push([{
      type: 'rest',
      duration: beatsPerMeasure === 4 ? 'w' : 'h',
      dots: 0,
    }]);
  }
  while (bassMeasures.length < maxMeasures) {
    bassMeasures.push([{
      type: 'rest',
      duration: beatsPerMeasure === 4 ? 'w' : 'h',
      dots: 0,
    }]);
  }

  return {
    trebleMeasures,
    bassMeasures,
    tempo,
    timeSignature,
  };
}

/**
 * Create VexFlow StaveNote from converted note data
 */
export function createStaveNote(noteData, StaveNote, Accidental, Dot) {
  let staveNote;

  if (noteData.type === 'rest') {
    // For rests, include dots in the duration string
    let durationStr = noteData.duration + 'r';
    if (noteData.dots > 0) {
      durationStr += 'd'.repeat(noteData.dots); // Add 'd' for each dot
    }

    staveNote = new StaveNote({
      keys: ['b/4'],
      duration: durationStr,
    });
  } else {
    // For notes, include dots in the duration string
    let durationStr = noteData.duration;
    if (noteData.dots > 0) {
      durationStr += 'd'.repeat(noteData.dots); // Add 'd' for each dot
    }

    staveNote = new StaveNote({
      keys: noteData.keys,
      duration: durationStr,
    });

    // Add accidentals if needed (handle multiple notes in chords)
    if (noteData.accidentals && noteData.accidentals.length > 0) {
      noteData.accidentals.forEach((accidental, index) => {
        if (accidental) {
          staveNote.addModifier(new Accidental(accidental), index);
        }
      });
    }
  }

  return staveNote;
}
