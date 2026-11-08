import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** The signed-in person's saved roles (RLS limits rows to their own). */
export const listSavedJobs = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const { data, error } = await context.supabase.from('saved_jobs').select('job_id,created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error('Your saved roles could not load.');
    return data.map(row => row.job_id);
  });

export const setSavedJob = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ jobId: z.string().uuid(), saved: z.boolean() }))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const result = data.saved
      ? await context.supabase.from('saved_jobs').upsert({ user_id: context.userId, job_id: data.jobId }, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
      : await context.supabase.from('saved_jobs').delete().eq('user_id', context.userId).eq('job_id', data.jobId);
    if (result.error) {
      console.error('Saved role change failed', { code: result.error.code });
      throw new Error(data.saved ? 'This role could not be saved. Only open roles can be saved.' : 'This role could not be removed.');
    }
    return { saved: data.saved };
  });
