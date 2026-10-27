import { Link, getRouteApi } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { filterProjects, projectTypes, type Project } from '@/data/projects';
import { CtaStrip, PageHero } from './PageElements';
const route = getRouteApi('/_site/work/');
function ProjectCard({project}:{project:Project}) {
 const video=useRef<HTMLVideoElement>(null);const reduce=useMotionPreference();
 const play=()=>{if(!reduce)void video.current?.play().catch(()=>{});};
 const pause=()=>{if(video.current){video.current.pause();video.current.currentTime=0;}};
 return <motion.article className="project-card" layout={!reduce} initial={reduce?false:{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduce?0:.35}}>
  <Link to="/work/$slug" params={{slug:project.slug}} onMouseEnter={play} onMouseLeave={pause} onFocus={play} onBlur={pause}>
   <div className={`project-preview ${project.format==='9:16'?'format-tall':project.format==='1:1'?'format-square':'format-wide'}`}><img src={project.posterUrl} alt={project.title} loading="lazy"/><video ref={video} src={project.videoUrl} poster={project.posterUrl} preload="none" muted loop playsInline aria-hidden="true"/>{project.isPlaceholder&&<span className="sample-label">Sample concept</span>}<span className="view-label">View</span></div>
   <p className="project-client">{project.client}</p><h2>{project.title}</h2><p className="project-result">{project.resultLine}</p>
  </Link>
 </motion.article>;
}
export function WorkPage(){const {data}=useProjects();const {type,client}=route.useSearch();const navigate=route.useNavigate();const selected=type||'all';const rows=filterProjects(data,selected,client||'');return <div className="public-page">
 <PageHero eyebrow="Portfolio" title="AI ads that pass as human made." intro="Every piece here was generated, directed and finished by Admakai. No crew, no studio."/>
 <nav className="work-filters" aria-label="Project filters"><div className="container-site">{projectTypes.map(item=><Button key={item.slug} variant="ghost" className={`filter-pill ${selected===item.slug?'active':''}`} aria-pressed={selected===item.slug} onClick={()=>void navigate({search:prev=>({...prev,type:item.slug==='all'?'':item.slug})})}>{item.label}</Button>)}{client&&<Button variant="ghost" className="filter-pill" onClick={()=>void navigate({search:prev=>({...prev,client:''})})}>Clear client filter ×</Button>}</div></nav>
 <section className="container-site page-section" aria-label="Projects">{rows.length?<motion.div className="work-grid"><AnimatePresence mode="popLayout">{rows.map(project=><ProjectCard key={project.id} project={project}/>)}</AnimatePresence></motion.div>:<div className="empty-state"><h2>No projects in this view yet.</h2><Button variant="outline" onClick={()=>void navigate({search:{type:'',client:''}})}>See all work</Button></div>}</section>
 <CtaStrip title="Want one of these for your brand?"/>
 </div>;}
