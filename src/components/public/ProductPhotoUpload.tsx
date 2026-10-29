import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Check, ImagePlus, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateAttachment } from '@/lib/lead-schema';
import './product-photo-upload.css';

type Props = { error?: string | undefined; disabled?: boolean; onError: (error: string | null) => void };

export function ProductPhotoUpload({ error, disabled = false, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const syncInput = (next: File | null) => {
    if (!input.current) return;
    const transfer = new DataTransfer();
    if (next) transfer.items.add(next);
    input.current.files = transfer.files;
  };
  const select = (next?: File) => {
    if (!next || disabled) return;
    const issue = validateAttachment(next);
    if (issue) { syncInput(file); onError(issue); return; }
    syncInput(next);
    setFile(next);
    onError(null);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files.length > 1) { onError('Choose one product photo.'); return; }
    select(event.dataTransfer.files[0]);
  };
  const remove = () => { syncInput(null); setFile(null); onError(null); };

  return <div className="booking-field full product-upload">
    <div className="product-upload-heading"><label id="attachment-label" htmlFor="attachment">Product photo</label><span>Optional</span></div>
    <input ref={input} className="sr-only product-upload-input" id="attachment" name="attachment" type="file" accept="image/jpeg,image/png" tabIndex={-1} disabled={disabled} aria-labelledby="attachment-label" aria-describedby={error ? 'attachment-help attachment-error' : 'attachment-help'} aria-invalid={!!error} onChange={event => select(event.target.files?.[0])}/>
    <div className="product-upload-zone" data-dragging={dragging} data-error={!!error} data-disabled={disabled}
      onDragEnter={event => { event.preventDefault(); if (!disabled) { dragDepth.current++; setDragging(true); } }}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}
      onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }} onDrop={drop}>
      {file ? <div className="product-upload-selected">
        <div className="product-upload-preview">{preview && <img src={preview} alt="Selected product photo"/>}</div>
        <div className="product-upload-details"><span className="product-upload-ready"><Check size={14}/>Ready to attach</span><strong title={file.name}>{file.name}</strong><span>{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`} · {file.type === 'image/png' ? 'PNG' : 'JPG'}</span></div>
        <div className="product-upload-actions"><Button type="button" variant="ghost" size="icon" aria-label="Replace product photo" title="Replace photo" disabled={disabled} onClick={() => input.current?.click()}><RefreshCw size={16}/></Button><Button type="button" variant="ghost" size="icon" aria-label="Remove product photo" title="Remove photo" disabled={disabled} onClick={remove}><X size={16}/></Button></div>
      </div> : <Button type="button" variant="ghost" className="product-upload-choose" disabled={disabled} aria-describedby="attachment-help" onClick={() => input.current?.click()}>
        <span className="product-upload-symbol"><ImagePlus size={24}/></span>
        <span className="product-upload-prompt"><strong>{dragging ? 'Drop your photo here' : 'Add a product photo'}</strong><span><span className="product-upload-browse">Browse files</span> or drag & drop</span></span>
      </Button>}
    </div>
    <div className="product-upload-footnote" id="attachment-help"><span>JPG or PNG · Under 5 MB</span><span><ShieldCheck size={13}/>Private attachment</span></div>
    <span className="sr-only" role="status">{file ? `${file.name} selected` : 'No photo selected'}</span>
    {error && <p className="field-error" id="attachment-error" role="alert">{error}</p>}
  </div>;
}