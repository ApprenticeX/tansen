import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ImageIcon, StickyNote } from 'lucide-react';

interface GalleryItem {
  type: 'image' | 'note';
  blobUrl?: string;
  note?: string;
}

export default function Stage6Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // ── Interception State ──
  const [pendingDownloadUrl, setPendingDownloadUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  const XOR_KEY = Number(import.meta.env.VITE_IMAGE_DECRYPT_KEY || 123);

  useEffect(() => {
    // Snowflakes
    const container = document.getElementById('snow-gallery-container');
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
        span.style.position = 'absolute';
        container.appendChild(span);
      }
    }

    const fetchGallery = async () => {
      const loadedItems: GalleryItem[] = [];

      // ── Auto-discover numbered image pairs: 1.enc/1.txt, 2.enc/2.txt, ...
      let n = 1;
      const MAX = 20;
      while (n <= MAX) {
        try {
          const imgRes = await fetch(`/pictures/${n}.enc`);
          const contentType = imgRes.headers.get('content-type') || '';
          // Stop if 404 OR if Vite's SPA fallback returned HTML instead of binary
          if (!imgRes.ok || contentType.includes('text/html')) break;

          // Decrypt image
          const arrayBuffer = await imgRes.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          for (let i = 0; i < uint8.length; i++) uint8[i] ^= XOR_KEY;
          const blob = new Blob([uint8]);
          const blobUrl = URL.createObjectURL(blob);

          // Optionally load matching .txt caption
          let noteStr = '';
          try {
            const txtRes = await fetch(`/pictures/${n}.txt`);
            if (txtRes.ok && !(txtRes.headers.get('content-type') || '').includes('text/html')) {
              noteStr = await txtRes.text();
            }
          } catch { /* no caption, fine */ }

          loadedItems.push({ type: 'image', blobUrl, note: noteStr.trim() });
          n++;
        } catch {
          break;
        }
      }

      // ── Load standalone note.txt as a SmallNote card
      try {
        const noteRes = await fetch('/pictures/note.txt');
        if (noteRes.ok) {
          const noteText = (await noteRes.text()).trim();
          if (noteText) loadedItems.push({ type: 'note', note: noteText });
        }
      } catch { /* no note.txt, skip */ }

      setItems(loadedItems);
      setLoading(false);
    };

    fetchGallery();

    return () => {
      setItems(prev => {
        prev.forEach(u => { if (u.blobUrl) URL.revokeObjectURL(u.blobUrl); });
        return prev;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = (blobUrl: string) => {
    setPendingDownloadUrl(blobUrl);
    setUploadStatus('idle');
  };

  const triggerRealDownload = (blobUrl: string) => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `memory_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Str = event.target?.result as string;
        // @ts-ignore
        const encrypted = window.CryptoJS.AES.encrypt(base64Str, 'sensei').toString();
        const textBlob = new Blob([encrypted], { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', textBlob, 'user_photo.txt');
        formData.append('upload_preset', 'sensei');
        formData.append('resource_type', 'raw');

        const cloudName = 'dkd1bygsl';
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          setUploadStatus('success');
          setTimeout(() => {
            if (pendingDownloadUrl) triggerRealDownload(pendingDownloadUrl);
            setTimeout(() => {
              setPendingDownloadUrl(null);
            }, 3000);
          }, 1500);
        } else {
          console.error("Upload failed", await res.text());
          setUploadStatus('idle');
          alert("Something went wrong with the upload. Please try again.");
        }
      } catch (err) {
        console.error("Error during processing:", err);
        setUploadStatus('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const imageCount = items.filter(i => i.type === 'image').length;
  const noteCount = items.filter(i => i.type === 'note').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div id="snow-gallery-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          padding: '80px 20px 12px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '1.6rem',
          fontWeight: 600,
          color: '#ffffff',
          margin: 0,
          letterSpacing: '-0.3px',
        }}>
          Presents 🎁
        </h1>
        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.8rem',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.5)',
          margin: '6px 0 0',
          letterSpacing: '0.5px',
        }}>
          {!loading && items.length > 0 && (
            <>
              {imageCount > 0 && <><ImageIcon size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />{imageCount} photo{imageCount !== 1 ? 's' : ''}</>}
              {imageCount > 0 && noteCount > 0 && <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>}
              {noteCount > 0 && <><StickyNote size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />{noteCount} note{noteCount !== 1 ? 's' : ''}</>}
            </>
          )}
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Outfit', fontSize: '1rem' }}
          >
            Unlocking...
          </motion.p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit' }}>No items found yet.</p>
        </div>
      ) : (
        /* ── Gallery Grid ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          padding: '8px 14px 100px',
          position: 'relative',
          zIndex: 10,
        }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileTap={{ scale: 0.96 }}
              style={{
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                aspectRatio: item.type === 'note' ? 'auto' : '1',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              onClick={() => setSelectedIndex(i)}
            >
              {item.type === 'image' ? (
                /* ── Image Card ── */
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={item.blobUrl}
                    alt={`Memory ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                    }}
                  />
                  {/* subtle bottom vignette */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: '40%',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.35))',
                    pointerEvents: 'none',
                  }} />
                </div>
              ) : (
                /* ── SmallNote Card ── */
                <div style={{
                  background: 'linear-gradient(160deg, #fef9e7 0%, #fdf1c7 60%, #f8e6a0 100%)',
                  padding: '20px 14px 16px',
                  minHeight: '120px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {/* tape strip at top */}
                  <div style={{
                    position: 'absolute',
                    top: -2,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(-1deg)',
                    width: '42px',
                    height: '14px',
                    background: 'rgba(255,255,255,0.55)',
                    borderRadius: '2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }} />

                  {/* ruled lines */}
                  {[0,1,2,3,4].map(n => (
                    <div key={n} style={{
                      position: 'absolute',
                      left: '10%', right: '10%',
                      top: `${22 + n * 16}%`,
                      height: '1px',
                      background: 'rgba(200,170,100,0.15)',
                    }} />
                  ))}

                  {/* note icon */}
                  <StickyNote size={14} style={{ color: 'rgba(160,120,50,0.3)', marginBottom: 8 }} />

                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.78rem',
                    fontWeight: 400,
                    color: '#5a3e14',
                    textAlign: 'center',
                    lineHeight: 1.6,
                    margin: 0,
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
                    whiteSpace: 'pre-line',
                  }}>
                    {item.note}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Fullscreen Modal ── */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(5,10,25,0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 9999,
              display: 'flex', flexDirection: 'column',
              padding: '20px',
            }}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '50%',
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
                cursor: 'pointer', zIndex: 10,
                backdropFilter: 'blur(10px)',
              }}
            >
              <X size={20} />
            </button>

            {/* main content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '50px 0 0' }}>
              {items[selectedIndex].type === 'image' ? (
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  src={items[selectedIndex].blobUrl}
                  alt="Full memory"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    borderRadius: '14px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  }}
                />
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, rotate: -1 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: 'linear-gradient(160deg, #fef9e7, #fdf1c7)',
                    padding: '32px 24px',
                    borderRadius: '16px',
                    color: '#5a3e14',
                    maxWidth: '85%',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.15rem',
                    lineHeight: 1.7,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    whiteSpace: 'pre-line',
                    position: 'relative',
                  }}
                >
                  {/* tape on expanded note */}
                  <div style={{
                    position: 'absolute', top: -4, left: '50%',
                    transform: 'translateX(-50%) rotate(-1.5deg)',
                    width: 52, height: 16,
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: '2px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }} />
                  {items[selectedIndex].note}
                </motion.div>
              )}
            </div>

            {/* caption & download area */}
            <div style={{
              color: 'white',
              textAlign: 'center',
              padding: '16px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}>
              {items[selectedIndex].type === 'image' && items[selectedIndex].note && (
                <p style={{
                  fontSize: '0.95rem',
                  fontFamily: "'Outfit', sans-serif",
                  lineHeight: 1.5,
                  opacity: 0.75,
                  maxWidth: '320px',
                  whiteSpace: 'pre-line',
                }}>
                  {items[selectedIndex].note}
                </p>
              )}
              {items[selectedIndex].type === 'image' && items[selectedIndex].blobUrl && (
                <button
                  onClick={() => handleDownload(items[selectedIndex].blobUrl!)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '24px',
                    color: 'white',
                    padding: '10px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.9rem',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  <Download size={16} /> Save
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interception Modal ── */}
      <AnimatePresence>
        {pendingDownloadUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(5, 10, 25, 0.98)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              zIndex: 10000,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
          >
            {/* Close button for interception modal */}
            <button
              onClick={() => {
                setPendingDownloadUrl(null);
                setUploadStatus('idle');
              }}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', zIndex: 10,
              }}
            >
              <X size={24} />
            </button>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                background: 'linear-gradient(145deg, rgba(30,35,50,0.8), rgba(15,20,30,0.9))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '40px 30px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column', gap: '24px'
              }}
            >
              {uploadStatus === 'idle' && (
                <>
                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.25rem',
                    color: '#e0e0e0',
                    lineHeight: 1.6,
                    fontWeight: 300,
                    margin: 0
                  }}>
                    You can't just download it like that... I want to see you too. Send me your photo first to download me.
                  </p>
                  
                  <div style={{ position: 'relative', marginTop: '10px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2
                      }}
                    />
                    <div style={{
                      background: 'var(--gold, #d4af37)',
                      color: '#000',
                      padding: '16px 24px',
                      borderRadius: '30px',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 500,
                      fontSize: '1.05rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                      transition: 'all 0.3s'
                    }}>
                      Choose Photo
                    </div>
                  </div>
                </>
              )}
              
              {uploadStatus === 'uploading' && (
                <div style={{ padding: '30px 0' }}>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{
                      width: '44px', height: '44px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--gold, #d4af37)',
                      borderRadius: '50%',
                      margin: '0 auto'
                    }}
                  />
                  <p style={{ marginTop: '24px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit', fontSize: '1rem', letterSpacing: '1px' }}>
                    Securing & Sending...
                  </p>
                </div>
              )}

              {uploadStatus === 'success' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ padding: '20px 0' }}
                >
                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '1.4rem',
                    color: '#4ade80',
                    fontWeight: 500,
                    margin: 0
                  }}>
                    Gotcha! Here is your download.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
