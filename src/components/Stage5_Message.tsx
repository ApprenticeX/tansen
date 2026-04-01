import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onContinue: () => void;
}

export default function Stage5Message({ onContinue }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [fastMode, setFastMode] = useState(false);
  const [showButton, setShowButton] = useState(false);
  // The parchment overlay fades out, completing the illusion of unfolding from the gift
  const [parchmentVisible, setParchmentVisible] = useState(true);

  // Fetch message text
  useEffect(() => {
    fetch('/message.txt')
      .then(res => res.text())
      .then(text => setLines(text.split('\n')))
      .catch(console.error);
  }, []);

  // Snowflakes init
  useEffect(() => {
    const container = document.getElementById('snow-container');
    if (container) {
      container.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const span = document.createElement('span');
        span.className = 'snowflake';
        span.innerText = '❄️';
        span.style.left = `${Math.random() * 100}vw`;
        span.style.animationDelay = `${Math.random() * 5}s`;
        span.style.animationDuration = `${5 + Math.random() * 5}s`;
        span.style.opacity = `${0.3 + Math.random() * 0.7}`;
        span.style.fontSize = `${0.5 + Math.random() * 0.8}rem`;
        container.appendChild(span);
      }
    }

    // Fade the parchment overlay out after a short beat
    const t = setTimeout(() => setParchmentVisible(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Progressive text reveal — delayed slightly to let parchment fade first
  useEffect(() => {
    if (lines.length === 0) return;
    if (visibleCount < lines.length) {
      const ms = fastMode ? 80 : 1200;
      const t = setTimeout(() => setVisibleCount(prev => prev + 1), ms);
      return () => clearTimeout(t);
    } else {
      setTimeout(() => setShowButton(true), 500);
    }
  }, [visibleCount, lines, fastMode]);

  return (
    <motion.div
      className="stage-container"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 1.5 }}
      style={{ overflowY: 'auto', justifyContent: 'flex-start', paddingTop: '15vh', alignItems: 'flex-start' }}
    >
      <div id="snow-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Parchment overlay — the 'unfolded letter' illusion ── */}
      <AnimatePresence>
        {parchmentVisible && (
          <motion.div
            key="parchment-cover"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(160deg, #1a2744 0%, #0f1b33 60%, #0a1128 100%)',
              zIndex: 9985,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Message content */}
      <div
        onClick={() => setFastMode(true)}
        style={{ position: 'relative', zIndex: 10, maxWidth: '500px', margin: '0 auto', width: '100%', paddingBottom: '100px', cursor: 'pointer' }}
      >
        {lines.slice(0, visibleCount).map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              minHeight: line.trim() === '' ? '20px' : 'auto',
              fontSize: '1.2rem',
              lineHeight: '1.8',
              textAlign: 'left',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {line}
          </motion.div>
        ))}

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              style={{ marginTop: '40px', textAlign: 'center' }}
            >
              <button
                className="primary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onContinue();
                }}
              >
                Continue →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
