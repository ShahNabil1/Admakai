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
- Public pages live under the pathless `_site` layout (Navbar/Footer/page transition); `/admin` sits outside it so the admin area gets its own shell.
- Lenis + GSAP ScrollTrigger are initialised once from `__root.tsx` via `src/lib/smooth-scroll.ts`; motion helpers in `src/components/motion/` must honour prefers-reduced-motion.
