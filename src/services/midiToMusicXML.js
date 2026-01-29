/**
 * MIDI to MusicXML converter using webmscore (MuseScore's WebAssembly library)
 * Provides professional-quality music notation with proper beaming, key signatures, etc.
 */

import WebMscore from 'webmscore';

let webmscoreReady = false;
let webmscoreInitPromise = null;

/**
 * Initialize webmscore library
 * @returns {Promise<void>}
 */
async function initWebMscore() {
  if (webmscoreReady) {
    return;
  }

  if (!webmscoreInitPromise) {
    webmscoreInitPromise = WebMscore.ready.then(() => {
      webmscoreReady = true;
      console.log('WebMscore initialized successfully');
    });
  }

  return webmscoreInitPromise;
}

/**
 * Convert MIDI file data to MusicXML string
 * @param {Uint8Array|ArrayBuffer} midiData - MIDI file data
 * @param {string} title - Optional title for the score
 * @returns {Promise<string>} MusicXML string
 */
export async function convertMidiToMusicXML(midiData, title = 'Untitled') {
  try {
    // Ensure webmscore is ready
    await initWebMscore();

    // Convert to Uint8Array if needed
    let midiBytes;
    if (midiData instanceof ArrayBuffer) {
      midiBytes = new Uint8Array(midiData);
    } else if (midiData instanceof Uint8Array) {
      midiBytes = midiData;
    } else {
      throw new Error('MIDI data must be Uint8Array or ArrayBuffer');
    }

    console.log('Loading MIDI file into WebMscore...');

    // Load MIDI file into webmscore
    const score = await WebMscore.load('midi', midiBytes);

    console.log('Converting to MusicXML...');

    // Export as uncompressed MusicXML (returns string directly)
    let musicXmlString = await score.saveXml();

    // Clean up
    score.destroy();

    // Inject title elements into the MusicXML if they don't exist
    // Add work title and movement title after <identification> and before <defaults>

    // First, check if <work> exists, if not add it after <identification>
    if (!musicXmlString.includes('<work>')) {
      const workElement = `  <work>
    <work-title>${title}</work-title>
  </work>
`;
      musicXmlString = musicXmlString.replace(
        /(<\/identification>\s*)/,
        `$1${workElement}`
      );
    }

    // Add movement-title if it doesn't exist
    if (!musicXmlString.includes('<movement-title>')) {
      const movementTitleElement = `  <movement-title>${title}</movement-title>
`;
      // Insert before <identification> or <defaults>, whichever comes first
      musicXmlString = musicXmlString.replace(
        /(<identification>)/,
        `${movementTitleElement}$1`
      );
    }

    // Add credit element for the title display at the top center
    if (!musicXmlString.includes('<credit')) {
      const creditElement = `  <credit page="1">
    <credit-type>title</credit-type>
    <credit-words default-x="600" default-y="1600" font-size="24" font-weight="bold" halign="center" valign="top">${title}</credit-words>
  </credit>
`;
      // Insert after <movement-title> or <work>, or after <identification>
      musicXmlString = musicXmlString.replace(
        /(<\/work>\s*)/,
        `$1${creditElement}`
      );
    }

    // Sanitize any invalid metadata values
    musicXmlString = musicXmlString.replace(/-2147483648/g, title);

    return musicXmlString;
  } catch (error) {
    console.error('Error converting MIDI to MusicXML:', error);
    throw error;
  }
}

/**
 * Convert our custom song format to MIDI bytes, then to MusicXML
 * @param {Object} song - Song object with notes array
 * @returns {Promise<string>} MusicXML string
 */
export async function convertSongToMusicXML(song) {
  try {
    // Dynamically import @tonejs/midi for MIDI file generation
    const { Midi } = await import('@tonejs/midi');

    console.log('Generating MIDI file from song data...');

    // Create a new MIDI file
    const midi = new Midi();
    const songTitle = song.name || song.title || 'Untitled';
    midi.name = songTitle;

    // Set tempo (BPM)
    const tempo = song.tempo || 120;

    // Split notes into treble (right hand) and bass (left hand) for grand staff
    // Middle C (MIDI 60) is the typical split point
    const MIDDLE_C = 60;
    const trebleNotes = song.notes.filter(note => note.midi >= MIDDLE_C);
    const bassNotes = song.notes.filter(note => note.midi < MIDDLE_C);

    // Add treble clef track (right hand)
    const trebleTrack = midi.addTrack();
    trebleTrack.name = `${songTitle} (Right Hand)`;
    trebleTrack.instrument.number = 0; // Acoustic Grand Piano
    trebleTrack.channel = 0;

    trebleNotes.forEach(note => {
      trebleTrack.addNote({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity || 0.8
      });
    });

    // Add bass clef track (left hand)
    const bassTrack = midi.addTrack();
    bassTrack.name = `${songTitle} (Left Hand)`;
    bassTrack.instrument.number = 0; // Acoustic Grand Piano
    bassTrack.channel = 0;

    bassNotes.forEach(note => {
      bassTrack.addNote({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity || 0.8
      });
    });

    // Set tempo changes (if any)
    midi.header.setTempo(0, tempo);

    // Convert to MIDI file bytes
    const midiBytes = midi.toArray();

    console.log('MIDI file generated, converting to MusicXML...');

    // Convert the MIDI bytes to MusicXML with the song title
    const musicXmlString = await convertMidiToMusicXML(new Uint8Array(midiBytes), songTitle);

    return musicXmlString;
  } catch (error) {
    console.error('Error converting song to MusicXML:', error);
    throw error;
  }
}
