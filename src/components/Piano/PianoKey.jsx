import { useState, useCallback } from 'react';
import './Piano.css';

/**
 * Individual piano key component
 * Handles both white and black keys with visual feedback
 */
function PianoKey({ keyData, onKeyPress, onKeyRelease, highlightPriority = 0, isDisabled, feedback = null }) {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    if (isDisabled) return;

    setIsPressed(true);
    onKeyPress(keyData.fullNote);
  }, [keyData.fullNote, onKeyPress, isDisabled]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    if (isDisabled) return;

    setIsPressed(false);
    onKeyRelease(keyData.fullNote);
  }, [keyData.fullNote, onKeyRelease, isDisabled]);

  const handleMouseLeave = useCallback((e) => {
    if (isPressed && !isDisabled) {
      setIsPressed(false);
      onKeyRelease(keyData.fullNote);
    }
  }, [isPressed, keyData.fullNote, onKeyRelease, isDisabled]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    if (isDisabled) return;

    setIsPressed(true);
    onKeyPress(keyData.fullNote);
  }, [keyData.fullNote, onKeyPress, isDisabled]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (isDisabled) return;

    setIsPressed(false);
    onKeyRelease(keyData.fullNote);
  }, [keyData.fullNote, onKeyRelease, isDisabled]);

  const keyClasses = [
    'piano-key',
    keyData.isBlack ? 'black-key' : 'white-key',
    isPressed ? 'pressed' : '',
    highlightPriority > 0 ? `highlighted priority-${highlightPriority}` : '',
    isDisabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={keyClasses}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-note={keyData.fullNote}
      data-midi={keyData.midiNote}
    >
      <span className="key-label">{keyData.note === 'C' ? keyData.fullNote : ''}</span>
      {feedback && (
        <span className={`key-feedback ${feedback.rating}`}>
          {feedback.message}
        </span>
      )}
    </div>
  );
}

export default PianoKey;
