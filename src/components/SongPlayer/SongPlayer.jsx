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
function SongPlayer({ onHighlightKeys, onSongComplete, onUserKeyPress, onKeyFeedback, onShowResults, onRegisterReset }) {
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
  const [countingIn, setCountingIn] = useState(false);
  const [countInBeats, setCountInBeats] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(0);

  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const lastStateUpdateRef = useRef(0); // Track last time we updated state
  const metronomeIntervalRef = useRef(null);
  const metronomeSynthRef = useRef(null);

  // Initialize metronome synth
  useEffect(() => {
    // Create a simple noise burst for metronome click
    metronomeSynthRef.current = new Tone.NoiseSynth({
      noise: {
        type: 'white'
      },
      envelope: {
        attack: 0.001,
        decay: 0.02,
        sustain: 0
      }
    }).toDestination();
    metronomeSynthRef.current.volume.value = -15;

    return () => {
      if (metronomeSynthRef.current) {
        metronomeSynthRef.current.dispose();
      }
    };
  }, []);

  // Reset challenge to the beginning (called by App after results are dismissed)
  const resetChallenge = useCallback(() => {
    setIsPlaying(false);
    setCountingIn(false);
    setCountInBeats(0);
    setLastFeedback(null);
    audioService.stopAllNotes();
    setCurrentTime(0);
    pausedTimeRef.current = 0;
    if (currentSong) {
      setPerformanceTracker(new PerformanceTracker(currentSong));
    }
  }, [currentSong]);

  useEffect(() => {
    onRegisterReset?.(resetChallenge);
  }, [onRegisterReset, resetChallenge]);

  // Play metronome click
  const playMetronomeClick = useCallback((isDownbeat = false) => {
    if (metronomeSynthRef.current) {
      // Make downbeat slightly louder
      const volume = metronomeSynthRef.current.volume.value;
      if (isDownbeat) {
        metronomeSynthRef.current.volume.value = volume + 3;
      }
      metronomeSynthRef.current.triggerAttackRelease('16n');
      // Reset volume after a short delay
      if (isDownbeat) {
        setTimeout(() => {
          if (metronomeSynthRef.current) {
            metronomeSynthRef.current.volume.value = volume;
          }
        }, 50);
      }
    }
  }, []);

  // Start count-in before challenge/practice
  const startCountIn = useCallback(async () => {
    if (!currentSong) return;

    await audioService.init('piano');

    const tempo = currentSong.tempo || 120;
    const beatDuration = 60 / tempo; // Duration of one beat in seconds
    const countInLength = 8; // 8 beats count-in

    setCountingIn(true);
    setCountInBeats(8);

    // Use Tone.js for precise timing
    Tone.getTransport().bpm.value = tempo;
    Tone.getTransport().cancel(); // Clear any existing scheduled events
    Tone.Draw.cancel();

    // Play the first click immediately
    if (metronomeEnabled) {
      playMetronomeClick(true);
    }

    // Start time is now (first beat already played)
    const startTime = Tone.now();
    const songStartTime = startTime + (countInLength * beatDuration);

    // Store the actual song start time
    startTimeRef.current = songStartTime;

    // Calculate total beats needed (count-in + song)
    const songDuration = currentSong.duration || 60;
    const totalBeats = Math.ceil(songDuration / beatDuration) + countInLength;

    // Schedule ONE continuous metronome track (starting from beat 1, since beat 0 already played)
    if (metronomeEnabled) {
      for (let i = 1; i < totalBeats; i++) {
        const beatTime = startTime + (i * beatDuration);
        const isCountInBeat = i < countInLength;
        const beatInMeasure = isCountInBeat ? i : (i - countInLength) % 4;

        Tone.Draw.schedule(() => {
          // Play click (downbeat on first beat of each measure)
          playMetronomeClick(beatInMeasure === 0);

          // Update count-in display for first 8 beats (8, 7, 6, 5, 4, 3, 2, 1)
          if (isCountInBeat) {
            setCountInBeats(8 - i);
          }
        }, beatTime);
      }
    } else {
      // If metronome disabled, still schedule count-in UI updates
      for (let i = 1; i < countInLength; i++) {
        const beatTime = startTime + (i * beatDuration);
        Tone.Draw.schedule(() => {
          setCountInBeats(8 - i);
        }, beatTime);
      }
    }

    // Schedule end of count-in and start of song
    Tone.Draw.schedule(() => {
      setCountingIn(false);
      setCountInBeats(0);

      // Start actual playback
      if (performanceTracker && pausedTimeRef.current === 0) {
        performanceTracker.start();
      }
      lastStateUpdateRef.current = 0;
      setIsPlaying(true);
    }, songStartTime);
  }, [currentSong, playMetronomeClick, performanceTracker, metronomeEnabled]);

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

      // Use count-in for challenge mode starting from beginning
      if (mode === 'challenge' && pausedTimeRef.current === 0) {
        // Don't check the note yet, wait for count-in to finish
        startCountIn();
        return;
      }

      // Start performance tracking for practice mode
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
    // Cancel all scheduled Tone.js events
    Tone.getTransport().cancel();
    Tone.Draw.cancel();
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
          const results = { ...performanceTracker.getResults(), mode };
          onShowResults(results);

          // Show trivia only after successful challenge completion
          if (mode === 'challenge' && results.passed && onSongComplete) {
            onSongComplete(currentSong);
          }
        }, 300);
      }
    }
  };

  // Start actual playback (called after count-in or directly)
  const startPlayback = useCallback(() => {
    if (!currentSong) return;

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
    // Note: metronome is now handled by Tone.js scheduling in startCountIn
  }, [currentSong, mode, performanceTracker]);

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
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      audioService.stopAllNotes();
    } else {
      // Play
      // Use count-in for challenge mode starting from beginning
      if (mode === 'challenge' && pausedTimeRef.current === 0) {
        startCountIn();
      } else {
        startPlayback();
      }
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

      // Update metronome beat indicator (visual only, sound handled by Tone.js scheduling)
      if (metronomeEnabled) {
        const tempo = currentSong.tempo || 120;
        const beatDuration = 60 / tempo;
        const currentBeat = Math.floor(elapsed / beatDuration) % 4;
        if (currentBeat !== metronomeBeat) {
          setMetronomeBeat(currentBeat);
        }
      }

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
  }, [isPlaying, currentSong, mode, playbackSpeed, onHighlightKeys, performanceTracker, metronomeEnabled, metronomeBeat, playMetronomeClick]);

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
    // Cancel all scheduled Tone.js events
    Tone.getTransport().cancel();
    Tone.Draw.cancel();
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
      {/* Count-in overlay */}
      {countingIn && (
        <div className="count-in-overlay">
          <div className="count-in-display">
            <h2>Get Ready!</h2>
            <div className="count-number">{countInBeats}</div>
            <p>Tempo: {currentSong?.tempo || 120} BPM</p>
          </div>
        </div>
      )}

      {/* Visual metronome indicator */}
      {metronomeEnabled && isPlaying && !countingIn && (
        <div className="metronome-indicator">
          {[0, 1, 2, 3].map((beat) => (
            <div
              key={beat}
              className={`beat-dot ${beat === metronomeBeat ? 'active' : ''} ${beat === 0 ? 'downbeat' : ''}`}
            />
          ))}
        </div>
      )}

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
          {/* Metronome toggle and control buttons - show in challenge and practice modes */}
          {currentSong && (mode === 'challenge' || mode === 'practice') && (
            <div className="control-group mode-in-header metronome-controls">
              <label htmlFor="metronome-toggle">
                <input
                  type="checkbox"
                  id="metronome-toggle"
                  checked={metronomeEnabled}
                  onChange={(e) => setMetronomeEnabled(e.target.checked)}
                />
                🔊 Click Track
              </label>
              {!isPlaying && !countingIn && currentTime === 0 && (
                <button
                  onClick={startCountIn}
                  className="play-icon-btn"
                  title="Start with count-in"
                >
                  ▶
                </button>
              )}
              {isPlaying && (
                <button
                  onClick={resetSong}
                  className="reset-icon-btn"
                  title="Reset"
                >
                  🔄
                </button>
              )}
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
          {[
            { key: 'beginner', label: 'Beginner' },
            { key: 'intermediate', label: 'Intermediate' },
            { key: 'advanced', label: 'Advanced' },
          ].map(({ key, label }) => {
            const group = songs.filter(s => s.unlocked && s.difficulty === key);
            if (group.length === 0) return null;
            return (
              <div key={key} className="difficulty-group">
                <h3 className="difficulty-heading">{label}</h3>
                <div className="songs-grid">
                  {group.map(song => (
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
              </div>
            );
          })}

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
                {/* Controls moved to header next to Click Track */}
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
