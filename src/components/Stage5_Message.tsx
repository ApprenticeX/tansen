import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onContinue: () => void;
}

export default function Stage5Message({ onContinue }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

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

    // Smoothly fade out the persistent transition cover (if it exists)
    const cover = document.getElementById('transition-cover');
    if (cover) {
      const anim = cover.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 900,
        easing: 'ease-in-out',
        fill: 'forwards'
      });
      anim.onfinish = () => cover.remove();
    }
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    if (visibleCount < lines.length) {
      const t = setTimeout(() => setVisibleCount(prev => prev + 1), 1200);
      return () => clearTimeout(t);
    } else {
      setTimeout(() => setShowButton(true), 500);
    }
  }, [visibleCount, lines]);

  const handleSkip = () => {
    if (visibleCount < lines.length) {
      setVisibleCount(lines.length);
      setShowButton(true);
    }
  };

  return (
    <motion.div
      className="stage-container"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 1.5 }}
      style={{ overflowY: 'auto', justifyContent: 'flex-start', paddingTop: '15vh', alignItems: 'flex-start', cursor: 'pointer' }}
      onClick={handleSkip}
      onTouchStart={handleSkip}
    >
      <div id="snow-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Message content */}
      <div
        style={{ position: 'relative', zIndex: 10, maxWidth: '500px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}
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
