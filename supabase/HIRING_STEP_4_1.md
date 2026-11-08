# Hiring Step 4.1: private image storage

## Created
- Private `hiring-media` bucket, 5 MB image limit.
- Seven new policies on `storage.objects`, scoped to this bucket: `hiring_media_read`, `hiring_media_insert`, `hiring_media_update`, `hiring_media_delete`, and restrictive insert/update/delete guards.
- Anonymous and signed-in visitors may read objects. Only the existing hiring `admin` role may upload, replace or delete objects. Existing `public.has_role` / `hiring_user_roles` are reused.

## Image flow
- Cover and internship poster uploads now target `hiring-media`, not a public bucket; fields save permanent object paths.
- Browser page-load signing requests create one-hour image URLs with in-memory deduplication and renewal before expiry. No localStorage or expiring URLs in saved job/settings fields.
- Covers render in Careers role cards and job details; admin cover/poster previews use the same resolver.
- YouTube without a custom poster uses `maxresdefault.jpg`, falling back to `hqdefault.jpg` on an error or YouTube's tiny missing-image placeholder. Vimeo/MP4 without a poster keep their dark gradient.
- Private company uploads in `hiring-assets` are unchanged.
- App code has no old public-upload target references. Historical migration/inventory files remain unchanged.
- Private object paths are not emitted as share-image URLs.

## Verification
- External Supabase confirms `hiring-media` is private; all seven new policies exist.
- 546 tests pass, including exact 3600-second signing, caching, renewal, failed-sign retries and YouTube fallback rules. Preview reports build OK.
- Anonymous desktop/mobile browser fixture confirms signed covers render, two covers share one signing request, maxres failure selects hq, Vimeo has no poster, and no overflow/runtime errors.
- Real admin upload followed by anonymous job-page readback is **not verified**: this external Supabase/Hub provides no authenticated test session. Current database has only a draft job with no cover and no configured video/poster; no test job was published or personal account modified.

No Lovable Cloud, public bucket or workspace-setting changes. Other bucket policies and existing admin page bodies/data were untouched. Fourteen pre-existing security advisories remain; this migration introduced none.