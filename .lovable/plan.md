# Final hiring workflow

- Add secure journey milestone templates, private member notes, versioned legal-review letter templates and admin-only journey/role/pipeline actions in external Supabase.
- Create offer and promotion PDFs in private letters storage, attach them to hiring emails and provide regeneration controls.
- Add the Team journey board and member drawer, candidate Journey view with live milestones, email template/log management and hiring settings editors.
- Preserve existing non-hiring pages and use the current design, PDF and email services.
- Run focused tests, rollback-only permission checks and Careers/me/admin smoke checks; document launch actions that require a real signed-in account.

## Technical approach
Use authenticated TanStack server functions with SQL authorization. Extend journey stage changes using additive triggers, keeping existing functions intact. Reuse hiring roles and existing private storage; candidate reads remain explicitly owner-scoped.