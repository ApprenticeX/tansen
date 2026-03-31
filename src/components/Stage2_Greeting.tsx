import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  age: number;
  onNext: () => void;
}

export default function Stage2Greeting({ age, onNext }: Props) {
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate random falling petals/sparkles
    const newPetals = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4
    }));
    setPetals(newPetals);

    // Auto advance after 4 seconds (or user can tap)
    const t = setTimeout(() => {
      onNext();
    }, 4500);

    return () => clearTimeout(t);
  }, [onNext]);

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
            width: '12px',
            height: '12px',
            background: 'rgba(255, 182, 193, 0.6)', // petal color
            borderRadius: '50% 0 50% 50%',
            filter: 'drop-shadow(0 0 4px rgba(255,182,193,0.8))'
          }}
        />
      ))}

      <motion.h1 
        className="elegant"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Happy {age}th Birthday,<br/>Sensei 🌸🌸
      </motion.h1>
      
    </motion.div>
  );
}
