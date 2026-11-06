import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync('supabase/migrations/20261106120900_50fc2a79-113e-4094-9d2f-25b02e216087.sql', 'utf8');
const categories = sql.split('insert into work_categories')[1]?.split('on conflict')[0] ?? '';
const works = sql.split('v(slug, title, vimeo_url')[1]?.split('),\nx as')[0] ?? '';
const links = sql.split('with s(work_slug, service_slug, position)')[1]?.split('insert into work_services')[0] ?? '';

describe('approved portfolio import counts', () => {
  it('contains the approved 10 categories', () => {
    expect(categories.match(/^  \('/gm)).toHaveLength(10);
  });
  it('contains the approved 75 works', () => {
    expect(works.match(/^  \('/gm)).toHaveLength(75);
  });
  it('contains the approved 114 ordered service links', () => {
    expect(links.match(/^  \('/gm)).toHaveLength(114);
  });
});