import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  age: number;
  onNext: () => void;
}

export default function Stage2Greeting({ age, onNext }: Props) {
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate random falling petals/sparkles that run infinitely until the button is clicked
    const newPetals = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 5
    }));
    setPetals(newPetals);
  }, []);

  return (
    <motion.div 
      className="stage-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1 }}
    >
      {/* Background Petals */}
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="sparkle"
          initial={{ top: '-10%', left: `${p.left}%`, opacity: 0 }}
          animate={{ top: '110%', opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          style={{
            width: '14px',
            height: '14px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255, 182, 193, 0.7))',
            borderRadius: '50% 0 50% 50%',
            filter: 'drop-shadow(0 4px 6px rgba(255,182,193,0.5))',
            boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.8)' // Gives it a slight 3D petal shape
          }}
        />
      ))}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.h1 
          className="elegant"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          style={{ fontSize: '3rem', lineHeight: 1.2 }}
        >
          Happy <span style={{ color: 'var(--pink-main)', textShadow: '0 2px 10px rgba(255, 182, 193, 0.6)' }}>{age}th</span> Birthday,<br/>Sensei 🌸
        </motion.h1>
      </div>
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          style={{ paddingBottom: '40px' }}
        >
          <button className="primary-btn" onClick={onNext}>
            Continue →
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
