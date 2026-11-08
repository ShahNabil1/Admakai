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
});