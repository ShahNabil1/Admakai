# Hiring Step 4

## Built
- Hiring sidebar and mobile entry; Jobs, Question bank, Agreements and Settings routes use the existing dark admin shell.
- Jobs: title/status/type filters, non-test application counts, deadlines, preview/copy, atomic duplicate with questions, close/reopen, empty draft editor, five tabs, publish validation, live slug checking and unsaved navigation warning.
- Questions: sortable job-local copies, bank picker, custom forms and plain-language knockout rules, shared candidate preview; bank editing preserves existing copies and offers explicit draft propagation.
- Agreements: safe Markdown editor, variable insertion, sample preview, key-term reorder, legal-review toggle, immutable new versions, version history and explicit job migration.
- Settings: email/notification tags, address/private logo/signature, WhatsApp link, shared internship-video preview/poster and Google toggle.
- Application side card displays the configured safe WhatsApp URL. Shared safe Markdown supports job/task/agreement formatting; HTML is not rendered. Start date remains “To be confirmed” until assigned.

## Database/storage inventory
- Added hiring_settings.whatsapp_help_url.
- Added public.hiring_question_sources, public.hiring_agreement_reviews, public.hiring_question_snapshots with explicit grants and RLS.
- Added policies: hiring_sources_read, hiring_sources_admin, hiring_agreement_reviews_admin, hiring_snapshots_staff_read, hiring_settings_admin_only_step4 and hiring_step4_asset_read/insert/update/delete.
- Added private implementations and public invoker wrappers: hiring_public_help, hiring_job_publish_errors, hiring_admin_save_job, hiring_admin_duplicate_job, hiring_admin_update_drafts, hiring_admin_agreement_version, hiring_admin_freeze_bank.
- Added triggers/functions: hiring_publish_step4/hiring_publish_guard_step4; hiring_snapshot_category_step4; hiring_rating_flags_step4.
- Created private hiring-assets (5 MB). hiring-public was refused by workspace public-bucket policy; no substitute private bucket was misrepresented as public. Cover/poster uploads report the restriction until an owner enables public buckets and the bucket is created.
- Reused hiring_user_roles, has_role, is_hiring_staff, existing job/question/template/pipeline tables and immutable version guards. No existing policies/functions or constraints were replaced; the added restrictive Settings policy narrows existing staff access to admins as requested.
- Snapshots are inactive bank rows tracked separately, compatible with existing category constraints. Latest-current agreement resolution preserves old immutable rows; no old is_current flags are rewritten.

## Checks and limitations
- 537 tests passed; preview build/type checks clean.
- Rollback-only synthetic database test passed: create job and custom rating rule, publish, bank edit isolation, duplicate with two questions, close, reviewer job read, settings concealment and mutation denial. No synthetic users or jobs persisted.
- Public browser verified all five new pages show the existing SSO gate; Careers and Home remain available with no runtime errors.
- Browser-only component fixture verified missing-publication list, custom rating knockout creation and shared applicant form preview at desktop/mobile. This is not authenticated end-to-end proof.
- Real Hub-authenticated admin/reviewer workflows, actual uploads, and published Careers readback remain unverified: external unmanaged Supabase supplies no authenticated test session. No live job was published for testing.
- Public covers/posters remain blocked by workspace policy. An owner/admin must enable public buckets under workspace Settings → Privacy & Security, then hiring-public can be created.
- Existing Today, Bookings, Pipeline, Projects, Work, Billing and Activity page bodies and their records were not changed. Shell changes only add Hiring/navigation; visiting Hiring avoids unrelated booking/lead reads.
- Uses the existing Supabase project. No new security-linter findings remain; 14 pre-existing advisories remain unchanged.