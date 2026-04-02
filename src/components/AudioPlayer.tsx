import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Array of your lofi music files in public/music/
  const playlist = [
    "/music/lofi1.m4a",
    "/music/lofi2.m4a",
    "/music/lofi3.m4a"
  ];
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    // Hide tooltip naturally after a few seconds
    const t = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const toggleAudio = () => {
    setShowTooltip(false); // Hide immediately if pressed
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
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px' }}>
      <AnimatePresence>
        {!isPlaying && showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, y: [0, -3, 0] }}
            transition={{ opacity: { duration: 0.4 }, y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(5px)',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#333',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              pointerEvents: 'none',
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: 'nowrap'
            }}
          >
            Press to play music ♫
          </motion.div>
        )}
      </AnimatePresence>

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
