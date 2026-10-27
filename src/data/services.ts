export interface Service { id: string; slug: string; family: string; name: string; description: string; deliverables: string[]; formats: string[]; turnaround: string; price: string; }
export const serviceFamilies = [
 { slug: 'video', name: 'Video ads', intro: 'Commercials and ad variants, generated and graded like a TVC.' },
 { slug: 'imagery', name: 'Product and fashion imagery', intro: 'Photoshoots and films from one photo of the product.' },
 { slug: 'people', name: 'People and presenters', intro: 'Your face, your voice, or a presenter we build.' },
 { slug: 'social', name: 'Social content and editing', intro: 'Weekly content and editing for brands that post.' },
 { slug: 'sound', name: 'Voice and sound', intro: 'Voices and dubbing that sit under the picture.' },
];
type Entry = [string,string,string,string,string[],string[],string];
const entries: Entry[] = [
 ['ai-commercial-30','video','AI Commercial, 30s','A full commercial with locked characters and locations.',['Concept and script','Character and location sheets','30s master and 3 cutdowns (15s, 6s, 9:16)','Captions'],['16:9','9:16','1:1'],'7 days'],
 ['ai-commercial-60','video','AI Commercial, 60s','Longer story, same pipeline.',['Concept and script','Character and location sheets','60s master and 4 cutdowns','Captions'],['16:9','9:16','1:1'],'7 days'],
 ['ai-ugc-ads','video','AI UGC Ads','Creator style hook videos without creators.',['3 hooks per script','3 AI creators','Captions','9:16 and 1:1 versions'],['9:16','1:1'],'5 days'],
 ['ad-variant-pack','video','Ad Variant Pack','One master ad into 10 testable versions.',['10 variants: hooks, formats, lengths and languages','Naming for ad manager'],['16:9','9:16','1:1'],'5 days'],
 ['product-film','video','Product Film','Software style product film: UI, type, motion.',['30 to 60s film','9:16 version','Music and SFX'],['16:9','9:16'],'5 days'],
 ['ai-product-photoshoot','imagery','AI Product Photoshoot','Studio, lifestyle and seasonal shots.',['12 images per product, across 3 scenes','Retouched','4:5 and 1:1 versions','PSD on request'],['4:5','1:1'],'3 days'],
 ['fashion-film-lookbook','imagery','Fashion Film and Lookbook','Runway film plus a full lookbook.',['30s film','20 lookbook images','3 AI models'],['16:9','9:16','4:5'],'7 days'],
 ['ai-brand-model','imagery','AI Brand Model','A consistent model that is yours alone.',['Model sheet: face, body and 6 expressions','10 images','Usage rights'],['4:5','1:1'],'5 days'],
 ['digital-clone','people','Digital Clone','Your face and voice, cloned with consent.',['Setup from a 3 minute recording, with written consent','4 videos per month','Bangla and English'],['16:9','9:16'],'Setup: 5 days'],
 ['ai-presenter-video','people','AI Presenter Video','A presenter explains your product.',['Script','AI presenter','60 to 90s video','Captions'],['16:9','9:16'],'5 days'],
 ['training-video','people','Training Video','Internal or customer training, per module.',['5 to 8 minute module','Slides and presenter','Chapters'],['16:9'],'7 days per 5 modules'],
 ['reels-pack','social','Reels Pack of 6','Six reels, one brief.',['6 reels','Hooks','Captions','Covers'],['9:16'],'5 days'],
 ['ai-video-editing','social','AI Video Editing','Send raw footage, get a finished cut.',['Cut and grade','Captions','SFX','Per minute of output'],['16:9','9:16','1:1'],'3 days'],
 ['motion-logo-animation','social','Motion Ad or Logo Animation','Kinetic type, logo reveals, product motion.',['10 to 20s animation','3 formats','Source on request'],['16:9','9:16','1:1'],'4 days'],
 ['ai-voiceover','sound','AI Voiceover','Original or cloned voice, per minute.',['Script polish','2 voice options','Mixed and mastered'],['Audio'],'2 days'],
 ['dubbing-lip-sync','sound','Dubbing and Lip Sync','Any language, lips match.',['Translation','Dubbed voice','Lip sync','Per minute'],['16:9','9:16'],'3 days'],
];
export const services: Service[] = entries.map(([slug,family,name,description,deliverables,formats,turnaround]) => ({id:slug,slug,family,name,description,deliverables,formats,turnaround,price:'[price]'}));
export const projectInclusions = ['Concept and script','Two revision rounds','Licensed music and AI voice','Captions in Bangla or English','Final files yours'];
export const projectExclusions = ['Media buying','Live shoots','Broadcast licensing unless requested','Extra revision rounds'];
export const serviceAliases: Record<string,string> = {'ai-commercials':'ai-commercial-30','brand-models-and-clones':'ai-brand-model','brand-models-digital-clones':'digital-clone','ai-voice-and-dubbing':'ai-voiceover','ai-voice-dubbing':'ai-voiceover','fashion-films-lookbooks':'fashion-film-lookbook','ad-variants-localisation':'ad-variant-pack'};
