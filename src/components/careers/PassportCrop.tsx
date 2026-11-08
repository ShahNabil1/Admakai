import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PASSPORT_WIDTH, PASSPORT_HEIGHT } from '@/lib/passport-rules';

export function PassportCrop({ file, onCancel, onSave }: { file: File; onCancel: () => void; onSave: (file: File) => void }) {
  const [url, setUrl] = useState(''), [crop, setCrop] = useState({ x: 0, y: 0 }), [zoom, setZoom] = useState(1), [area, setArea] = useState<Area | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  const save = async () => {
    if (!area || !url) return;
    setBusy(true); setError('');
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = PASSPORT_WIDTH; canvas.height = PASSPORT_HEIGHT;
      const context = canvas.getContext('2d'); if (!context) throw new Error('Photo cropping is unavailable.');
      context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, PASSPORT_WIDTH, PASSPORT_HEIGHT);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
      if (!blob) throw new Error('This image could not be cropped.');
      onSave(new File([blob], 'passport.jpg', { type: 'image/jpeg' }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Choose another image.'); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onCancel(); }}><DialogContent className="passport-dialog" aria-describedby={undefined}><DialogTitle>Crop passport photo</DialogTitle><div className="passport-crop">{url && <Cropper image={url} crop={crop} zoom={zoom} aspect={35 / 45} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)} onMediaLoaded={() => setError('')} onCropAreaChange={() => undefined} />}</div><label>Zoom<input aria-label="Photo zoom" type="range" min={1} max={3} step={.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>{error && <p role="alert" className="application-error">{error}</p>}<div className="passport-actions"><Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button className="application-next" onClick={() => void save()} disabled={busy || !area}>{busy ? 'Cropping…' : 'Use photo'}</Button></div></DialogContent></Dialog>;
}