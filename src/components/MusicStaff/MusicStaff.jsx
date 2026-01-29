import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { convertMidiToMusicXML, convertSongToMusicXML } from '../../services/midiToMusicXML';
import './MusicStaff.css';

/**
 * MusicStaff Component
 * Displays professional music notation using OpenSheetMusicDisplay with MuseScore conversion
 */
function MusicStaff({ song, midiFileData }) {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!song || !containerRef.current) return;

    let mounted = true;

    const renderMusicScore = async () => {
      setIsLoading(true);
      setError(null);

      // Clear previous content
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        let musicXmlString = null;

        // If we have MIDI file data, convert it to MusicXML
        if (midiFileData) {
          console.log('Converting uploaded MIDI file to MusicXML...');
          const songTitle = song?.name || song?.title || 'Uploaded MIDI';
          musicXmlString = await convertMidiToMusicXML(midiFileData, songTitle);
        } else if (song && song.notes) {
          // Convert built-in song to MIDI, then to MusicXML
          console.log('Converting built-in song to MusicXML...');
          musicXmlString = await convertSongToMusicXML(song);
        }

        if (!musicXmlString) {
          // No music data available
          if (mounted && containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="padding: 20px; text-align: center; color: #666;">
                <p>📝 No music notation available.</p>
              </div>
            `;
          }
          setIsLoading(false);
          return;
        }

        // Create OSMD instance
        if (!mounted) return;

        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backend: 'svg',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: true, // Enable credits to show the centered title
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawingParameters: 'compacttight', // More compact layout
        });

        osmdRef.current = osmd;

        // Load and render the MusicXML
        console.log('Loading MusicXML into OpenSheetMusicDisplay...');
        await osmd.load(musicXmlString);

        if (!mounted) return;

        console.log('Rendering music notation...');
        osmd.render();

        console.log('Music notation rendered successfully');
      } catch (err) {
        console.error('Error rendering music staff:', err);
        console.error('Error details:', err.message, err.stack);

        if (mounted) {
          setError(err.message);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="padding: 20px; color: #f44336; text-align: center;">
                <p>Unable to render music notation</p>
                <small style="display: block; margin-top: 10px; color: #999;">
                  ${err.message}
                </small>
                <small style="display: block; margin-top: 5px; color: #999;">
                  This may occur with complex or non-standard MIDI files.
                </small>
              </div>
            `;
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    renderMusicScore();

    // Cleanup
    return () => {
      mounted = false;
      if (osmdRef.current) {
        osmdRef.current = null;
      }
    };
  }, [song, midiFileData]);

  if (!song) {
    return null;
  }

  return (
    <div className="music-staff-container">
      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>⏳ Loading music notation...</p>
        </div>
      )}
      <div
        ref={containerRef}
        id="music-staff"
        className="music-staff"
        style={{ display: isLoading ? 'none' : 'block' }}
      ></div>
      {!isLoading && !error && song.notes && (
        <div className="staff-info">
          <p>📝 Musical Notation ({song.notes.length} notes, Tempo: {song.tempo || 120} BPM)</p>
        </div>
      )}
    </div>
  );
}

export default MusicStaff;
