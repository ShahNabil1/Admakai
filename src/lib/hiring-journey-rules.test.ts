import {describe,it,expect} from 'vitest';
import {journeyDays,needsJourneyReason,letterKind,paidProjectTotal,documentBucket,fillHiringTemplate} from './hiring-journey-rules';
describe('Final hiring journey rules',()=>{
 it('requires a reason for Paused',()=>expect(needsJourneyReason('paused')).toBe(true));
 it('requires a reason for Ended',()=>expect(needsJourneyReason('ended')).toBe(true));
 it('creates an offer letter at Offer',()=>expect(letterKind('offer')).toBe('offer'));
 it('creates a promotion letter at Project',()=>expect(letterKind('project')).toBe('promotion'));
 it('creates a promotion letter at Salary',()=>expect(letterKind('salary')).toBe('promotion'));
 it('does not create a promotion at Learner',()=>expect(letterKind('learner')).toBeNull());
 it('sums only paid BDT project amounts',()=>expect(paidProjectTotal([{is_paid:true,amount:5000},{is_paid:false,amount:9000},{is_paid:true,amount:2500}])).toBe(7500));
 it('uses the private letters bucket for offer documents',()=>expect(documentBucket('offer_letter')).toBe('letters'));
 it('uses the private letters bucket for promotions',()=>expect(documentBucket('promotion_letter')).toBe('letters'));
 it('preserves agreement storage',()=>expect(documentBucket('agreement')).toBe('agreements'));
 it('counts the first stage day as one',()=>expect(journeyDays('2026-11-08T00:00:00Z',Date.parse('2026-11-08T12:00:00Z'))).toBe(1));
 it('fills stage and application variables',()=>expect(fillHiringTemplate('{{candidate_name}} {{stage_name}} {{application_code}}',{candidate_name:'Applicant',stage_name:'Project Stage',application_code:'ADM-7'})).toBe('Applicant Project Stage ADM-7'));
});
