import {describe,it,expect} from 'vitest';
import {canMoveHiring,reminderEligible,interviewIcs,averageRating,csvCell,dhakaInput} from './hiring-review-rules';
describe('Hiring Prompt 6 rules',()=>{
 it('reviewers stop at interview_done',()=>{expect(canMoveHiring(['reviewer'],'interview_done')).toBe(true);for(const key of ['selected','offer','hired','rejected'])expect(canMoveHiring(['reviewer'],key)).toBe(false);});
 it('interviewers cannot move stages',()=>expect(canMoveHiring(['interviewer'],'in_review')).toBe(false));
 it('admins may select',()=>expect(canMoveHiring(['admin'],'selected')).toBe(true));
 it('reminders run once between 23 and 25 hours',()=>{const now=new Date('2026-11-08T10:00:00Z');expect(reminderEligible('2026-11-09T10:00:00Z',null,now)).toBe(true);expect(reminderEligible('2026-11-09T08:59:00Z',null,now)).toBe(false);expect(reminderEligible('2026-11-09T11:01:00Z',null,now)).toBe(false);expect(reminderEligible('2026-11-09T10:00:00Z','2026-11-08',now)).toBe(false);});
 it('calendar carries exact start, end and Meet location',()=>{const text=interviewIcs({id:'123',scheduled_at:'2026-11-09T04:00:00Z',duration_minutes:30,mode:'meet',meet_link:'https://meet.google.com/abc',office_address:null},'Editor');expect(text).toContain('DTSTART:20261109T040000Z');expect(text).toContain('DTEND:20261109T043000Z');expect(text).toContain('SUMMARY:Admakai interview: Editor');expect(text).toContain('LOCATION:https://meet.google.com/abc');});
 it('Dhaka input is six hours ahead of UTC',()=>expect(dhakaInput('2026-11-09T04:00:00Z')).toBe('2026-11-09T10:00'));
 it('averages all rated axes only',()=>expect(averageRating([{skill_score:5,thinking_score:3,commitment_score:null}])).toBe(4));
 it('CSV neutralizes formula values',()=>expect(csvCell('=1+1')).toBe('"\'=1+1"'));
});import {ratingTone,weeklyApplyRatio} from './hiring-review-rules';
describe('Applications board helpers',()=>{
 it('unrated applicants stay neutral',()=>expect(ratingTone(0,0)).toBe('none'));
 it('rating tones split at 4 and 2.5',()=>{expect(ratingTone(4,1)).toBe('good');expect(ratingTone(3.9,2)).toBe('mid');expect(ratingTone(2.5,1)).toBe('mid');expect(ratingTone(2.4,1)).toBe('low');});
 it('compares the last 7 Dhaka days with the 7 before',()=>{const now=new Date('2026-11-08T12:00:00Z');const r=weeklyApplyRatio(['2026-11-08T05:00:00Z','2026-11-07T05:00:00Z','2026-11-03T05:00:00Z','2026-10-30T05:00:00Z','2026-10-20T05:00:00Z'],now);expect(r.current).toBe(3);expect(r.previous).toBe(1);expect(r.change).toBe(200);expect(r.days).toHaveLength(7);expect(r.days[6]).toBe(1);});
 it('no previous week gives no percentage',()=>expect(weeklyApplyRatio(['2026-11-08T05:00:00Z'],new Date('2026-11-08T12:00:00Z')).change).toBeNull());
});
