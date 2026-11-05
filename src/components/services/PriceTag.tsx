import type { ReactNode } from 'react';
import './services.css';
export function PriceTag({ amount, unit, anchor, className = '' }: { amount: string | number; unit: string; anchor?: ReactNode; className?: string }) {
  return <div className={`service-foundation ${className}`}>{anchor && <p className="service-price-anchor">{anchor}</p>}<p className="service-price">{amount} <small>{unit}</small></p></div>;
}
