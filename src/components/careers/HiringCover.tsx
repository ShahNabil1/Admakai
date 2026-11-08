import { useState } from 'react';
import { useHiringMedia } from '@/hooks/use-hiring-media';

export function HiringCover({ value, title }: { value: string | null; title: string }) {
  const url = useHiringMedia(value);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) return null;
  return <img className="career-job-cover" src={url} alt={`${title} cover`} onError={() => setFailedUrl(url)} />;
}