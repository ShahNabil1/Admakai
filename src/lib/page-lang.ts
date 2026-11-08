/** Bengali pages: the blog index and its articles. Everything else is English. */
export function pageLang(pathname: string): 'bn' | 'en' { return pathname === '/blog' || pathname.startsWith('/blog/') ? 'bn' : 'en'; }
