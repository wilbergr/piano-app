import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Piano as PianoIcon,
  CircleHelp,
  X,
  Music,
  Gamepad2,
  Play,
  Zap,
  Check,
  Hourglass,
  Lightbulb,
  PartyPopper,
  Star,
  ThumbsUp,
  CircleSlash,
  CircleX,
} from 'lucide-react';
import Piano from './components/Piano/Piano';
import SongPlayer from './components/SongPlayer/SongPlayer';
import Toast from './components/Toast/Toast';
import audioService from './services/audioService';
import './App.css';
import './components/SongPlayer/SongPlayer.css';

function App() {
  // Preload piano samples on app mount (without starting audio context)
  useEffect(() => {
    const preloadAudio = async () => {
      console.log('Starting piano sample preload...');
      try {
        await audioService.preload('piano');
        console.log('Piano samples preload complete');
      } catch (error) {
        console.error('Failed to preload piano samples:', error);
      }
    };

    preloadAudio();
  }, []);

  const [challengeConfig, setChallengeConfig] = useState(null);
  useEffect(() => {
    fetch('challenge-config.json')
      .then((r) => r.json())
      .then(setChallengeConfig)
      .catch(() => {});
  }, []);

  const resetChallengeRef = useRef(null);
  const handleRegisterReset = useCallback((fn) => {
    resetChallengeRef.current = fn;
  }, []);

  const [highlightedKeys, setHighlightedKeys] = useState([]);
  const [keyFeedback, setKeyFeedback] = useState(null);
  const [performanceResults, setPerformanceResults] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState(null);
  const userKeyPressHandlerRef = useRef(null);

  // In-app notification (replaces browser alert())
  const showToast = useCallback((message, tone = 'default') => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // Handle key highlighting from song player
  // keys can be an array of strings ['C4', 'E4'] or array of objects [{note: 'C4', priority: 1}]
  const handleHighlightKeys = useCallback((keys) => {
    setHighlightedKeys(keys);
  }, []);

  // Handle feedback for specific key
  const handleKeyFeedback = useCallback((feedback) => {
    setKeyFeedback(feedback);
    if (feedback) {
      // Clear feedback after 1 second
      setTimeout(() => setKeyFeedback(null), 1000);
    }
  }, []);

  // Handle performance results
  const handleShowResults = useCallback((results) => {
    setPerformanceResults(results);
  }, []);

  const handleCloseResults = useCallback(() => {
    resetChallengeRef.current?.();
    setPerformanceResults(null);
  }, []);

  // Handle song completion
  const handleSongComplete = useCallback((song) => {
    console.log('Song completed:', song);
    // TODO: Show trivia modal
    showToast(`Song "${song.title || song.name}" completed! Trivia coming soon.`, 'success');
  }, [showToast]);

  // Receive the key press handler from SongPlayer
  const setUserKeyPressHandler = useCallback((handler) => {
    userKeyPressHandlerRef.current = handler;
  }, []);

  // Handle key press from Piano
  const handlePianoKeyPress = useCallback((note) => {
    if (userKeyPressHandlerRef.current) {
      userKeyPressHandlerRef.current(note);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <PianoIcon className="title-icon" aria-hidden="true" />
          <h1>Piano Learning App</h1>
        </div>
        <p>Learn piano through interactive lessons and songs</p>
      </header>

      <main className="app-main">
        <div className="app-stack">
          {/* Song Player Controls */}
          <SongPlayer
            onHighlightKeys={handleHighlightKeys}
            onSongComplete={handleSongComplete}
            onUserKeyPress={setUserKeyPressHandler}
            onKeyFeedback={handleKeyFeedback}
            onShowResults={handleShowResults}
            onRegisterReset={handleRegisterReset}
            onNotify={showToast}
          />
          {/* Piano Keyboard */}
          <Piano
            highlightedKeys={highlightedKeys}
            disableInput={false}
            scrollToKey={null}
            onUserKeyPress={handlePianoKeyPress}
            keyFeedback={keyFeedback}
          />
        </div>

        <div className="help-toggle-container">
          <button
            className="help-toggle-btn"
            onClick={() => setShowHelp(h => !h)}
            aria-expanded={showHelp}
          >
            {showHelp ? (
              <>
                <X className="inline-icon" aria-hidden="true" /> Hide Help
              </>
            ) : (
              <>
                <CircleHelp className="inline-icon" aria-hidden="true" /> How to Use
              </>
            )}
          </button>
          {showHelp && (
            <div className="help-content">
              <h2>How to Use</h2>
              <ul>
                <li><Music className="inline-icon" aria-hidden="true" /> <strong>Select a song</strong> from the song player above</li>
                <li><Gamepad2 className="inline-icon" aria-hidden="true" /> <strong>Choose a mode:</strong> Demo (watch), Practice (your pace), or Challenge (real-time)</li>
                <li><Play className="inline-icon" aria-hidden="true" /> <strong>Demo mode:</strong> Press play to watch and listen</li>
                <li><PianoIcon className="inline-icon" aria-hidden="true" /> <strong>Practice/Challenge:</strong> Just start playing the highlighted keys!</li>
                <li><Zap className="inline-icon" aria-hidden="true" /> <strong>Adjust speed</strong> to learn at your own pace</li>
              </ul>

              <h3>Features:</h3>
              <ul>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> 88-key interactive piano with real sounds</li>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> MIDI song playback with key highlighting</li>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> Adjustable playback speed (0.5x to 2.0x)</li>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> Demo mode - watch and learn</li>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> Practice mode - play at your own pace</li>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> Challenge mode - test your timing</li>
                <li><Check className="inline-icon icon-success" aria-hidden="true" /> Performance tracking with detailed metrics</li>
                <li><Hourglass className="inline-icon" aria-hidden="true" /> Trivia challenges - coming soon</li>
              </ul>

              <div className="tip-box">
                <h4><Lightbulb className="inline-icon" aria-hidden="true" /> Pro Tip:</h4>
                <p>Start with the C Major Scale to familiarize yourself with the keyboard layout. Then try more complex songs as they unlock!</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, Vite, Tone.js, and @tonejs/midi</p>
      </footer>

      {/* Results Modal - Rendered at app root level */}
      {performanceResults && (
        <div className="results-modal">
          <div className="results-content">
            <h2>Performance Results</h2>
            <div className="results-summary">
              <div className={`accuracy-circle ${performanceResults.passed ? 'passed' : 'failed'}`}>
                <span className="accuracy-value">{Math.round(performanceResults.accuracy)}%</span>
                <span className="accuracy-label">Accuracy</span>
              </div>
              <div className="results-status">
                {performanceResults.passed ? (
                  <>
                    <p className="pass-message"><PartyPopper className="inline-icon" aria-hidden="true" /> Excellent! You passed!</p>
                    {performanceResults.mode === 'challenge' && challengeConfig?.code && (
                      <div className="challenge-code">
                        <p className="challenge-code-label">Your unlock code:</p>
                        <span className="challenge-code-value">{challengeConfig.code}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="fail-message">Keep practicing! You need 90% to pass.</p>
                )}
              </div>
            </div>
            <div className="results-breakdown">
              <div className="result-row">
                <span className="result-label"><Star className="inline-icon icon-success" aria-hidden="true" /> Perfect</span>
                <span className="result-value">{performanceResults.perfect}</span>
              </div>
              <div className="result-row">
                <span className="result-label"><ThumbsUp className="inline-icon" aria-hidden="true" /> Good</span>
                <span className="result-value">{performanceResults.good}</span>
              </div>
              <div className="result-row">
                <span className="result-label"><CircleSlash className="inline-icon icon-danger" aria-hidden="true" /> Missed</span>
                <span className="result-value">{performanceResults.missed}</span>
              </div>
              <div className="result-row">
                <span className="result-label"><CircleX className="inline-icon icon-danger" aria-hidden="true" /> Wrong</span>
                <span className="result-value">{performanceResults.wrong}</span>
              </div>
            </div>
            <div className="results-actions">
              <button onClick={handleCloseResults} className="btn-primary">
                Try Again
              </button>
              <button onClick={handleCloseResults} className="btn-secondary">
                Back to Songs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transient in-app notifications (replaces browser alert()) */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
