import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface Props {
  onOpen: () => void;
}

export default function Stage4Present({ onOpen }: Props) {
  const [opened, setOpened] = useState(false);
  const lidControls = useAnimation();

  const handleDragEnd = (event: any, info: any) => {
    if (opened) return;
    
    // If dragged upward significantly, trigger open
    if (info.offset.y < -50) {
      setOpened(true);
      setTimeout(() => {
        onOpen();
      }, 2500);
    } else {
      // Snap back down if not pulled high enough
      lidControls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div 
      className="stage-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="elegant" style={{ opacity: opened ? 0 : 1, transition: '0.5s' }}>
        A gift awaits... <span className="emoji">🎁</span>
      </h1>
      
      <p style={{ opacity: opened ? 0 : 0.6, fontSize: '1rem', transition: '0.4s', marginBottom: '80px' }}>
        Grab the lid and pull up to open!
      </p>

      <div style={{ position: 'relative', width: 220, height: 180, display: 'flex', justifyContent: 'center' }}>
        
        {/* The Box Base */}
        <motion.div 
          animate={opened ? { scale: 1.05, y: 10 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute', bottom: 0, width: '100%', height: 160, 
            background: 'linear-gradient(135deg, rgba(255,182,193,0.9), rgba(216,112,147,0.8))',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 8,
            overflow: 'visible',
            zIndex: 1
          }}
        >
          {/* Internal shadow visible only when open */}
          <div style={{ position: 'absolute', top: -10, left: 10, right: 10, height: 30, background: 'rgba(0,0,0,0.15)', borderRadius: '50%', opacity: opened ? 1 : 0, transition: '1s' }} />

          {/* Vertical Ribbon */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 40, height: '100%', background: 'linear-gradient(to right, #D4AF37, #F3E5AB, #D4AF37)', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} />
          
          {/* Floating sparkles shooting from inside the box when opened */}
          <AnimateSparkles active={opened} />
        </motion.div>

        {/* The Draggable Lid */}
        <motion.div
          drag={opened ? false : "y"}
          dragConstraints={{ top: -200, bottom: 0 }}
          onDragEnd={handleDragEnd}
          animate={opened ? { y: -300, rotate: 25, x: 50, opacity: 0 } : lidControls}
          transition={opened ? { duration: 1.2, ease: "easeOut" } : {}}
          whileHover={{ scale: opened ? 1 : 1.02 }}
          whileTap={{ cursor: 'grabbing', scale: 1.05 }}
          style={{
            position: 'absolute', top: -20, width: 240, height: 70,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,240,245,0.85))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 12px 25px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.5)',
            borderRadius: 6, zIndex: 10, cursor: opened ? 'default' : 'grab',
            touchAction: 'none'
          }}
        >
          {/* Vertical Ribbon on Lid */}
          <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 40, height: '102%', background: 'linear-gradient(to right, #D4AF37, #F3E5AB, #D4AF37)' }} />
          
          {/* Top Bow construction using pure CSS borders */}
          <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 55, height: 55, border: '8px solid #D4AF37', borderRadius: '50% 50% 0 50%', transform: 'rotate(-25deg) translateX(5px)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }} />
            <div style={{ width: 30, height: 30, background: 'radial-gradient(circle, #F3E5AB, #D4AF37)', borderRadius: '50%', zIndex: 5, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
            <div style={{ width: 55, height: 55, border: '8px solid #D4AF37', borderRadius: '50% 50% 50% 0', transform: 'rotate(25deg) translateX(-5px)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }} />
          </div>

          {/* User Hint tag attached to bow */}
          <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ position: 'absolute', top: -85, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: 20, color: '#D4AF37', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 4px 10px rgba(0,0,0,0.15)', pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            ↑ Lift Lid
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  );
}

function AnimateSparkles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1.5, 0],
            x: (Math.random() - 0.5) * 300,
            y: -150 - Math.random() * 250
          }}
          transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '30%', left: '50%',
            width: '12px', height: '12px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 15px 4px #d4af37'
          }}
        />
      ))}
    </>
  );
}
