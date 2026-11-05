import { serviceSteps } from '@/content/service-process';
import { ServiceReveal } from './ServiceMotion';
import { cn } from '@/lib/utils';
import './services.css';
export function StepList({ variant = 'normal', className }: { variant?: 'normal' | 'compact'; className?: string }) {
  return <ol className={cn('service-foundation service-steps', variant === 'compact' && 'service-steps--compact', className)}>{serviceSteps.map((step, index) => <li key={step.title} className={cn('service-step', step.chip && 'service-step--advance')}><ServiceReveal>
    <div className="service-step-top"><span className="service-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{step.chip && <span className="service-step-chip">{step.chip}</span>}</div>
    <h3>{step.title}</h3><p>{step.text}</p>
  </ServiceReveal></li>)}</ol>;
}
