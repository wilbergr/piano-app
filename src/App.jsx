import { useState, useRef, useCallback, useEffect } from 'react';
import Piano from './components/Piano/Piano';
import SongPlayer from './components/SongPlayer/SongPlayer';
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
  const userKeyPressHandlerRef = useRef(null);

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
    if (performanceResults && !performanceResults.passed) {
      resetChallengeRef.current?.();
    }
    setPerformanceResults(null);
  }, [performanceResults]);

  // Handle song completion
  const handleSongComplete = useCallback((song) => {
    console.log('Song completed:', song);
    // TODO: Show trivia modal
    alert(`Song "${song.title || song.name}" completed! Trivia coming soon.`);
  }, []);

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
        <h1>🎹 Piano Learning App</h1>
        <p>Learn piano through interactive lessons and songs</p>
      </header>

      <main className="app-main">
        {/* Piano Keyboard */}
        <Piano
          highlightedKeys={highlightedKeys}
          disableInput={false}
          scrollToKey={null}
          onUserKeyPress={handlePianoKeyPress}
          keyFeedback={keyFeedback}
        />

        {/* Song Player Controls */}
        <SongPlayer
          onHighlightKeys={handleHighlightKeys}
          onSongComplete={handleSongComplete}
          onUserKeyPress={setUserKeyPressHandler}
          onKeyFeedback={handleKeyFeedback}
          onShowResults={handleShowResults}
          onRegisterReset={handleRegisterReset}
        />

        <div className="info-section">
          <h2>How to Use</h2>
          <ul>
            <li>🎵 <strong>Select a song</strong> from the song player above</li>
            <li>🎮 <strong>Choose a mode:</strong> Demo (watch), Practice (your pace), or Challenge (real-time)</li>
            <li>▶️ <strong>Demo mode:</strong> Press play to watch and listen</li>
            <li>🎹 <strong>Practice/Challenge:</strong> Just start playing the highlighted keys!</li>
            <li>⚡ <strong>Adjust speed</strong> to learn at your own pace</li>
          </ul>

          <h3>Features:</h3>
          <ul>
            <li>✅ 88-key interactive piano with real sounds</li>
            <li>✅ MIDI song playback with key highlighting</li>
            <li>✅ Adjustable playback speed (0.5x to 2.0x)</li>
            <li>✅ Demo mode - watch and learn</li>
            <li>✅ Practice mode - play at your own pace</li>
            <li>✅ Challenge mode - test your timing</li>
            <li>✅ Performance tracking with detailed metrics</li>
            <li>⏳ Trivia challenges - coming soon</li>
          </ul>

          <div className="tip-box">
            <h4>💡 Pro Tip:</h4>
            <p>Start with the C Major Scale to familiarize yourself with the keyboard layout. Then try more complex songs as they unlock!</p>
          </div>
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
                    <p className="pass-message">🎉 Excellent! You passed!</p>
                    {challengeConfig?.code && (
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
                <span className="result-label">🌟 Perfect</span>
                <span className="result-value">{performanceResults.perfect}</span>
              </div>
              <div className="result-row">
                <span className="result-label">👍 Good</span>
                <span className="result-value">{performanceResults.good}</span>
              </div>
              <div className="result-row">
                <span className="result-label">✓ OK</span>
                <span className="result-value">{performanceResults.ok}</span>
              </div>
              <div className="result-row">
                <span className="result-label">✗ Missed</span>
                <span className="result-value">{performanceResults.missed}</span>
              </div>
              <div className="result-row">
                <span className="result-label">❌ Wrong</span>
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
    </div>
  );
}

export default App;
