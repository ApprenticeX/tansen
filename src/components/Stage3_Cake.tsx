import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Props {
  onCut: () => void;
}

export default function Stage3Cake({ onCut }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isSwiping, setIsSwiping] = useState(false);
  const [cutComplete, setCutComplete] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    // Resize observer to ensure the canvas overlays perfectly
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (cutComplete) return;
    setIsSwiping(true);
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setStartPoint({ x, y });
    
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping || cutComplete || !startPoint) return;
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Stop page scrolling
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      // Redraw line
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Check distance - if long enough, trigger cut
      const dist = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
      if (dist > 150) { // arbitrary threshold roughly a swiping motion
        finishCut();
      }
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (!cutComplete) {
      // Clear line if they let go too early
      const ctx = canvasRef.current!.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
  };

  const finishCut = () => {
    setCutComplete(true);
    setIsSwiping(false);
    
    // Confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffb6c1', '#d4af37', '#fff']
    });

    // Advance after delay
    setTimeout(() => {
      onCut();
    }, 3000);
  };

  return (
    <motion.div 
      className="stage-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6 }}
      style={{ touchAction: 'none' }}
    >
      <h1 className="elegant" style={{ marginBottom: '40px' }}>
        {cutComplete ? 'A perfect cut! 🎂' : 'Make a wish, then slice the cake!'}
      </h1>

      <div 
        ref={containerRef}
        style={{ position: 'relative', width: '300px', height: '300px' }}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* We emulate the cut by having two halves of the image */}
        <motion.div
          style={{
            position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', overflow: 'hidden',
          }}
          animate={cutComplete ? { x: -20, rotate: -5, opacity: 0 } : { x: 0 }}
          transition={{ duration: 1.5 }}
        >
          <img src="/cake.png" style={{ height: '100%', width: '300px', objectFit: 'cover' }} alt="Cake Left" draggable={false} />
        </motion.div>

        <motion.div
          style={{
            position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', overflow: 'hidden',
          }}
          animate={cutComplete ? { x: 20, rotate: 5, opacity: 0 } : { x: 0 }}
          transition={{ duration: 1.5 }}
        >
          <img src="/cake.png" style={{ height: '100%', width: '300px', objectFit: 'cover', transform: 'translateX(-50%)' }} alt="Cake Right" draggable={false} />
        </motion.div>

        {/* Canvas for swipe line overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none',
            display: cutComplete ? 'none' : 'block'
          }}
        />
      </div>
    </motion.div>
  );
}
