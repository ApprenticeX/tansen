import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

interface Props {
  onOpen: () => void;
}

type LetterPhase = 'hidden' | 'rising' | 'expanding';

export default function Stage4Present({ onOpen }: Props) {
  const [opened, setOpened] = useState(false);
  const [letterPhase, setLetterPhase] = useState<LetterPhase>('hidden');
  const lidControls = useAnimation();

  const handleDragEnd = (_event: unknown, info: { offset: { y: number } }) => {
    if (opened) return;
    if (info.offset.y < -50) {
      setOpened(true);
    } else {
      lidControls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  useEffect(() => {
    if (!opened) return;
    // Lid flies off ~800ms → letter rises → ~900ms later letter expands → call onOpen
    const t1 = setTimeout(() => setLetterPhase('rising'), 900);
    const t2 = setTimeout(() => setLetterPhase('expanding'), 1900);
    const t3 = setTimeout(() => {
      // ── Persistent DOM cover to perfectly bridge the unmount/mount gap ──
      const cover = document.createElement('div');
      cover.id = 'transition-cover';
      cover.style.position = 'fixed';
      cover.style.inset = '0';
      cover.style.background = 'linear-gradient(160deg, #1a2744 0%, #0f1b33 60%, #0a1128 100%)';
      cover.style.zIndex = '99999';
      document.body.appendChild(cover);
      onOpen();
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <motion.div
      className="stage-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      transition={{ duration: 0.5 }}
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
            zIndex: 1,
          }}
        >
          {/* Internal shadow */}
          <div style={{ position: 'absolute', top: -10, left: 10, right: 10, height: 30, background: 'rgba(0,0,0,0.15)', borderRadius: '50%', opacity: opened ? 1 : 0, transition: '1s' }} />
          {/* Vertical Ribbon */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 40, height: '100%', background: 'linear-gradient(to right, #D4AF37, #F3E5AB, #D4AF37)', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} />
          {/* Floating sparkles */}
          <AnimateSparkles active={opened} />
        </motion.div>

        {/* The Draggable Lid */}
        <motion.div
          drag={opened ? false : "y"}
          dragConstraints={{ top: -200, bottom: 0 }}
          onDragEnd={handleDragEnd}
          animate={opened ? { y: -320, rotate: 28, x: 60, opacity: 0 } : lidControls}
          transition={opened ? { duration: 1.1, ease: "easeOut" } : {}}
          whileHover={{ scale: opened ? 1 : 1.02 }}
          whileTap={{ cursor: 'grabbing', scale: 1.05 }}
          style={{
            position: 'absolute', top: -20, width: 240, height: 70,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,240,245,0.85))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 12px 25px rgba(0,0,0,0.2), inset 0 2px 5px rgba(255,255,255,0.5)',
            borderRadius: 6, zIndex: 10, cursor: opened ? 'default' : 'grab',
            touchAction: 'none',
          }}
        >
          {/* Ribbon on Lid */}
          <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 40, height: '102%', background: 'linear-gradient(to right, #D4AF37, #F3E5AB, #D4AF37)' }} />
          {/* Bow */}
          <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 55, height: 55, border: '8px solid #D4AF37', borderRadius: '50% 50% 0 50%', transform: 'rotate(-25deg) translateX(5px)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }} />
            <div style={{ width: 30, height: 30, background: 'radial-gradient(circle, #F3E5AB, #D4AF37)', borderRadius: '50%', zIndex: 5, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
            <div style={{ width: 55, height: 55, border: '8px solid #D4AF37', borderRadius: '50% 50% 50% 0', transform: 'rotate(25deg) translateX(-5px)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }} />
          </div>
          {/* Hint */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ position: 'absolute', top: -85, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: 20, color: '#D4AF37', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 4px 10px rgba(0,0,0,0.15)', pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            ↑ Lift Lid
          </motion.div>
        </motion.div>
      </div>

      {/* ── Letter rising from box ── */}
      <AnimatePresence>
        {letterPhase !== 'hidden' && (
          <motion.div
            key="letter-reveal"
            style={{
              position: 'fixed',
              width: 82,
              height: 108,
              left: '50%',
              top: '50%',
              marginLeft: -41,
              marginTop: -54,
              background: 'linear-gradient(160deg, #1a2744 0%, #0f1b33 60%, #0a1128 100%)',
              borderRadius: 10,
              zIndex: 9990,
              transformOrigin: 'center center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
            initial={{ scale: 0, y: 120, opacity: 0, rotate: -5 }}
            animate={
              letterPhase === 'expanding'
                ? { scale: 1.5, y: -110, opacity: 0, rotate: 0 } // Letter fades into the background overlay
                : { scale: 1, y: -110, opacity: 1, rotate: 0 }
            }
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Fold lines on letter */}
            <div style={{ position: 'absolute', top: '34%', left: '8%', right: '8%', height: '1px', background: 'rgba(100,140,200,0.2)' }} />
            <div style={{ position: 'absolute', top: '58%', left: '8%', right: '8%', height: '1px', background: 'rgba(100,140,200,0.2)' }} />
            {/* Wax seal */}
            <div style={{
              width: 26, height: 26,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #5a7fbf, #3a5a9a)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
            }}>
              ❄
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── Fullscreen Overlay (Avoids 40x Scale GPU glitch) ── */}
      <AnimatePresence>
        {letterPhase === 'expanding' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(160deg, #1a2744 0%, #0f1b33 60%, #0a1128 100%)',
              zIndex: 9980,
            }}
          />
        )}
      </AnimatePresence>
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
            y: -150 - Math.random() * 250,
          }}
          transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '30%', left: '50%',
            width: '12px', height: '12px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 15px 4px #d4af37',
          }}
        />
      ))}
    </>
  );
}
