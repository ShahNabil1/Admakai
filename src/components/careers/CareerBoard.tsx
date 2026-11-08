import { Fragment, useEffect, useState } from 'react';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Briefcase, MapPin, Search, SlidersHorizontal, Play, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { boardGroups, clearBoardSearch, filterBoardJobs, type BoardSearch } from '@/lib/career-board-rules';
import { canApply } from '@/lib/careers-rules';
import type { CareerJob } from '@/lib/careers.functions';
import type { InternshipVideoSettings } from '@/lib/internship-video';
import { resolveInternshipVideo } from '@/lib/internship-video';
import { HiringCover } from './HiringCover';
import { DraftBanner } from './CareerShared';
import { InternshipVideo } from './InternshipVideo';
const route=getRouteApi('/_site/careers/');

export function CareerSearch() {
  const search=route.useSearch(), navigate=route.useNavigate();
  const [query,setQuery]=useState(search.q);
  useEffect(()=>setQuery(search.q),[search.q]);
  const select=(key:'types'|'modes'|'experience',value:string)=>void navigate({search:prev=>({...prev,[key]:value?[value]:[]}),resetScroll:false});
  return <form className="board-search" role="search" onSubmit={e=>{e.preventDefault();void navigate({search:prev=>({...prev,q:query}),resetScroll:false});document.getElementById('roles')?.scrollIntoView({behavior:'smooth'});}}>
    <label className="board-query"><Search size={20}/><span className="sr-only">Search roles</span><input placeholder="Search roles" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {(['modes','types','experience'] as const).map(key=>{
      const group=boardGroups.find(g=>g.key===key);
      return <label key={key}><span>{key==='modes'?'Work location':key==='types'?'Type':'Experience'}</span><select aria-label={key==='modes'?'Work location':key==='types'?'Role type':'Experience'} value={search[key].length===1?search[key][0]:''} onChange={e=>select(key,e.target.value)}>
        <option value="">Any {key==='modes'?'location':key==='types'?'type':'experience'}</option>{group?.options.filter(([value])=>key!=='types'||value!=='part_time').map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select></label>;
    })}
    <Button type="submit" className="board-search-submit"><Search size={16}/>Search</Button>
  </form>;
}
function BoardFilters({search,update,clear}:{search:BoardSearch;update:(key:'types'|'modes'|'experience'|'schedules',value:string)=>void;clear:()=>void}){
  return <div className="board-filter-groups"><div className="board-filter-title"><h3>Filters</h3><Button variant="link" onClick={clear}>Clear all</Button></div>{boardGroups.map(group=><fieldset key={group.key}><legend>{group.label}</legend>{group.options.map(([value,label])=><label key={value}><input type="checkbox" checked={search[group.key].includes(value)} onChange={()=>update(group.key,value)}/>{label}</label>)}</fieldset>)}</div>;
}
export function CareerBoard({jobs,applications,settings}:{jobs:CareerJob[];applications:{job_id:string}[];settings:InternshipVideoSettings}){
  const search=route.useSearch(),navigate=route.useNavigate();
  const [filtersOpen,setFiltersOpen]=useState(false),[videoOpen,setVideoOpen]=useState(false);
  const filtered=filterBoardJobs(jobs,search);
  const promo=jobs.some(job=>job.type==='internship'&&canApply(job));
  const video=resolveInternshipVideo(settings.internship_video_url);
  const clear=()=>void navigate({search:clearBoardSearch,resetScroll:false});
  const update=(key:'types'|'modes'|'experience'|'schedules',value:string)=>void navigate({search:prev=>({...prev,[key]:prev[key].includes(value)?prev[key].filter(v=>v!==value):[...prev[key],value]}),resetScroll:false});
  const activeCount=search.types.length+search.modes.length+search.experience.length+search.schedules.length;
  const promoCard=<article className="board-promo"><div className="board-promo-pattern" aria-hidden="true"/><span className="board-promo-icon"><Play size={22}/></span><p className="board-promo-eyebrow">LEARN. CREATE. GROW.</p><h3>Admakai Internship Program</h3><p>6 months. No fee. Learn AI filmmaking beside our team.</p><Button disabled={!video} onClick={()=>setVideoOpen(true)}><Play size={16}/>Watch the video</Button></article>;
  return <section id="roles" className="career-board-band"><div className="container-site career-board-layout">
    <aside className="board-sidebar"><BoardFilters search={search} update={update} clear={clear}/></aside>
    <div className="board-results"><div className="board-results-heading"><h2>Open roles <span>{filtered.length}</span></h2><label>Sort by: <select aria-label="Sort roles" value={search.sort} onChange={e=>void navigate({search:prev=>({...prev,sort:e.target.value}),resetScroll:false})}><option value="latest">Latest</option><option value="oldest">Oldest</option></select></label></div>
      <Button variant="outline" className="board-mobile-filters" onClick={()=>setFiltersOpen(true)}><SlidersHorizontal size={16}/>Filters{activeCount>0?` (${activeCount})`:''}</Button>
      <div className="board-job-grid">{filtered.map((job,i)=><Fragment key={job.id}>{i===2&&promo&&promoCard}<article className="board-job-card">
        <div className="board-card-header"><div className="board-role-icon"><Briefcase size={22}/><HiringCover value={job.cover_image_url} title={job.title}/></div><time dateTime={job.created_at}>{new Date(job.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Dhaka'})}</time></div>
        {job.status==='draft'&&<DraftBanner/>}<h3><Link to="/careers/$slug" params={{slug:job.slug}}>{job.title}</Link></h3>
        <div className="board-tags"><span className="board-tag-type">{job.type.replaceAll('_','-')}</span><span className="board-tag-mode">{job.work_mode}</span>{job.experience_level==='none'&&<span>No experience</span>}{job.status==='closed'&&<span>Closed</span>}</div>
        <p className="board-location"><MapPin size={14}/>Dhaka · {job.work_mode}</p><p className="board-summary">{job.summary}</p>
        <div className="board-card-actions">{applications.some(a=>a.job_id===job.id)?<Button asChild className="board-apply"><Link to="/dashboard/careers">View application</Link></Button>:canApply(job)?<Button asChild className="board-apply"><Link to="/careers/$slug/apply" params={{slug:job.slug}}>Apply <ArrowUpRight size={15}/></Link></Button>:null}<Button asChild variant="outline" className="board-details"><Link to="/careers/$slug" params={{slug:job.slug}}>Details</Link></Button></div>
      </article></Fragment>)}{promo&&filtered.length>0&&filtered.length<3&&promoCard}</div>
      {!filtered.length&&<div className="board-empty"><Briefcase size={32}/><h3>No roles match these filters</h3><Button variant="link" onClick={clear}>Clear filters</Button></div>}
    </div>
  </div><Sheet open={filtersOpen} onOpenChange={setFiltersOpen}><SheetContent side="bottom" className="board-filter-sheet" data-lenis-prevent><SheetTitle className="sr-only">Filter roles</SheetTitle><SheetDescription className="sr-only">Choose role type, work mode, experience and schedule</SheetDescription><BoardFilters search={search} update={update} clear={clear}/><Button className="board-apply" onClick={()=>setFiltersOpen(false)}>Show {filtered.length} roles</Button></SheetContent></Sheet>
  <Dialog open={videoOpen} onOpenChange={setVideoOpen}><DialogContent className="board-video-modal" data-lenis-prevent><DialogTitle>Admakai Internship Program</DialogTitle><DialogDescription>6 months. No fee. Learn AI filmmaking beside our team.</DialogDescription><InternshipVideo settings={settings}/></DialogContent></Dialog></section>;
}