import { useReducedMotion } from 'framer-motion';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Keep the first browser render identical to SSR, then apply the device preference.
export function useMotionPreference() {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const reduce = useReducedMotion();
  return hydrated && Boolean(reduce);
}