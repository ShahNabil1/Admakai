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
 it('keeps every service in the replacement catalogue',()=>expect(services.map(s=>s.slug)).toEqual(['ai-commercial-30s','ai-commercial-60s','ai-ugc-ads','ad-variant-pack','product-film','saas-explainer','cgi-product-commercial','festival-campaign-pack','ai-storyboard-animatic','ai-product-photoshoot','fashion-film-lookbook','ai-brand-model','virtual-try-on','ecommerce-catalogue-pack','static-ad-creative-pack','3d-product-360']));
 for(const [slug,days] of [['ai-commercial-30s','7 days'],['ai-commercial-60s','7 days'],['ai-ugc-ads','5 days'],['ad-variant-pack','5 days'],['product-film','5 days'],['saas-explainer','7 days'],['cgi-product-commercial','5 days'],['festival-campaign-pack','7 days'],['ai-storyboard-animatic','3 days'],['ai-product-photoshoot','3 days'],['fashion-film-lookbook','7 days'],['ai-brand-model','5 days'],['virtual-try-on','2 days'],['ecommerce-catalogue-pack','3 days'],['static-ad-creative-pack','3 days'],['3d-product-360','5 days']])it(`${slug} delivery`,()=>expect(services.find(s=>s.slug===slug)?.delivery).toBe(days));
 it('marks six projects as samples',()=>{expect(projects).toHaveLength(6);expect(projects.every(p=>p.isPlaceholder)).toBe(true);});
 it('marks four team profiles as samples',()=>{expect(team).toHaveLength(4);expect(team.every(p=>p.isPlaceholder)).toBe(true);});
 it('honours category filtering',()=>expect(filterProjects(projects,'ugc','').map(p=>p.slug)).toEqual(['sample-ugc']));
 it('honours client filtering',()=>expect(filterProjects(projects,'all','unknown')).toEqual([]));
 it('does not expose unpublished rows',()=>expect(filterProjects([{...projects[0],isPublished:false}] as typeof projects,'all','')).toEqual([]));
});
