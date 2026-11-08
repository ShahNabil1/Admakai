<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Supabase is connected directly via `src/lib/supabase.ts` (supabase-js, VITE_ env vars); never enable Lovable Cloud — user requirement.
- Authorization roles live only in protected public.user_roles, never editable profiles or signup metadata; app helpers read this table to prevent self-promotion. Explicitly revoke inherited table grants before granting least-privilege access, because this external database has broad default privileges.
- Booking/lead access is enforced in SQL policies and guard triggers: members may only self-assign leads, clients only request bookings, and audit records reject mutation even for privileged writes; regression SQL runs with synthetic users in rollback-only migration blocks.
- Authenticated booking reads use explicit safe columns rather than SELECT *; internal notes are available only through the staff-checked app.booking_internal_notes helper, because row policies cannot hide columns.
- All slot computation lives in app.open_slots; public.open_slots only forwards it for the default public Supabase API schema, preventing duplicated public/admin scheduling logic. Public booking creation uses app.create_booking with email/day transaction locks, shared slot validation and the unique slot index to enforce limits atomically.
- Pre-login clients link through trusted verified auth emails only, never editable profile emails; confirmation lifecycle triggers audit links. Booking proof uses rollback-only synthetic writes so immutable audit history never needs disabling.
- /book uses app-schema browser RPCs with schema-exposure fallback only; no frontend slot generation. The direct Supabase client persists OTP sessions and strips opaque API-key bearer headers.
- Everyone outside the team signs in at /signin and uses one /dashboard shell (ssr:false gate); AuthProvider in root is the only auth listener (useAuth), and old /me and /app paths forward via account-rules legacyAccountPath. Private server functions use RLS middleware; uploads use signed URLs and server signature checks.
- The /book wizard keeps all selections and details in its page state; its calendar only presents SQL-returned availability and keyboard focus never commits a choice, so navigation cannot accidentally advance a step.
- Public pages live under the pathless `_site` layout (Navbar/Footer/page transition); `/admin` sits outside it so the admin area gets its own shell.
- Lenis + GSAP ScrollTrigger are initialised once from `__root.tsx` via `src/lib/smooth-scroll.ts`; motion helpers in `src/components/motion/` must honour prefers-reduced-motion.
- The public Layout renders the Home fixed Navbar directly before main, outside hero isolation and page-transition containers, and the shared Footer after main on every public route.
- Navbar owns its scroll listener and uses the tested 80px threshold helper for an always-visible floating pill; its mobile menu stays above the fixed wrapper.
- Motion components use the hydration-safe motion preference hook to keep server and initial browser markup identical before applying reduced motion.
- Footer settings use a public publishable-key server read of allowlisted key/value site_settings rows and a route-primed Query cache; missing tables or settings resolve to safe local fallbacks, never admin reads.
- LegalPage reads Privacy/Terms from browser-safe legal data; refund stays unapproved. Footer imagery uses asset pointers and a duplicated landscape mask.
- SEO uses the shared browser-safe `seoHead` helper in each leaf route and Organization data in the public layout, not Helmet or root share images, to preserve SSR tags and per-page sharing.
- Public SEO route inventory drives build-time sitemap generation and explicit prerender paths; admin is lazily imported and never prerendered, while unavailable public project data falls back atomically to static URLs.
- Omit unknown prices, team identities, project video facts and contacts from structured data; only emit complete record schemas when the corresponding public content exists.
- Inner pages prime public-content Query options in route loaders; the existing typed hooks subscribe with Suspense and server reads use allowlisted tables/projections and static fallbacks so missing tables still SSR useful content.
- Inner-page styling is scoped to public-page elements and shared PageElements; reuse Home motion, FAQ and tool-stack without modifying Home content.
- Booking contacts stay separate from sitewide contacts. Enquiries sync photo previews to FormData and use libphonenumber metadata with bundled country-flag-icons SVGs for international phone selection/validation.
- Blog posts are hardcoded components (metadata in `src/data/blog.ts`); missing media renders a filename placeholder so layout never breaks.
- /admin uses popup SSO with a redirect fallback, expiring shared-storage state and exact-origin/source token-free messages; the fixed Hub owns staff roles and the callback verifies them through Supabase.
- Invoice totals, numbers and paid status come only from DB triggers; payments are insert-only, so money state cannot drift.
- Entity changes are logged by the shared log_activity trigger; UIs only read public.activity, keeping audit append-only.
- src/components/admin and src/components/home have their own AGENTS.md; read it before changing files there.
- Clickable controls get the hand cursor from a global base rule in src/styles.css; never set cursor:default on interactive elements, so new buttons/links inherit it automatically.
- Services, categories and plans live in DB tables edited at /admin/site-content via role-checked server functions; the public layout loader splices published rows into the src/data registries (static fallback), so consumers stay unchanged and these pages are not prerendered. Keep shared design, isolated service CSS, serviceHead and VimeoPlayer-only embeds.
- Plan-derived copy reads the live plans registry at call time, never module-level copies, so Home and Pricing cannot drift.
- Home featured works and exact published count use src/lib/works.ts Query reads; failed counts remain null rather than invented totals.

- Booking interest helpers resolve published services and shared plans; exact interest prefixes the existing message while legacy need codes preserve SQL compatibility without schema changes.
- About uses the approved browser-safe team list rather than database fallback identities, ensuring supplied order and initials-only presentation.
- All public work thumbnails use VideoPreviewCard and a page-wide lazy preview controller to enforce one muted active player and three paused players; reduced motion and data saving prevent mounting. Service cards retain their lightbox action and dimensions.
- Hiring access uses protected hiring_user_roles/app_role; approved SQL owner sync grants/revokes admin, preserving legacy roles.
- Hiring CRUD uses role-checked functions, SQL snapshots and HTML-free Markdown.
- Hiring statuses change only through checked SQL RPCs; candidate_interviews is an invoker view over the private ownership-checked safe reader, never a raw assessment projection.
- Hiring templates/audits/submitted signatures are immutable; only own unfinished draft signatures can be replaced. Resolve the latest current version.
- Careers primes public RLS reads during SSR, then uses a separate authenticated no-store read for draft previews and own-application links; never place protected reads in public loaders or emit draft JobPosting data.
- Talent-pool submissions use the public publishable client and a normalized-email transactional trigger; staff-only read policies keep applicant contact details private.
- Enquiries use server-only app.create_enquiry; CRM mail goes via crm-emails.server.ts and the shared reminder endpoint, one delivery path.
- html lang comes from page-lang.ts; seoHead lang sets hreflang.
- Every email, agreement PDF and letter goes through public.delivery_outbox (src/lib/outbox.server.ts): enqueue a full snapshot first, then process; retries and the reminders endpoint/button resend only from the stored snapshot, and the (event, kind, trigger) key prevents double sends.
- Work feedback is public only via the work_public_stats RPC and approved-comment RLS; views insert only through deduped record_work_view, preventing inflation.
