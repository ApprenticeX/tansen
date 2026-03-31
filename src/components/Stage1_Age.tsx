import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onConfirm: (age: number) => void;
}

export default function Stage1Age({ onConfirm }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const currentYear = new Date().getFullYear(); // usually 2025 as per prompt

  const handleYes = () => {
    onConfirm(currentYear - 1999);
  };

  const handleDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value);
    if (!isNaN(y)) {
      onConfirm(currentYear - y);
    }
  };

  return (
    <motion.div 
      className="stage-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="elegant">Born in 1999?</h1>
      
      {!showDropdown ? (
        <>
          <button className="primary-btn" onClick={handleYes}>
            Yes ✨
          </button>
          <button 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              textDecoration: 'underline',
              marginTop: '12px',
              cursor: 'pointer',
              fontFamily: 'Outfit'
            }}
            onClick={() => setShowDropdown(true)}
          >
            Not quite...
          </button>
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <select className="dropdown" onChange={handleDropdown} defaultValue="">
            <option value="" disabled>Select Birth Year</option>
            <option value="1998">1998</option>
            <option value="1999">1999</option>
            <option value="2000">2000</option>
            <option value="2001">2001</option>
          </select>
        </motion.div>
      )}
    </motion.div>
  );
}
