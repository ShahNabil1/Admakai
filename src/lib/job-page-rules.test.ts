import { describe, expect, it } from 'vitest';
import { isJobDetailsPath, jobChips, jobFaqs, mentionsMoney, postedLabel, seatsLine } from './job-page-rules';
import { readFileSync } from 'node:fs';

describe('Job details page rules', () => {
  it('gives only the job page the light header', () => {
    expect(isJobDetailsPath('/careers/ai-artist-intern')).toBe(true);
    expect(isJobDetailsPath('/careers')).toBe(false);
    expect(isJobDetailsPath('/careers/ai-artist-intern/apply')).toBe(false);
  });
  it('shows the four internship chips in order', () => {
    expect(jobChips({ type: 'internship', work_mode: 'hybrid', experience_level: 'none', schedule: 'evening' }))
      .toEqual(['AI Filmmaking', 'No experience needed', 'Evening hours', 'Hybrid']);
  });
  it('drops No experience needed when experience is required', () => {
    expect(jobChips({ type: 'full_time', work_mode: 'office', experience_level: 'mid', schedule: 'day' })).toEqual(['Full-time', 'Day hours', 'Office']);
  });
  it('reads only complete FAQ rows', () => {
    expect(jobFaqs([{ question: 'Q?', answer: 'A.' }, { question: '', answer: 'x' }, 'bad', null])).toEqual([{ question: 'Q?', answer: 'A.' }]);
    expect(jobFaqs(null)).toEqual([]);
  });
  it('adds seats only when the job has them', () => {
    expect(seatsLine(10)).toBe(' · 10 seats in this batch');
    expect(seatsLine(null)).toBe('');
  });
  it('formats the posted date in Dhaka time', () => {
    expect(postedLabel('2026-11-07T20:00:00Z')).toBe('Posted 8 November 2026');
  });
  it('spots money words', () => {
    for (const t of ['No fee', 'It is free', 'Paid projects', 'A salaried spot', 'stipend']) expect(mentionsMoney(t)).toBe(true);
    expect(mentionsMoney('Learn from zero. Work on real brand projects. The best join our core team.')).toBe(false);
  });
});

describe('Careers screens have no money wording', () => {
  const files = ['JobDetailsPage.tsx', 'CareersPage.tsx', 'CareerBoard.tsx', 'ApplicationSignIn.tsx'];
  for (const file of files) it(file, () => {
    const visible = readFileSync(`src/components/careers/${file}`, 'utf8')
      .replace(/import[^\n]*\n/g, '').replace(/className="[^"]*"/g, '').replace(/\/\/[^\n]*/g, '');
    expect(visible.match(/['">]([^'"<>{}]*)['"<]/g)?.find(mentionsMoney) ?? null).toBeNull();
  });
});
