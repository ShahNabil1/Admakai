import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createHiringMediaCache, hiringMediaPath, HIRING_MEDIA_BUCKET } from '@/lib/hiring-media';

const signedImage = createHiringMediaCache(async (path, seconds) => {
  const { data, error } = await supabase.storage.from(HIRING_MEDIA_BUCKET).createSignedUrl(path, seconds);
  if (error || !data?.signedUrl) throw new Error('Image could not load.');
  return data.signedUrl;
});

export function useHiringMedia(value: string | null | undefined) {
  const path = hiringMediaPath(value);
  const [image, setImage] = useState<{ value: string; url: string } | null>(null);
  useEffect(() => {
    if (!path || !value) return;
    let active = true;
    const load = () => { void signedImage(path).then(url => {
      if (active) setImage({ value, url });
    }).catch(() => { if (active) setImage(null); }); };
    load();
    const timer = window.setInterval(load, 59 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [path, value]);
  return path ? (image && image.value === value ? image.url : null) : value || null;
}