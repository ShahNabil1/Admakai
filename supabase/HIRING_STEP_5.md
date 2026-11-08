# Hiring Prompt 5

## Implemented
- English-letter full names in the application and candidate profile; database trigger validates changed names.
- Private agreement generation with pdf-lib, bundled OFL English/Bengali fonts, A4 pagination, exact signed template/version, signature, Dhaka timestamps, private agreements path and SHA-256. Optional company images are omitted when unavailable.
- Authenticated submission commits through caller-scoped `submit_application` before best-effort PDF and email delivery.
- Resend branded HTML/plain-text messages, private PDF attachment for submission email, preferences/important-update exceptions, sender/reply-to, admin recipients and delivery logs. Missing key records skipped; provider failures record failed.
- Authenticated staff status orchestration and admin-only PDF regeneration/email functions, ready for later admin integration.
- `/me/login`, `/me`, `/me/applications/:id`, `/me/documents`, `/me/profile`, and journey placeholder. Owner-filtered reads, safe interview view, Realtime cleanup, timeline, task notes, Meet ten-minute gate, calendar files, withdrawal and private PDF URLs.
- Candidate header link only; existing admin page bodies and data remain unchanged.

## Database additions / narrowly scoped changes
- `email_log_status_check` now accepts skipped.
- `withdraw_application` uses a private ownership-checked implementation and public invoker wrapper.
- `hiring_pdf_only_update` checks service role, unchanged signed fields, canonical path and digest. The two existing agreement-update guards preserve draft edits and add only this PDF finalization exception.
- `hiring_english_name_guard` plus candidate trigger.
- Private/public safe wrappers: `hiring_candidate_questions`, `hiring_candidate_contact`, `hiring_candidate_email_status`, `hiring_candidate_submit_task`.
- One task-files owner-read policy for profile photo paths. No buckets were created or made public.

## Architecture deviation
The project's enforced server architecture does not permit new Supabase Edge Functions. Equivalent operations use authenticated TanStack server functions and server-only helpers against the existing external Supabase; no Deno functions were deployed. RESEND_API_KEY was saved as a project runtime secret, not confirmed as an external Supabase Edge Function secret. No Lovable Cloud was enabled.

## Verification and limits
Focused tests cover A4 multi-page PDF bytes, canonical path/digest, exact template version, skipped/sent/failed email, missing signature, delivery-failure isolation, names, preferences, Meet join threshold, due dates, timeline and polling.
Rollback-only SQL checked PDF-only service-role updates, immutable signed name, candidate isolation for applications/documents/agreements/safe readers, withdrawal ownership and terminal blocking, optional reason, and English names. All fixtures rolled back.
Careers/admin/login smoke checks passed without runtime errors; protected candidate URLs redirect to login with safe return paths. Mobile login and sample-data tracker fit 390px; withdrawal confirmation rendered.
Real external Hub candidate/staff sessions are unavailable here. A real staff submission, Storage PDF readback, Resend delivery, Realtime transition, OTP delivery and deployed runtime remain unverified. No real application/email was created. Company address and admin recipient list are currently empty; no content was invented. Existing security advisories were not re-audited.