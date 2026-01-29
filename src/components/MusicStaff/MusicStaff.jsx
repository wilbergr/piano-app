import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, BarlineType, StaveConnector } from 'vexflow';
import { convertMidiToVexFlow, createStaveNote } from '../../services/midiToVexFlow';
import './MusicStaff.css';

/**
 * MusicStaff Component
 * Displays musical notation using VexFlow with proper MIDI conversion
 */
function MusicStaff({ song }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!song || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    try {
      // Convert MIDI data to VexFlow format
      const { trebleMeasures, bassMeasures, timeSignature } = convertMidiToVexFlow(song);

      if (trebleMeasures.length === 0 && bassMeasures.length === 0) {
        containerRef.current.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa;">No notes to display</div>';
        return;
      }

      // Configuration - make it fill the container width
      // Use clientWidth which excludes padding and borders
      const containerWidth = containerRef.current.clientWidth;
      const leftMargin = 10;
      const rightMargin = 10;
      const availableWidth = containerWidth - leftMargin - rightMargin;

      const measuresPerLine = 4;
      const measureWidth = availableWidth / measuresPerLine;
      const staveWidth = availableWidth;
      const trebleStaveHeight = 120;
      const bassStaveHeight = 120;
      const grandStaffHeight = trebleStaveHeight + bassStaveHeight + 20; // Space between staves
      const beatsPerMeasure = timeSignature[0];

      // Calculate number of lines needed
      const numMeasures = Math.max(trebleMeasures.length, bassMeasures.length);
      const numLines = Math.ceil(numMeasures / measuresPerLine);
      const totalHeight = numLines * grandStaffHeight + 40;

      // Create an SVG renderer
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      // Use available width + margins for the total SVG width to fill the container
      renderer.resize(availableWidth + leftMargin + rightMargin, totalHeight);
      const context = renderer.getContext();

      let measureIndex = 0;

      // Render each line with grand staff (treble + bass)
      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        const yPositionTreble = lineIndex * grandStaffHeight + 40;
        const yPositionBass = yPositionTreble + trebleStaveHeight + 20;
        const measuresInLine = Math.min(measuresPerLine, numMeasures - measureIndex);

        // Create staves for each measure in this line
        for (let m = 0; m < measuresInLine; m++) {
          const xPosition = leftMargin + m * measureWidth;
          const trebleMeasureData = trebleMeasures[measureIndex];
          const bassMeasureData = bassMeasures[measureIndex];

          // Create treble staff
          const trebleStave = new Stave(xPosition, yPositionTreble, measureWidth);

          // Add clef and time signature to first measure only
          if (measureIndex === 0) {
            trebleStave.addClef('treble');
            trebleStave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
          }

          // Add end bar to last measure
          if (measureIndex === numMeasures - 1) {
            trebleStave.setEndBarType(BarlineType.END);
          }

          trebleStave.setContext(context).draw();

          // Create bass staff
          const bassStave = new Stave(xPosition, yPositionBass, measureWidth);

          // Add clef and time signature to first measure only
          if (measureIndex === 0) {
            bassStave.addClef('bass');
            bassStave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
          }

          // Add end bar to last measure
          if (measureIndex === numMeasures - 1) {
            bassStave.setEndBarType(BarlineType.END);
          }

          bassStave.setContext(context).draw();

          // Add brace connecting treble and bass staves (only on first measure of each line)
          if (m === 0) {
            const connector = new StaveConnector(trebleStave, bassStave);
            connector.setType(StaveConnector.type.BRACE);
            connector.setContext(context).draw();
          }

          // Add bar line connector for all measures
          const lineConnector = new StaveConnector(trebleStave, bassStave);
          lineConnector.setType(StaveConnector.type.SINGLE_LEFT);
          lineConnector.setContext(context).draw();

          // Render treble clef notes
          const trebleNotes = trebleMeasureData.map(noteData =>
            createStaveNote(noteData, StaveNote, Accidental)
          );

          if (trebleNotes.length > 0) {
            const trebleVoice = new Voice({ num_beats: beatsPerMeasure, beat_value: timeSignature[1] });
            trebleVoice.setStrict(false);
            trebleVoice.addTickables(trebleNotes);
            new Formatter().joinVoices([trebleVoice]).format([trebleVoice], measureWidth - 20);
            trebleVoice.draw(context, trebleStave);
          }

          // Render bass clef notes
          const bassNotes = bassMeasureData.map(noteData =>
            createStaveNote(noteData, StaveNote, Accidental)
          );

          if (bassNotes.length > 0) {
            const bassVoice = new Voice({ num_beats: beatsPerMeasure, beat_value: timeSignature[1] });
            bassVoice.setStrict(false);
            bassVoice.addTickables(bassNotes);
            new Formatter().joinVoices([bassVoice]).format([bassVoice], measureWidth - 20);
            bassVoice.draw(context, bassStave);
          }

          measureIndex++;
        }
      }

    } catch (error) {
      console.error('Error rendering music staff:', error);
      console.error('Error details:', error.message, error.stack);
      // Show error message in the container
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="padding: 20px; color: #f44336; text-align: center;">Unable to render music notation<br/><small>${error.message}</small></div>`;
      }
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [song]);

  if (!song) {
    return null;
  }

  return (
    <div className="music-staff-container">
      <div
        ref={containerRef}
        id="music-staff"
        className="music-staff"
      ></div>
      <div className="staff-info">
        <p>📝 Musical Notation ({song.notes.length} notes, Tempo: {song.tempo || 120} BPM)</p>
      </div>
    </div>
  );
}

export default MusicStaff;
