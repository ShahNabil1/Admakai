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
- /app is a noindex protected client shell outside _site; root owns auth invalidation, start attaches its session bearer, and private server functions use RLS middleware. Uploads use signed URLs, real transfer progress and server signature validation.
- The /book wizard keeps all selections and details in its page state; its calendar only presents SQL-returned availability and keyboard focus never commits a choice, so navigation cannot accidentally advance a step.
- Public pages live under the pathless `_site` layout (Navbar/Footer/page transition); `/admin` sits outside it so the admin area gets its own shell.
- Lenis + GSAP ScrollTrigger are initialised once from `__root.tsx` via `src/lib/smooth-scroll.ts`; motion helpers in `src/components/motion/` must honour prefers-reduced-motion.
- The public Layout renders the Home fixed Navbar directly before main, outside hero isolation and page-transition containers, and the shared Footer after main on every public route.
- Navbar scroll direction is resolved by a tested browser-safe helper; the Navbar owns its listener and keeps the mobile menu above the fixed wrapper.
- Motion components use the hydration-safe motion preference hook to keep server and initial browser markup identical before applying reduced motion.
- The Home client section owns its scoped styles and reads logo pointers and counts from `src/data/clients.ts`; CSS translates duplicated marquee tracks so continuous motion needs no JavaScript loop.
- Home tool-stack badges resolve their icon from a position in `toolSprites` (`src/data/tools.ts`) sampled out of the single `public/tools/tools-sprite.png` sheet, so adding a tool logo is one position entry rather than a new file plus a component branch; a tool with no position keeps the coloured monogram.
- Home ethics owns its scoped styling and uploaded image pointer; its scroll animation is locally cleaned up and disabled for reduced motion to preserve the shared scroll lifecycle.
- Home pricing reads its amounts and plan terms from a browser-safe pricing data module, not the unused database hook; numeric amounts alone count up and placeholders stay literal until configured.
- Home FAQ and its route-head FAQPage structured data share one browser-safe data module; use the TanStack head scripts API rather than react-helmet, and keep accordion state single-valued with accessible button headings.
- Footer settings use a public publishable-key server read of allowlisted key/value site_settings rows and a route-primed Query cache; missing tables or settings resolve to safe local fallbacks, never admin reads.
- LegalPage reads Privacy/Terms from browser-safe legal data; refund stays unapproved. Footer imagery uses asset pointers and a duplicated landscape mask.
- SEO uses the shared browser-safe `seoHead` helper in each leaf route and Organization data in the public layout, not Helmet or root share images, to preserve SSR tags and per-page sharing.
- Public SEO route inventory drives build-time sitemap generation and explicit prerender paths; admin is lazily imported and never prerendered, while unavailable public project data falls back atomically to static URLs.
- Omit unknown prices, team identities, project video facts and contacts from structured data; only emit complete record schemas when the corresponding public content exists.
- Inner pages prime public-content Query options in route loaders; the existing typed hooks subscribe with Suspense and server reads use allowlisted tables/projections and static fallbacks so missing tables still SSR useful content.
- Public enquiries validate fields and image signatures on the server, use publishable-key RLS writes and store private attachment paths; never log personal data or report an unsaved enquiry as delivered.
- Inner-page styling is scoped to public-page elements and shared PageElements; reuse Home motion, FAQ and tool-stack without modifying Home content.
- Booking contacts stay separate from sitewide contacts. Enquiries sync photo previews to FormData and use libphonenumber metadata with bundled country-flag-icons SVGs for international phone selection/validation.
- Blog posts are hardcoded components (metadata in `src/data/blog.ts`); missing media renders a filename placeholder so layout never breaks.
- /admin uses sso.ts's fixed Hub origin to avoid stale overrides, with a same-origin state-checked callback; Hub owns staff roles.
- Invoice totals, numbering and paid status are owned by database triggers (payments only insert, never edit); the UI never writes subtotal/paid_total, so money state cannot drift.
- Entity changes are logged to public.activity by the shared log_activity trigger; admin timelines read it instead of writing their own records, keeping the audit trail append-only.
- Admin popups/confirmations use the shared Modal/useConfirm helpers in src/components/admin/ui.tsx so every irreversible action gets the same confirmation flow.
