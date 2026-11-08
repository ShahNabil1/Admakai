import { createServerFn } from '@tanstack/react-start';
import { leadSchema, validateEnquiryAttachment, fileSignature } from './lead-schema';
import { services } from '@/data/services';

const MIME = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' } as const;

export const submitLead = createServerFn({ method: 'POST' }).inputValidator((input: FormData) => {
  if (!(input instanceof FormData)) throw new Error('Invalid form.');
  const fields = Object.fromEntries([...input.entries()].filter(([key]) => key !== 'attachment'));
  const values = leadSchema.parse(fields);
  const attached = input.get('attachment');
  const file = attached instanceof File && attached.size ? attached : null;
  const error = validateEnquiryAttachment(file);
  if (error) throw new Error(error);
  return { values, file };
}).handler(async ({ data }) => {
  const { values, file } = data;
  if (values.website) return { status: 'saved' as const }; // honeypot
  if (values.service_slug && values.service_slug !== 'not-sure' && !services.some(s => s.slug === values.service_slug)) return { status: 'error' as const };
  if (values.plan_slug && !['starter', 'growth', 'scale'].includes(values.plan_slug)) return { status: 'error' as const };
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  let path: string | null = null;
  try {
    if (file) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = fileSignature(bytes);
      if (!kind || MIME[kind] !== file.type) return { status: 'error' as const };
      path = `enquiries/${crypto.randomUUID()}.${kind}`;
      const up = await db.storage.from('enquiry-uploads').upload(path, bytes, { contentType: MIME[kind], upsert: false });
      if (up.error) return { status: 'unavailable' as const };
    }
    const interest = [values.service_slug, values.plan_slug ? `plan:${values.plan_slug}` : ''].filter(Boolean).join(' ');
    const { data: id, error } = await db.rpc('create_enquiry' as never, { p_name: values.name, p_email: values.email, p_whatsapp: values.whatsapp, p_brand_name: values.brand, p_website: values.brand_website, p_service_interest: interest, p_budget_band: values.budget_range, p_message: values.message, p_source_page: values.source_page || null, p_attachment_path: path } as never);
    if (error) {
      if (path) await db.storage.from('enquiry-uploads').remove([path]);
      return { status: error.message.includes('rate_limited') ? 'rate_limited' as const : 'unavailable' as const };
    }
    const { deliverEnquiry } = await import('./crm-emails.server');
    const emails = await deliverEnquiry(String(id)).catch(() => []);
    return { status: 'saved' as const, id: String(id), emailed: emails.some(e => e.status === 'sent') };
  } catch {
    if (path) await db.storage.from('enquiry-uploads').remove([path]);
    return { status: 'error' as const };
  }
});
