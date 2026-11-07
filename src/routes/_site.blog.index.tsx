import { createFileRoute, Link } from "@tanstack/react-router";
import { seoHead, breadcrumbs } from '@/lib/seo';
import { blogPosts } from '@/data/blog';
import { SafeImg, Section } from '@/components/blog/BlogParts';

export const Route = createFileRoute("/_site/blog/")({
  head: () => seoHead({ title: 'ব্লগ | Admakai', description: 'আমরা যে কাজগুলো করি, সেগুলো কীভাবে করি তার পুরোটা। Admakai-এর কেস স্টাডি আর এআই প্রসেস।', path: '/blog', jsonLd: [breadcrumbs([{ name: 'ব্লগ', path: '/blog' }])] }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="blog-page">
      <div className="blog-inner">
        <Section className="blog-index">
          <h1>ব্লগ</h1>
          <p>আমরা যে কাজগুলো করি, সেগুলো কীভাবে করি তার পুরোটা।</p>
          <div className="blog-grid">
            {blogPosts.map(post => (
              <Link key={post.slug} to={post.path} className="blog-card blog-frame">
                {post.cover
                  ? <SafeImg src={post.cover} alt={post.title} ratio="16 / 10" />
                  : <div className="blog-css-cover" role="img" aria-label={post.title} style={{ aspectRatio: '16 / 10' }} />}
                <div className="blog-card-body">
                  <span className="blog-chip">{post.category}</span>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <span className="blog-meta">{post.readLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
