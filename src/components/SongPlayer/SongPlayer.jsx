import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  parseMidiFile,
  createTestSong,
  createTwinkleSong,
  createMarySong,
  createOdeToJoySong,
  createFurEliseSong,
  createJingleBellsSong,
  createCanonInDSong,
  createMoonlightSonataSong,
  createHungarianDanceSong,
  getNotesAtTime
} from '../../services/midiParser';
import audioService from '../../services/audioService';
import PerformanceTracker from '../../services/performanceTracker';
import songsData from '../../data/songs.json';
import MusicStaff from '../MusicStaff/MusicStaff';
import './SongPlayer.css';

/**
 * Song Player Component
 * Handles song loading, playback, and mode management
 */
function SongPlayer({ onHighlightKeys, onSongComplete, onUserKeyPress, onKeyFeedback, onShowResults }) {
  const [songs] = useState(songsData.songs);
  const [selectedSong, setSelectedSong] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [mode, setMode] = useState('demo'); // 'demo', 'practice', 'challenge'
  const [isLoading, setIsLoading] = useState(false);
  const [performanceTracker, setPerformanceTracker] = useState(null);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [midiFileData, setMidiFileData] = useState(null); // Store raw MIDI file data for music notation

  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const lastStateUpdateRef = useRef(0); // Track last time we updated state

  // Handle MIDI file upload
  const handleMidiUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Read the file as ArrayBuffer for music notation conversion
      const arrayBuffer = await file.arrayBuffer();
      setMidiFileData(arrayBuffer);

      // Also parse it for playback
      const songData = await parseMidiFile(file);

      songData.id = 'uploaded';
      songData.title = file.name.replace(/\.(mid|midi)$/i, '');
      songData.difficulty = 'custom';

      setSelectedSong({ id: 'uploaded', title: songData.title, difficulty: 'custom' });
      setCurrentSong(songData);
      setCurrentTime(0);
      pausedTimeRef.current = 0;

      // Initialize performance tracker
      const tracker = new PerformanceTracker(songData);
      setPerformanceTracker(tracker);

      console.log('Uploaded MIDI loaded:', songData);
    } catch (error) {
      console.error('Error loading MIDI file:', error);
      alert('Failed to load MIDI file. Please make sure it is a valid MIDI file.');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  }, []);

  // Load a song
  const loadSong = useCallback(async (songId) => {
    setIsLoading(true);
    try {
      const song = songs.find(s => s.id === songId);
      if (!song) {
        throw new Error('Song not found');
      }

      setSelectedSong(song);
      setMidiFileData(null); // Clear MIDI file data for built-in songs

      let songData;
      if (song.midiFile === 'test') {
        songData = createTestSong();
      } else if (song.midiFile === 'twinkle') {
        songData = createTwinkleSong();
      } else if (song.midiFile === 'mary') {
        songData = createMarySong();
      } else if (song.midiFile === 'ode') {
        songData = createOdeToJoySong();
      } else if (song.midiFile === 'furelise') {
        songData = createFurEliseSong();
      } else if (song.midiFile === 'jingle') {
        songData = createJingleBellsSong();
      } else if (song.midiFile === 'canon') {
        songData = createCanonInDSong();
      } else if (song.midiFile === 'moonlight') {
        songData = createMoonlightSonataSong();
      } else if (song.midiFile === 'hungarian') {
        songData = createHungarianDanceSong();
      } else {
        // Load actual MIDI file
        songData = await parseMidiFile(song.midiFile);
      }

      songData.id = song.id;
      songData.title = song.title;
      songData.difficulty = song.difficulty;
      songData.triviaQuestionId = song.triviaQuestionId;

      setCurrentSong(songData);
      setCurrentTime(0);
      pausedTimeRef.current = 0;

      // Initialize performance tracker
      const tracker = new PerformanceTracker(songData);
      setPerformanceTracker(tracker);

      // Highlight first notes in practice/challenge mode with priority
      if ((mode === 'practice' || mode === 'challenge') && songData.notes.length > 0) {
        const upcomingNotes = songData.notes.slice(0, 3).map((n, idx) => ({
          note: n.note,
          priority: idx + 1
        }));
        if (onHighlightKeys) {
          onHighlightKeys(upcomingNotes);
        }
      }

      console.log('Song loaded:', songData);
    } catch (error) {
      console.error('Error loading song:', error);
      alert('Failed to load song. Using test song instead.');
      // Fall back to test song
      const testSong = createTestSong();
      testSong.id = 'test-scale';
      testSong.title = 'C Major Scale';
      setCurrentSong(testSong);
      setPerformanceTracker(new PerformanceTracker(testSong));
    } finally {
      setIsLoading(false);
    }
  }, [songs]);

  // Handle user key press in practice/challenge mode
  const handleUserKeyPress = useCallback(async (note) => {
    if (!performanceTracker || mode === 'demo') return;

    // Auto-start playback on first note press for practice/challenge modes
    if (!isPlaying && (mode === 'practice' || mode === 'challenge')) {
      // Ensure audio is started
      if (!audioService.getIsInitialized()) {
        await audioService.init('piano');
      }

      // Start performance tracking
      if (pausedTimeRef.current === 0) {
        performanceTracker.start();
      }

      startTimeRef.current = Tone.now() - pausedTimeRef.current;
      lastStateUpdateRef.current = 0; // Reset state update timer
      setIsPlaying(true);
      // Note: playbackLoop will be started by the useEffect that watches isPlaying
    }

    // Check the note
    const currentTime = pausedTimeRef.current;
    const result = performanceTracker.checkNote(note, currentTime);

    // Send feedback with note information
    if (onKeyFeedback) {
      onKeyFeedback({
        ...result,
        note: note
      });
    }
    setLastFeedback(result);

    // Check if song is complete
    if (performanceTracker.getCompletionPercentage() === 100) {
      finishSong();
    }
  }, [performanceTracker, mode, isPlaying]);

  // Set up key press handler when component mounts or when handler changes
  useEffect(() => {
    if (onUserKeyPress) {
      onUserKeyPress(handleUserKeyPress);
    }
  }, [onUserKeyPress, handleUserKeyPress]);

  // Highlight first notes when switching to practice/challenge mode
  useEffect(() => {
    if ((mode === 'practice' || mode === 'challenge') && currentSong && !isPlaying && currentTime === 0) {
      const upcomingNotes = currentSong.notes.slice(0, 3).map((n, idx) => ({
        note: n.note,
        priority: idx + 1
      }));
      if (onHighlightKeys) {
        onHighlightKeys(upcomingNotes);
      }
    } else if (mode === 'demo' && !isPlaying && onHighlightKeys) {
      // Clear highlights in demo mode when not playing
      onHighlightKeys([]);
    }
  }, [mode, currentSong, isPlaying, currentTime, onHighlightKeys]);

  // Finish song and show results
  const finishSong = () => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    audioService.stopAllNotes();
    if (onHighlightKeys) {
      onHighlightKeys([]);
    }

    // Set progress to 100% at completion
    if (currentSong) {
      setCurrentTime(currentSong.duration);
      pausedTimeRef.current = currentSong.duration;
    }

    if (mode === 'practice' || mode === 'challenge') {
      if (onShowResults && performanceTracker) {
        // Small delay to show 100% progress before results
        setTimeout(() => {
          const results = performanceTracker.getResults();
          onShowResults(results);

          // Show trivia only after successful challenge completion
          if (mode === 'challenge' && results.passed && onSongComplete) {
            onSongComplete(currentSong);
          }
        }, 300);
      }
    }
  };

  // Play/Pause toggle
  const togglePlayback = useCallback(async () => {
    if (!currentSong) return;

    // Ensure audio is started
    if (!audioService.getIsInitialized()) {
      await audioService.init('piano');
    }

    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      audioService.stopAllNotes();
    } else {
      // Play
      // Start performance tracking for practice/challenge modes
      if ((mode === 'practice' || mode === 'challenge') && performanceTracker) {
        if (pausedTimeRef.current === 0) {
          performanceTracker.start();
        }
      }

      startTimeRef.current = Tone.now() - pausedTimeRef.current;
      lastStateUpdateRef.current = 0; // Reset state update timer
      setIsPlaying(true);
      // Note: playbackLoop will be started by the useEffect that watches isPlaying
    }
  }, [currentSong, isPlaying, mode, performanceTracker]);

  // Playback loop
  const playbackLoop = useCallback(() => {
    if (!isPlaying || !currentSong) return;

    if (mode === 'demo' || mode === 'challenge') {
      // Time-based playback for demo and challenge modes
      const now = Tone.now();
      const elapsed = (now - startTimeRef.current) * playbackSpeed;
      pausedTimeRef.current = elapsed;

      // Only update state every 50ms to reduce re-renders
      const shouldUpdateState = now - lastStateUpdateRef.current >= 0.05;
      if (shouldUpdateState) {
        setCurrentTime(elapsed);
        lastStateUpdateRef.current = now;
      }

      // Get notes to play at current time
      const activeNotes = getNotesAtTime(currentSong.notes, elapsed, 0.05);

      // Highlight keys (only when notes change to reduce updates)
      const notesToHighlight = activeNotes.map(n => n.note);
      if (onHighlightKeys && shouldUpdateState) {
        onHighlightKeys(notesToHighlight);
      }

      // Play notes in demo mode only
      if (mode === 'demo') {
        activeNotes.forEach(note => {
          // Check if this note should start now
          if (Math.abs(note.time - elapsed) < 0.05) {
            audioService.playNote(note.note, note.velocity, note.duration + 's');
          }
        });
      }

      // Check if song is complete
      if (elapsed >= currentSong.duration) {
        finishSong();
        return;
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    } else if (mode === 'practice') {
      // Practice mode: wait for user input
      if (!performanceTracker) return;

      const currentNote = performanceTracker.getCurrentNote();
      const upcomingNotes = performanceTracker.getUpcomingNotes(2);

      if (currentNote) {
        // Highlight current note and upcoming notes with priority
        const notesToHighlight = [
          { note: currentNote.note, priority: 1 },
          ...upcomingNotes.map((n, idx) => ({ note: n.note, priority: idx + 2 }))
        ];
        if (onHighlightKeys) {
          onHighlightKeys(notesToHighlight);
        }

        // Update display time based on current note
        setCurrentTime(currentNote.time);
        pausedTimeRef.current = currentNote.time;
      } else {
        // Song is complete
        finishSong();
        return;
      }

      // Continue loop (waiting for user input)
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    }
  }, [isPlaying, currentSong, mode, playbackSpeed, onHighlightKeys, performanceTracker]);

  // Start/stop playback loop based on isPlaying
  // Note: playbackLoop is intentionally NOT in dependencies to avoid infinite loops
  // The animation frame loop calls itself recursively and will use the latest version
  useEffect(() => {
    if (isPlaying && !animationFrameRef.current) {
      // Only start the loop if it's not already running
      const startLoop = () => {
        playbackLoop();
      };
      startLoop();
    } else if (!isPlaying && animationFrameRef.current) {
      // Stop the loop when not playing
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioService.stopAllNotes();
    };
  }, []);

  // Reset song
  const resetSong = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
    lastStateUpdateRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    audioService.stopAllNotes();
    if (onHighlightKeys) {
      onHighlightKeys([]);
    }
    setLastFeedback(null);
    if (performanceTracker) {
      performanceTracker.reset();
    }
  };

  // Speed control
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress based on mode
  const getProgress = () => {
    if (!currentSong) return 0;

    if (mode === 'practice' && performanceTracker) {
      // For practice mode, use note completion percentage
      return performanceTracker.getCompletionPercentage();
    } else {
      // For demo and challenge modes, use time-based progress
      return (currentTime / currentSong.duration) * 100;
    }
  };

  const progress = getProgress();

  return (
    <div className="song-player">
      <div className="player-header">
        <div className="header-top">
          {/* Mode selector dropdown - only show when song is selected */}
          {currentSong && (
            <div className="control-group mode-in-header">
              <label htmlFor="mode-select">Mode:</label>
              <select
                id="mode-select"
                className="control-select"
                value={mode}
                onChange={(e) => {
                  const newMode = e.target.value;
                  setMode(newMode);
                  // Reset speed to 1x for practice/challenge modes
                  if (newMode === 'practice' || newMode === 'challenge') {
                    setPlaybackSpeed(1.0);
                  }
                  resetSong();
                }}
              >
                <option value="demo">Demo</option>
                <option value="practice">Practice</option>
                <option value="challenge">Challenge</option>
              </select>
            </div>
          )}
          {/* Speed control dropdown - only show in demo mode when song is selected */}
          {currentSong && mode === 'demo' && (
            <div className="control-group mode-in-header">
              <label htmlFor="speed-select">Speed:</label>
              <select
                id="speed-select"
                className="control-select"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              >
                {speeds.map(speed => (
                  <option key={speed} value={speed}>{speed}x</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {currentSong && (
          <div className="current-song-info">
            <h3>{currentSong.title || currentSong.name}</h3>
            <span className={`difficulty-badge ${currentSong.difficulty}`}>
              {currentSong.difficulty}
            </span>
          </div>
        )}
      </div>

      {!currentSong && (
        <div className="song-list">
          <h3>Select a Song:</h3>
          <div className="songs-grid">
            {songs.filter(s => s.unlocked).map(song => (
              <button
                key={song.id}
                className="song-card"
                onClick={() => loadSong(song.id)}
                disabled={isLoading}
              >
                <div className="song-title">{song.title}</div>
                <div className="song-preview">{song.preview}</div>
                <span className={`difficulty-badge ${song.difficulty}`}>
                  {song.difficulty}
                </span>
              </button>
            ))}
          </div>

          {/* MIDI Upload Section */}
          <div className="upload-section">
            <h3>Or Upload Your Own MIDI File:</h3>
            <label htmlFor="midi-upload" className="upload-btn">
              📁 Choose MIDI File
              <input
                id="midi-upload"
                type="file"
                accept=".mid,.midi"
                onChange={handleMidiUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      {currentSong && (
        <div className="player-controls">
          {/* Music Staff */}
          <MusicStaff song={currentSong} midiFileData={midiFileData} />

          {/* Progress bar */}
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentSong.duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="controls-row">
            {mode === 'demo' ? (
              <div className="main-controls">
                <button onClick={resetSong} className="control-btn" title="Reset">
                  ⏮
                </button>
                <button
                  onClick={togglePlayback}
                  className="control-btn play-btn"
                  disabled={isLoading}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button onClick={resetSong} className="control-btn" title="Stop">
                  ⏹
                </button>
              </div>
            ) : (
              <div className="ready-message-inline">
                {isPlaying && (
                  <button onClick={resetSong} className="control-btn reset-inline" title="Reset">
                    🔄
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Real-time feedback */}
          {(mode === 'practice' || mode === 'challenge') && isPlaying && (
            <div className="performance-panel">
              {performanceTracker && (
                <div className="performance-stats">
                  <div className="stat">
                    <span className="stat-label">Progress:</span>
                    <span className="stat-value">
                      {performanceTracker.currentNoteIndex} / {performanceTracker.results.totalNotes}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Accuracy:</span>
                    <span className="stat-value">{Math.round(performanceTracker.getAccuracy())}%</span>
                  </div>
                  <div className="stat-grid">
                    <span className="stat-mini perfect">🌟 {performanceTracker.results.perfect}</span>
                    <span className="stat-mini good">👍 {performanceTracker.results.good}</span>
                    <span className="stat-mini ok">✓ {performanceTracker.results.ok}</span>
                    <span className="stat-mini missed">✗ {performanceTracker.results.missed}</span>
                    <span className="stat-mini wrong">❌ {performanceTracker.results.wrong}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={() => {
            resetSong();
            setCurrentSong(null);
          }} className="back-btn">
            ← Back to Song List
          </button>
        </div>
      )}
    </div>
  );
}

export default SongPlayer;
