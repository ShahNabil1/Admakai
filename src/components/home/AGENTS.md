- Home tool-stack badges resolve their icon from a position in `toolSprites` (`src/data/tools.ts`) sampled out of the single `public/tools/tools-sprite.png` sheet, so adding a tool logo is one position entry rather than a new file plus a component branch; a tool with no position keeps the coloured monogram.
- Home ethics owns its scoped styling and uploaded image pointer; its scroll animation is locally cleaned up and disabled for reduced motion to preserve the shared scroll lifecycle.
- Home and Pricing use src/data/plans.ts for monthly terms and USD ranges, formatted by useCurrency; Growth powers Content Partner and its numeric ranges retain entry animation.
- Home FAQ and its route-head FAQPage structured data share one browser-safe data module; use the TanStack head scripts API rather than react-helmet, and keep accordion state single-valued with accessible button headings.

- Home cards derive service text and links from the catalogue; live published-work count and recent featured cards share works Query helpers and the WorkCard presentation with VideoPreviewCard media.
- The Home client section owns its scoped styles and reads logo pointers and counts from `src/data/clients.ts`; CSS translates duplicated marquee tracks so continuous motion needs no JavaScript loop.
