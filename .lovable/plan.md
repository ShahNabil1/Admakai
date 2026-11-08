# Admin Analytics (Admin → Analytics)

A new light-themed page inside the admin, matching the current admin design, showing what visitors do on admakai.com — including people who start booking a call but leave before finishing.

## What you will see

**Top number cards** (with date range: Today / 7 days / 30 days / custom, Dhaka time)
- Visitors, visits, page views
- Average time on site, average time per page
- Bounce (left after one page)
- Booking clicks, booking started, booking completed, booking conversion %
- Enquiries sent

**Traffic over time** — line chart of visits and page views per day/hour.

**Pages** — table of every page: views, visitors, average time spent, how far people scroll, exit rate. Click a page to see what was clicked on it.

**Visitor journey (path flow)** — a flow diagram: where people land, which page they go to next, where they leave. Example: Home → Services → Pricing → Book.

**Booking funnel** — step-by-step bars:
```text
Clicked "Book a call" → Opened booking page → Chose service → Chose date/time → Filled details → Booked
```
with how many dropped at each step.

**Unfinished bookings (lost leads)** — the important one you asked for. When a visitor types their name/email/WhatsApp in the booking form but leaves without booking, their details are saved automatically. You see a list: name, email, WhatsApp, which service, which step they stopped at, when. Buttons: "Mark contacted", "Turn into lead", "Delete". If they later finish booking, they disappear from this list automatically.

**Clicks** — most-clicked buttons (Book a call, WhatsApp, Pricing, service cards, video plays, offer bar).

**Where visitors come from** — Google, Facebook, Instagram, direct, other sites, campaign links (utm).

**Visitor details** — country/city (approximate), phone vs desktop, browser, new vs returning.

**Video & content** — most watched portfolio videos and blog posts (reuses your existing view counts).

**Live now** — how many people are on the site in the last 5 minutes and which page.

**Single visit view** — click any visit to see its timeline: pages in order, time on each, clicks, whether they booked.

## Privacy
- No personal data is stored for anonymous visitors — only a random visitor ID in their browser.
- Booking form details are saved only after a visible line under the form: "We save what you type so we can help if you don't finish." (needed for honesty and law).
- Your own team's visits (signed-in staff) are excluded from numbers.
- Raw visit data older than 13 months is cleared automatically.
- Privacy page gets one line about this.

## Who can see it
Owners and hiring admins (same as other admin sections).

## Technical details
- Tracking script loaded once from the public `_site` layout: page view on route change, heartbeat every 15s while tab visible (for time on page), scroll depth, clicks on elements marked `data-track`, booking step events from the `/book` wizard handlers.
- Events sent in batches via `navigator.sendBeacon` to a public server route `/api/public/track` that validates and rate-limits, then inserts with the server publishable client into a narrow insert-only `analytics_events` table (no public reads). Sessions table derived by SQL.
- Booking drafts: debounced upsert of the wizard's details step into `booking_drafts` (keyed by random draft id); `app.create_booking` marks the matching draft completed.
- Admin reads through role-checked server functions calling SQL aggregate functions (staff check via user_roles / hiring roles). Charts drawn as inline SVG, Sankey for journeys.
- Also emit matching `project.*` events to the built-in Lovable analytics so data exists in both.
- External Supabase only, additive migration with explicit grants; tests for funnel step rules, time-on-page calc and draft completion.

## Questions before building
1. Should lost booking leads also send you an email alert? (Optional.)
2. Should the WhatsApp/phone number be saved as soon as typed, or only when the visitor moves to the next step?
