import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import AudioPlayer from './components/AudioPlayer';
import Stage1Age from './components/Stage1_Age';
import Stage2Greeting from './components/Stage2_Greeting';
import Stage3Cake from './components/Stage3_Cake';
import Stage4Present from './components/Stage4_Present';
import Stage5Message from './components/Stage5_Message';
import Stage6Gallery from './components/Stage6_Gallery';

function App() {
  const [stage, setStage] = useState(1);
  const [maxStageReached, setMaxStageReached] = useState(1);
  const [age, setAge] = useState(26);
  const advancingFromRef = useRef<number | null>(null);

  useEffect(() => {
    if (stage === 5 || stage === 6) {
      document.body.classList.add('theme-winter');
    } else {
      document.body.classList.remove('theme-winter');
    }
    
    if (stage > maxStageReached) {
      setMaxStageReached(stage);
    }
  }, [stage, maxStageReached]);

  const advanceStage = useCallback(() => {
    setStage(current => {
      // Guard: only allow advancing exactly +1, and block duplicate calls from the same stage
      if (advancingFromRef.current === current) return current; // already advancing from this stage
      advancingFromRef.current = current;
      const next = Math.min(current + 1, 6);
      if (next > maxStageReached) setMaxStageReached(next);
      // Reset the guard after the transition settles
      setTimeout(() => { advancingFromRef.current = null; }, 500);
      return next;
    });
  }, [maxStageReached]);

  const jumpToStage = (targetStage: number) => {
    if (targetStage <= maxStageReached) {
      setStage(targetStage);
    }
  };

  return (
    <>
      <AudioPlayer />
      
      {/* Navigation Top Bar */}
      <div style={{ 
        position: 'fixed', 
        top: 30, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 900, 
        display: 'flex', 
        gap: '8px' 
      }}>
         {[1,2,3,4,5,6].map(s => (
           <div 
             key={s} 
             onClick={() => jumpToStage(s)}
             style={{
               width: '10px', 
               height: '10px', 
               borderRadius: '50%',
               backgroundColor: stage === s ? ((stage === 5 || stage === 6) ? '#fff' : 'var(--pink-main)') : 'rgba(100,100,100,0.3)',
               cursor: s <= maxStageReached ? 'pointer' : 'default',
               transition: 'background-color 0.3s'
             }}
           />
         ))}
      </div>

      <AnimatePresence mode="wait">
        {stage === 1 && <Stage1Age key="stage1" onConfirm={(a) => { setAge(a); advanceStage(); }} />}
        {stage === 2 && <Stage2Greeting key="stage2" age={age} onNext={advanceStage} />}
        {stage === 3 && <Stage3Cake key="stage3" onCut={advanceStage} />}
        {stage === 4 && <Stage4Present key="stage4" onOpen={advanceStage} />}
        {stage === 5 && <Stage5Message key="stage5" onContinue={advanceStage} />}
        {stage === 6 && <Stage6Gallery key="stage6" />}
      </AnimatePresence>
      <Analytics />
    </>
  );
}

export default App;
