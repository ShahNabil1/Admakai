import { useEffect, useRef } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { signatureIsMeaningful } from "@/lib/application-rules";
export function ApplicationSignature({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    pad = useRef<SignaturePad | null>(null),
    callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const color = getComputedStyle(el).color;
    const instance = new SignaturePad(el, { penColor: color, minWidth: 1.1, maxWidth: 2.5 });
    pad.current = instance;
    const resize = () => {
      const groups = instance.toData();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      el.width = el.offsetWidth * ratio;
      el.height = el.offsetHeight * ratio;
      el.getContext("2d")?.scale(ratio, ratio);
      instance.clear();
      instance.fromData(groups);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const done = () => {
      const points = instance.toData().flatMap((g) => g.points);
      if (!signatureIsMeaningful(points)) {
        callback.current(null);
        return;
      }
      el.toBlob((blob) => callback.current(blob), "image/png");
    };
    instance.addEventListener("endStroke", done);
    return () => {
      observer.disconnect();
      instance.off();
      instance.removeEventListener("endStroke", done);
      pad.current = null;
    };
  }, []);
  return (
    <div className="application-signature">
      <canvas ref={canvas} aria-label="Draw your signature" />
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          pad.current?.clear();
          onChange(null);
        }}
      >
        Clear
      </Button>
    </div>
  );
}
