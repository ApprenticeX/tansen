import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Props {
  onCut: () => void;
}

/* ─── The full cake (rendered twice for the split effect) using User's SCSS snippet ─── */
function CakeVisual({ blown }: { blown: boolean }) {
  return (
    <>
      <style>{`
        .cake-wrapper {
          position: relative;
          width: 250px;
          height: 200px;
          margin-top: 40px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .css-plate {
          width: 270px;
          height: 110px;
          position: absolute;
          bottom: -10px;
          left: -10px;
          background-color: #f1f5f9;
          border-radius: 50%;
          box-shadow:
              0 2px 0 #cbd5e1,
              0 4px 0 #94a3b8;
        }

        .cake-wrapper > * { position: absolute; }

        .css-layer {
          position: absolute;
          display: block;
          width: 250px;
          height: 100px;
          border-radius: 50%;
          background-color: #e83e8c;
          box-shadow:
              0 2px 0px #b6266c,
              0 4px 0px #b6266c,
              0 6px 0px #b6266c,
              0 8px 0px #b6266c,
              0 10px 0px #b6266c,
              0 12px 0px #b6266c,
              0 14px 0px #b6266c,
              0 16px 0px #b6266c,
              0 18px 0px #b6266c,
              0 20px 0px #b6266c,
              0 22px 0px #b6266c,
              0 24px 0px #b6266c,
              0 26px 0px #b6266c,
              0 28px 0px #b6266c,
              0 30px 0px #b6266c;
        }

        .css-layer-top { top: 0px; }
        .css-layer-middle { top: 33px; }
        .css-layer-bottom { top: 66px; }

        .css-icing {
          top: -2px;
          left: 5px;
          background-color: #FFD1DC;
          width: 240px;
          height: 90px;
          border-radius: 50%;
        }
        .css-icing:before {
          content: "";
          position: absolute;
          top: 4px;
          right: 5px;
          bottom: 6px;
          left: 5px;
          background-color: #ffe4e1;
          box-shadow: 0 0 4px #fff, 0 0 4px #fff, 0 0 4px #fff;
          border-radius: 50%;
          z-index: 1;
        }

        .css-drip {
          display: block;
          position: absolute;
          width: 50px;
          height: 60px;
          border-bottom-left-radius: 25px;
          border-bottom-right-radius: 25px;
          background-color: #FFD1DC;
        }
        .css-drip1 { top: 51px; left: 5px; transform: skewY(15deg); height: 48px; width: 40px; }
        .css-drip2 { top: 67px; left: 181px; transform: skewY(-15deg); }
        .css-drip3 { top: 52px; left: 90px; width: 80px; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }

        .css-candle {
          background-color: #FFB6C1;
          width: 14px;
          height: 45px;
          border-radius: 7px / 3px;
          position: absolute;
          z-index: 10;
          background: repeating-linear-gradient(45deg, #fff, #fff 4px, #ffb6c1 4px, #ffb6c1 8px);
        }
        .css-candle:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 14px;
          height: 6px;
          border-radius: 50%;
          background-color: #fca5a5;
        }

        .css-flame {
          position: absolute;
          background-color: orange;
          width: 15px;
          height: 35px;
          border-radius: 10px 10px 10px 10px / 25px 25px 10px 10px;
          top: -34px;
          left: 50%;
          margin-left: -7.5px;
          z-index: 10;
          box-shadow: 0 0 10px rgba(255,165,0,0.5), 0 0 20px rgba(255,165,0,0.5), 0 0 60px rgba(255,165,0,0.5), 0 0 80px rgba(255,165,0,0.5);
          transform-origin: 50% 90%;
          animation: flicker 1s ease-in-out alternate infinite;
        }

        @keyframes flicker {
          0% { transform: skewX(5deg); box-shadow: 0 0 10px rgba(255,165,0,0.2), 0 0 20px rgba(255,165,0,0.2), 0 0 60px rgba(255,165,0,0.2), 0 0 80px rgba(255,165,0,0.2); }
          25% { transform: skewX(-5deg); box-shadow: 0 0 10px rgba(255,165,0,0.5), 0 0 20px rgba(255,165,0,0.5), 0 0 60px rgba(255,165,0,0.5), 0 0 80px rgba(255,165,0,0.5); }
          50% { transform: skewX(10deg); box-shadow: 0 0 10px rgba(255,165,0,0.3), 0 0 20px rgba(255,165,0,0.3), 0 0 60px rgba(255,165,0,0.3), 0 0 80px rgba(255,165,0,0.3); }
          75% { transform: skewX(-10deg); box-shadow: 0 0 10px rgba(255,165,0,0.4), 0 0 20px rgba(255,165,0,0.4), 0 0 60px rgba(255,165,0,0.4), 0 0 80px rgba(255,165,0,0.4); }
          100% { transform: skewX(5deg); box-shadow: 0 0 10px rgba(255,165,0,0.5), 0 0 20px rgba(255,165,0,0.5), 0 0 60px rgba(255,165,0,0.5), 0 0 80px rgba(255,165,0,0.5); }
        }
      `}</style>
      <div className="cake-wrapper">
          <div className="css-plate"></div>
          <div className="css-layer css-layer-bottom"></div>
          <div className="css-layer css-layer-middle"></div>
          <div className="css-layer css-layer-top"></div>
          <div className="css-icing">
              {/* Custom Text requested by user */}
              <div style={{
                  position: 'relative',
                  zIndex: 5,
                  paddingTop: 24,
                  textAlign: 'center',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.2rem',
                  color: '#a62060',
                  fontWeight: 800,
                  transform: 'rotateX(15deg)', // Aligns with the isometric ellipse top perspective
                  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
                  lineHeight: 1.2
              }}>
                  Happy Birthday<br/>
                  <span style={{ fontSize: '1rem' }}>Sensei.,.</span>
              </div>
          </div>
          <div className="css-drip css-drip1"></div>
          <div className="css-drip css-drip2"></div>
          <div className="css-drip css-drip3"></div>
          
          {/* Main Candle offset slightly to avoid edge */}
          <div className="css-candle" style={{ top: -20, left: 115 }}>
              {!blown && <div className="css-flame"></div>}
          </div>
      </div>
    </>
  );
}

/* ─────────────────────── MAIN EXPORT ─────────────────────── */
export default function Stage3Cake({ onCut }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [candlesBlown, setCandlesBlown] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [cutComplete, setCutComplete] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [knifePos, setKnifePos] = useState<{ x: number; y: number } | null>(null);

  const [swipes, setSwipes] = useState<number>(0);
  const [completedLines, setCompletedLines] = useState<{start: {x:number, y:number}, end: {x:number, y:number}}[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!candlesBlown || cutComplete) return;
    setIsSwiping(true);
    const pos = getPos(e);
    setStartPoint(pos);
    setKnifePos(pos);
  };

  const drawGlowingLine = (ctx: CanvasRenderingContext2D, p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.4, 'rgba(255,200,220,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0.95)');

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,150,200,0.8)';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sx = p1.x + (p2.x - p1.x) * t;
      const sy = p1.y + (p2.y - p1.y) * t;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + (0.3 + Math.random() * 0.5) + ")";
      ctx.fill();
    }
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping || cutComplete || !startPoint || !candlesBlown) return;
    const pos = getPos(e);
    setKnifePos(pos);

    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

      completedLines.forEach(line => {
        drawGlowingLine(ctx, line.start, line.end);
      });

      drawGlowingLine(ctx, startPoint, pos);

      const dist = Math.hypot(pos.x - startPoint.x, pos.y - startPoint.y);
      if (dist > 70) {
        setIsSwiping(false);
        const newLine = { start: startPoint, end: pos };
        setCompletedLines(prev => [...prev, newLine]);
        
        const newSwipes = swipes + 1;
        setSwipes(newSwipes);
        
        if (newSwipes >= 2) {
           finishCut();
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    setKnifePos(null);
    if (!cutComplete) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        completedLines.forEach(line => {
          drawGlowingLine(ctx, line.start, line.end);
        });
      }
    }
  };

  const finishCut = () => {
    setCutComplete(true);
    setIsSwiping(false);
    setKnifePos(null);

    /* Multi-burst confetti */
    const burst = (origin: { x: number; y: number }, colors: string[]) =>
      confetti({ particleCount: 90, spread: 70, origin, colors, startVelocity: 35 });

    burst({ x: 0.3, y: 0.55 }, ['#f9a8d4', '#ec4899', '#fff', '#fde68a']);
    setTimeout(() => burst({ x: 0.7, y: 0.55 }, ['#a78bfa', '#60d394', '#4cc9f0', '#fff']), 200);
    setTimeout(() => burst({ x: 0.5, y: 0.4 }, ['#FFD166', '#FF6B9D', '#fff']), 400);

    setTimeout(onCut, 3500);
  };

  return (
    <motion.div
      className="stage-container"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -120 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ touchAction: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* ─── Heading ─── */}
      <div style={{ minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 32, gap: 14 }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={cutComplete ? 'done' : candlesBlown ? 'slice' : 'blow'}
            className="elegant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            {!candlesBlown
              ? <><span className="emoji">🕯️</span> Touch the flame to blow it out!</>
              : cutComplete
              ? <><span className="emoji">🎂</span> A perfect cut!</>
              : <><span className="emoji">🔪</span> Swipe {2 - swipes} time{2 - swipes === 1 ? '' : 's'} to slice!</>}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* ─── Cake container ─── */}
      <div
        ref={containerRef}
        style={{ position: 'relative', width: 300, height: 300, cursor: (!candlesBlown || cutComplete) ? 'default' : 'crosshair' }}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Flame Absolute Touch Target ── */}
        {!candlesBlown && (
           <div 
             style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 100, height: 100, zIndex: 50, cursor: 'pointer' }}
             onClick={() => setCandlesBlown(true)}
             onTouchStart={() => setCandlesBlown(true)}
           />
        )}
        {/* ── Main Cake Body (expanded slightly to eliminate any anti-aliased seams) ── */}
        <motion.div
          style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 -50%, 100% -50%, 100% 72%, 52% 28%, 52% 150%, 0 150%)', zIndex: 5, pointerEvents: 'none' }}
          animate={cutComplete ? { x: -8, rotate: -3, opacity: 1, y: 5 } : { x: 0, rotate: 0, y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <CakeVisual blown={candlesBlown} />
        </motion.div>

        {/* ── The Wedge (Slice) ── */}
        <motion.div
          style={{ position: 'absolute', inset: 0, clipPath: 'polygon(50% 30%, 150% 70%, 150% 150%, 50% 150%)', zIndex: 6, pointerEvents: 'none' }}
          animate={cutComplete ? { x: 45, rotate: 15, opacity: 1, y: 25 } : { x: 0, rotate: 0, y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <CakeVisual blown={candlesBlown} />
        </motion.div>

        {/* ── Knife cursor indicator ── */}
        <AnimatePresence>
          {knifePos && candlesBlown && !cutComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute',
                left: knifePos.x - 12,
                top: knifePos.y - 24,
                fontSize: '1.6rem',
                zIndex: 30,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
                transform: 'rotate(-45deg)',
              }}
            >
              🔪
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cut flash ── */}
        <AnimatePresence>
          {cutComplete && (
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, transparent 70%)',
                zIndex: 25, pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Canvas (swipe trail) ── */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 0, left: 0, zIndex: 20,
            display: cutComplete ? 'none' : 'block',
            pointerEvents: 'none',
          }}
        />
      </div>
    </motion.div>
  );
}