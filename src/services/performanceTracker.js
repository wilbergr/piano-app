/**
 * Performance Tracker Service
 * Tracks user performance during practice and challenge modes
 */

/**
 * Timing windows for scoring (in milliseconds)
 * Made more forgiving for better user experience
 */
export const TIMING_WINDOWS = {
  PERFECT: 400,   // ±400ms = 100%
  GOOD: 600,      // ±600ms = 80%
  // >600ms = late (40%)
};

/**
 * Performance tracker class
 */
export class PerformanceTracker {
  constructor(song) {
    this.song = song;
    this.notes = [...song.notes]; // Copy of all notes in the song
    this.currentNoteIndex = 0;
    this.results = {
      perfect: 0,
      good: 0,
      missed: 0,
      wrong: 0,
      totalNotes: song.notes.length,
      noteResults: [], // Individual note results
      startTime: null,
      endTime: null,
    };
  }

  /**
   * Start tracking
   */
  start() {
    this.results.startTime = Date.now();
  }

  /**
   * Get the current note that should be played
   * @returns {Object|null} Current note or null if finished
   */
  getCurrentNote() {
    if (this.currentNoteIndex >= this.notes.length) {
      return null;
    }
    return this.notes[this.currentNoteIndex];
  }

  /**
   * Get the next few notes for preview
   * @param {number} count - Number of notes to preview
   * @returns {Array} Array of upcoming notes
   */
  getUpcomingNotes(count = 3) {
    const upcoming = [];
    for (let i = 1; i <= count; i++) {
      const index = this.currentNoteIndex + i;
      if (index < this.notes.length) {
        upcoming.push(this.notes[index]);
      }
    }
    return upcoming;
  }

  /**
   * Check if the played note is correct
   * @param {string} playedNote - Note that was played (e.g., 'C4')
   * @param {number} playedTime - Time when the note was played (in seconds from song start)
   * @returns {Object} Result object with score and timing info
   */
  checkNote(playedNote, playedTime) {
    const currentNote = this.getCurrentNote();

    if (!currentNote) {
      // Song is finished, this is an extra note
      return {
        correct: false,
        score: 0,
        rating: 'extra',
        message: 'Song already finished',
      };
    }

    // Check if correct note
    if (playedNote !== currentNote.note) {
      this.results.wrong++;
      return {
        correct: false,
        score: 0,
        rating: 'wrong',
        message: `Wrong note! Expected ${currentNote.note}`,
        expectedNote: currentNote.note,
      };
    }

    // Calculate timing difference (in milliseconds)
    const expectedTime = currentNote.time;
    const timingDiff = Math.abs((playedTime - expectedTime) * 1000);

    let rating;
    let score;

    if (timingDiff <= TIMING_WINDOWS.PERFECT) {
      rating = 'perfect';
      score = 100;
      this.results.perfect++;
    } else if (timingDiff <= TIMING_WINDOWS.GOOD) {
      rating = 'good';
      score = 80;
      this.results.good++;
    } else {
      rating = 'late';
      score = 40;
      this.results.missed++;
    }

    // Store individual note result
    this.results.noteResults.push({
      note: currentNote.note,
      expectedTime,
      actualTime: playedTime,
      timingDiff,
      rating,
      score,
    });

    // Move to next note
    this.currentNoteIndex++;

    // Check if song is complete
    if (this.currentNoteIndex >= this.notes.length) {
      this.finish();
    }

    return {
      correct: true,
      score,
      rating,
      timingDiff,
      message: this.getRatingMessage(rating, timingDiff),
    };
  }

  /**
   * Mark current note as missed (timeout)
   */
  missNote() {
    const currentNote = this.getCurrentNote();
    if (!currentNote) return;

    this.results.missed++;
    this.results.noteResults.push({
      note: currentNote.note,
      expectedTime: currentNote.time,
      actualTime: null,
      timingDiff: null,
      rating: 'missed',
      score: 0,
    });

    this.currentNoteIndex++;

    if (this.currentNoteIndex >= this.notes.length) {
      this.finish();
    }
  }

  /**
   * Get a message for the rating
   * @param {string} rating - Rating (perfect, good, ok, late)
   * @param {number} timingDiff - Timing difference in ms
   * @returns {string} Message
   */
  getRatingMessage(rating, timingDiff) {
    switch (rating) {
      case 'perfect':
        return '🌟 Perfect!';
      case 'good':
        return '👍 Good!';
      case 'late':
        return `⏰ Late (${Math.round(timingDiff)}ms)`;
      default:
        return '';
    }
  }

  /**
   * Finish tracking and calculate final stats
   */
  finish() {
    this.results.endTime = Date.now();
    this.results.duration = (this.results.endTime - this.results.startTime) / 1000;
  }

  /**
   * Calculate overall accuracy percentage
   * @returns {number} Accuracy percentage (0-100)
   */
  getAccuracy() {
    const totalScore = this.results.noteResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = this.results.totalNotes * 100;
    return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  }

  /**
   * Check if the user passed (90% or higher)
   * @returns {boolean} True if passed
   */
  hasPassed() {
    return this.getAccuracy() >= 90;
  }

  /**
   * Get completion percentage
   * @returns {number} Percentage of notes completed (0-100)
   */
  getCompletionPercentage() {
    return (this.currentNoteIndex / this.results.totalNotes) * 100;
  }

  /**
   * Get detailed results
   * @returns {Object} Full results object
   */
  getResults() {
    return {
      ...this.results,
      accuracy: this.getAccuracy(),
      passed: this.hasPassed(),
      completion: this.getCompletionPercentage(),
    };
  }

  /**
   * Reset the tracker
   */
  reset() {
    this.currentNoteIndex = 0;
    this.results = {
      perfect: 0,
      good: 0,
      missed: 0,
      wrong: 0,
      totalNotes: this.song.notes.length,
      noteResults: [],
      startTime: null,
      endTime: null,
    };
  }
}

export default PerformanceTracker;
