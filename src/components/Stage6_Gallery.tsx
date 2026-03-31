import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface GalleryItem {
  blobUrl: string;
  note: string;
}

export default function Stage6Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const XOR_KEY = Number(import.meta.env.VITE_IMAGE_DECRYPT_KEY || 123);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/pictures/manifest.json');
        if (!res.ok) throw new Error("No manifest found");
        
        const manifest = await res.json();
        const loadedItems: GalleryItem[] = [];

        for (const item of manifest) {
          try {
            // Fetch Encrypted Image
            const imgRes = await fetch(`/pictures/${item.image}`);
            const arrayBuffer = await imgRes.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < uint8.length; i++) {
              uint8[i] ^= XOR_KEY;
            }
            
            const blob = new Blob([uint8]);
            const blobUrl = URL.createObjectURL(blob);

            // Fetch Text Note if exists
            let noteStr = '';
            if (item.txt) {
              const txtRes = await fetch(`/pictures/${item.txt}`);
              if (txtRes.ok) {
                noteStr = await txtRes.text();
              }
            }

            loadedItems.push({ blobUrl, note: noteStr });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            console.warn("Failed to load item", item);
          }
        }
        setItems(loadedItems);
      } catch (err) {
        console.error("Gallery empty or manifest error", err);
      }
      setLoading(false);
    };

    fetchGallery();

    return () => {
      items.forEach(u => URL.revokeObjectURL(u.blobUrl));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = (blobUrl: string) => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `memory_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div 
      className="stage-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{ padding: '80px 20px 20px 20px', overflowY: 'auto' }}
    >
      {loading ? (
        <h2 className="elegant" style={{ color: 'white' }}>Unlocking memories...</h2>
      ) : items.length === 0 ? (
        <h2 className="elegant" style={{ color: 'white' }}>No encrypted images found yet.</h2>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '15px',
          width: '100%',
          maxWidth: '800px'
        }}>
          {items.map((item, i) => (
            <div 
              key={i} 
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
              onClick={() => setSelectedIndex(i)}
            >
              <img src={item.blobUrl} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* Full Screen Modal View */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.95)',
              zIndex: 9999,
              display: 'flex', flexDirection: 'column',
              padding: '20px'
            }}
          >
            <button 
              onClick={() => setSelectedIndex(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'transparent', border: 'none', color: 'white',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <X size={32} />
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img 
                src={items[selectedIndex].blobUrl} 
                alt="Full memory" 
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }} 
              />
            </div>

            <div style={{ 
              minHeight: '20vh', 
              color: 'white', 
              textAlign: 'center', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Outfit', lineHeight: 1.5, opacity: 0.9 }}>
                {items[selectedIndex].note || '*No note attached*'}
              </p>
              
              <button
                onClick={() => handleDownload(items[selectedIndex].blobUrl)}
                className="primary-btn"
                style={{
                  width: 'auto',
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: 'auto'
                }}
              >
                <Download size={18} /> Download
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
