import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { ArrowUpRight, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { Magnetic } from '@/components/motion/Magnetic';
import { projectInclusions, projectExclusions } from '@/data/services';
import './pages.css';
export function PageHero({eyebrow,title,intro}:{eyebrow:string;title:string;intro:string}) {return <header className="page-hero container-site"><Reveal><p className="page-eyebrow">{eyebrow}</p><h1><SplitText text={title}/></h1><p className="page-intro">{intro}</p></Reveal></header>;}
export function Breadcrumb({title}:{title:string}) {return <nav className="page-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ArrowRight size={12}/><Link to="/work">Work</Link><ArrowRight size={12}/><span aria-current="page">{title}</span></nav>;}
export function CtaStrip({title='Ready to make something worth watching?'}:{title?:string}) {return <section className="page-cta"><div className="container-site"><Reveal><h2>{title}</h2></Reveal><Magnetic><Button asChild className="page-call"><Link to="/book">Book a call <ArrowUpRight size={18}/></Link></Button></Magnetic></div></section>;}
export function Inclusions(){return <section className="page-paper page-section"><div className="container-site included-grid">{[["Included in every project",projectInclusions],["Not included",projectExclusions]].map(([title,items])=><Reveal key={String(title)}><h2 className="section-title">{String(title)}</h2><ul>{(items as string[]).map(item=><li key={item}><Check size={17}/>{item}</li>)}</ul></Reveal>)}</div></section>;}
export function PageError({reset}:ErrorComponentProps){const router=useRouter();return <section className="container-site page-hero"><h1>This page could not load</h1><Button onClick={()=>{void router.invalidate();reset();}}>Try again</Button></section>;}
export function ProjectNotFound(){return <section className="container-site page-hero"><p className="page-eyebrow">Portfolio</p><h1>This project moved</h1><Button asChild className="page-call"><Link to="/work">Back to work <ArrowRight/></Link></Button></section>;}
