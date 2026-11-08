import {describe,it,expect} from 'vitest';
import {searchDashboard,dashboardUnread,dhakaClock,type DashboardItem} from './dashboard-rules';
const items:DashboardItem[]=[{id:'a',kind:'application',title:'AI Artist Intern',detail:'In Review',at:'',target:'/dashboard/careers'},{id:'b',kind:'call',title:'Call with Admakai',detail:'Confirmed',at:'',target:'/dashboard/calls'},{id:'c',kind:'document',title:'Declaration',detail:'Signed',at:'',target:'/dashboard/documents'}];
describe('dashboard presentation rules',()=>{
it('search includes own applications calls and documents',()=>{expect(searchDashboard(items,'ARTIST')[0]?.id).toBe('a');expect(searchDashboard(items,'confirmed')[0]?.id).toBe('b');expect(searchDashboard(items,'declaration')[0]?.id).toBe('c');expect(searchDashboard(items,'absent')).toEqual([])});
it('seen updates are excluded from unread count',()=>expect(dashboardUnread(items,['a','c']).map(i=>i.id)).toEqual(['b']));
it('clock uses Dhaka UTC plus six',()=>expect(dhakaClock(Date.parse('2026-11-08T12:46:00Z'))).toBe('18:46'));
});