import akboria from '@/assets/clients/6RevC1709404776.png';
import towbah from '@/assets/clients/1788961235819_Towbah---Remove-BG_e66510.png';
import arot from '@/assets/clients/B29puLqPsqfB1Ahkuc0FjTl8RbQICEUyJ8OPWfbr.png';
import chardike from '@/assets/clients/CHARDIKE.png';
import hawar from '@/assets/clients/HawarIT-logo-300-subtitle.png';
import jimJolly from '@/assets/clients/images_1.png';
import innsaei from '@/assets/clients/Innsaei-Logo.png';
import skinfo from '@/assets/clients/skinfo-170x80.png';
import beautyScience from '@/assets/clients/TBS-logo.png';
import gentlePark from '@/assets/clients/Asset_1.png';

export const clients = [
  { name: 'Akboria', src: akboria },
  { name: 'Towbah Islamic Corner', src: towbah },
  { name: 'Arot', src: arot },
  { name: 'Chardike', src: chardike },
  { name: 'HawarIT', src: hawar },
  { name: 'Jim & Jolly', src: jimJolly },
  { name: 'Innsaei', src: innsaei },
  { name: 'Skinfo', src: skinfo },
  { name: 'The Beauty Science', src: beautyScience },
  { name: 'Gentle Park', src: gentlePark },
];

export function repeatClients<T>(items: readonly T[], minimum = 12): T[] {
  if (items.length === 0) return [];
  return Array.from({ length: Math.ceil(minimum / items.length) }, () => [...items]).flat();
}

export const marqueeClients = repeatClients(clients);