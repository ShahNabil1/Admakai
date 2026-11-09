# Admakai

You are setting up the foundation of a marketing website for Admakai, an AI advertising Agency . Build only the foundation in this step. Do not design any page sections yet; I will give each section separately with its own design reference.

STACK AND RULES
- Vite + React + TypeScript + Tailwind CSS + shadcn/ui. Use React Router for routing.
- Connect Supabase DIRECTLY using the official @supabase/supabase-js client. Do NOT enable or connect Lovable Cloud in any way. If any step suggests Lovable Cloud, skip it.
- Create src/lib/supabase.ts that exports a single client created from these environment variables: VITE_SUPABASE_URL=[SUPABASE_URL] and VITE_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]. Add them to the project .env.
- This site has NO public user accounts. No sign up, no login, no profile pages for visitors. The only protected area is /admin, which will be built later.
- All content (projects, services, pricing, team, settings, leads) will come from Supabase tables later. For now create typed empty hooks in src/hooks/ (useProjects, useServices, usePricingTiers, useTeam, useSiteSettings) that query the tables of the same name and return { data, loading, error }. Do not create the tables yet.

DESIGN TOKENS (black and white palette, premium studio feel)
- Colors in tailwind.config and CSS variables: --bg: #0A0A0A; --surface: #141414; --line: #262626; --fg: #F5F5F5; --muted: #8A8A8A; --accent: #FFFFFF. Light sections may use --paper: #F6F6F6 with --ink: #111111.
- Fonts via Google Fonts: Inter (300 to 800) for all UI and body, Instrument Serif italic for display accents. Set Inter as the default font family on body. Add a .font-display utility for Instrument Serif.
- Type scale: display 72 to 120px with letter-spacing -0.03em and line-height 0.95; h2 44 to 56px; body 16 to 18px with line-height 1.6. Max content width 1280px with 24px side padding on mobile and 48px on desktop.
- Border radius 12px for cards, 999px for pills. Buttons: primary is white background with black text, secondary is 1px --line border with white text. Hover states on everything.

ANIMATION SETUP (install and configure, do not animate anything yet)
- Install framer-motion, gsap (with ScrollTrigger registered once in src/lib/gsap.ts), and lenis for smooth scrolling.
- Create src/components/motion/Reveal.tsx: a Framer Motion wrapper that fades and slides children up 24px when they enter the viewport, once, with props for delay and duration. Default duration 0.7s, ease [0.22, 1, 0.36, 1].
- Create src/components/motion/SplitText.tsx: splits a string into words, each word wrapped in an overflow-hidden span, and animates words up with a 0.04s stagger when in view.
- Create src/components/motion/Magnetic.tsx: a wrapper that makes a button follow the cursor slightly on hover (max 8px) and springs back.
- Initialise Lenis smooth scroll once in App.tsx and sync it with GSAP ScrollTrigger. Respect prefers-reduced-motion: if set, disable Lenis and make all motion components render instantly.
- Add a page transition: on route change, fade the page content in over 0.4s.

LAYOUT SHELL
- Create src/components/layout/Navbar.tsx and Footer.tsx as empty placeholders with just the word Navbar and Footer for now. I will design them in the next step.
- Create routes and empty page files that render only their title as an h1: / (Home), /work, /work/:slug, /services, /pricing, /about, /book-a-call, /admin. Wrap all public routes in a Layout component that renders Navbar, the page, and Footer.
- Set the document title to "Admakai" and add a favicon placeholder. Dark background on body by default.

Confirm when done by listing the files you created. Do not add any extra sections, hero content, or placeholder marketing copy.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://admakai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/501d0449-9e53-4830-89e1-c51ec60b3911).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
