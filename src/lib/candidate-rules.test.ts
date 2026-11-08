import { describe, expect, it } from 'vitest';
import { shouldSendHiringEmail, IMPORTANT_EMAILS, interviewJoinEnabled, taskDueAt, safeCandidatePath, applicationTimeline, PDF_POLL_MS, PDF_POLL_LIMIT_MS } from './candidate-rules';
describe('Candidate dashboard rules', () => {
  for (const key of IMPORTANT_EMAILS) it(`always sends important ${key} updates`, () => expect(shouldSendHiringEmail(key,true,false)).toBe(true));
  it('skips routine notifications when disabled', () => expect(shouldSendHiringEmail('in_review',true,false)).toBe(false));
  it('respects disabled templates even for important updates', () => expect(shouldSendHiringEmail('hired',false,true)).toBe(false));
  it('sends admin alerts independently of candidate preferences', () => expect(shouldSendHiringEmail('admin_new_application',true,false)).toBe(true));
  it('enables Meet exactly ten minutes before', () => { const t=Date.parse('2026-11-09T10:00:00Z'); expect(interviewJoinEnabled('2026-11-09T10:00:00Z',t-600001)).toBe(false); expect(interviewJoinEnabled('2026-11-09T10:00:00Z',t-600000)).toBe(true); });
  it('computes task due from shortlisting not page load', () => expect(taskDueAt('2026-11-08T10:00:00Z',3)).toBe('2026-11-11T10:00:00.000Z'));
  it('rejects external sign-in destinations', () => { expect(safeCandidatePath('//evil.example')).toBe('/me'); expect(safeCandidatePath('/me/profile')).toBe('/me/profile'); });
  it('polls PDFs every two seconds', () => expect(PDF_POLL_MS).toBe(2000));
  it('stops PDF polling after forty seconds', () => expect(PDF_POLL_LIMIT_MS).toBe(40000));
  it('includes only side stages that happened', () => { const stages=['submitted','in_review','waitlist','rejected','withdrawn'].map((key,n)=>({key,sort_order:n,is_negative:key==='rejected',is_terminal:false,candidate_label:key})); expect(applicationTimeline(stages,[], 'submitted').map(s=>s.stage.key)).toEqual(['submitted','in_review']); });
});