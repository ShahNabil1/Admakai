# Hiring Step 1 inventory

Applied to the existing external Supabase project. No UI changes.

## Compatibility and exceptions

- Existing `public.user_roles` and `public.user_role` remain untouched. They use owner/manager/member/client and one role per user. The user approved a separate `public.hiring_user_roles` table with `public.app_role` (admin/reviewer/interviewer). No existing `has_role` existed to reuse.
- Candidate IDs reference `public.profiles(user_id)`, which already references the same auth user ID, preserving the project's existing identity convention.
- Buckets must be created through Supabase Storage API; Supabase rejects bucket creation SQL. All schema, policies, seeds and regression tests are saved as migrations.
- No real account received a hiring role. Trusted provisioning must assign the first hiring admin; legacy staff have no automatic hiring access.
- Agreement bodies and versions cannot be edited or deleted. Create version + 1; the latest marked-current version is resolved without changing older rows.
- The agreement is explicitly a draft for legal review, not legally approved.
- Email templates are stored, not connected to delivery. Signed URLs, signing/PDF production and applicant UI belong to later steps.

## Tables (23, all RLS-enabled)

`hiring_user_roles`, `candidates`, `pipelines`, `pipeline_stages`, `jobs`, `question_bank`, `job_questions`, `agreement_templates`, `applications`, `application_answers`, `application_events`, `application_reviews`, `internal_notes`, `interviews`, `signed_agreements`, `member_journeys`, `journey_milestones`, `journey_events`, `journey_projects`, `documents`, `email_templates`, `email_log`, `hiring_settings`.

## Functions (19)

Public: `has_role`, `is_hiring_staff`, `hiring_owns_application`, `hiring_owns_journey`, `hiring_touch_updated_at`, `hiring_reject_mutation`, `hiring_template_version_guard`, `hiring_template_is_latest`, `hiring_application_guard`, `hiring_answer_guard`, `hiring_job_pipeline_guard`, `hiring_journey_guard`, `hiring_milestone_guard`, `hiring_signed_agreement_guard`, `change_application_status`, `change_journey_stage`, `submit_application`, `hiring_storage_path_owned`.

Private: `hiring_private.own_interviews`.

New schema: `hiring_private`. New view: `public.candidate_interviews`, caller-rights, eight safe fields only. Candidates see zero raw interview rows and only their own safe-view appointments. Interviewers see/update only assigned interviews unless they also hold admin/reviewer access.

## Buckets (5, all private)

`resumes`, `signatures`, `agreements`, `letters`, `task-files`.

Paths must be exactly `{candidate_id}/{application_id}/{filename}` and reference an application owned by that candidate. Candidates upload/read their own paths. Staff read all hiring files. Candidates have no overwrite/delete policy. Generated files can be written by trusted service code in later steps.

## Policies (54)

| Table | Created policies |
| --- | --- |
| hiring_user_roles | hiring_roles_own_read, hiring_roles_admin_read |
| candidates | hiring_candidates_read, hiring_candidates_insert, hiring_candidates_update |
| pipelines | hiring_pipelines_staff_read, hiring_pipelines_admin_write |
| pipeline_stages | hiring_stages_public_read, hiring_stages_admin_write |
| agreement_templates | hiring_templates_public_read, hiring_templates_staff_read, hiring_templates_admin_insert, hiring_templates_latest_public |
| jobs | hiring_jobs_public_read, hiring_jobs_staff_read, hiring_jobs_admin_write |
| question_bank | hiring_question_bank_staff_read, hiring_question_bank_admin_write |
| job_questions | hiring_job_questions_public_read, hiring_job_questions_staff_read, hiring_job_questions_admin_write |
| applications | hiring_applications_read, hiring_applications_candidate_insert, hiring_applications_candidate_update |
| application_answers | hiring_answers_read, hiring_answers_candidate_insert, hiring_answers_candidate_update |
| application_events | hiring_application_events_read |
| application_reviews | hiring_reviews_staff_read, hiring_reviews_reviewer_insert, hiring_reviews_reviewer_update |
| internal_notes | hiring_notes_staff_read, hiring_notes_reviewer_insert |
| interviews | hiring_interviews_staff_read, hiring_interviews_admin_insert, hiring_interviews_assigned_update |
| signed_agreements | hiring_signed_agreements_read |
| member_journeys | hiring_journeys_read, hiring_journeys_admin_insert |
| journey_milestones | hiring_milestones_read, hiring_milestones_admin_write |
| journey_events | hiring_journey_events_read |
| journey_projects | hiring_projects_read, hiring_projects_admin_write |
| documents | hiring_documents_read, hiring_documents_admin_insert |
| email_templates | hiring_email_templates_staff_read, hiring_email_templates_admin_write |
| email_log | hiring_email_log_staff_read |
| hiring_settings | hiring_settings_staff_read, hiring_settings_admin_write |
| storage.objects | hiring_files_candidate_read, hiring_files_candidate_upload, hiring_files_staff_read |

## Seeds and Realtime

- Two default pipelines, 11 application stages and six journey stages.
- All 16 supplied bank questions, including options, lengths and knockout rules.
- One version 1 draft internship agreement with all five exact acknowledgements.
- All 12 email templates and one settings row with careers@admakai.com.
- No invented jobs, candidates, applications or staff assignments.
- Realtime enabled on applications, application_events, member_journeys, journey_events and journey_milestones. Existing publication members preserved.

## Verification

Inline SQL regression tests passed under actual anonymous/authenticated roles with synthetic candidate A/B, admin, reviewer and assigned/unassigned interviewers. Checked candidate isolation, safe view, private data denial, self-promotion denial, protected status grants, required-answer/agreement submission, duplicate submission, post-submit edits, negative reasons, invalid stages, reviewers, interview assignment, score limits and immutable records. All fixtures rolled back. A follow-up migration re-tested the hardened interview reader.

The initial migration captured and compared existing table/grant, function, policy, trigger and bucket definitions and aborted if any changed; checks passed. Later migrations touch only the newly created hiring view or run rollback-only tests.

Security review: the owner-rights view advisory was resolved using an invoker view and non-exposed private safe reader. Intentional definer-function advisories remain for the narrow role/ownership helpers and explicitly authorized status/submission RPCs; revoking their execution would break the required RLS/RPC design. These are reviewed advisories, not a claim of a warning-free linter. Existing no-policy, definer and disabled leaked-password-protection advisories were not changed under the additive-only rule.

All 492 existing application tests passed after the migrations. The preview reports build OK. Database-only flows were exercised through SQL, not an applicant UI, which is intentionally absent in this step.