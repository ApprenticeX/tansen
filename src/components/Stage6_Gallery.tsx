import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ImageIcon, StickyNote, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadFile {
    name: string;
    status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
    progress: number; // 0-100
}

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
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadProgress, setUploadProgress] = useState(0); // 0-100
    const [uploadLabel, setUploadLabel] = useState('');

    // ── Multi-Upload Card State ──
    const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
    const [multiUploadStatus, setMultiUploadStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
    const multiFileInputRef = useRef<HTMLInputElement>(null);

    // ── Unlock gate: visible after any image is viewed ──
    const [anyImageViewed, setAnyImageViewed] = useState(false);

    // ── Hold-to-Reveal State ──
    const [isRevealed, setIsRevealed] = useState(false);

    const XOR_KEY = Number(import.meta.env.VITE_IMAGE_DECRYPT_KEY || 123);

    useEffect(() => {
        setIsRevealed(false);
    }, [selectedIndex]);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const state = e.state;
            if (!state?.interceptionModal) {
                setPendingDownloadUrl(null);
                setUploadStatus('idle');
            }
            if (!state?.galleryModal) {
                setSelectedIndex(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const openGalleryItem = (i: number) => {
        window.history.pushState({ galleryModal: true }, '');
        setSelectedIndex(i);
        if (items[i]?.type === 'image') setAnyImageViewed(true);
    };

    const closeGalleryItem = () => {
        if (window.history.state?.galleryModal) {
            window.history.back();
        } else {
            setSelectedIndex(null);
        }
    };

    const openInterception = (blobUrl: string) => {
        window.history.pushState({ galleryModal: true, interceptionModal: true }, '');
        setPendingDownloadUrl(blobUrl);
        setUploadStatus('idle');
    };

    const closeInterception = () => {
        if (window.history.state?.interceptionModal) {
            window.history.back();
        } else {
            setPendingDownloadUrl(null);
            setUploadStatus('idle');
            setUploadProgress(0);
        }
    };

    const resetUpload = () => {
        setUploadStatus('idle');
        setUploadProgress(0);
        setUploadLabel('');
    };

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
        openInterception(blobUrl);
    };

    const triggerRealDownload = (blobUrl: string) => {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `memory_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // ── Multi-file uploader ──
    const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        // reset input so same files can be re-selected
        if (multiFileInputRef.current) multiFileInputRef.current.value = '';

        const queue: UploadFile[] = files.map(f => ({ name: f.name, status: 'pending', progress: 0 }));
        setUploadQueue(queue);
        setMultiUploadStatus('working');

        const TARGET_BYTES = 4 * 1024 * 1024;
        const STEPS = 8;
        const cloudName = 'dkd1bygsl';
        let hadError = false;

        const update = (idx: number, patch: Partial<UploadFile>) =>
            setUploadQueue(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));

        for (let idx = 0; idx < files.length; idx++) {
            const file = files[idx];
            try {
                // Read
                const base64Str: string = await new Promise((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });

                let finalBase64 = base64Str;

                if (file.size > TARGET_BYTES) {
                    update(idx, { status: 'compressing', progress: 5 });
                    const img: HTMLImageElement = await new Promise((res, rej) => {
                        const i = new Image();
                        i.onload = () => res(i);
                        i.onerror = rej;
                        i.src = base64Str;
                    });
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width; canvas.height = img.height;
                    canvas.getContext('2d')!.drawImage(img, 0, 0);

                    let lo = 0.7, hi = 1.0, best = canvas.toDataURL('image/jpeg', 0.7);
                    for (let s = 0; s < STEPS; s++) {
                        const mid = (lo + hi) / 2;
                        const candidate = canvas.toDataURL('image/jpeg', mid);
                        if (candidate.length * 0.75 <= TARGET_BYTES) { best = candidate; lo = mid; }
                        else hi = mid;
                        await new Promise(r => setTimeout(r, 0));
                        update(idx, { progress: 5 + Math.round(((s + 1) / STEPS) * 30) });
                    }
                    finalBase64 = best;
                }

                update(idx, { status: 'uploading', progress: 40 });

                // @ts-ignore
                const encrypted = window.CryptoJS.AES.encrypt(finalBase64, 'sensei').toString();
                const textBlob = new Blob([encrypted], { type: 'text/plain' });
                const formData = new FormData();
                formData.append('file', textBlob, `user_photo_${Date.now()}.txt`);
                formData.append('upload_preset', 'sensei');
                formData.append('resource_type', 'raw');

                await new Promise<void>((res, rej) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
                    xhr.upload.onprogress = (ev) => {
                        if (ev.lengthComputable)
                            update(idx, { progress: 40 + Math.round((ev.loaded / ev.total) * 55) });
                    };
                    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? res() : rej(new Error(`HTTP ${xhr.status}`));
                    xhr.onerror = () => rej(new Error('Network error'));
                    xhr.send(formData);
                });

                update(idx, { status: 'done', progress: 100 });
            } catch (err) {
                console.error('Multi-upload error:', err);
                update(idx, { status: 'error', progress: 0 });
                hadError = true;
            }
        }

        setMultiUploadStatus(hadError ? 'error' : 'done');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus('uploading');
        setUploadProgress(0);

        const TARGET_MB = 4;
        const TARGET_BYTES = TARGET_MB * 1024 * 1024;
        const STEPS = 8; // binary search iterations

        const getBase64 = (f: File): Promise<string> =>
            new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result as string);
                r.onerror = reject;
                r.readAsDataURL(f);
            });

        try {
            setUploadLabel('Reading file...');
            const base64Str = await getBase64(file);
            setUploadProgress(5);

            let finalBase64 = base64Str;

            // Only compress if file is over 4MB
            if (file.size > TARGET_BYTES) {
                setUploadLabel('Optimising quality...');
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const i = new Image();
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = base64Str;
                });

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);

                // Binary search — each step drives progress from 5% → 35%
                let lo = 0.7, hi = 1.0, best = canvas.toDataURL('image/jpeg', 0.7);
                for (let i = 0; i < STEPS; i++) {
                    const mid = (lo + hi) / 2;
                    const candidate = canvas.toDataURL('image/jpeg', mid);
                    const approxBytes = candidate.length * 0.75;
                    if (approxBytes <= TARGET_BYTES) {
                        best = candidate;
                        lo = mid;
                    } else {
                        hi = mid;
                    }
                    // yield to browser so the progress bar actually paints
                    await new Promise(r => setTimeout(r, 0));
                    setUploadProgress(5 + Math.round(((i + 1) / STEPS) * 30));
                }
                finalBase64 = best;
            } else {
                setUploadProgress(35);
            }

            setUploadLabel('Encrypting...');
            // @ts-ignore
            const encrypted = window.CryptoJS.AES.encrypt(finalBase64, 'sensei').toString();
            const textBlob = new Blob([encrypted], { type: 'text/plain' });
            setUploadProgress(45);

            const formData = new FormData();
            formData.append('file', textBlob, 'user_photo.txt');
            formData.append('upload_preset', 'sensei');
            formData.append('resource_type', 'raw');

            setUploadLabel('Sending...');
            const cloudName = 'dkd1bygsl';

            // Use XHR so we get real upload progress (45% → 95%)
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        const pct = 45 + Math.round((ev.loaded / ev.total) * 50);
                        setUploadProgress(Math.min(pct, 95));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(formData);
            });

            setUploadProgress(100);
            setUploadLabel('Done!');
            setUploadStatus('success');
            setTimeout(() => {
                if (pendingDownloadUrl) triggerRealDownload(pendingDownloadUrl);
                setTimeout(() => { closeInterception(); }, 3000);
            }, 1500);

        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('error');
            setUploadLabel('');
        }
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
                            onClick={() => openGalleryItem(i)}
                        >
                            {item.type === 'image' ? (
                                /* ── Image Card ── */
                                <div
                                    style={{ position: 'relative', width: '100%', height: '100%' }}
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    <motion.img
                                        src={item.blobUrl}
                                        alt={`Memory locked`}
                                        onDragStart={(e) => e.preventDefault()}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                            pointerEvents: 'none',
                                            WebkitTouchCallout: 'none',
                                            WebkitUserSelect: 'none',
                                            userSelect: 'none',
                                            filter: 'blur(15px) brightness(0.6)',
                                            transform: 'scale(1.1)', // Prevents blur bleeding at the edges
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
                                    {[0, 1, 2, 3, 4].map(n => (
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

                    {/* ── Upload Card (visible only after any image is viewed) ── */}
                    <AnimatePresence>
                        {anyImageViewed && (
                            <motion.div
                                key="upload-card"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                                style={{
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                    gridColumn: 'span 2',
                                }}
                            >
                                <div style={{
                                    background: 'linear-gradient(160deg, #e8f0fe 0%, #d6e4ff 60%, #c5d8ff 100%)',
                                    padding: '22px 18px 20px',
                                    minHeight: '130px',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}>
                                    {/* tape strip at top */}
                                    <div style={{
                                        position: 'absolute', top: -2, left: '50%',
                                        transform: 'translateX(-50%) rotate(1deg)',
                                        width: '42px', height: '14px',
                                        background: 'rgba(255,255,255,0.6)',
                                        borderRadius: '2px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    }} />

                                    {/* ruled lines */}
                                    {[0, 1, 2, 3, 4].map(n => (
                                        <div key={n} style={{
                                            position: 'absolute', left: '10%', right: '10%',
                                            top: `${22 + n * 16}%`, height: '1px',
                                            background: 'rgba(100,140,220,0.12)',
                                        }} />
                                    ))}

                                    {multiUploadStatus === 'idle' && (
                                        <>
                                            <Upload size={18} style={{ color: 'rgba(60,100,200,0.5)', position: 'relative', zIndex: 1 }} />
                                            <p style={{
                                                fontFamily: "'Outfit', sans-serif",
                                                fontSize: '0.82rem',
                                                fontWeight: 500,
                                                color: '#2a3f7a',
                                                textAlign: 'center',
                                                margin: 0,
                                                lineHeight: 1.5,
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                Share your photos with me 📸
                                            </p>
                                            <div style={{ position: 'relative', zIndex: 1 }}>
                                                <input
                                                    ref={multiFileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleMultiUpload}
                                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                                />
                                                <div style={{
                                                    background: 'rgba(60,100,200,0.15)',
                                                    border: '1px solid rgba(60,100,200,0.25)',
                                                    borderRadius: '20px',
                                                    padding: '8px 22px',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    color: '#2a3f7a',
                                                    pointerEvents: 'none',
                                                }}>
                                                    Choose Photos
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(multiUploadStatus === 'working' || multiUploadStatus === 'done' || multiUploadStatus === 'error') && (
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>
                                            {uploadQueue.map((f, i) => (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{
                                                            fontFamily: "'Outfit', sans-serif",
                                                            fontSize: '0.72rem',
                                                            color: '#2a3f7a',
                                                            margin: 0,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '70%',
                                                        }}>
                                                            {f.name}
                                                        </p>
                                                        {f.status === 'done' && <CheckCircle2 size={14} style={{ color: '#22c55e', flexShrink: 0 }} />}
                                                        {f.status === 'error' && <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                                        {(f.status === 'compressing' || f.status === 'uploading' || f.status === 'pending') && (
                                                            <span style={{ fontFamily: 'Outfit', fontSize: '0.7rem', color: '#4a6abf' }}>{f.progress}%</span>
                                                        )}
                                                    </div>
                                                    {f.status !== 'done' && f.status !== 'error' && (
                                                        <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(60,100,200,0.1)', overflow: 'hidden' }}>
                                                            <motion.div
                                                                animate={{ width: `${f.progress}%` }}
                                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                                style={{
                                                                    height: '100%', borderRadius: '99px',
                                                                    background: 'linear-gradient(90deg, #4a6abf, #7ca3ff)',
                                                                    width: `${f.progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {(multiUploadStatus === 'done' || multiUploadStatus === 'error') && (
                                                <button
                                                    onClick={() => { setMultiUploadStatus('idle'); setUploadQueue([]); }}
                                                    style={{
                                                        marginTop: '6px',
                                                        alignSelf: 'center',
                                                        background: 'rgba(60,100,200,0.12)',
                                                        border: '1px solid rgba(60,100,200,0.2)',
                                                        borderRadius: '16px',
                                                        color: '#2a3f7a',
                                                        padding: '6px 18px',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        fontSize: '0.78rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {multiUploadStatus === 'error' ? 'Try Again' : 'Upload More'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                            onClick={closeGalleryItem}
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
                                <div
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        WebkitTouchCallout: 'none',
                                    }}
                                    onPointerDown={() => setIsRevealed(true)}
                                    onPointerUp={() => setIsRevealed(false)}
                                    onPointerLeave={() => setIsRevealed(false)}
                                    onPointerCancel={() => setIsRevealed(false)}
                                    onContextMenu={(e) => e.preventDefault()}
                                >
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
                                            pointerEvents: 'none',
                                            filter: isRevealed ? 'blur(0px) brightness(1)' : 'blur(25px) brightness(0.5)',
                                            transition: 'filter 0.2s ease',
                                        }}
                                    />

                                    <AnimatePresence>
                                        {!isRevealed && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                style={{
                                                    position: 'absolute',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    padding: '16px 32px',
                                                    borderRadius: '30px',
                                                    color: 'white',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    pointerEvents: 'none',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                                                    zIndex: 10,
                                                }}
                                            >
                                                <span style={{ fontSize: '1.4rem' }}>👆</span> Press & Hold to Reveal
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
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
                            padding: '16px 20px 60px',
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
                                        display: 'none',
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
                            onClick={closeInterception}
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
                                        You can't just download it like that😂... I want to see you🌸 too. Send me your photo first to download me❄️.
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
                                <div style={{ padding: '30px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* progress bar track */}
                                    <div style={{
                                        width: '100%',
                                        height: '6px',
                                        borderRadius: '99px',
                                        background: 'rgba(255,255,255,0.08)',
                                        overflow: 'hidden',
                                    }}>
                                        <motion.div
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ duration: 0.35, ease: 'easeOut' }}
                                            style={{
                                                height: '100%',
                                                borderRadius: '99px',
                                                background: 'linear-gradient(90deg, #d4af37, #f5d06e)',
                                                boxShadow: '0 0 8px rgba(212,175,55,0.5)',
                                                width: `${uploadProgress}%`,
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit', fontSize: '0.85rem', margin: 0 }}>
                                            {uploadLabel}
                                        </p>
                                        <p style={{ color: 'var(--gold, #d4af37)', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                                            {uploadProgress}%
                                        </p>
                                    </div>
                                </div>
                            )}

                            {uploadStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '10px 0' }}
                                >
                                    <p style={{
                                        fontFamily: "'Outfit', sans-serif",
                                        fontSize: '1rem',
                                        color: '#f87171',
                                        margin: 0,
                                        lineHeight: 1.5,
                                        textAlign: 'center',
                                    }}>
                                        Something went wrong 😕
                                    </p>
                                    <button
                                        onClick={resetUpload}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: '24px',
                                            color: 'white',
                                            padding: '10px 28px',
                                            fontFamily: "'Outfit', sans-serif",
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
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
