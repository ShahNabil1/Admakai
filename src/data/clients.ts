import akboria from '../../public/brand/clients/6RevC1709404776.png.asset.json';
import towbah from '../../public/brand/clients/1788961235819_Towbah---Remove-BG_e66510.webp.asset.json';
import arot from '../../public/brand/clients/B29puLqPsqfB1Ahkuc0FjTl8RbQICEUyJ8OPWfbr.png.asset.json';
import chardike from '../../public/brand/clients/CHARDIKE.png.asset.json';
import hawar from '../../public/brand/clients/HawarIT-logo-300-subtitle.png.asset.json';
import jimJolly from '../../public/brand/clients/images_1.jpeg.asset.json';
import innsaei from '../../public/brand/clients/Innsaei-Logo.webp.asset.json';
import skinfo from '../../public/brand/clients/skinfo-170x80.webp.asset.json';
import beautyScience from '../../public/brand/clients/TBS-logo.png.asset.json';
import gentlePark from '../../public/brand/clients/Asset_1.png.asset.json';

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