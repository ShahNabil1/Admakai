import { useEffect, useRef, useState } from 'react';

export function useTimedLogo() {
  const [active, setActive] = useState<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current !== null) clearTimeout(timeout.current); }, []);
  const activate = (name: string) => {
    if (timeout.current !== null) clearTimeout(timeout.current);
    setActive(name);
    timeout.current = setTimeout(() => { setActive(null); timeout.current = null; }, 2000);
  };
  return { active, activate };
}