import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { publishedWorksQueryOptions, recentFeaturedWorks } from '@/lib/works';
import { WorkCard } from '@/components/public/WorkPage';
import { Reveal } from '@/components/motion/Reveal';
import '@/components/public/work-page.css';
export function RecentWork() {
  const { data } = useSuspenseQuery(publishedWorksQueryOptions);
  const works = recentFeaturedWorks(data);
  const [previewId, setPreviewId] = useState<string | null>(null);
  return <section className="container-site page-section" aria-labelledby="recent-work-title">
    <Reveal><p className="page-eyebrow">Our work</p><h2 id="recent-work-title" className="section-title serif">Recent work</h2></Reveal>
    <div className="workpage-grid">{works.map(work => <WorkCard key={work.id} work={work} previewing={previewId === work.id} onPreview={setPreviewId} />)}</div>
    <p className="plan-note"><Link to="/work">See all work</Link></p>
  </section>;
}
