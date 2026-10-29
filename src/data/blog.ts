// Hardcoded blog posts (no CMS). Images live in public/blog/<slug-folder>/.
export const SAZDAH_DIR = '/blog/sazdah';
export const DISCORD_URL = 'https://discord.gg/DF3cfYQmm';
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KNPhJo9DkGvKgCoRO2nH53';

export type BlogPostSummary = {
  slug: 'sazdah-tvc';
  path: '/blog/sazdah-tvc';
  category: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  cover: string;
  datePublished: string;
  dateLabel: string;
  readLabel: string;
};

export const sazdahPost: BlogPostSummary = {
  slug: 'sazdah-tvc',
  path: '/blog/sazdah-tvc',
  category: 'কেস স্টাডি',
  title: 'একটা পুরো টিভিসি, কোনো শুটিং ছাড়া',
  seoTitle: 'একটা পুরো টিভিসি, কোনো শুটিং ছাড়া | Admakai',
  description: 'সাজদাহর টিভিসি পুরোটা এআই দিয়ে বানানো। লোকেশন, ক্যারেক্টার শিট, ভয়েস আর ভিডিও প্রম্পট সহ পুরো প্রসেস খোলা।',
  excerpt: 'সাজদাহ হেয়ার কেয়ারের এই অ্যাডটা পুরোটা এআই দিয়ে বানানো। একটাও ক্যামেরা চলেনি, একজনও মডেল আসেনি। আমরা কিছু লুকাচ্ছি না, পুরো প্রসেসটা এই লেখায় খুলে দিলাম। ছবি, প্রম্পট, ভয়েস, এডিট, এমনকি যেগুলো ভুল হয়েছিল সেগুলোও।',
  cover: `${SAZDAH_DIR}/cover.jpg`,
  datePublished: '2026-10-29',
  dateLabel: '২৯ অক্টোবর ২০২৬',
  readLabel: '৮ মিনিট পড়া',
};

export const blogPosts: BlogPostSummary[] = [sazdahPost];
