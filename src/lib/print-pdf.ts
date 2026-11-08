/** Opens the print dialog for a PDF via a hidden same-origin iframe; falls back to a new tab. Returns false when it fell back. */
export async function printPdf(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = URL.createObjectURL(new Blob([await res.arrayBuffer()], { type: 'application/pdf' }));
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    await new Promise<void>((resolve, reject) => {
      frame.onload = () => { try { frame.contentWindow!.focus(); frame.contentWindow!.print(); resolve(); } catch (e) { reject(e); } };
      frame.onerror = () => reject(new Error('load failed'));
      frame.src = blob;
      document.body.appendChild(frame);
    });
    setTimeout(() => { frame.remove(); URL.revokeObjectURL(blob); }, 60000);
    return true;
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
}
export const PRINT_FALLBACK_NOTE = "Use your browser's print button.";
