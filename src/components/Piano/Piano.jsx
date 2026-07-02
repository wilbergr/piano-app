import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import PianoKey from './PianoKey';
import generatePianoKeys from './pianoKeys';
import audioService from '../../services/audioService';
import useIsMobile from '../../hooks/useIsMobile';
import './Piano.css';

// Mobile windowed-keyboard config: show one octave (C..B, 7 white keys) at a
// time so keys stay ≥44px on a 390px phone without horizontal hunting.
// octaveStart is the octave whose C..B is shown. Clamped to C1..B7.
const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;
const DEFAULT_OCTAVE = 4; // middle-C octave

const clampOctave = (o) => Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, o));

// Extract the primary (priority-1) highlighted note from either supported
// highlightedKeys format (array of strings, or array of {note, priority}).
const getPrimaryHighlightedNote = (highlightedKeys) => {
  if (!highlightedKeys || highlightedKeys.length === 0) return null;
  if (typeof highlightedKeys[0] === 'object' && highlightedKeys[0].note) {
    const p1 = highlightedKeys.find((k) => k.priority === 1);
    return (p1 || highlightedKeys[0]).note;
  }
  return highlightedKeys[0];
};

/**
 * Main Piano component.
 * Desktop: renders the full 88-key keyboard (horizontally scrollable).
 * Mobile: renders a single-octave window with prev/next octave navigation so
 * the keyboard is playable on a phone without a tiny horizontal-scroll strip.
 */
function Piano({ highlightedKeys = [], disableInput = false, scrollToKey = null, onUserKeyPress, keyFeedback = null }) {
  const [keys] = useState(generatePianoKeys());
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [audioReady, setAudioReady] = useState(false);
  const [octaveStart, setOctaveStart] = useState(DEFAULT_OCTAVE);
  const [prevPrimaryNote, setPrevPrimaryNote] = useState(null);
  const pianoRef = useRef(null);
  const isMobile = useIsMobile(768);

  // Keys visible in the current view. Desktop = all 88; mobile = one octave
  // window (C{octaveStart} .. B{octaveStart}, 7 white + 5 black keys).
  const visibleKeys = useMemo(() => {
    if (!isMobile) return keys;
    const low = 12 * (octaveStart + 1); // MIDI of C{octaveStart}
    const high = low + 11; // MIDI of B{octaveStart}
    return keys.filter((k) => k.midiNote >= low && k.midiNote <= high);
  }, [keys, isMobile, octaveStart]);

  const octaveLabel = `C${octaveStart}–B${octaveStart}`;

  // When song playback highlights a new note outside the visible window, shift
  // the window so a phone user isn't left hunting for the next key. This is the
  // React "adjust state during render when a prop changes" pattern — guarded by
  // the previous primary note so it runs once per change and never loops.
  const primaryNote = getPrimaryHighlightedNote(highlightedKeys);
  if (primaryNote !== prevPrimaryNote) {
    setPrevPrimaryNote(primaryNote);
    if (isMobile && primaryNote) {
      const keyObj = keys.find((k) => k.fullNote === primaryNote);
      if (keyObj) {
        const low = 12 * (octaveStart + 1);
        const high = low + 11;
        if (keyObj.midiNote < low || keyObj.midiNote > high) {
          setOctaveStart(clampOctave(keyObj.octave));
        }
      }
    }
  }

  // Scroll to specific key when requested (desktop full-keyboard only)
  useEffect(() => {
    if (isMobile) return;
    if (scrollToKey && pianoRef.current) {
      const keyElement = pianoRef.current.querySelector(`[data-note="${scrollToKey}"]`);
      if (keyElement) {
        keyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [scrollToKey, isMobile]);

  // Auto-scroll to middle C on initial load (desktop full-keyboard only)
  useEffect(() => {
    if (isMobile) return;
    if (pianoRef.current) {
      const middleCKey = pianoRef.current.querySelector('[data-note="C4"]');
      if (middleCKey) {
        setTimeout(() => {
          middleCKey.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 500);
      }
    }
  }, [isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.stopAllNotes();
    };
  }, []);

  // Initialize audio on first user interaction
  const ensureAudioReady = useCallback(async () => {
    if (!audioReady) {
      try {
        const success = await audioService.init('piano');
        if (success) {
          setAudioReady(true);
          console.log('Audio initialized successfully');
        } else {
          console.error('Failed to initialize audio');
        }
        return success;
      } catch (error) {
        console.error('Audio initialization error:', error);
        return false;
      }
    }
    return true;
  }, [audioReady]);


  const handleKeyPress = useCallback(async (note) => {
    if (disableInput) return;

    // Ensure audio is ready on first key press
    const ready = await ensureAudioReady();
    if (!ready) {
      console.error('Audio not ready');
      return;
    }

    setActiveKeys(prev => new Set(prev).add(note));
    console.log('Playing note:', note);
    audioService.playNote(note, 0.8, null);

    // Notify parent component (for practice/challenge modes)
    if (onUserKeyPress) {
      onUserKeyPress(note);
    }
  }, [disableInput, ensureAudioReady, onUserKeyPress]);

  const handleKeyRelease = useCallback((note) => {
    if (disableInput) return;

    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
    audioService.stopNote(note);
  }, [disableInput]);

  const getKeyHighlightPriority = useCallback((note) => {
    // Handle both formats: array of strings or array of {note, priority} objects
    if (highlightedKeys.length === 0) return 0;

    // Check if it's the new format with priority
    if (typeof highlightedKeys[0] === 'object' && highlightedKeys[0].note) {
      const found = highlightedKeys.find(k => k.note === note);
      return found ? found.priority : 0;
    }

    // Old format: array of strings (treat all as priority 1)
    return highlightedKeys.includes(note) ? 1 : 0;
  }, [highlightedKeys]);

  return (
    <div className="piano-container">
      {isMobile && (
        <div className="octave-nav">
          <button
            type="button"
            className="octave-btn"
            onClick={() => setOctaveStart((o) => clampOctave(o - 1))}
            disabled={octaveStart <= MIN_OCTAVE}
            title="Lower octave"
          >
            ‹
          </button>
          <span className="octave-label">{octaveLabel}</span>
          <button
            type="button"
            className="octave-btn"
            onClick={() => setOctaveStart((o) => clampOctave(o + 1))}
            disabled={octaveStart >= MAX_OCTAVE}
            title="Higher octave"
          >
            ›
          </button>
        </div>
      )}
      <div className={`piano-scroll ${isMobile ? 'is-windowed' : ''}`} ref={pianoRef}>
        <div className="piano-keyboard">
          {visibleKeys.map((keyData, index) => (
            <PianoKey
              key={`${keyData.fullNote}-${index}`}
              keyData={keyData}
              onKeyPress={handleKeyPress}
              onKeyRelease={handleKeyRelease}
              highlightPriority={getKeyHighlightPriority(keyData.fullNote)}
              isDisabled={disableInput}
              feedback={keyFeedback && keyFeedback.note === keyData.fullNote ? keyFeedback : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Piano;
