import { expect, it } from 'vitest';
import { pageLang } from './page-lang';
it('marks the blog index Bengali',()=>expect(pageLang('/blog')).toBe('bn'));
it('marks blog articles Bengali',()=>expect(pageLang('/blog/video-lighting-guide')).toBe('bn'));
it('keeps other pages English',()=>expect(pageLang('/blogger')).toBe('en'));
