// Content for the /blog/video-lighting-guide article.
// All reader-facing text is Bengali; prompt text stays English.
// Styles 1 to 8 are approved. Slots 9 to 34 are placeholders until the
// remaining style content is supplied; they render as muted "শীঘ্রই আসছে" cards.

export type LightingStyle = {
  id: number;
  nameEn: string;
  nameBn: string;
  category: string;
  mood: string;
  what: string;
  when: string;
  specs: { direction: string; contrast: string; temperature: string; quality: string };
  tip: string;
  light: string;
  colour: string;
  swatch: { x: number; y: number; key: string; bg: string };
  pending?: boolean;
};

export const MASTER_TEMPLATE = `LIGHTING CHANGE ONLY: {NAME}

INPUT: @video1 is my original clip. It is the only source for the person, location, framing, camera movement and action.

LOCK (HIGHEST PRIORITY): Keep the same person, face, skin tone, hair, clothes, props, location and composition. Keep the same camera movement, timing, duration, expressions, gestures and lip sync. Do not add, remove or move anything.

LIGHT: {LIGHT}

COLOUR: {COLOUR}

CONSISTENCY: Light direction, shadow shapes and exposure stay stable from frame to frame as the person and camera move. No flicker unless this style asks for it. Shadows and reflections must stay physically believable.

FINISH: Photorealistic, real skin texture with visible pores, original lens perspective and depth of field. Keep the original speech and audio. No added music, text, logos or watermarks.`;

export const REFERENCE_BLOCK = `REFERENCE: @image1 is a lighting and colour reference only. Copy its light direction, contrast and colour. Never copy its person, clothes, location or composition, and never use it as a start frame.`;

export function buildPrompt(style: LightingStyle, withReference = false): string {
  const prompt = MASTER_TEMPLATE
    .replace('{NAME}', style.nameEn)
    .replace('{LIGHT}', style.light)
    .replace('{COLOUR}', style.colour);
  return withReference ? `${prompt}\n\n${REFERENCE_BLOCK}` : prompt;
}

export const lightingStyles: LightingStyle[] = [
  {
    id: 1,
    nameEn: 'High-key',
    nameBn: 'হাই-কি',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'পরিষ্কার ও কমার্শিয়াল',
    what: 'উজ্জ্বল, প্রায় ছায়াহীন আলো। সামনে থেকে বড় নরম আলো আর শক্তিশালী ফিল দিয়ে পুরো দৃশ্য হালকা আর ঝকঝকে করা হয়।',
    when: 'স্কিনকেয়ার, ক্লিনিক, ই কমার্স প্রোডাক্ট ভিডিও, এক্সপ্লেইনার আর যেকোনো বিজ্ঞাপন যেখানে বিশ্বাস আর পরিচ্ছন্নতা বোঝাতে হবে।',
    specs: { direction: 'সামনে থেকে, বড় সোর্স', contrast: '১:১ থেকে ২:১', temperature: '৫৬০০K', quality: 'খুব নরম' },
    tip: 'বেশি উজ্জ্বল করলে মুখ সমতল আর ওভারএক্সপোজড লাগে। প্রম্পটে হাইলাইটে স্কিনের ডিটেইল রাখতে বলুন।',
    light: 'Bright, even, almost shadowless light from large soft sources in front of the person, with strong fill from both sides. Minimal shadow under the chin and on the walls. Keep detail in the brightest skin highlights, nothing clipped to pure white.',
    colour: 'Clean neutral daylight around 5600K, low contrast, airy whites, fresh natural skin tones, crisp commercial look.',
    swatch: { x: 50, y: 40, key: '#FFFFFF', bg: '#CFCFCF' },
  },
  {
    id: 2,
    nameEn: 'Low-key',
    nameBn: 'লো-কি',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'রহস্য ও থ্রিলার',
    what: 'দৃশ্যের বেশিরভাগ অংশ অন্ধকারে থাকে, শুধু একটা আলো মুখ আর শরীরের উপরের অংশে আলোর একটা পুকুর তৈরি করে।',
    when: 'থ্রিলার, পারফিউম বা প্রিমিয়াম পণ্য, স্বীকারোক্তি ধরনের দৃশ্য, আর এমন হুক যেখানে দর্শককে কৌতূহলী করতে হবে।',
    specs: { direction: '৪৫ ডিগ্রি পাশ থেকে', contrast: '৮:১ বা বেশি', temperature: '৪৩০০K', quality: 'নরম কী লাইট' },
    tip: 'চোখে ছোট একটা ক্যাচলাইট রাখতে বলুন। চোখে আলো না থাকলে মুখ প্রাণহীন দেখায়।',
    light: 'One soft key light from about 45 degrees creates a pool of light on the face and upper body. Almost no fill. The rest of the location falls into deep near-black shadow, with only faint shapes of the surroundings visible. Keep a small catchlight in both eyes.',
    colour: 'Slightly warm neutral around 4300K, high contrast, rich blacks without crushing the face, moody and premium.',
    swatch: { x: 30, y: 35, key: '#FFE2B8', bg: '#050506' },
  },
  {
    id: 3,
    nameEn: 'Rembrandt',
    nameBn: 'রেমব্রান্ট',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'আবেগ ও গল্প',
    what: 'ওপরে আর ৪৫ ডিগ্রি পাশে রাখা একটা আলো। ছায়ার দিকের গালে চোখের নিচে ছোট একটা উজ্জ্বল ত্রিভুজ তৈরি হয়। চিত্রশিল্পী রেমব্রান্টের ছবি থেকে এই নাম।',
    when: 'ইন্টারভিউ, ডকুমেন্টারি, প্রতিষ্ঠাতার গল্প, আবেগী মনোলগ আর যেকোনো দৃশ্য যেখানে গভীরতা আর ভারিক্কি ভাব দরকার।',
    specs: { direction: 'ওপরে ও ৪৫ ডিগ্রি পাশে', contrast: '৪:১', temperature: '৩৮০০K', quality: 'নরম থেকে মাঝারি' },
    tip: 'ত্রিভুজটা চোখের চেয়ে লম্বা বা নাকের চেয়ে চওড়া হবে না, এটা প্রম্পটে বলে দিন। নাহলে AI পুরো গাল আলোকিত করে ফেলে।',
    light: 'One key light placed high and about 45 degrees to the side. On the shadow side of the face, a small bright triangle of light sits under the eye, no longer than the eye and no wider than the nose, formed where the nose shadow meets the cheek shadow. Very little fill, background darker than the face.',
    colour: 'Warm painterly tones around 3800K, rich moody contrast, deep warm shadows.',
    swatch: { x: 28, y: 25, key: '#FFD29A', bg: '#141010' },
  },
  {
    id: 4,
    nameEn: 'Butterfly (Paramount)',
    nameBn: 'বাটারফ্লাই বা প্যারামাউন্ট',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'গ্ল্যামার ও বিউটি',
    what: 'আলো ঠিক মুখের সামনে আর একটু ওপরে থাকে। নাকের ঠিক নিচে প্রজাপতির মতো ছোট একটা ছায়া পড়ে। পুরনো হলিউডের স্টুডিও পোর্ট্রেটের ক্লাসিক আলো।',
    when: 'বিউটি, কসমেটিকস, ফ্যাশন ক্লোজআপ, আর গ্ল্যামারাস প্রোডাক্ট শট যেখানে চোয়াল আর গালের হাড় ফুটিয়ে তুলতে হবে।',
    specs: { direction: 'সরাসরি সামনে, ক্যামেরার ওপরে', contrast: '৩:১', temperature: '৫০০০K', quality: 'নরম' },
    tip: 'যাদের চোখ একটু ভেতরে বসা, তাদের চোখের নিচে কালো দেখাতে পারে। প্রম্পটে নিচ থেকে হালকা রিফ্লেক্টর ফিল যোগ করুন।',
    light: 'Key light high and directly in front of the face, above the camera. A small symmetrical butterfly shaped shadow sits right under the nose. Soft shadows under the cheekbones and chin. Gentle low fill from below, like a reflector at chest height, keeps the eyes open and bright.',
    colour: 'Clean slightly warm 5000K, glamorous classic Hollywood portrait feel, soft falloff behind the person.',
    swatch: { x: 50, y: 15, key: '#FFF1DE', bg: '#1C1A1C' },
  },
  {
    id: 5,
    nameEn: 'Split',
    nameBn: 'স্প্লিট',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'দ্বন্দ্ব ও টুইস্ট',
    what: '৯০ ডিগ্রি পাশ থেকে কড়া আলো, ঠিক অর্ধেক মুখ আলোকিত আর বাকি অর্ধেক পুরো অন্ধকার। মুখের মাঝখান দিয়ে স্পষ্ট একটা রেখা।',
    when: 'দ্বৈত চরিত্র, ভেতরের দ্বন্দ্ব, ভিলেন রিভিল, আগে আর পরের পরিবর্তন দেখানো, বা কোনো কঠিন সিদ্ধান্তের মুহূর্ত।',
    specs: { direction: '৯০ ডিগ্রি পাশ থেকে', contrast: '১৬:১', temperature: '৫৬০০K বা ঠান্ডা', quality: 'কড়া' },
    tip: 'টাইট ক্লোজআপে সবচেয়ে ভালো কাজ করে। ওয়াইড শটে পুরো ঘর অর্ধেক অন্ধকার দেখায় আর ইফেক্টটা হারিয়ে যায়।',
    light: 'A hard light from exactly 90 degrees to one side lights precisely one half of the face. The other half falls into darkness, with a sharp vertical division running down the middle of the face. No fill. The surroundings stay dark.',
    colour: 'Neutral to slightly cool 5600K, dramatic high contrast, deep clean blacks.',
    swatch: { x: 2, y: 45, key: '#F4F7FF', bg: '#020203' },
  },
  {
    id: 6,
    nameEn: 'Loop',
    nameBn: 'লুপ',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'আবেগ ও গল্প',
    what: 'আলো একটু পাশে আর চোখের লেভেলের সামান্য ওপরে। নাকের ছায়া গালের দিকে ছোট একটা লুপ বানায়, কিন্তু গালের ছায়ার সাথে মেশে না। সবচেয়ে বহুমুখী পোর্ট্রেট আলো।',
    when: 'ইউটিউব টকিং হেড, টেস্টিমোনিয়াল, কর্পোরেট ভিডিও, কোর্সের ক্লাস, আর এমন যেকোনো জায়গা যেখানে মানুষটাকে সুন্দর আর স্বাভাবিক দেখাতে হবে।',
    specs: { direction: '৩০ থেকে ৪৫ ডিগ্রি পাশে, চোখের একটু ওপরে', contrast: '৩:১', temperature: '৫০০০K', quality: 'নরম' },
    tip: 'নাকের ছায়া যেন গালের ছায়ার সাথে না মেশে, এটা আলাদা করে লিখুন। মিশে গেলে সেটা Rembrandt হয়ে যায়।',
    light: 'A soft key light slightly off axis, 30 to 45 degrees to the side and just above eye level. The nose casts a small shadow that loops down toward the cheek but does not connect with the cheek shadow. Gentle fill keeps the shadow side readable. Natural, flattering modelling across the face.',
    colour: 'Natural neutral 5000K, medium contrast, healthy true to life skin tones.',
    swatch: { x: 35, y: 30, key: '#FFF4E6', bg: '#2A2826' },
  },
  {
    id: 7,
    nameEn: 'Broad',
    nameBn: 'ব্রড',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'বন্ধুসুলভ ও উষ্ণ',
    what: 'মানুষ যখন একটু পাশ ফিরে থাকে, তখন মুখের যে অংশ ক্যামেরার দিকে, সেটা আলোকিত হয়। মুখ খোলা, চওড়া আর বন্ধুসুলভ দেখায়।',
    when: 'খুশির বিজ্ঞাপন, পারিবারিক দৃশ্য, শিশুদের কনটেন্ট, আর চিকন মুখকে একটু ভরাট দেখাতে।',
    specs: { direction: 'ক্যামেরার দিকের মুখে', contrast: '২:১', temperature: '৫০০০K', quality: 'নরম' },
    tip: 'গোল বা চওড়া মুখে এই আলো মুখকে আরও চওড়া দেখায়। সেক্ষেত্রে Short লাইটিং বেছে নিন।',
    light: 'The side of the face turned toward the camera is the brightly lit side. Gentle shadow only on the far side of the face. Soft, open, broad light with generous fill.',
    colour: 'Warm natural 5000K portrait tones, low to medium contrast, friendly and inviting.',
    swatch: { x: 62, y: 35, key: '#FFEBD2', bg: '#2E2B28' },
  },
  {
    id: 8,
    nameEn: 'Short',
    nameBn: 'শর্ট',
    category: 'পোর্ট্রেট ক্লাসিক',
    mood: 'সিনেমাটিক ও গম্ভীর',
    what: 'Broad এর উল্টো। মুখের যে অংশ ক্যামেরা থেকে দূরে, আলো পড়ে সেখানে। ক্যামেরার কাছের অংশ নরম ছায়ায় থাকে, ফলে মুখ সরু আর ভাস্কর্যের মতো দেখায়।',
    when: 'সিনেমাটিক সংলাপ, গম্ভীর ইন্টারভিউ, ছেলেদের ফ্যাশন, আর বেশিরভাগ ড্রামা সিন। সিনেমার সবচেয়ে প্রচলিত ডিফল্ট আলো এটাই।',
    specs: { direction: 'ক্যামেরা থেকে দূরের মুখে', contrast: '৪:১', temperature: '৪৫০০K', quality: 'নরম' },
    tip: 'সংলাপের দৃশ্যে দুইজনকেই Short লাইটিংয়ে রাখলে শট আর রিভার্স শট একসাথে সবচেয়ে সিনেমাটিক লাগে।',
    light: 'The light falls on the side of the face turned away from the camera. The near side, facing the camera, falls into soft shadow. Sculpted, moody portrait with real depth. Surroundings a little darker than the face.',
    colour: 'Slightly warm neutral 4500K, medium high contrast, cinematic and serious.',
    swatch: { x: 70, y: 30, key: '#FFE6C7', bg: '#121212' },
  },
];

// Placeholder slots so the grid and table of contents are ready for all 34 styles.
const pendingCategories = [
  'ড্রামা ও কনট্রাস্ট', 'ড্রামা ও কনট্রাস্ট', 'ড্রামা ও কনট্রাস্ট',
  'আলোর কোয়ালিটি', 'আলোর কোয়ালিটি', 'আলোর কোয়ালিটি',
  'সময় ও প্রকৃতি', 'সময় ও প্রকৃতি', 'সময় ও প্রকৃতি',
  'মোটিভেটেড আলো', 'মোটিভেটেড আলো', 'মোটিভেটেড আলো',
  'কালার ও স্টাইল', 'কালার ও স্টাইল', 'কালার ও স্টাইল',
  'চলমান আলো', 'চলমান আলো', 'চলমান আলো',
  'পোর্ট্রেট ক্লাসিক', 'পোর্ট্রেট ক্লাসিক', 'পোর্ট্রেট ক্লাসিক',
  'ড্রামা ও কনট্রাস্ট', 'আলোর কোয়ালিটি', 'সময় ও প্রকৃতি',
];
for (let id = 9; id <= 34; id++) {
  lightingStyles.push({
    id,
    nameEn: `Style ${id}`,
    nameBn: 'শীঘ্রই আসছে',
    category: pendingCategories[id - 9] ?? 'পোর্ট্রেট ক্লাসিক',
    mood: '',
    what: '', when: '',
    specs: { direction: '', contrast: '', temperature: '', quality: '' },
    tip: '', light: '', colour: '',
    swatch: { x: 50, y: 35, key: '#3A3D44', bg: '#101114' },
    pending: true,
  });
}

export const styleCategories = ['সব', 'পোর্ট্রেট ক্লাসিক', 'ড্রামা ও কনট্রাস্ট', 'আলোর কোয়ালিটি', 'সময় ও প্রকৃতি', 'মোটিভেটেড আলো', 'কালার ও স্টাইল', 'চলমান আলো'];

export const moodFinder: { mood: string; ids: number[] }[] = [
  { mood: 'পরিষ্কার ও কমার্শিয়াল', ids: [1, 13, 27] },
  { mood: 'রহস্য ও থ্রিলার', ids: [2, 9, 15, 24] },
  { mood: 'আবেগ ও গল্প', ids: [3, 6, 17, 21] },
  { mood: 'গ্ল্যামার ও বিউটি', ids: [4, 13] },
  { mood: 'দ্বন্দ্ব ও টুইস্ট', ids: [5, 10, 16] },
  { mood: 'বন্ধুসুলভ ও উষ্ণ', ids: [7, 14, 22] },
  { mood: 'সিনেমাটিক ও গম্ভীর', ids: [8, 11, 29] },
  { mood: 'রাতের দৃশ্য', ids: [18, 19, 20, 23, 31] },
  { mood: 'প্রকৃতি ও স্বপ্নময়', ids: [17, 25, 26] },
  { mood: 'এনার্জি ও নাইটলাইফ', ids: [28, 30, 33] },
  { mood: 'স্টেজ ও রিভিল', ids: [10, 26, 34] },
  { mood: 'চলমান দৃশ্য', ids: [32, 33] },
];

export const glossary: { term: string; meaning: string }[] = [
  { term: 'কী লাইট', meaning: 'দৃশ্যের মূল আলো, যেটা মুখের আকার আর মুড ঠিক করে।' },
  { term: 'ফিল লাইট', meaning: 'কী লাইটের ছায়া নরম করার দুর্বল আলো। ফিল যত কম, দৃশ্য তত নাটকীয়।' },
  { term: 'ব্যাক বা রিম লাইট', meaning: 'পেছন থেকে আসা আলো, যেটা মানুষকে ব্যাকগ্রাউন্ড থেকে আলাদা করে।' },
  { term: 'কনট্রাস্ট রেশিও', meaning: 'আলোকিত অংশ আর ছায়ার অংশের উজ্জ্বলতার অনুপাত। ২:১ মানে নরম, ৮:১ বা তার বেশি মানে খুব নাটকীয়।' },
  { term: 'কালার টেম্পারেচার', meaning: 'আলোর রং, কেলভিনে মাপা হয়। ২৭০০K মানে হলদেটে বাল্বের আলো, ৫৬০০K মানে দুপুরের রোদ, ৭০০০K এর বেশি মানে নীলচে ঠান্ডা আলো।' },
  { term: 'হার্ড বনাম সফট আলো', meaning: 'ছোট উৎস থেকে আসা আলো ধারালো ছায়া ফেলে, বড় উৎস থেকে আসা আলো ছায়াকে নরম করে গড়িয়ে দেয়।' },
  { term: 'মোটিভেটেড আলো', meaning: 'যে আলোর একটা বিশ্বাসযোগ্য উৎস দৃশ্যে আছে বা আছে বলে মনে হয়, যেমন জানালা, ল্যাম্প, স্ক্রিন বা আগুন।' },
];
