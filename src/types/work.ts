export type WorkAspect = '16:9' | '9:16' | '1:1' | '4:5';

export type CaseStudy = {
  is_sample?: boolean;
  overview?: string;
  problems?: string[];
  solutions?: string[];
  process?: { title: string; body: string }[];
  tools?: string[];
  deliverables?: string[];
  result?: string;
  metrics?: { label: string; value: string }[];
  testimonial?: { quote: string; name: string; role: string } | null;
};

export type WorkCategory = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Work = {
  id: string;
  slug: string;
  title: string;
  vimeo_id: string;
  aspect: WorkAspect;
  duration_sec: number | null;
  thumbnail_url: string | null;
  category_id: string | null;
  client_name: string | null;
  industry: string | null;
  year: number | null;
  short_description: string | null;
  tags: string[];
  featured: boolean;
  published: boolean;
  sort_order: number;
  case_study: CaseStudy;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkService = {
  work_id: string;
  service_slug: string;
  position: number;
};

export type WorkServiceLink = { service_slug: string; position: number };
