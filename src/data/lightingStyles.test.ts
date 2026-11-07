import { describe, expect, it } from 'vitest';
import { lightingStyles, buildPrompt, moodFinder, styleCategories, glossary, MASTER_TEMPLATE, REFERENCE_BLOCK } from './lightingStyles';
import { lightingPost } from './blog';

describe('lighting guide data', () => {
  it('has 34 style slots with unique ordered ids', () => {
    expect(lightingStyles).toHaveLength(34);
    lightingStyles.forEach((s, i) => expect(s.id).toBe(i + 1));
  });

  it('has full approved content for styles 1 to 8 and pending slots after', () => {
    const ready = lightingStyles.filter(s => !s.pending);
    expect(ready.map(s => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const s of ready) {
      expect(s.what.length).toBeGreaterThan(10);
      expect(s.when.length).toBeGreaterThan(10);
      expect(s.light.length).toBeGreaterThan(20);
      expect(s.colour.length).toBeGreaterThan(20);
      expect(s.tip.length).toBeGreaterThan(10);
    }
    expect(lightingStyles.filter(s => s.pending)).toHaveLength(26);
  });

  it('builds prompts from the master template with style name, light and colour', () => {
    const style = lightingStyles[0]!;
    const prompt = buildPrompt(style);
    expect(prompt).toContain(`LIGHTING CHANGE ONLY: ${style.nameEn}`);
    expect(prompt).toContain(`LIGHT: ${style.light}`);
    expect(prompt).toContain(`COLOUR: ${style.colour}`);
    expect(prompt).not.toContain('{NAME}');
    expect(prompt).not.toContain('{LIGHT}');
    expect(prompt).not.toContain('{COLOUR}');
    expect(prompt).not.toContain('REFERENCE:');
    const withRef = buildPrompt(style, true);
    expect(withRef).toContain(REFERENCE_BLOCK);
  });

  it('master template keeps its block order and line breaks', () => {
    const blocks = ['LIGHTING CHANGE ONLY:', 'INPUT:', 'LOCK (HIGHEST PRIORITY):', 'LIGHT:', 'COLOUR:', 'CONSISTENCY:', 'FINISH:'];
    let last = -1;
    for (const block of blocks) {
      const at = MASTER_TEMPLATE.indexOf(block);
      expect(at).toBeGreaterThan(last);
      last = at;
    }
    expect(MASTER_TEMPLATE.split('\n').length).toBeGreaterThan(10);
  });

  it('mood finder ids reference existing styles', () => {
    const ids = new Set(lightingStyles.map(s => s.id));
    for (const m of moodFinder) for (const id of m.ids) expect(ids.has(id)).toBe(true);
    expect(moodFinder).toHaveLength(12);
  });

  it('every style category is covered by the filter chips', () => {
    for (const s of lightingStyles) expect(styleCategories).toContain(s.category);
  });

  it('glossary has the seven approved terms', () => {
    expect(glossary.map(g => g.term)).toEqual(['কী লাইট', 'ফিল লাইট', 'ব্যাক বা রিম লাইট', 'কনট্রাস্ট রেশিও', 'কালার টেম্পারেচার', 'হার্ড বনাম সফট আলো', 'মোটিভেটেড আলো']);
  });

  it('uses no em dashes or en dashes in reader-facing text', () => {
    const texts: string[] = [lightingPost.title, lightingPost.seoTitle, lightingPost.description, lightingPost.excerpt];
    for (const s of lightingStyles) texts.push(s.nameBn, s.what, s.when, s.tip, s.category, s.mood, s.specs.direction, s.specs.contrast, s.specs.temperature, s.specs.quality);
    for (const g of glossary) texts.push(g.term, g.meaning);
    for (const m of moodFinder) texts.push(m.mood);
    for (const text of texts) {
      expect(text).not.toContain('—');
      expect(text).not.toContain('–');
    }
  });
});
