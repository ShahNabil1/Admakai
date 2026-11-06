import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';
import type { WorkCategory } from '@/types/work';
import type { WorkWithLinks } from '@/lib/works';
import { buildWorksExport, importWorks, type ImportSummary } from '@/lib/work-admin';
import { workImportFileSchema, workImportWorkSchema, type WorkImportFile } from '@/lib/work-schemas';

type Props = { works: WorkWithLinks[]; categories: WorkCategory[]; onReload: () => Promise<void> };

type Preview = { file: WorkImportFile; rowErrors: { slug: string; message: string }[] };

export function WorkImport({ works, categories, onReload }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const exportJson = () => {
    const file = buildWorksExport(categories, works);
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toLocaleDateString('en-CA');
    a.href = url;
    a.download = `admakai-works-export-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const onFile = async (file: File) => {
    setPreview(null);
    setSummary(null);
    setParseError(null);
    try {
      const raw: unknown = JSON.parse(await file.text());
      const parsed = workImportFileSchema.safeParse(raw);
      if (!parsed.success) {
        // Validate row by row so the preview can still show per-row errors.
        const loose = raw as { works?: unknown[] };
        if (!loose || typeof loose !== 'object' || !Array.isArray(loose.works)) {
          setParseError('This file is not a valid works export. Expected a "works" array.');
          return;
        }
        const rowErrors: { slug: string; message: string }[] = [];
        const validWorks: WorkImportFile['works'] = [];
        loose.works.forEach((row, index) => {
          const check = workImportWorkSchema.safeParse(row);
          if (check.success) validWorks.push(check.data);
          else {
            const slug = (row as { slug?: string })?.slug ?? `row ${index + 1}`;
            rowErrors.push({ slug, message: check.error.issues[0]?.message ?? 'Invalid row.' });
          }
        });
        setPreview({ file: { version: 1, categories: [], works: validWorks }, rowErrors });
        return;
      }
      setPreview({ file: parsed.data, rowErrors: [] });
    } catch {
      setParseError('The file could not be read. Make sure it is a .json export from this page.');
    }
  };

  const runImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const result = await importWorks(preview.file);
      setSummary(result);
      setPreview(null);
      toast.success(`Import done: ${result.created} created, ${result.updated} updated.`);
      await onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const linkCount = preview?.file.works.reduce((n, w) => n + w.services.length, 0) ?? 0;

  return (
    <div className="work-import">
      <div className="admin-panel work-import-panel">
        <h3 className="admin-sub">Export</h3>
        <p className="admin-hint">Downloads every category, work, service link and case study as a JSON file you can re-import later.</p>
        <button className="admin-btn" onClick={exportJson}><Download size={15} /> Export works</button>
      </div>

      <div className="admin-panel work-import-panel">
        <h3 className="admin-sub">Import</h3>
        <p className="admin-hint">Upload a .json file in the export format. Categories and works are matched by slug: existing ones are updated, new ones are created.</p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="work-file-input"
          aria-label="Choose a works export file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }}
        />
        <button className="admin-btn-ghost" onClick={() => fileInput.current?.click()}><Upload size={15} /> Choose file</button>
        {parseError && <p className="admin-alert" role="alert">{parseError}</p>}

        {preview && (
          <div className="work-import-preview">
            <p><strong>{preview.file.categories.length}</strong> categories, <strong>{preview.file.works.length}</strong> works, <strong>{linkCount}</strong> service links ready to import.</p>
            {preview.rowErrors.length > 0 && (
              <div className="work-import-errors">
                <p className="admin-label">{preview.rowErrors.length} row{preview.rowErrors.length === 1 ? '' : 's'} will be skipped</p>
                <ul>
                  {preview.rowErrors.map((r) => <li key={r.slug}><strong>{r.slug}</strong>: {r.message}</li>)}
                </ul>
              </div>
            )}
            <div className="admin-dialog-actions">
              <button className="admin-btn-ghost" onClick={() => setPreview(null)} disabled={busy}>Cancel</button>
              <button className="admin-btn" onClick={() => void runImport()} disabled={busy || preview.file.works.length === 0}>{busy ? 'Importing…' : 'Import'}</button>
            </div>
          </div>
        )}

        {summary && (
          <div className="work-import-preview">
            <p><strong>{summary.created}</strong> created, <strong>{summary.updated}</strong> updated, <strong>{summary.failed.length}</strong> failed.</p>
            {summary.failed.length > 0 && (
              <ul className="work-import-errors">
                {summary.failed.map((f) => <li key={f.slug}><strong>{f.slug}</strong>: {f.reason}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
