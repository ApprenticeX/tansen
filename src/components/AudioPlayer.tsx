import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Array of your lofi music files in public/music/
  const playlist = [
    "/music/lofi1.m4a",
    "/music/lofi2.m4a",
    "/music/lofi3.m4a"
  ];
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
      {/* 
        The top wrapper adds fixed layout.
        The onEnded fires when a track finishes naturally, advancing to next song. 
      */}
      <audio 
        ref={audioRef} 
        src={playlist[currentTrackIndex]} 
        onEnded={handleEnded}
      />
      <button 
        onClick={toggleAudio}
        style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-main)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}
        aria-label={isPlaying ? "Mute music" : "Play music"}
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  );
}
