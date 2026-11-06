WITH cat AS (
  INSERT INTO public.work_categories (slug, name, sort_order) VALUES
    ('fashion', 'Fashion', 1), ('commercials', 'Commercials', 2)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
), allcats AS (SELECT id, slug FROM cat UNION ALL SELECT id, slug FROM public.work_categories WHERE slug IN ('fashion','commercials'))
INSERT INTO public.works (slug, title, vimeo_id, aspect, duration_sec, thumbnail_url, category_id, client_name, industry, year, short_description, tags, featured, published, sort_order, case_study)
SELECT v.slug, v.title, v.vimeo_id, v.aspect, v.duration_sec, v.thumbnail_url, c.id, v.client_name, v.industry, v.year, v.short_description, v.tags, v.featured, v.published, v.sort_order, v.case_study::jsonb
FROM allcats c JOIN (VALUES
  ('tmp-serum-launch', 'Summer Serum Launch', '1227685387', '16:9', 34, NULL, 'commercials', 'Gentle Park', 'Beauty', 2026, 'A launch film for a summer serum.', ARRAY['skincare','serum'], true, true, 1, '{"is_sample":true}'),
  ('tmp-fashion-reel-one', 'Fashion Reel One', '1244180887', '9:16', 21, NULL, 'fashion', 'Gentle Park', 'Fashion', 2026, NULL, ARRAY['fashion'], false, true, 2, '{}'),
  ('tmp-fashion-reel-two', 'Fashion Reel Two', '1244180887', '9:16', 18, NULL, 'fashion', NULL, 'Fashion', 2026, NULL, ARRAY['fashion'], false, true, 3, '{}'),
  ('tmp-product-square', 'Product Square Cut', '1227685387', '1:1', 15, NULL, 'commercials', NULL, NULL, 2026, NULL, ARRAY[]::text[], false, true, 4, '{}')
) AS v(slug, title, vimeo_id, aspect, duration_sec, thumbnail_url, cat_slug, client_name, industry, year, short_description, tags, featured, published, sort_order, case_study)
ON c.slug = v.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM public.works w WHERE w.slug = v.slug);
INSERT INTO public.works (slug, title, vimeo_id, aspect, duration_sec, thumbnail_url, category_id, client_name, industry, year, short_description, tags, featured, published, sort_order, case_study)
SELECT 'tmp-no-cat', 'Uncategorized Wide', '1227685387', '16:9', 40, NULL, NULL, NULL, NULL, 2026, NULL, ARRAY[]::text[], false, true, 5, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.works WHERE slug = 'tmp-no-cat');