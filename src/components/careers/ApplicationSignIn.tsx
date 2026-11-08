import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { GraduationCap, Film, BriefcaseBusiness } from 'lucide-react';
import logo from '@/assets/brand/logo-dark-cropped.png.asset.json';
import { Button } from '@/components/ui/button';
import { EmailCodeForm } from './EmailCodeForm';
import './apply-redesign.css';

export function ApplicationSignIn({ returnPath, onSignedIn, googleEnabled = true, children }: { returnPath: string; onSignedIn: () => unknown | Promise<unknown>; googleEnabled?: boolean; children?: ReactNode }) {
  const [updates, setUpdates] = useState(true);
  return <section className="apply-signin">
    <div className="apply-signin-story">
      <img className="apply-logo" src={logo.url} alt="Admakai" />
      <div><p className="apply-kicker">YOUR NEXT CHAPTER</p><h1>Start your journey in AI filmmaking</h1>
      <ul>{[[GraduationCap, 'No fee to learn'], [Film, 'Learn beside a working AI film team'], [BriefcaseBusiness, 'Paid projects after the learning stage']].map(([Icon, text]) => { const FactIcon = Icon as typeof Film; return <li key={String(text)}><span><FactIcon size={20} /></span>{String(text)}</li>; })}</ul></div>
      <p className="apply-story-footer">Admakai · A Branta Tech sister concern</p>
    </div>
    <div className="apply-signin-fields">
      <h2>Sign up to continue applying</h2>
      <EmailCodeForm returnPath={returnPath} onSignedIn={onSignedIn} googleEnabled={googleEnabled} openingsUpdates={updates} />
      <label className="application-check apply-updates"><input type="checkbox" checked={updates} onChange={e => setUpdates(e.target.checked)} />Send me updates about new openings</label>
      <p className="apply-legal">By continuing, you agree to the Admakai <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></p>
      <p className="apply-already">Already applied? <Button variant="link" onClick={() => document.querySelector<HTMLInputElement>('.apply-signin input[type=email]')?.focus()}>Sign in</Button></p>
      {children}
    </div>
  </section>;
}