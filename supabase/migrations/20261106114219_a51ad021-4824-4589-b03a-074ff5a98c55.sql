DELETE FROM public.work_services WHERE work_id IN (SELECT id FROM public.works WHERE slug LIKE 'tmp-%');
DELETE FROM public.works WHERE slug LIKE 'tmp-%';
DELETE FROM public.work_categories WHERE slug IN ('fashion', 'commercials');