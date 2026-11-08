# Hiring Step 3: seven-step application

Uses the existing external Supabase; Lovable Cloud was not enabled. The user explicitly approved necessary existing hiring safeguard updates. Legacy roles are unchanged.

## Added
- `applications.cv_path`, `applications.is_test` and `hiring_settings.google_login_enabled` (false).
- Automatic test classification, job/deadline eligibility, personal/answer validation, name-change signature invalidation and disabled-task step normalization.
- Checked `record_signature`, `submit_task`, `hiring_save_progress`, safe application-question/agreement readers and public Google switch reader. Sensitive new helper implementations live in `hiring_private` behind invoker wrappers.
- Private signature storage is restricted to the server-validated signing upload; draft CV replacement/removal remains ownership-scoped.
- Optional practical-task process-note question for existing task-enabled jobs (500-character maximum).
- Apply index and confirmation child routes; header retained, footer omitted only on application paths. Admin shell and SSO callback admit only owner or database-verified hiring staff. Existing data policies still determine which admin tools staff can use.

## Approved existing hiring changes
- `submit_application` now permits staff draft tests, checks current template/name, writes existing equals/contains knockout flags into staff-only reviews and submits atomically.
- Signed-record guard permits replacement only for an owned unfinished draft; submitted agreements and other history stay immutable.
- Name changes invalidate unfinished signatures; changing the name back does not restore validity.
- Existing tables/policies beyond the explicitly approved fields and hiring guards were not renamed or dropped. New restrictive signature policies intentionally block direct browser image bypass.

## Verified
1. SQL rollback tests: non-staff cannot see/apply to draft jobs; hiring staff creates and resumes the same draft; `is_test=true`; required answers/agreement are enforced; optional empty CV/task values work.
2. SQL rollback tests: valid draft task timestamps; name-change re-signing, including changing back; knockout flags written and hidden from another candidate; duplicate submission rejection; shortlisted task event; submitted agreement immutability; disabled task step five normalizes to six.
3. Browser-only fixture (not a real staff session): all seven steps, required-field highlighting, five input/choice types, one-second autosave, closing/reopening a tab and restoring answers, portfolio URL, task deferral, disabled terms until agreement end, drawn canvas signature, review, final truth checkbox and confirmation navigation/timeline/code.
4. Live public preview: signed-out email validation, hidden Google switch, header retained/footer hidden, normal careers footer retained, no admin shell signed out, desktop/mobile without overflow or page errors.
5. Existing suite and added concrete rule tests pass; latest build is clean.

All synthetic SQL users and data were rolled back. Browser fixtures never wrote real applications. No real owner was impersonated or given a new role.

## Not verified / setup required
- External unmanaged Supabase provides no authenticated browser session. A real staff draft application, real OTP delivery, real private upload/readback and real provider login remain unverified; do not treat browser fixtures as those checks.
- In Supabase Authentication, enable the Email provider and new signups for candidate OTP. Use `{{ .Token }}` in the signup/confirmation and magic-link templates to send a numeric code, and configure six-digit OTPs. Configure a production SMTP provider as needed. Hosted settings were not read or changed here.
- Set Site URL to `https://admakai.com`; allow the actual `/careers/.../apply` return addresses on main/www/published/preview origins (a suitably scoped `/careers/*/apply` wildcard if supported).
- Google remains off. If later enabled in hiring settings, configure the Supabase Google provider and its Google Cloud callback; test outside the embedded preview.
- WhatsApp help is hidden because hiring settings has no approved help-contact field/value. No contact was invented.
- PDF generation/preview/download and application notification email wait for Step 4; the confirmation page explicitly labels that slot.
- Fourteen pre-existing security advisories remain; newly introduced callable-definer advisories were resolved by private implementations/invoker wrappers.