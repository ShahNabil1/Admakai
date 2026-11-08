# Hiring Prompt 6

## Added
- Hiring overview, applications Kanban/table, applicant profile and interviews calendar/list under the existing admin shell.
- Filters, saved view choice, multi-select stage moves/reviewer assignment, formula-safe CSV export, ratings, internal notes, private CV/signature/PDF views.
- Staff directory; schedule, reschedule, cancel and result RPCs. Results advance to interview_done without email. Reviewer SQL ceiling and exact assigned-application interviewer scope apply even to direct calls.
- `interviews.reminder_sent_at`, three interview email templates, ICS attachments and once-only claimed reminder delivery. Failed/skipped reminders release their claim.
- Protected POST `/api/public/hiring-reminders` checks CRON_SECRET; admin-only Send reminders now is available. CRON_SECRET is saved securely, never in source/SQL.

## Scheduling and deletion limits
Neither pg_cron nor pg_net is installed. This external modern project does not support authored pg_net callbacks; no automatic schedule was installed. An external scheduler can call `https://admakai.com/api/public/hiring-reminders` hourly after publication using its matching secret as a Bearer authorization header. The endpoint returns no applicant data.

Delete-all-test was not implemented: existing application_events/signed_agreements reject deletion even through cascading privileged deletes, and the request preserves those existing rules. Test records remain protected rather than silently disabling immutable history.

## Checks
- Focused rule/email tests; rollback-only synthetic flow in_review → shortlisted → interview_scheduled → interview_done → selected, including reviewer/interviewer restrictions and candidate-safe interview reads.
- Careers/me/admin quick browser smoke, desktop/mobile isolated board and scheduling-dialog fixtures; no page runtime errors or mobile page overflow.
- Real authenticated external Hub/Supabase flows, actual candidate Realtime readback, interview email delivery and private file readback remain unverified; no authentication session is available in this environment.
- No Cloud, Edge Functions, unrelated admin data changes or re-audit of pre-existing advisories.