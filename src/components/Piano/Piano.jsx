import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import PianoKey from './PianoKey';
import generatePianoKeys, { MIDDLE_C_INDEX } from './pianoKeys';
import audioService from '../../services/audioService';
import './Piano.css';

/**
 * Main Piano component - renders full 88-key piano keyboard
 */
function Piano({ highlightedKeys = [], disableInput = false, scrollToKey = null, onUserKeyPress, keyFeedback = null }) {
  const [keys] = useState(generatePianoKeys());
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [audioReady, setAudioReady] = useState(false);
  const pianoRef = useRef(null);

  // Scroll to specific key when requested
  useEffect(() => {
    if (scrollToKey && pianoRef.current) {
      const keyElement = pianoRef.current.querySelector(`[data-note="${scrollToKey}"]`);
      if (keyElement) {
        keyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [scrollToKey]);

  // Auto-scroll to middle C on initial load
  useEffect(() => {
    if (pianoRef.current) {
      const middleCKey = pianoRef.current.querySelector('[data-note="C4"]');
      if (middleCKey) {
        setTimeout(() => {
          middleCKey.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 500);
      }
    }
  }, []);

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

  const handleStartAudio = async () => {
    await ensureAudioReady();
  };

  return (
    <div className="piano-container">
      {!audioReady && (
        <div className="audio-notice">
          <p>🔊 Click the button below to enable audio</p>
          <button onClick={handleStartAudio} className="start-audio-btn">
            Enable Audio 🎵
          </button>
        </div>
      )}

      <div className="piano-scroll" ref={pianoRef}>
        <div className="piano-keyboard">
          {keys.map((keyData, index) => (
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
