export type Tool = { name: string; slug: string; color: string; dark?: boolean };
export type TitlePart = { text: string; serif?: boolean };
export type ToolCard = { icon: 'video' | 'image' | 'voice' | 'edit'; tile: string; title: TitlePart[]; text: string; tasks: string; tools: Tool[] };

const t = (name: string, color: string, dark = false): Tool => ({
  name, color, dark, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
});

export const toolCards: ToolCard[] = [
  {
    icon: 'video', tile: '#E8B931',
    title: [{ text: 'Video', serif: true }, { text: ' generation' }],
    text: 'Cinematic shots with locked characters, locations and light.',
    tasks: 'Text and image to video, consistent faces across cuts, camera moves, product and lifestyle shots.',
    tools: [t('Seedance', '#0D0D0D'), t('Veo', '#1A73E8'), t('Kling', '#1C1C1C'), t('Higgsfield', '#C6FF3A', true)],
  },
  {
    icon: 'image', tile: '#F0772B',
    title: [{ text: 'Image' }, { text: ' and photoshoot', serif: true }],
    text: 'Product and brand imagery from one reference photo.',
    tasks: 'Studio and lifestyle photoshoots, brand models, locations, upscaling and cleanup.',
    tools: [t('Seedream', '#2B2B2B'), t('Nano Banana', '#F5C518', true), t('Midjourney', '#1B1B1B'), t('Magnific', '#6B4EFF'), t('Omni Flash', '#FF5A1F')],
  },
  {
    icon: 'voice', tile: '#4A2E2B',
    title: [{ text: 'Voice', serif: true }, { text: ' and sound' }],
    text: 'Voices, dubbing and music that sit under the picture.',
    tasks: 'Cloned and original voiceovers, Bangla and English, lip synced dubbing, music and sound design.',
    tools: [t('ElevenLabs', '#111111'), t('Suno', '#FF3B30')],
  },
  {
    icon: 'edit', tile: '#8DBE5A',
    title: [{ text: 'Direction' }, { text: ' and edit', serif: true }],
    text: 'The human layer: idea, script, cut, grade, delivery.',
    tasks: 'Scripts and prompts, shot lists, edit, colour grade, captions, versioning for every platform.',
    tools: [t('Claude', '#D97757'), t('GPT-5', '#10A37F'), t('DaVinci Resolve', '#2D7FF9'), t('After Effects', '#9999FF', true)],
  },
];

/** Slugs with a real logo in public/tools/<slug>.png. Add a slug here once its logo is uploaded. */
export const toolLogos = new Set<string>([]);
