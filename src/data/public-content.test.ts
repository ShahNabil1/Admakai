import { describe, expect, it } from 'vitest';
import { pricingTiers } from './pricing';
import { services } from './services';
import { projects, filterProjects } from './projects';
import { team } from './team';
describe('Public content rules',()=>{
 for(const [slug,videos,statics,rounds,days] of [['starter',4,8,2,5],['growth',8,16,2,5],['scale',16,30,3,3]] as const){
  it(`${slug} video allowance`,()=>expect(pricingTiers.find(p=>p.slug===slug)?.videos).toBe(videos));
  it(`${slug} static allowance`,()=>expect(pricingTiers.find(p=>p.slug===slug)?.statics).toBe(statics));
  it(`${slug} revision allowance`,()=>expect(pricingTiers.find(p=>p.slug===slug)?.revisionRounds).toBe(rounds));
  it(`${slug} turnaround`,()=>expect(pricingTiers.find(p=>p.slug===slug)?.turnaroundDays).toBe(days));
 }
 it('leaves every plan price unset',()=>expect(pricingTiers.every(p=>p.price==='[price]')).toBe(true));
 it('keeps every explicitly listed service',()=>expect(services.map(s=>s.slug)).toEqual(['ai-commercial-30','ai-commercial-60','ai-ugc-ads','ad-variant-pack','product-film','ai-product-photoshoot','fashion-film-lookbook','ai-brand-model','digital-clone','ai-presenter-video','training-video','reels-pack','ai-video-editing','motion-logo-animation','ai-voiceover','dubbing-lip-sync']));
 for(const [slug,days] of [['ai-commercial-30','7 days'],['ai-commercial-60','7 days'],['ai-ugc-ads','5 days'],['ad-variant-pack','5 days'],['product-film','5 days'],['ai-product-photoshoot','3 days'],['fashion-film-lookbook','7 days'],['ai-brand-model','5 days'],['digital-clone','Setup: 5 days'],['ai-presenter-video','5 days'],['training-video','7 days per 5 modules'],['reels-pack','5 days'],['ai-video-editing','3 days'],['motion-logo-animation','4 days'],['ai-voiceover','2 days'],['dubbing-lip-sync','3 days']])it(`${slug} delivery`,()=>expect(services.find(s=>s.slug===slug)?.turnaround).toBe(days));
 it('marks six projects as samples',()=>{expect(projects).toHaveLength(6);expect(projects.every(p=>p.isPlaceholder)).toBe(true);});
 it('marks four team profiles as samples',()=>{expect(team).toHaveLength(4);expect(team.every(p=>p.isPlaceholder)).toBe(true);});
 it('honours category filtering',()=>expect(filterProjects(projects,'ugc','').map(p=>p.slug)).toEqual(['sample-ugc']));
 it('honours client filtering',()=>expect(filterProjects(projects,'all','unknown')).toEqual([]));
 it('does not expose unpublished rows',()=>expect(filterProjects([{...projects[0],isPublished:false}] as typeof projects,'all','')).toEqual([]));
});
