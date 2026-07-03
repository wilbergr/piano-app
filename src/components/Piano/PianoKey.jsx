import { useState, useCallback } from 'react';
import { Star, ThumbsUp, Clock, CircleX } from 'lucide-react';
import './Piano.css';

// Non-color cue for the on-key feedback bubble: each rating gets a distinct
// icon (matching the stat-mini icon set) so meaning doesn't ride on color alone.
const FEEDBACK_ICONS = {
  perfect: Star,
  good: ThumbsUp,
  ok: Clock,
  late: Clock,
  wrong: CircleX,
};

// "C#4" → "C sharp 4" so screen readers don't read the note as "C4".
const noteAriaLabel = (fullNote) => fullNote.replace('#', ' sharp ');

/**
 * Individual piano key component
 * Handles both white and black keys with visual feedback.
 * Keyboard-operable: role="button", Enter/Space plays the note (press on
 * keydown, release on keyup, mirroring mouse down/up), Arrow/Home/End
 * navigation is delegated to the parent Piano via onNavigate (roving tabindex).
 */
function PianoKey({ keyData, onKeyPress, onKeyRelease, highlightPriority = 0, isDisabled, feedback = null, tabIndex = -1, onNavigate, onFocus, registerRef }) {
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

  const handleMouseLeave = useCallback(() => {
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

  // Keyboard: Enter/Space = play (down/up like a mouse press), arrows navigate.
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isDisabled || e.repeat) return;
      setIsPressed(true);
      onKeyPress(keyData.fullNote);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      onNavigate?.(e.key, keyData.fullNote);
    }
  }, [keyData.fullNote, onKeyPress, onNavigate, isDisabled]);

  const handleKeyUp = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isDisabled) return;
      setIsPressed(false);
      onKeyRelease(keyData.fullNote);
    }
  }, [keyData.fullNote, onKeyRelease, isDisabled]);

  // Release a held note if focus leaves the key (parity with mouse-leave).
  const handleBlur = useCallback(() => {
    if (isPressed && !isDisabled) {
      setIsPressed(false);
      onKeyRelease(keyData.fullNote);
    }
  }, [isPressed, keyData.fullNote, onKeyRelease, isDisabled]);

  const keyClasses = [
    'piano-key',
    keyData.isBlack ? 'black-key' : 'white-key',
    isPressed ? 'pressed' : '',
    highlightPriority > 0 ? `highlighted priority-${highlightPriority}` : '',
    isDisabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  const FeedbackIcon = feedback ? FEEDBACK_ICONS[feedback.rating] : null;

  return (
    <div
      className={keyClasses}
      role="button"
      aria-label={noteAriaLabel(keyData.fullNote)}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : tabIndex}
      ref={registerRef ? (el) => registerRef(keyData.fullNote, el) : undefined}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={onFocus ? () => onFocus(keyData.fullNote) : undefined}
      onBlur={handleBlur}
      data-note={keyData.fullNote}
      data-midi={keyData.midiNote}
    >
      <span className="key-label">{keyData.note === 'C' ? keyData.fullNote : ''}</span>
      {feedback && (
        <span className={`key-feedback ${feedback.rating}`} aria-hidden="true">
          {FeedbackIcon && <FeedbackIcon className="inline-icon" />}
          {feedback.message}
        </span>
      )}
    </div>
  );
}

export default PianoKey;
