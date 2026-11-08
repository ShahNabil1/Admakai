# Work videos: hover preview, click-to-play, views, reactions, comments, admin feedback

## One thing changed from the request (safety)
Starting numbers that admins type in for views and reactions are fine. They get added to the real counts. Comments are different: made-up comments shown as if real viewers wrote them count as fake reviews. That is illegal in many places, including under the US FTC rule from 2024, and it can damage Admakai's reputation if someone notices.
So comments added from the admin will show as **"Admakai team"** or **"Client feedback"** (when it is real client feedback). They will not show as made-up viewers. Everything else follows the answers you gave.

## 1. Fix "click does not play"
- Reproduce the bug in a browser on /work and on the video page first. The cause is not confirmed yet.
- Clicking a card opens the video page, and the video starts playing there with sound where the browser allows it. Otherwise it plays muted with the "Tap to unmute" button.

## 2. YouTube-style hover preview
- With a mouse, hovering a card starts a muted preview after a short delay. Moving away stops it. This is already partly built, so it gets checked and fixed on /work, Home and the service pages.
- On phones, the card most visible on screen previews (existing behaviour). Reduced-motion and data-saver users get no previews.

## 3. Views
- Each video has a "starting views" number set in admin (for example 30,000 to 100,000). The public count is starting views plus real views.
- A real view is counted once per visitor per video per 24 hours, after about 3 seconds of watching.
- The count shows under the title, for example "1.3 lakh views", in compact format.

## 4. Reactions (LinkedIn style)
- Six reactions: Like, Celebrate, Support, Love, Insightful, Funny. Hover or long-press to choose one.
- Signed-in users only. One reaction per person per video, which they can change or remove.
- The public total is the admin's starting number plus real reactions, with the top 3 reaction icons shown.

## 5. Comments
- Signed-in users can write a comment, up to 1,000 characters. It goes to admin for approval first, and the writer sees "Waiting for approval".
- Approved comments show the person's name and initials avatar, with no profile link.
- Admin can hide or remove any comment.
- Admin can add pinned "Admakai team" or "Client feedback" comments (see above).

## 6. Admin: new "Portfolio feedback" section
- Overview: total views, reactions, comments and pending approvals, with the top videos for the last 7 or 30 days.
- Per video: real views over time, signed-in viewers (name/email) next to an anonymous count, reaction breakdown, and an editor for the starting views and reactions.
- Comment queue: Pending, Approved and Hidden tabs with Approve, Hide and Delete, plus who wrote it and when.
- Owners and hiring admins can use it, the same people who edit site content.

## Technical details
- External Supabase, add-only migration with explicit GRANTs, RLS, and revoked default privileges:
  - `works`: add `base_views int`, `base_reactions int` (default 0).
  - `work_views(work_id, viewer_id null, visitor_hash, created_at)`: insert only through RPC `app.record_work_view` with a 24h dedupe. There is no public SELECT; counts come from a security-definer `work_public_stats(work_ids)`.
  - `work_reactions(work_id, user_id, kind, unique(work_id,user_id))`: users write their own rows through RLS.
  - `work_comments(work_id, user_id null, author_label, body, status pending|approved|hidden, is_team bool)`. Public reads see approved comments only, owners read their own, and staff manage everything through role-checked policies. Changes are logged by the existing `log_activity` trigger.
- Server functions use RLS middleware. Public stats use a publishable-key server read primed in the route loader.
- Hover logic reuses VideoPreviewCard and the preview controller. Cards keep their current sizes.
- Tests: view dedupe window, count = base + real, one reaction per user, pending comments hidden from public, and only staff can approve.
- Verify in a browser: hover preview, click plays, signed-in react and comment, and approval in admin.
