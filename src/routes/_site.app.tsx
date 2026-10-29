import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { seoHead } from '@/lib/seo';
import '@/components/public/pages.css';
export const Route = createFileRoute('/_site/app')({ head: () => seoHead({ title: 'Your Booking Access | Admakai', description: 'Secure email-link access for your Admakai booking.', path: '/app', noindex: true }), component: BookingAccess });
function BookingAccess() {
  const [status, setStatus] = useState('Checking your sign-in link…');
  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (active && session) setStatus('You’re signed in.'); });
    void supabase.auth.getSession().then(({ data, error }) => { if (active) setStatus(error ? 'This sign-in link could not be opened.' : data.session ? 'You’re signed in.' : 'Open the sign-in link in your booking email.'); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  return <div className="public-page"><section className="legal-document"><p className="page-eyebrow">Your booking</p><h1>Booking access</h1><p role="status">{status}</p><p>Your dashboard and product-photo uploads are not available yet.</p><Button asChild variant="link"><a href="/book">Back to booking</a></Button></section></div>;
}