import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface Props {
  onOpen: () => void;
}

export default function Stage4Present({ onOpen }: Props) {
  const [opened, setOpened] = useState(false);
  const ribbonControls = useAnimation();

  const handleDragEnd = (event: any, info: any) => {
    if (opened) return;
    
    // If dragged downward significantly, trigger open
    if (info.offset.y > 60) {
      setOpened(true);
      setTimeout(() => {
        onOpen();
      }, 2000);
    } else {
      // Snap back if not pulled enough
      ribbonControls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
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
        Are you ready for your present? 🎁
      </h1>

      <div style={{ position: 'relative', marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        <motion.div
          animate={opened ? { y: -100, opacity: 0, rotate: 15 } : { y: [0, -10, 0] }}
          transition={opened ? { duration: 0.8 } : { duration: 2, repeat: Infinity }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <img 
            src="/giftbox.png" 
            alt="Present" 
            style={{ width: '280px', filter: 'drop-shadow(0px 10px 15px rgba(212, 175, 55, 0.4))' }} 
            draggable={false}
          />
        </motion.div>

        {/* The Pullable Ribbon */}
        {!opened && (
          <div style={{ 
            position: 'absolute', 
            bottom: '15%', 
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }} // Free drag tracking
              onDragEnd={handleDragEnd}
              animate={ribbonControls}
              whileTap={{ cursor: 'grabbing' }}
              style={{
                width: '40px',
                height: '90px',
                cursor: 'grab',
                touchAction: 'none', // Crucial for mobile dragging
                position: 'relative'
              }}
            >
              {/* SVG Ribbon piece for crisp UI and drop-shadow support */}
              <svg width="40" height="90" viewBox="0 0 40 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))'}}>
                <path d="M0 0H40V90L20 70L0 90V0Z" fill="url(#paint0_linear)"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="20" y1="0" x2="20" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F5D061"/>
                    <stop offset="1" stopColor="#B8860B"/>
                  </linearGradient>
                </defs>
              </svg>

              <motion.span 
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ 
                  position: 'absolute', 
                  top: '25px', 
                  left: '14px', 
                  color: 'white', 
                  fontSize: '1.2rem', 
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  pointerEvents: 'none' // Let the touch pass through to the draggable div
                }}
              >
                ↓
              </motion.span>
            </motion.div>
          </div>
        )}

        {/* Floating sparkles behind lid when opened */}
        <AnimateSparkles active={opened} />
      </div>

      <p style={{ marginTop: '30px', opacity: 0.6, fontSize: '1rem', transition: 'opacity 0.5s' }}>
        {!opened ? 'Pull the ribbon to open!' : 'A beautiful surprise...'}
      </p>
    </motion.div>
  );
}

function AnimateSparkles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1.5, 0],
            x: (Math.random() - 0.5) * 200,
            y: -150 - Math.random() * 150
          }}
          transition={{ duration: 1 + Math.random(), ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '10px', height: '10px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 12px 3px #d4af37'
          }}
        />
      ))}
    </>
  );
}
