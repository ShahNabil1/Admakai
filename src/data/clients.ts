import akboria from '@/assets/clients/6RevC1709404776.png.asset.json';
import towbah from '@/assets/clients/1788961235819_Towbah---Remove-BG_e66510.png.asset.json';
import arot from '@/assets/clients/B29puLqPsqfB1Ahkuc0FjTl8RbQICEUyJ8OPWfbr.png.asset.json';
import chardike from '@/assets/clients/CHARDIKE.png.asset.json';
import hawar from '@/assets/clients/HawarIT-logo-300-subtitle.png.asset.json';
import jimJolly from '@/assets/clients/images_1.png.asset.json';
import innsaei from '@/assets/clients/Innsaei-Logo.png.asset.json';
import skinfo from '@/assets/clients/skinfo-170x80.png.asset.json';
import beautyScience from '@/assets/clients/TBS-logo.png.asset.json';
import gentlePark from '@/assets/clients/Asset_1.png.asset.json';

export const BRAND_COUNT = 40;
export const AD_COUNT = 300;

export const clients = [
  { name: 'Akboria', src: akboria.url },
  { name: 'Towbah Islamic Corner', src: towbah.url },
  { name: 'Arot', src: arot.url },
  { name: 'Chardike', src: chardike.url },
  { name: 'HawarIT', src: hawar.url },
  { name: 'Jim & Jolly', src: jimJolly.url },
  { name: 'Innsaei', src: innsaei.url },
  { name: 'Skinfo', src: skinfo.url },
  { name: 'The Beauty Science', src: beautyScience.url },
  { name: 'Gentle Park', src: gentlePark.url },
];

export function repeatClients<T>(items: readonly T[], minimum = 12): T[] {
  if (items.length === 0) return [];
  return Array.from({ length: Math.ceil(minimum / items.length) }, () => [...items]).flat();
}

export const marqueeClients = repeatClients(clients);