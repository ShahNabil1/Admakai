# Hiring Prompt 7 — final workflow

Implemented on external Supabase and the existing TanStack PDF/email layer. No Cloud or Edge Functions. Existing non-hiring page bodies and data were not changed.

## Added
- Tables: journey_milestone_templates (10 exact internship seeds), letter_templates (offer/promotion legal-review drafts), journey_notes (private by default).
- member_journeys.mentor_name; stage-copy/reason/admin guards; stage-in-use deletion guard; Realtime journey/milestone/project/note/event publication.
- Checked private functions with public invoker wrappers: start_journey, hiring7_move_journey, hiring7_set_mentor, grant_hiring_role, revoke_hiring_role, hiring7_staff_roles, hiring7_save_letter.
- Existing has_role/hiring_user_roles and private letters bucket reused. Existing change_journey_stage left intact, extended by additive triggers.
- Policies: hiring7_milestone_templates_read/write, hiring7_letters_admin_read, hiring7_notes_read/admin_insert; explicit least-privilege grants.
- Admin Team journey board/drawer, milestones/custom milestones, private/visible notes, mentor, BDT paid projects, stage history/reasons and letter regeneration.
- Candidate Journey menu/card and own journey with live milestones/projects/notes/stages; letters read from private letters storage through Documents.
- Email templates, branded preview, test to account email, logs/filters/retry; role, pipeline and immutable letter version editors in Settings.
- Offer and project/salary promotion PDFs, A4 embedded fonts, company logo/signature and version footer; PDF attachments to delivery. Legal-review templates must be approved before issuance.

## Verification
64 focused tests passed. Rollback-only SQL checked hired-only starts; exact 3/4/3 milestones; completed milestone readback; BDT 5000 project; visible/private note filtering; other-candidate invisibility; role grant/revoke; unknown-account message; pause reason preservation; new immutable letter version. No synthetic users remain. Smoke Careers/me/admin/journey/emails, desktop and 390px mobile: no browser errors/overflow. Build OK. New migration warnings resolved; 14 pre-existing advisories were not re-audited.

## Launch checklist
- Review offer/promotion text legally, clear Legal review pending and save a new version before issuing letters.
- Sign in through your existing external Supabase/Branta Hub and exercise: Hired → Start journey → milestone → paid project → Learner → Project; open /me/journey in the member's session and confirm live readback.
- Exercise a second Offer application; check private PDF download in Documents and the attached email/email log. Actual signed-in Storage/PDF/email/Realtime flow is unverified: no managed session is available for this external project.
- Grant/revoke a Reviewer who has signed in at /me/login; test the owner no-remove protection in the UI.
- Save an email template and use Send test to me; confirm inbox delivery and failed-email Retry.
- Check logo/company address/signature and Google provider/redirect settings; their hosted configuration remains unverified.
- Configure an external hourly callback to the protected interview-reminder endpoint, or use Send reminders now. No scheduler was added.
- Publish the updated app after these checks; commits alone do not publish.
