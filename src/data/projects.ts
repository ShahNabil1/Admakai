export interface Project { id:string; slug:string; title:string; client:string; clientSlug:string; industry:string; serviceSlug:string; type:string; format:string; durationSeconds:number; videoUrl:string; posterUrl:string; challenge:string; approach:string; resultLine:string; deliverables:string[]; isFeatured:boolean; sortOrder:number; isPublished:boolean; createdAt:string; isPlaceholder:boolean; gallery?:string[]; }
const examples = [
 ['commercial','An everyday moment, reimagined','ai-commercial-30',1,'16:9'],
 ['ugc','A hook worth stopping for','ai-ugc-ads',2,'9:16'],
 ['product','One product. A different world.','ai-product-photoshoot',3,'1:1'],
 ['presenter','A familiar face, a new story','ai-presenter-video',4,'9:16'],
 ['motion','Made to move','motion-logo-animation',6,'16:9'],
 ['fashion','A look beyond the studio','fashion-film-lookbook',7,'9:16'],
] as const;
export const projects: Project[] = examples.map(([type,title,serviceSlug,n,format],i) => ({id:`sample-${i+1}`,slug:`sample-${type}`,title,client:'Admakai concept',clientSlug:'admakai-concept',industry:'Concept exploration',serviceSlug,type,format,durationSeconds:0,videoUrl:`/capabilities/cap-${n}.mp4`,posterUrl:`/capabilities/cap-${n}.jpg`,challenge:'Sample brief: explore a distinctive visual direction without a live shoot.',approach:'Human direction, generated references and a considered edit. This preview illustrates a possible treatment, not a commissioned case study.',resultLine:'Concept preview · not a client campaign',deliverables:['Concept preview','Format exploration','Visual direction'],isFeatured:i<3,sortOrder:i,isPublished:true,createdAt:'2026-01-01',isPlaceholder:true}));
export const projectTypes = [{slug:'all',label:'All'},{slug:'commercial',label:'Commercials'},{slug:'ugc',label:'UGC'},{slug:'product',label:'Product'},{slug:'fashion',label:'Fashion'},{slug:'presenter',label:'Presenters'},{slug:'motion',label:'Motion'},{slug:'voice',label:'Voice'}];
export function filterProjects(rows:Project[],type:string,client:string) { return rows.filter(p=>p.isPublished && (type==='all'||type===''||type==='case-study'||p.type===type) && (!client||p.clientSlug===client)).sort((a,b)=>a.sortOrder-b.sortOrder); }
