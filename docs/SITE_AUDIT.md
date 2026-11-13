# Admakai — Full Site Audit

**Audit date:** 8 November 2026 (UTC). **Mode:** read-only investigation; this report is the only project file added. No application code, content, database, policies, buckets or settings changed. No tests or builds were run.

**Evidence:** current source, read-only queries against the connected external Supabase, its database linter, secret-name/presence checks, existing preview logs and signed-out browser observations. This audits the current checkout/preview, not proof that the published domain has the same version. Authenticated end-to-end checks are unavailable for this external/unmanaged Supabase; provider settings, real uploads, inbox delivery and cross-user browser sessions remain unverified. No personal account emails or secret values are reproduced.

**Tests:** **595 statically enumerated test cases across 54 test files**, including parameterized rows and tests created by loops. This is a source count, not a passing-test count. There are 369 literal `it`/`test` calls; inline `.each` tables contribute 90 cases, three data-driven tables contribute 84, and loop expansion adds 52. No test suite was executed.

## 1. ROUTES

Files below are relative to `src/routes/`. `:slug` and `:id` denote dynamic segments. Pathless layout files are not separate pages. The application parent and index share one URL, not two separate application screens.

### Public pages and sign-in entry points

| Route | File | Page title | Who can open / purpose / state |
|---|---|---|---|
| `/` | `_site.index.tsx` | Admakai \| AI Ad Agency in Bangladesh for Commercials | Public; studio Home, services, proof and booking links. |
| `/pricing` | `_site.pricing.tsx` | AI Ad Pricing in Bangladesh \| Admakai | Public; shared monthly plans and service estimates. |
| `/services` | `_site.services.tsx` | AI Advertising Services: Commercials and UGC \| Admakai | Public; 37-service catalogue, filters and browser-only service finder. |
| `/services/:slug` | `_site.services_.$slug.tsx` | [Service name] \| Admakai | Public; service detail and portfolio. Unknown/unpublished slugs redirect to Services. |
| `/work` | `_site.work.index.tsx` | Our Work \| Admakai | Public; live published portfolio with search/categories and video previews. |
| `/work/:slug` | `_site.work.$slug.tsx` | [Work title] \| Admakai Work | Public; published work/player/case study; unavailable records use not-found handling. |
| `/about` | `_site.about.tsx` | About Admakai | AI Advertising Studio in Dhaka | Public; studio story, process and eight approved team identities. |
| `/blog` | `_site.blog.index.tsx` | ব্লগ \| Admakai | Public; two hardcoded Bengali articles. |
| `/blog/sazdah-tvc` | `_site.blog.sazdah-tvc.tsx` | একটা পুরো টিভিসি, কোনো শুটিং ছাড়া \| Admakai | Public; TVC case study. Unfinished media: filename placeholders such as cover.jpg and tvc.mp4. |
| `/blog/video-lighting-guide` | `_site.blog.video-lighting-guide.tsx` | ভিডিও লাইটিং গাইড: ৩৪টি AI লাইটিং স্টাইল ও রেডি প্রম্পট \| Admakai | Public; complete 34-style guide and copyable prompts; intentionally image-free. |
| `/book` | `_site.book.tsx` | Book Your Admakai Call | Available Times in Dhaka | Public; SQL-backed availability, service interest and contact booking wizard. |
| `/careers` | `_site.careers.index.tsx` \| Careers at Admakai | Public; open roles, filters, internship video and talent-pool signup. Currently no public roles were shown. |
| `/careers/:slug` | `_site.careers.$slug.index.tsx` | [Job title] \| Careers at Admakai | Public for published jobs; draft preview is hiring-staff only through a separate signed-in read. Unavailable roles are noindex. |
| `/careers/:slug/apply` | `_site.careers.$slug.apply.tsx + _site.careers.$slug.apply.index.tsx` | Apply for a role \| Admakai (parent: Apply \| Careers at Admakai) | Public entry; sign-in required for own saved seven-step application. Staff can test drafts. Not a placeholder. |
| `/careers/:slug/apply/done` | `_site.careers.$slug.apply.done.tsx` | Application submitted \| Admakai | Public page wrapper; private PDF/status reads require the submitting account; polls for PDF. |
| `/me/login` | `_site.me.login.tsx` | Candidate sign in \| Admakai | Public; email-code sign-in; optional Google governed by hiring settings; sanitized return to /me. |
| `/signin` | `signin.tsx` | Sign In \| Admakai | Public; client password sign-in, signup, email verification, recovery and Google button. |
| `/auth/sso/callback` | `auth.sso.callback.tsx` | Signing in \| Admakai | Public callback; validates Branta Hub response/state and staff/hiring access, then finishes admin sign-in. |
| `/privacy` | `_site.privacy.tsx` | Privacy policy \| Admakai | Public; supplied privacy policy. |
| `/terms` | `_site.terms.tsx` | Terms of service \| Admakai | Public; supplied terms. |
| `/refund` | `_site.refund.tsx` | Refund policy \| Admakai | Public; **unfinished, visible TODO legal placeholder**. |

### Signed-in client and candidate pages

All `/app` pages use `_authenticated.tsx` (`ssr:false`, Supabase `getUser`, signed-out redirect to `/signin`). All `/me` pages use `_candidate.tsx` (`ssr:false`, signed-out redirect to `/me/login`). These guards require an account, not a special client/candidate role. Ownership/RLS decides which rows the account can see.

| Route | File | Page title | Access and purpose |
|---|---|---|---|
| `/app` | `_authenticated.app.index.tsx` | Your Studio Space \| Admakai | Signed in; linked-client next call, shared notes and next-call uploads. |
| `/app/calls` | `_authenticated.app.calls.tsx` | My Calls \| Admakai | Signed in; own linked-client bookings, hosts, shared notes and eligible meeting links. |
| `/app/projects` | `_authenticated.app.projects.tsx` | Projects \| Admakai | Signed in; RLS-visible projects and deliverables. |
| `/app/reviews` | `_authenticated.app.reviews.tsx` | Reviews \| Admakai | Signed in; submitted/resubmitted deliverables, timed feedback and decisions. |
| `/app/files` | `_authenticated.app.files.tsx` | Files \| Admakai | Signed in; **unfinished ClientEmpty**, not a working all-files browser. |
| `/app/billing` | `_authenticated.app.billing.tsx` | Billing \| Admakai | Signed in; own client invoices excluding drafts, items and payments. |
| `/me` | `_candidate.me.index.tsx` | My applications \| Admakai | Signed in; own draft/submitted applications and journey shortcut when applicable. |
| `/me/applications/:id` | `_candidate.me.applications.$id.tsx` | Application tracker \| Admakai | Signed in, owning candidate; tracker/timeline, answers, interview/task actions, agreement and withdrawal. |
| `/me/documents` | `_candidate.me.documents.tsx` | My documents \| Admakai | Signed in, owning candidate; agreements and offer/promotion letter links. |
| `/me/journey` | `_candidate.me.journey.tsx` | Team journey \| Admakai | Signed in; own member journeys, milestones/projects/visible notes; nav link only when a journey exists. |
| `/me/profile` | `_candidate.me.profile.tsx` | Candidate profile \| Admakai | Signed in; own candidate profile/photo/notification preference and sign-out. |

### Admin pages

Every admin URL mounts the same lazy, client-only `AdminPage`. It renders a signed-out SSO gateway or access-denied state before the workspace. There is **no route-level beforeLoad role guard**, but the shared UI checks access, hiring server functions check roles, and non-hiring queries are constrained by database RLS. Absence of a route guard does not establish public data exposure.

| Route | File | Page title | Access and purpose |
|---|---|---|---|
| `/admin` | `admin.tsx` | Admin \| Admakai | Owner or hiring staff passes the current shell check; legacy tabs additionally depend on database staff/manager permissions. Today/Bookings/Pipeline/Projects/Work/Billing/Activity are tabs on this URL. |
| `/admin/hiring` | `admin_.hiring.index.tsx` | Overview \| Admakai Hiring | Hiring admin/reviewer; aggregate hiring overview. |
| `/admin/hiring/jobs` | `admin_.hiring.jobs.tsx` | Jobs \| Admakai Hiring | Hiring staff; admins edit, reviewers/interviewers read only. |
| `/admin/hiring/jobs/:id` | `admin_.hiring.jobs_.$id.tsx` | Job editor \| Admakai Hiring | Hiring staff; admin editing/publishing, others read only. |
| `/admin/hiring/questions` | `admin_.hiring.questions.tsx` | Question bank \| Admakai Hiring | Hiring staff; admin question editing, others read only. |
| `/admin/hiring/agreements` | `admin_.hiring.agreements.tsx` | Agreements \| Admakai Hiring | Hiring admin; immutable versioned agreement templates. |
| `/admin/hiring/settings` | `admin_.hiring.settings.tsx` | Hiring settings \| Admakai Hiring | Hiring admin; company/email/video/help/roles/pipelines/letters. |
| `/admin/hiring/applications` | `admin_.hiring.applications.tsx` | Applications \| Admakai Hiring | Admin/reviewer; application board/table and bulk actions; interviewer reads remain assignment-scoped. |
| `/admin/hiring/applications/:id` | `admin_.hiring.applications_.$id.tsx` | Applicant profile \| Admakai Hiring | Admin/reviewer or assigned interviewer; server/RLS scope private applicant details. |
| `/admin/hiring/interviews` | `admin_.hiring.interviews.tsx` | Interviews \| Admakai Hiring | Hiring staff; admin/reviewer scheduling, interviewer own assigned interviews/results. |
| `/admin/hiring/journey` | `admin_.hiring.journey.tsx` | Team journey \| Admakai Hiring | Hiring admin; member board/drawer and milestones/projects/stage changes. |
| `/admin/hiring/emails` | `admin_.hiring.emails.tsx` | Email templates and log \| Admakai Hiring | Hiring admin; templates, tests, logs and retry. |

**Layout-only files:** `__root.tsx`, `_site.tsx`, `_authenticated.tsx`, `_authenticated.app.tsx`, `_candidate.tsx`, `_candidate.me.tsx`, and the application parent above. `/` is provided by `_site.index.tsx`, not an unfinished template.

**API route:** `POST /api/public/hiring-reminders`, file `src/routes/api/public/hiring-reminders.ts`; only a matching `CRON_SECRET` bearer can send interview reminders. Returns an unavailable response if no secret is configured. This is not a public dashboard despite its `/api/public` prefix.

## 2. AUTH AND ROLES

### Sign-in methods and redirects

| User type | Entry | Methods implemented | Destination / access |
|---|---|---|---|
| Admin / studio team | `/admin` | Branta Console SSO at `console.brantatech.com/sso/admakai`; popup with redirect fallback, state expiry, exact-origin/source messages and Supabase session verification. The upstream Hub's password/Google choices were not inspected. | Callback `/auth/sso/callback`, then admin workspace. Current local shell accepts **owner or hiring staff**, not standalone legacy manager/member. |
| Client | `/signin` | Email/password; signup with full name/WhatsApp/password; six-digit signup confirmation; password recovery email and recovery-code verification; Google OAuth button. No standalone client passwordless/magic-link sign-in button. | Sanitized `/app` destination or one of its five child pages; stored intended destination honored. |
| Candidate / hired member | `/me/login` or application entry | Supabase `signInWithOtp`, six-digit `verifyOtp`; new email accounts may be created by OTP; optional Google if hiring setting enabled. | Sanitized `/me` child destination, or continuation of the application form. |

These use **the same external Supabase Auth accounts/session**, not separate candidate and client identity stores. Login interfaces, navigation and return-path rules are separate. New auth users receive `profiles` plus legacy `user_roles = client`; a candidate is represented by its `candidates` record, not a candidate enum role. Verified-email linkage connects existing pre-login client records automatically.

**Can a client sign in today? Yes, the sign-in/signup UI and account/data paths exist at `/signin` → `/app`.** A linked client can see own calls, projects, reviews and issued invoices. An account without a matching linked `clients` record sees empty client data. Actual password/OTP/Google sign-in and hosted signup/provider settings were not exercised or read; source implementation is not proof of provider configuration.

### Role systems and current counts (no emails)

| Role table | Roles defined | Current role-row counts | Enforcement |
|---|---|---|---|
| `public.user_roles` | owner, manager, member, client | owner **4**, manager **0**, member **2**, client **3** | Own-role read policy; `app.my_role`, `app.is_staff`, `app.is_manager`, project ownership/membership helpers enforce CRM/delivery/billing access. Profiles do not carry editable privileges. |
| `public.hiring_user_roles` | admin, reviewer, interviewer | admin **4**, reviewer **0**, interviewer **0** | `public.has_role`, `is_hiring_staff`, checked private RPCs/server functions and applicant-assignment RLS. Owner synchronization grants hiring admin automatically. |

Counts are rows in each system, not a unique-person total across both. Catalog inspection found no additional role table in application schemas. `project_members` grants project assignment, not global account roles. Candidate membership is `member_journeys`, not a global role.

**Important access mismatch:** `src/lib/application-rules.ts:129` and `AdminPage.tsx:48–58` restrict admin entry to owners or hiring staff, while `src/lib/sso.ts` recognizes owner/manager/member and database staff policies allow them. The two existing members have no hiring role in the counts, so the current local admin shell will deny them. Hiring-only staff can enter the shared shell but legacy-tab data/actions remain subject to legacy permissions; hiding irrelevant tabs would be clearer.

**Session risks:** login pages and AdminPage have their own auth subscribers in addition to the root subscriber. Some are necessary for sign-in completion; audit lifecycle/sign-out cache handling before consolidating accounts. Candidate/profile sign-out and client shell sign-out are not one shared account-menu flow. Do not interpret `/app` or `/me` authentication-only guards as cross-account exposure: live RLS policies scope projects/invoices/bookings and candidate reads explicitly scope IDs.

## 3. ADMIN PANEL

| Section | Shows and actions | Reads / writes |
|---|---|---|
| Today | Dhaka today's calls, pending requests, stale new/contacted leads; opens details and management actions. | Reads bookings, clients, leads, profiles; shared actions write bookings/leads. |
| Bookings | Contact/brand/WhatsApp/email, selected interest, brief/message, budget, source, slot, host, meeting link, shared notes and files. Filter/status change, take/assign ownership, update meeting link/shared notes, cancel/no-show/completion. Detail opens in the admin page. | bookings, clients, leads, profiles, booking_files; writes bookings, with triggers/activity logging. Internal notes use staff-checked helper rather than broad booking projections. |
| Pipeline | Kanban leads, ownership/value/lost reason; move stage, take ownership, edit estimate, mark lost and confirm won conversion. | leads, clients, profiles; writes leads. Won trigger creates projects and marks clients customers; audit appends activity. |
| Projects | Client/project/stage, tasks, deliverable versions and review player. Move stage, add task/change task status/take assignment, upload deliverable, read feedback/resolve comments. | projects, clients, tasks, deliverables, review_comments; writes projects/tasks/deliverables/comments; deliverables Storage upload/signing. |
| Work | Works, Categories, Service portfolios, Import/Export. Search/filter, publish/feature/order, add/edit/delete work, Vimeo metadata/thumbnail recovery, categories, service ordering, JSON import/export. | works, work_categories, work_services; mutations through existing browser libraries/RLS; Vimeo oEmbed supplies metadata. |
| Billing | Invoices/client/project choices, invoice items, recorded payments. Create draft, edit items, delete draft, send/number invoice, record payment, void eligible invoice. | invoices, invoice_items, payments, clients, projects. Totals/numbers/payment status derived by database triggers; payments insert-only. |
| Activity | Append-only entity/actor/verb/from/to/time/metadata feed, filters, realtime refresh. No edit/delete action. | activity, profiles; read only in UI. |
| Hiring overview / applications | Counts, board/table, filters/bulk move/CSV, applicant answers/ratings/notes/interviews/timeline; assign reviewer, score, move with candidate message/reason. | applications, candidates, jobs, pipeline_stages, application_answers/reviews/events, internal_notes, interviews, signed_agreements, documents, email_log; checked RPCs/functions. |
| Hiring interviews | Calendar/list, scheduling/rescheduling/cancellation, score/strengths/concerns/recommendation and reminders. | interviews plus scoped applications/candidates/jobs/staff; checked interview RPCs; email_log and reminder claim updates. |
| Hiring jobs / questions | Lifecycle/filter/counts, duplication, preview/publish checks, details/list editors, questions/task/agreement/pipelines; bank create/edit/archive and explicit draft propagation. | jobs, job_questions, question_bank, hiring_question_sources/snapshots, pipelines/stages, agreement_templates, applications; checked CRUD/snapshot RPCs. |
| Hiring agreements | Markdown editor/preview/key terms/legal review/version history; saving creates new version. | agreement_templates, hiring_agreement_reviews; version RPC, no in-place historic edits. |
| Hiring journey | Stage board/day/milestone counts, member drawer, start journey, mentor, milestones/private-visible notes, BDT projects, paid total, stage history/reasons and letter regeneration. | member_journeys, journey_milestones/templates/projects/notes/events, candidates, jobs, stages, staff role helper, documents/letter_templates. |
| Hiring emails | Subject/body/enabled/last sent, variable chips/branded preview/test; log filters and failed-email retry. | email_templates, email_log, hiring_settings; delivery also reads application/candidate/job/profile context. |
| Hiring settings | Sender/reply-to/admin recipients/company/logo/signature/help/video/Google toggle; team roles, pipeline stages/order, letter versions. | hiring_settings, hiring_user_roles through RPCs, pipelines/stages, letter_templates; hiring-assets/hiring-media uploads. |

### Exact lead and project stages

- **Lead:** `new → contacted → qualified → proposal_sent → won`; alternative `lost`. The UI can move between columns; this is the vocabulary/order, not proof every lead must visit every stage. Lost reasons: budget, timing, went_elsewhere, no_response, not_a_fit, other. SQL prevents unauthorized owner changes. Moving to won creates at most one linked project for that lead and sets `clients.is_customer`.
- **Project:** `brief → script → assets → first_cut → revision → final → delivered`.
- **Task:** todo, in_progress, in_review, done, blocked.
- **Deliverable:** submitted, changes_requested, resubmitted, approved.
- **Invoice:** draft, sent, partially_paid, paid, overdue, void.
- **Booking database:** requested, in_review, confirmed, completed, cancelled, no_show, rescheduled. Admin's displayed status list omits rescheduled even though client code/database know it.

### What a project actually contains

`projects`: id, client_id, lead_id, title, stage, owner_id, due_at, brief (JSON), revision_limit, created_at, updated_at. `project_members` relates staff users to a project. `tasks` adds title/status/assignee/due date. `deliverables` relates title/version/status, private storage_path or external_url, submitted_by, decided_at and timestamps. `review_comments` supplies timed/threaded comments and resolution. `invoices.project_id` links billing, and `payments.invoice_id` tracks payments.

There is no independent project-files table: delivered files use `deliverables.storage_path`; booking/client uploads use `booking_files`. No separate public share-review-link/token model was found: clients review inside `/app/reviews` with authentication. Project due date/brief/revision fields exist, but the current workspace emphasizes stage/tasks/uploads and does not provide a complete project-details editor. Client list does not display every stored project field or task.

## 4. CLIENT SIDE

**Client pages exist.** They are not limited to booking forms:

| Page | Client-visible data |
|---|---|
| `/app` | Own linked client's next call, host/shared notes, eligible join action, next-call file uploader/list; Files/Billing shortcuts. |
| `/app/calls` | Own bookings/history and shared call notes; confirmed-call meeting link only within allowed join window. |
| `/app/projects` | Own RLS-visible projects and deliverables. |
| `/app/reviews` | Own submitted/resubmitted deliverables, timed comments, approval/change-request actions. |
| `/app/billing` | Own non-draft invoices, items, totals and recorded payments; no self-service online payment integration found. |
| `/app/files` | Placeholder/empty feature page; not a working consolidated file library. |

Client uploads accept up to five files per booking, 10 MB each, with server signature checks and booking ownership checks. Completed-call uploads/removals are restricted; removal is manager-only. Clients can also access delivered files through project/review views, but historical booking files are not centrally browsable in the Files page.

### Public booking → CRM → account

1. `/book` retains service/category/optional monthly-plan choices and contact details in page state; time selection comes from SQL availability, not frontend-generated slots.
2. Browser calls `app.open_slots` / `app.create_booking`, with public-schema forwarding fallback when required. Database validates contact/slot/budget and uses transaction locks, shared slot validation and slot uniqueness.
3. It finds/creates a `clients` contact by normalized email, reuses/creates an open `leads` row, creates a requested `bookings` row, links the lead's booking and appends immutable activity.
4. Admin sees the joined contact/booking/lead immediately through its reads/realtime. When the lead becomes won, the trigger creates its project.
5. **A booking does not create an Auth user/account.** If a matching verified Auth user already exists, it can link the client record. If the visitor signs up later and confirms the same email, deployed `profiles_link_client` / `on_auth_email_confirmed_link_client` triggers connect the old client contact to that verified user. Editable profile email alone cannot claim a booking.
6. Client signs in at `/signin`, lands at `/app`, and `getClientArea` resolves `clients.profile_id = userId`; downstream RLS scopes bookings/projects/invoices through that client.

A separate **general enquiry** path exists on pricing/service forms (`submitLead`), but it is broken against the current CRM schema; it is not the same as the working SQL booking path. See Problems.

## 5. DATABASE

Read-only live catalog confirms **21 non-hiring public tables**, all with **RLS enabled**. Standard IDs/timestamps omitted below where unimportant. Live policies confirm client/project/invoice ownership scope; not every write was exercised.

| Table | Purpose / key columns | RLS | Pages/consumers |
|---|---|---|---|
| profiles | Auth identity details: user_id, full_name, email, whatsapp, avatar_url, timezone, is_active. | On; self/staff reads, scoped edits. | Sign-in trigger, client shell, admin names, hiring contact context. |
| user_roles | Protected global role: user_id, role. | On; own read, privileged changes only. | SSO/admin/CRM/project/billing helpers. |
| clients | CRM contact/customer: profile_id, contact_name, email, brand_name, website, whatsapp, is_customer, notes, owner_id. | On; staff or linked owner reads, manager writes. | Booking, admin, client dashboard, projects/billing. |
| leads | Sales pipeline: client_id, booking_id, stage, owner_id, value_estimate, currency, lost_reason_category/reason, reopened_from, source, stage_changed_at. | On; staff and guarded writes. | Admin Today/Pipeline/Bookings; booking RPC and won conversion. |
| bookings | client_id, lead_id, slot_at, duration_minutes, status, owner_id, meet_link, brief, budget_band, source, reschedule_count, notes_shared/internal, recording_url, reminder timestamps, completed_at. | On; staff or own client, safe column grants/guards. | /book; admin Today/Bookings; /app and /app/calls. |
| booking_files | booking_id, storage_path, original_name, bytes, mime. | On; own-booking/staff reads, scoped upload, manager removal. | Client next-call uploads; admin booking details. |
| availability | weekday, start_time, end_time, is_active. | On; public read, manager write. | SQL slot computation; no dedicated full availability editor found in current tabs. |
| availability_rules | slot_minutes, gap_minutes, min_notice_hours, max_horizon_days, max_per_day, default_meet_link, business_timezone. | On; public read, manager edit. | SQL slot/booking validation. |
| blocked_dates | date_from, date_to, reason. | On; public read, manager write. | SQL unavailable-day filtering. |
| projects | client_id, lead_id, title, stage, owner_id, due_at, brief, revision_limit. | On; assigned project staff or linked client reads. | Admin Projects, /app/projects, /app/reviews, Billing choices. |
| project_members | project_id, user_id. | On; staff reads, manager add/remove. | Project authorization helpers; no complete membership editor found. |
| tasks | project_id, title, status, assignee_id, due_at. | On; project-scoped. | Admin Projects. |
| deliverables | project_id, title, version, status, storage_path, external_url, submitted_by, decided_at. | On; project staff/client reads, scoped submissions/decisions. | Admin Projects and client Projects/Reviews. |
| review_comments | deliverable_id, author_id, timecode_ms, body, parent_id, resolved. | On; project/deliverable-scoped. | Shared review player. |
| invoices | number, client_id, project_id, status, currency, issued_at, due_at, notes, subtotal, paid_total, created_by. | On; staff or own client's non-drafts; manager writes. | Admin Billing, /app/billing. |
| invoice_items | invoice_id, description, quantity, unit_price. | On; invoice-scoped. | Shared invoice detail. |
| payments | invoice_id, amount, method, reference, paid_at, recorded_by. | On; scoped read, append-only payment records. | Admin/client Billing. |
| activity | entity_type/id, actor_id, verb, from_value, to_value, meta. | On; staff reads, append-only guards. | Admin Activity, entity history. |
| works | slug, title, vimeo_id, aspect, duration_sec, thumbnail_url, category_id, client_name, industry, year, short_description, tags, featured, published, sort_order, case_study, seo_title/description. | On; published public reads, staff management. | Home, /work, /work/:slug, service portfolios, admin Work. |
| work_categories | slug, name, sort_order. | On; public read / staff manage. | Work filters/admin categories. |
| work_services | work_id, service_slug, position. | On; public portfolio relation / staff manage. | Service portfolio pages/admin ordering. |

**Additional non-hiring application-schema table:** `app.password_history` — user_id, password_hash, created_at; RLS on, **no policies**. It is intentionally inaccessible through ordinary table access; password-reuse/recording routines use privileged helpers. Do not add broad read policies to password hashes just to silence the informational warning.

**Person-to-business links:** Auth user → `profiles.user_id`; user → `clients.profile_id` via verified email; client → `bookings.client_id`, `projects.client_id`, `invoices.client_id`; staff → owners on clients/leads/bookings/projects, `project_members.user_id`, `tasks.assignee_id`; feedback/payment submitters via author_id/recorded_by. Candidate → candidates.id → applications/member_journeys/documents is separate business context on the same Auth identity.

**Content/schema mismatch:** no live `services`, `pricing_tiers`, `team`, `site_settings`, or old content-shaped `projects` table matching the legacy public adapter. Services/plans/team now use static sources; some fallback adapters still try old projections and silently fall back. Live `projects` is the private CRM table, **not** public portfolio `works`.

## 6. SERVER LAYER, EMAILS AND STORAGE

TanStack Start server functions are the app's RPC endpoints. Authenticated ones use `requireSupabaseAuth`; role-specific handlers and/or SQL RPC/RLS enforce authorization. Browser CRM/delivery/work/billing libraries also query Supabase directly under RLS; they are not additional server routes. No new Edge Functions are used by this server layer; legacy deployed Edge Function inventory was not inspected.

### Every declared server function (73)

Names grouped by module under `src/lib/`; each name below is an exported `createServerFn`.

**`application.functions.ts`**
- `applicationSettings` — Public Google/help settings.
- `readApplication` — Own eligible job/application/questions/agreement/draft context.
- `saveCandidate` — Own candidate details.
- `saveApplication` — Autosaved progress and answers via checked RPC.
- `uploadApplicationFile` — Validated private CV/photo upload.
- `removeApplicationCv` — Remove own draft CV reference/file.
- `recordApplicationSignature` — Validated signature and exact-version agreement record.
- `saveApplicationTask` — Save application practical-task URL.
- `submitApplication` — Submit with caller authorization, then best-effort PDF/email delivery.

**`candidate.functions.ts`**
- `candidateWorkspace` — Own profile/applications/jobs/documents/journeys.
- `candidateTracker` — Own application timeline/interview/task/answers.
- `candidatePdf` — Own signed agreement URL and email status.
- `candidateDocument` — Own document signed URL.
- `withdrawCandidateApplication` — Owner non-terminal submitted withdrawal.
- `submitCandidateTask` — Own task submission.
- `saveCandidateProfile` — Own editable candidate fields.
- `uploadCandidatePhoto` — Validated own photo upload.
- `regenerateHiringPdf` — Hiring-admin agreement PDF regeneration.
- `sendHiringEmail` — Hiring-admin selected template send.
- `hiringChangeStatus` — Staff checked status change plus delivery.

**`careers.functions.ts`**
- `getCareerJobs` — Public published job list.
- `getInternshipVideo` — Public allowlisted internship video settings.
- `getCareerDetail` — Public published job and questions.
- `getSignedInCareers` — Staff draft preview / own application links.
- `joinTalentPool` — Public validated talent-pool submission with database daily guard.

**`client.functions.ts`**
- `getClientArea` — Active own profile, linked client, safe bookings and host names.
- `getBookingFiles` — RLS-scoped booking-file list and signed URLs.
- `prepareClientUpload` — Own eligible booking signed-upload allocation.
- `finishClientUpload` — Verify uploaded bytes/signature/size and record booking file.
- `removeClientFile` — Manager-only removal from eligible booking.

**`hiring-admin.functions.ts`**
- `hiringWorkspace` — Staff jobs/questions/templates/pipelines/roles.
- `saveHiringJob` — Admin checked job/questions save.
- `duplicateHiringJob` — Admin duplicate.
- `changeHiringJobStatus` — Admin close/reopen/publish lifecycle.
- `hiringSlugAvailable` — Staff slug availability.
- `saveBankQuestion` — Admin create/edit bank question.
- `archiveBankQuestion` — Admin archive/freeze rather than unsafe deletion.
- `updateDraftQuestions` — Explicit admin propagation to draft jobs.
- `saveHiringTemplate` — Admin new immutable agreement version.
- `moveHiringTemplate` — Admin current-version selection.
- `markLegalReview` — Admin legal-review metadata.
- `readHiringSettings` — Admin settings read.
- `saveHiringSettings` — Admin settings update.
- `uploadHiringImage` — Admin validated media/logo/signature upload.

**`hiring-journey.functions.ts`**
- `journeyWorkspace` — Admin board with member/staff/milestone/project/note/history data.
- `candidateJourneys` — Own allowlisted journey data and visible notes/history.
- `startHiringJourney` — Admin hired-only start RPC.
- `moveHiringJourney` — Admin stage RPC then letter/email delivery.
- `setJourneyMentor` — Admin checked mentor copy.
- `saveJourneyMilestone` — Admin custom milestone/completion.
- `addJourneyNote` — Admin private-by-default note.
- `saveJourneyProject` — Admin BDT project create/edit.
- `hiringFinalSettings` — Admin staff/letters/pipelines/stages.
- `changeHiringRole` — Admin reviewer/interviewer grant/revoke.
- `saveLetterTemplate` — Admin immutable letter version.
- `savePipelineStage` — Admin stage create/edit/delete with in-use SQL guard.
- `regenerateHiringLetter` — Admin offer/promotion PDF.
- `hiringEmailsWorkspace` — Admin templates and newest 1,000 logs.
- `saveEmailTemplate` — Admin subject/body/enabled save.
- `testHiringTemplate` — Admin test to own verified account email.
- `retryHiringEmail` — Admin retry failed log.

**`hiring-review.functions.ts`**
- `hiringReviewWorkspace` — Admin/reviewer or assignment-scoped interviewer review data.
- `hiringApplicant` — Scoped applicant details/private file signing.
- `moveHiringApplicant` — Checked staff/reviewer-ceiling status change and email.
- `saveHiringRating` — Checked rating RPC.
- `assignHiringReviewer` — Admin reviewer assignment.
- `addHiringNote` — Authorized internal applicant note.
- `scheduleHiringInterview` — Checked scheduling and ICS email.
- `editHiringInterview` — Checked reschedule/cancel/result and applicable mail.
- `sendHiringReminders` — Admin once-claimed interview reminder batch.

**`leads.functions.ts`**
- `submitLead` — Public form/image validation and intended enquiry insert; **incompatible with current leads schema and absent leads bucket**.

**`public-data.functions.ts`**
- `getPublicRows` — Allowlisted legacy content reads/static fallbacks; services/plans return static values.

**`site.functions.ts`**
- `getPublicSiteDetails` — Public allowlisted site settings with local fallback.

**Only discovered HTTP API route:** `POST /api/public/hiring-reminders` — secret-authenticated reminder orchestration. Booking uses SQL RPCs, not a TanStack API route. PDF/email helpers live in `hiring-delivery.server.ts`, `hiring-letters.server.ts`, `hiring-interviews.server.ts`; these are internal implementations, not independently exposed endpoints.

### Secrets/configuration — names only

- Application secret names observed: `RESEND_API_KEY` and `CRON_SECRET`.
- Sandbox presence checks also confirm `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. These integration bindings are not shown in the custom-secret listing.
- Browser configuration referenced in source: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, optional legacy `VITE_SUPABASE_ANON_KEY`, project ID configuration.
- `SUPABASE_ANON_KEY` is absent in the checked sandbox environment but **not required** when `SUPABASE_PUBLISHABLE_KEY` is present. No required checked secret is missing.
- Google client ID/secret, provider enablement, SMTP/auth-email templates and production redirects are hosted settings, not verified by this secret listing. Production secret validity/deployment was not independently tested.

### Emails implemented today

1. **Auth emails:** Supabase Auth signup confirmation/resend, password recovery, candidate OTP (possibly magic-link-shaped depending on hosted template). App expects numeric codes. Google/SMTP/auth templates not verified.
2. **Hiring submission:** `application_submitted` to candidate (agreement attachment when available) and `admin_new_application` to configured admin recipients.
3. **Status:** in_review, shortlisted, interview_scheduled, selected, offer, hired, rejected, subject to stage email setting/template enabled and notification rules. Important triggers interview_scheduled/rejected/selected/offer/hired bypass candidate preference but still respect disabled templates.
4. **Interviews:** interview_scheduled, interview_rescheduled, interview_cancelled and interview_reminder; calendar ICS attached where appropriate. Reminder window is around 24 hours before, claimed once; retry releases failed claims.
5. **Journey:** journey_stage_changed; project/salary moves generate promotion PDFs. Offer moves generate offer PDFs. Legal-review-pending letters block issuance until approved.
6. **Admin tests/retries:** template test uses current admin account email; failed-email retry uses log context.

These custom hiring messages use **Resend directly from the existing server layer**, sender/reply-to/admin recipients from hiring_settings, branded HTML plus text and email_log. The live email_templates table has **13 enabled triggers** listed above. The live **email_log currently has zero rows**; this audit sent nothing, so no current logged production delivery is proven. Previous one-off Resend success is not evidence of a complete hiring workflow.

**No booking confirmation/reschedule/cancellation/reminder or invoice-send email implementation was found in the inspected app paths.** Booking records contain reminder fields and the client UI promises an email on confirmation, but the visible admin booking update does not invoke delivery. Sending an invoice currently changes its billing status/number; it is not proof of email delivery. The hourly interview callback is not scheduled by the app; external scheduling or manual Send reminders now is still needed.

### All live Storage buckets

| Bucket | Visibility | Intended content / state |
|---|---|---|
| client-uploads | Private | Booking attachments; configured 10 MB limit. |
| deliverables | Private | Project delivery media/files. |
| agreements | Private | Exact-version signed application agreement PDFs. |
| letters | Private | Offer/promotion PDFs. |
| resumes | Private | Candidate CVs. |
| signatures | Private | Candidate agreement signatures. |
| task-files | Private | Candidate photos/task-related files. |
| hiring-assets | Private | Company PDF logo/authorized signature; 5 MB configured limit. |
| hiring-media | Private | Job covers/video posters; 5 MB configured limit. Anonymous and signed-in reads allowed for one-hour signed URL display; admin-only writes. |

Bucket list confirms all nine are private. A private bucket can deliberately allow anonymous signing/read via its policies; that does not make hiring-media a public bucket. **No `leads` bucket exists**, although general-enquiry attachments try it. No `hiring-public` bucket exists. Bucket names describe intended use, not an assertion that files are currently present. Stored object inventory was not fetched.

## 7. DESIGN SYSTEM

- **Public shell:** `_site.tsx` mounts `<Navbar hero />`, constrained page content/transitions and shared Footer; application pages suppress Footer. Navbar owns the fixed/floating-pill/mobile behavior, currency control and signed-in candidate link. Footer uses supplied landscape imagery, service/company/legal links and safe contact fallbacks.
- **Shared foundations:** `src/styles.css` defines semantic background/foreground/surface/line/paper/ink/accent, shadcn-compatible colors, finder/video/pricing tokens and global pointer behavior. Buttons/inputs/dialog foundations in `src/components/ui/`; public sections reuse PageElements/motion/FAQ/video previews/currency controls.
- **Fonts:** Plus Jakarta Sans primary UI; Instrument Serif expressive headings; Noto Sans Bengali for Bengali; blog uses Anek Bangla/Inter, lighting guide requests Noto Serif Bengali/Anton/Inter. Root loads Google-font stylesheets; some requested article fonts may use fallback if not separately loaded. PDF fonts are bundled Noto Latin/Bengali, not dependent on browser fonts.
- **Palette:** dark monochrome public backgrounds, pale paper sections, yellow accent; light client dashboard; restrained admin neutrals; candidate dark/public-theme shell with blue/green/red status accents. Orange journey warning token marks overdue decisions. Brand/surface tokens and shell-scoped CSS coexist; some hardcoded colors and local variable overrides remain.
- **Admin controls:** `AdminShell`, shared `Action`, `Modal`, confirmation helpers, toast system, tables/filters. Hiring styles are scoped across hiring.css/review.css/journey.css rather than changing legacy page bodies.
- **Client shell:** own sidebar, header identity/sign-out, mobile navigation, Skeleton, CallItem, upload widget, shared delivery ReviewPlayer and InvoiceDetail. Mobile main nav omits Files/Billing but Home shortcuts expose them.
- **Candidate shell:** desktop menu/mobile bottom bar, application status cards/timeline, AgreementPdf, conditional Journey link and profile page sign-out. It lacks the client's persistent identity/account menu.
- **Trackers/cards:** candidate timeline and member progress are specialized; project review and invoice detail are shared with staff/client modes. Work thumbnails use VideoPreviewCard and page-wide preview limits.

**Intentional differences, not automatically bugs:** Bengali article editorial designs, studio vs internal dashboard surfaces, and initials-only About team are distinct approved presentation contexts. Consolidate foundations without forcing every screen into the marketing design.

**Inconsistencies/maintenance concerns:** no universal account menu; multiple button/style families and raw fallback links/buttons; per-shell variables/radii differ (global card radius 12 px versus candidate/hiring 8 px); root has many font families. `Navbar.tsx` contains a literal `<nav>Navbar</nav>` non-hero fallback, but current public/candidate layout consumers pass `hero`; this is dormant unfinished code, **not a confirmed live broken header**.

## 8. PROBLEMS

### The 14 existing database security advisories

The read-only Supabase linter reported **14 issues, no ERROR-level result**: one informational no-policy table, two anonymous-definer warnings, ten signed-in-definer warnings, and disabled leaked-password protection. The ten signed-in entries include the same two functions also reported for anonymous callers. Below uses **audit risk ratings**, not blindly treating every warning as an exploit.

| # | Severity | Advisory in plain English | One-line fix / disposition |
|---|---|---|---|
| 1 | Low | `app.password_history` has row security enabled and no normal read/write policy. This locks ordinary access; it is not an open table. | Keep password hashes inaccessible; document helper-only access rather than adding broad policies. |
| 2 | Low | Anonymous callers can run privileged `hiring_template_is_latest`. It answers whether a template is the latest. | Keep only if required for public agreement policy; otherwise move behind a narrow public wrapper. |
| 3 | Low | Anonymous callers can run privileged `is_hiring_staff(userId)`, potentially learning a guessed user's staff flag. | Restrict to caller identity/private helpers unless anonymous policy evaluation really needs it. |
| 4 | Medium | Signed-in callers can run privileged `change_application_status`. It checks staff and SQL stage guards but is a sensitive direct endpoint. | Retain explicit staff/reviewer/assignment guards; private implementation plus checked invoker wrapper can reduce exposed definer surface. |
| 5 | Medium | Signed-in callers can run privileged `change_journey_stage`. Existing function checks staff; added stage guard enforces admin-only changes. | Preserve admin/reason validation on every direct path; consider private implementation plus wrapper. |
| 6 | Low | Signed-in callers can run `has_role(userId, role)` and inspect a guessed user's hiring-role flag. | Use self-scoped role queries or document the minimal boolean policy-helper exposure. |
| 7 | Low | Signed-in callers can run `hiring_owns_application`; it tests ownership against their own auth identity. | Keep narrow boolean behavior; do not return private application content. |
| 8 | Low | Signed-in callers can run `hiring_owns_journey`; it tests their own ownership. | Keep identity-scoped helper and least-privilege execution. |
| 9 | Low | Signed-in callers can run `hiring_storage_path_owned`; it resolves ownership for private storage policy checks. | Keep strict path/identity validation; expose no arbitrary file access. |
| 10 | Low | Signed-in callers can also run `hiring_template_is_latest` (separate linter entry from #2). | Same restricted-helper/public-policy disposition as #2. |
| 11 | Low | Signed-in callers can also run `is_hiring_staff` (separate entry from #3). | Scope role probing where feasible while preserving authenticated policy checks. |
| 12 | Low | Signed-in callers can run `password_previously_used`; it only checks the caller's password history. | Keep caller-only execution and never expose hashes or other users' results. |
| 13 | Medium | Signed-in callers can run privileged `submit_application`; it performs sensitive ownership/submission validation. | Preserve owner/draft/signature/required-answer checks on direct RPC calls; use private checked wrapper if refactoring. |
| 14 | Medium | Supabase leaked-password protection is disabled. Known compromised passwords are not blocked by that feature. | Enable leaked-password protection in hosted Auth settings, if supported by the account's plan. |

**No confirmed high-severity exploit follows from these 14 alone.** Function definitions and existing guards reduce many warnings to intentional privileged-helper exposure. This is a focused read-only review, not a penetration test or guarantee of security.

### Confirmed and actionable functional problems

1. **High — general enquiries cannot persist to the live CRM.** `src/lib/leads.functions.ts` inserts name/brand/whatsapp/email/service_slug/budget_range/message/attachment_url/status into `public.leads`; live leads instead requires client_id and uses stage/CRM fields. Attachments target absent bucket `leads`. Therefore pricing/service enquiry forms will return unavailable/error rather than create a usable lead. Fix by adapting validated enquiries to the existing client+lead model (or a deliberately separate enquiry model), not overwriting the CRM table. No submission was made during the audit.
2. **Medium — client Files is unfinished.** `_authenticated.app.files.tsx` renders `ClientEmpty`, despite visible navigation to Files. Build an own-client file list using existing booking_files/deliverables rather than a second file store.
3. **Medium — refund policy is a public TODO placeholder.** Browser and source confirmed it. Supply approved policy; until then don't advertise it as complete.
4. **Medium — legacy team members/managers can be denied admin entry.** Current owner-or-hiring shell gate conflicts with older staff role vocabulary/database access. Resolve intended access explicitly rather than promoting users just for testing.
5. **Medium — booking email promise is not connected to a sender.** Client call copy says confirmation email will arrive; inspected booking status mutation has no mail orchestration. Add checked actual delivery or correct the promise after deciding the requirement.
6. **Medium — sitemap uses the wrong table and omits Careers.** `scripts/sitemap.ts:34` reads CRM projects with slug/published columns that do not exist, falls back to static-only URLs. `src/data/seo-routes.ts` includes service/blog/legal URLs but omits `/careers` and dynamic job URLs; current sitemap has **49 URLs**, consistent with static-only output. Generate published work URLs from works and add published job inventory.
7. **Medium — PDF Print buttons open a tab rather than print.** `AgreementPdf.tsx` accepts `print=true` but ignores it; candidate document buttons similarly open the signed PDF. Browser viewer manual print may work, but app does not trigger print as advertised.
8. **Medium — email/PDF delivery is best-effort after committed status changes.** Failures can leave a moved application/journey without its expected letter; UI does warn for a caught journey failure, so it is not wholly silent. `sendHiringEmail` returns failed results rather than throwing; `deliverJourneyStage` does not fully propagate those statuses, so it can report ready with failed mail. Add durable retry/status readback and avoid regenerating duplicate letters on blind retries.
9. **Medium — retry loses original journey message/stage variables.** `retryLetterEmail` sends empty extras and uses the journey's current stage for promotion regeneration, not the historical failed event's snapshot. Persist/replay delivery context to retry the correct content.
10. **Medium — stage drag reorder is two sequential writes.** `FinalSettings.tsx` swaps sort_order values with separate requests; interruption/concurrent edits can leave duplicate/inconsistent order. Atomic reorder RPC would be safer. No uniqueness-conflict failure was reproduced.
11. **Low — several update handlers don't check affected rows.** Stage/template/milestone/project edits check errors but may treat zero matched rows as success. Require returned row/count for stale IDs.
12. **Low — capped collections lack full pagination.** Admin projects 200/tasks 1,000/deliverables 500; email logs newest 1,000; several hiring reads depend on default limits. Older items may appear absent as volume grows. Add paging/counts where needed.
13. **Low — Sazdah article media is still filenames/placeholders.** Browser shows cover.jpg/tvc.mp4; supply actual approved media. This is not a route crash.
14. **Low — redundant legacy content adapters.** Public-content `projects` projections don't match CRM projects, and absent team/site_settings use fallbacks. Static services/plans/team are authoritative; clean obsolete adapters only after verifying imports. No deletion was attempted; no complete dead-code graph proves all unused files.

### Browser, performance and link evidence

- Signed-out visits covered Home/Pricing/Services/Work/About/Blog/two articles/Book/Careers/Privacy/Terms/Refund/Sign-in/me/app/admin/journey, plus an AI UGC service detail. No uncaught page errors were observed. `/me` redirected to `/me/login?redirect=%2Fme`; `/app` to `/signin`; admin displayed Branta SSO, not private data.
- Latest existing build log says build OK. No tests/builds were run by this audit. Existing console/runtime telemetry was empty or absent; absence is not proof every interaction is error-free.
- About/Sazdah appeared briefly empty during the first 350 ms sample, then loaded at network-idle. Do not label them broken pages from the initial transient state. About screenshot taken during animation showed partially revealed heading text; this was not established as permanent clipping.
- No measured slow-page ranking/Core Web Vitals was collected. Potential costs: multiple external fonts, bundled PDF font data, duplicated candidate/workspace reads and page-transition animation. Signed-in data/performance remains unmeasured.
- Known destination links exist for client/candidate/admin pages; Files and Refund lead to unfinished pages rather than 404s. External Vimeo playback, Google OAuth, Hub login and social/help links were not authenticated or comprehensively crawled. Browser cannot prove every link works.

### SEO gaps and strengths

- Meaningful leaf pages use shared `seoHead`/`serviceHead`: unique title, description, og:title/description/type/url, Twitter card and canonical. Sampled public pages have these tags; dynamic titles depend on loaded records.
- No meaningful absolute image is forced onto root metadata; work/job share images are conditional. Missing media/relative asset pages may use hosting screenshot rather than declared OG image; that is not automatically invalid.
- Private/admin pages are noindex. Some private detail canonicals use generic resource paths instead of exact IDs; low impact but inconsistent.
- robots.txt exists and points to `https://admakai.com/sitemap.xml`; it explicitly disallows `/admin`, not `/app` or `/me`. Those pages are client-gated/noindex; robots is not a security boundary.
- Sitemap is generated at build time, **not merely a hand-maintained static file**, but its dynamic read is wrong and Careers is missing as described above. Published portfolio/job discovery is therefore incomplete.
- About description says “since 2024” while Organization foundingDate is 2026. About body explains the Branta team worked since 2024 and became Admakai in 2026; refine the description to preserve that distinction rather than imply Admakai was founded in 2024.
- Bengali articles inherit `<html lang="en">`, and shared seoHead emits English hreflang. Add accurate language metadata for Bengali content. Missing loaded Noto Serif Bengali/Anton styles may cause font fallback; confirm before adding more fonts.

## 9. YOUR RECOMMENDATION

1. Keep one external Supabase Auth identity and reuse the current session without introducing a second identity store.
2. Offer one public sign-in entry with email code as the common option; retain password/Google only where deliberately supported and configured.
3. Keep Branta Console as staff SSO, returning to the same account/session system rather than replacing its trusted access checks.
4. Create one shared account menu showing identity, Dashboard, Profile, Sign out and only the workspaces the account can actually use.
5. Compose one dashboard from existing ClientHome/Calls/Delivery/Billing and CandidateDashboard/Journey/Documents, instead of rebuilding them.
6. Show client sections when a verified linked client exists, candidate sections when candidate/application data exists, and Journey only for members with journeys.
7. Keep staff/admin work separate; use server/RLS permissions for every record, never visibility toggles or user-editable metadata as authorization.
8. Preserve sanitized same-origin return paths and consolidate sign-out cancellation/cache clearing/navigation into one reliable shared flow.
9. Fix enquiry persistence, complete Files, approve legal letters/refund text, correct sitemap and verify real mail/PDF/live updates before launch.
10. Treat this as a subsequent implementation decision: this audit changed none of those flows or settings.
