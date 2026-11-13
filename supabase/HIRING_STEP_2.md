# Hiring Step 2

## Storage and roles
- Already existed and remain private: resumes, signatures, agreements, letters, task-files. Created none.
- Verified all three existing hiring storage policies cover all five buckets: hiring_files_candidate_read, hiring_files_candidate_upload, hiring_files_staff_read. Definitions unchanged.
- Existing user_roles has user_id, role (owner/manager/member/client), created_at, updated_at; there are no literal admin roles. The requested exact admin-to-hiring-admin migration therefore granted no emails. Owner/member roles were deliberately not promoted without authorization. Reused hiring_user_roles, app_role, has_role and is_hiring_staff.

## Additions
- talent_pool, explicit least-privilege grants, RLS, talent_pool_public_insert and talent_pool_hiring_read policies.
- hiring_talent_pool_guard and talent_pool_guard trigger, plus email/created-at index. Names and emails normalized; timestamp assigned by server; transactional email lock enforces one entry in a rolling 24-hour window. Public insert only, hiring staff read only. Input field lengths, email, web URL and interest allowlist checked in server and trigger.
- AI Video Artist Intern draft, hybrid, ten seats, deadline December 8, 2026 (30 days after November 8). All requested responsibilities, requirements, benefits, tools and task settings stored literally.
- Existing default application/journey pipelines and version-one agreement linked. All sixteen existing question-bank rows attached in requested 4/4/3/2/3 section order; only laptop question optional.
- Careers page, filters, FAQ, internship progression, real talent form, job details, sharing, sticky/mobile action, /careers/:slug/apply placeholder and /me placeholder destination.
- Careers links added to the existing header/footer. No other existing pages/components changed.
- Public reads use anonymous RLS at SSR; a separate validated authenticated/no-store function reads staff drafts and candidate-owned application IDs after hydration. Signed-out users see no draft rows, and drafts produce no public JobPosting schema. Staff drafts carry a yellow banner.
- Each new route has dedicated title/description/OG/twitter metadata; open, unexpired jobs produce JobPosting data. Application and dashboard placeholders are noindex. No video was invented; requested animated showreel placeholder retained.

## Verification
- Migration regression: normalized duplicate email rejected; anonymous talent read grant absent; anonymous insert works; internship draft invisible to anonymous; exactly sixteen questions and one optional question. Fixtures rolled back.
- Browser: real talent insert saved and read back from database; second uppercase email rejected within 24 hours. Synthetic row removed through cleanup migration.
- Public page, filters, FAQ, draft concealment, apply placeholder and mobile navigation verified. No page runtime errors. Page overflow checks passed at 390, 740, 1024 and 1280 widths.
- Existing regression suite plus eight careers rule tests: 500 passed; preview build OK.
- Authenticated staff draft preview, own-application link and real job detail interaction remain unverified end-to-end: external unmanaged Supabase provides no browser session here. No credentials requested, existing owners not promoted, draft not published for testing.
- Fourteen pre-existing security advisories remain unchanged (one RLS/no-policy informational finding, twelve executable definer-function advisories, leaked-password protection disabled). This migration introduced none.
- Existing database definitions and bucket settings not changed; only new objects and requested seed records added.

## URLs
- /careers
- /careers/ai-video-artist-intern (hiring staff only while draft)
- /careers/ai-video-artist-intern/apply (coming soon)
- /me (coming soon)
