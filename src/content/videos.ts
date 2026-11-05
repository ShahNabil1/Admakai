export interface ServiceVideo { id: string; hash?: string; poster: string; title: string }
export const backgroundMode: boolean = true;
export const aiOrShotAnswer: 'A' | 'B' = 'B';
export const videos: Record<string, ServiceVideo> = {
  servicesHero: { id: 'placeholder', poster: '', title: 'Admakai service reel' },
  aiOrShotA: { id: 'placeholder', poster: '', title: 'Clip A' },
  aiOrShotB: { id: 'placeholder', poster: '', title: 'Clip B' },
};
