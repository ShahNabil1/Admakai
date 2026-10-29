import { Link } from '@tanstack/react-router';
import { DISCORD_URL, SAZDAH_DIR as D, WHATSAPP_GROUP_URL, sazdahPost } from '@/data/blog';
import { Compare, Cover, CtaStrip, Gallery, Note, PillLink, Prompt, ReadingProgress, SafeImg, Section, Soft, Step } from './BlogParts';
import { useEffect, useRef, useState } from 'react';

const characterPrompt = `Character sheet. FACE LOCK @image1: 100% identical face to @image1, same eyes, nose, lips, jaw, beard, hairline, skin tone, no beautification, no slimming, no age change. Body: Bangladeshi man, mid twenties, slim, realistic proportions, head to body 1:7.5, five fingers each hand.

HAIR: his own hair but slightly messy and dry looking at the front.

OUTFIT LOCK @image2: copy the exact clothing of the person in @image2 as a male version: deep green velvet robe with a wide shawl collar, loosely tied at the waist, over a plain white sleeveless vest. Clothes only, not the face or body.

Layout: one sheet with full body front, full body three quarter, profile, plus three close ups (worried pulling at hair, skeptical holding a bottle, delighted). Light matched to @image2: warm tungsten key with a pink rim. Plain warm grey background, 50mm, no distortion, realistic skin texture, no text, no logo.`;

const clipPrompt = `@image 1 is the location: this exact red tiled bathroom with the arched mirror and wooden vanity, nothing added or removed. @image 2 is HERO: this exact face and the green velvet robe over a white vest, messy dry hair. @image 3 is MIRROR: the same face, neat combed hair, white vest only. @image 4 oil, @image 5 shampoo, @image 6 hair mask: exact products, labels unchanged. @audio is the ONLY speech.

WHO IS WHERE: HERO in the green robe is the only person in the room, in every shot, always outside the mirror. MIRROR in the white vest exists only inside the mirror glass as HERO's reflection, never in the room. Nobody in a white vest ever appears outside the glass.

SPEECH SOURCE: @audio is the complete and final voice track. Do not synthesize, generate, dub or add any speech in any language, no narrator, no music. If @audio cannot be used, output a silent video with natural mouth movement only where marked.

LIP SYNC: HERO speaks 0.7 to 2.6s and 5.6 to 7.4s. MIRROR speaks 2.9 to 5.1s. Mouths closed at all other times.

FACE LOCK: HERO and MIRROR share one face, 100% identical to @image 2 in every frame; no beautification, no drift. Only hair and clothes differ.

REALITY RULE: in SHOT 1 the mirror reflects HERO correctly. From SHOT 3 the reflection is MIRROR, who moves on his own while HERO stands still. In SHOT 4 MIRROR's hand comes out through the glass surface and hands the oil to HERO; the glass ripples slightly where the hand passes.

Shot on ARRI Alexa 35 with Cooke S7/i primes at T2.0 and a 1/4 Black Pro-Mist filter, 4K, 16:9, 24fps, 180-degree shutter, real-time speed, no on-screen text, no logos other than the product labels. Shallow depth, ARRI REVEAL colour, Kodak 2383 print look, gentle halation, real skin texture, fine Kodak 5219 grain.

SHOT 1 (0-0.7s) 24mm wide from behind HERO, he stands at the vanity, both hands in his hair, looking at his own correct reflection, silent.
SHOT 2 (0.7-2.7s) 50mm medium front, HERO pulls at his dry hair by the temples with both hands, worried, talking.
SHOT 3 (2.7-5.2s) 24mm wide from behind HERO, in the glass the reflection is now MIRROR, leaning on the mirror frame from inside, talking, pointing at himself.
SHOT 4 (5.2-7.0s) 85mm insert at the mirror edge, MIRROR's hand pushes out through the glass holding the oil, label to camera, HERO's robed arm takes it.
SHOT 5 (7.0-9.5s) 50mm medium front, HERO holds the oil, looks at it, skeptical, then reads the label silently.

Physics: correct mirror geometry in SHOT 1, the glass ripples where the hand passes in SHOT 4, the bottle changes hands cleanly, hair moves under the fingers, five fingers each hand, nothing floats, nothing appears or vanishes.

Duration exactly 9.5 seconds.`;

function Tvc() {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (ref.current?.networkState === 3) setFailed(true); }, []);
  if (failed) return <div className="blog-wide blog-frame"><SafeImg src={`${D}/tvc.mp4`} alt="সাজদাহ টিভিসি" /></div>;
  return (
    <div className="blog-wide blog-frame">
      <video ref={ref} controls playsInline preload="metadata" poster={`${D}/tvc-poster.jpg`} onError={() => setFailed(true)}>
        <source src={`${D}/tvc.mp4`} type="video/mp4" onError={() => setFailed(true)} />
      </video>
    </div>
  );
}

const Discord = (text: string, button: string) => <CtaStrip text={text} button={button} href={DISCORD_URL} />;

export function SazdahPost() {
  return (
    <div className="blog-page">
      <ReadingProgress />
      <article className="blog-inner">
        <div className="blog-col">
          <Section>
            <nav aria-label="Breadcrumb" className="blog-meta"><Link to="/blog">ব্লগ</Link></nav>
            <span className="blog-chip" style={{ marginTop: 16 }}>{sazdahPost.category}</span>
            <h1>একটা পুরো টিভিসি, কোনো <span className="blog-serif">শুটিং</span> ছাড়া</h1>
            <span className="blog-meta" style={{ marginTop: 14 }}>Admakai · <time dateTime={sazdahPost.datePublished}>{sazdahPost.dateLabel}</time> · {sazdahPost.readLabel}</span>
          </Section>
          <Cover src={sazdahPost.cover} alt="সাজদাহ টিভিসির ফাইনাল ফ্রেম" />
          <Section><p className="blog-lead">{sazdahPost.excerpt}</p></Section>
          <Tvc />
          <div className="blog-stats">
            {[['০', 'শুটিং ডে'], ['৩', 'ক্লিপে ভাগ'], ['১১', 'রেফারেন্স ফাইল'], ['৫', 'দিন প্রথম কাট']].map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
          </div>
          <CtaStrip text="পড়তে পড়তে কিছু আটকালে জিজ্ঞেস করার জায়গা আছে। আমাদের কমিউনিটিতে আসুন, Bangladesh AI Talent Alliance." button="ডিসকর্ডে যোগ দিন" href={DISCORD_URL} />

          <Section>
            <h2>ক্লায়েন্ট আমাদের যা দিয়েছিল</h2>
            <p>সাজদাহ একটা হেয়ার কেয়ার ব্র্যান্ড। তিনটা প্রোডাক্ট, একটা অ্যান্টি হেয়ারফল অয়েল, একটা শ্যাম্পু আর একটা হেয়ার মাস্ক। আমাদের হাতে এসেছিল শুধু প্রোডাক্টের ছবি আর ব্র্যান্ডের লোগো। আর কিছু না। কোনো মডেল না, কোনো লোকেশন না, কোনো ফুটেজ না।</p>
          </Section>
          <Gallery cols={3} ratio="4 / 5" items={[{ src: `${D}/prod-oil.jpg`, caption: 'হেয়ার গ্রোথ অয়েল' }, { src: `${D}/prod-shampoo.jpg`, caption: 'অ্যান্টি হেয়ারফল শ্যাম্পু' }, { src: `${D}/prod-mask.jpg`, caption: 'ড্যামেজ রিপেয়ার মাস্ক' }]} />
          <Note>প্রথম নিয়ম। প্রোডাক্টের ছবি সাদা ব্যাকগ্রাউন্ডে, সোজা সামনে থেকে তোলা হলে পুরো কাজটা সহজ হয়ে যায়। লেবেল পরিষ্কার দেখা গেলে এআই সেটা অবিকল ধরে রাখতে পারে। দোকানের হলুদ আলোয় তোলা বাঁকা ছবি দিলে প্রতিটা ফ্রেমে লেবেল বদলে যাবে, আর পরে এডিটে ঠিক করা যায় না।</Note>

          <Section>
            <h2>সাতটা ধাপ, একটাও বাদ দেওয়া যায় না</h2>
            <p>বেশিরভাগ মানুষ ধাপ তিন থেকে শুরু করে, মানে সরাসরি ভিডিও জেনারেট করতে বসে যায়। এজন্যই আউটপুট দেখে এআই মনে হয়। আসল কাজটা হয় প্রথম দুই ধাপে, যেখানে একটা ফ্রেমও জেনারেট হয় না।</p>
          </Section>

          <div className="blog-steps">
            <Step n="01" title="গল্পটা আগে, টুল পরে">
              <p>আমরা একটা পুরোনো আইডিয়া ধার করেছি, আয়না। একজন মানুষ আয়নার সামনে দাঁড়িয়ে নিজের চুল নিয়ে হতাশ। আয়নার ভেতরের সে আরেকটু আত্মবিশ্বাসী, চুল গোছানো, আর সে উত্তর দেয়। পুরো অ্যাডটা দুইজন মানুষের কথোপকথন, কিন্তু মানুষ আসলে একজনই।</p>
              <p>এই গল্পটা লেখার আগে আমরা একটা ফ্রেমও জেনারেট করিনি। কারণ গল্প ঠিক না হলে যত ভালো শটই বানান, মানুষ দুই সেকেন্ড পর স্ক্রল করে চলে যাবে। ভালো শট খারাপ গল্পকে বাঁচাতে পারে না।</p>
              <Note>নিজে করতে চাইলে প্রশ্ন চারটা। <strong>গল্পটা কী।</strong> <strong>কে বলছে।</strong> <strong>কোথায় বলছে।</strong> <strong>দুই সেকেন্ড পরেও মানুষ কেন দেখবে।</strong> চারটার উত্তর এক লাইনে লিখতে না পারলে এআই চালু করবেন না।</Note>
            </Step>

            <Step n="02" title="লোকেশন বানানো, মানুষ ছাড়া">
              <p>আগে খালি সেট বানাই, কোনো মানুষ ছাড়া। কারণ একই সেটে পরে যত শট লাগবে সব এক রকম দেখাবে। লাল টাইলসের বাথরুম, আর্চ আয়না, চারপাশে বাল্ব, গোলাপি পর্দা। তিনটা অ্যাঙ্গেলে তিনটা প্লেট বানানো হয়েছে, আর এই তিনটা প্লেটই পরে প্রতিটা ভিডিও প্রম্পটে রেফারেন্স হিসেবে গেছে।</p>
              <Gallery cols={3} items={[{ src: `${D}/loc-wide.jpg`, caption: 'ওয়াইড প্লেট' }, { src: `${D}/loc-vanity.jpg`, caption: 'ক্লোজ প্লেট' }, { src: `${D}/loc-endcard.jpg`, caption: 'এন্ড কার্ড ব্যাকড্রপ' }]} />
              <p>নিচের স্লাইডারটা টেনে দেখুন। বামে আমাদের বানানো খালি সেট, ডানে ফাইনাল অ্যাডের সেই একই ফ্রেম।</p>
              <Compare before={{ src: `${D}/loc-wide.jpg`, label: 'খালি সেট' }} after={{ src: `${D}/after-wide.jpg`, label: 'ফাইনাল ফ্রেম' }} />
              {Discord('এই তিনটা লোকেশন প্লেট যে প্রম্পটে বানানো, সেটা ডিসকর্ডের রিসোর্স রুমে পুরোটা দেওয়া আছে।', 'প্রম্পটটা নিন')}
            </Step>

            <Step n="03" title="ক্যারেক্টার শিট, এটাই আসল চাবি">
              <p>এখানেই বেশিরভাগ মানুষ হেরে যায়। প্রতিবার নতুন করে প্রম্পট দিলে প্রতিবার নতুন মুখ আসে। তাই আমরা আগে একটা ক্যারেক্টার শিট বানাই, একই মুখের সামনে, পাশ, তিন কোয়ার্টার আর কয়েকটা এক্সপ্রেশন, সব এক ছবিতে। তারপর ভিডিও জেনারেট করার সময় ঐ শিটটাই রেফারেন্স হিসেবে দিই।</p>
              <p>এই অ্যাডে দুইটা শিট লেগেছে। একই মুখ, কিন্তু আয়নার বাইরের মানুষটা সবুজ রোব পরা আর চুল অগোছালো, আয়নার ভেতরের মানুষটা সাদা গেঞ্জি পরা আর চুল পরিপাটি। পোশাক আর চুল আলাদা, মুখ হুবহু এক।</p>
              <Gallery cols={2} items={[{ src: `${D}/char-robe.jpg`, caption: 'আয়নার বাইরের মানুষ' }, { src: `${D}/char-vest.jpg`, caption: 'আয়নার ভেতরের মানুষ' }]} ratio="16 / 9" />
              <p>মুখটা একজন আসল মানুষের ছবি থেকে লক করা, তার অনুমতি নিয়ে। নিচের প্রম্পটটা কপি করে নিজের ছবি দিয়ে চালিয়ে দেখতে পারেন।</p>
              <Prompt label="ক্যারেক্টার শিট প্রম্পট" text={characterPrompt} />
              {Discord('নিজের ছবি দিয়ে চালাতে গিয়ে মুখ বদলে গেলে স্ক্রিনশট দিয়ে ভেতরে জিজ্ঞেস করুন। এটার জন্য আলাদা একটা রুম আছে।', 'জিজ্ঞেস করুন')}
            </Step>

            <Step n="04" title="ভয়েস আগে, ভিডিও পরে">
              <p>এটা উল্টো মনে হতে পারে, কিন্তু আমরা ভিডিওর আগে ভয়েস বানাই। কারণ ভিডিওর দৈর্ঘ্য ভয়েসের দৈর্ঘ্য অনুযায়ী ঠিক করতে হয়। উল্টোটা করলে কথা কেটে যায়, বা শেষে ফাঁকা পড়ে থাকে, আর লিপ সিংক কখনো মেলে না।</p>
              <p>দুইটা চরিত্র, দুইটাই একই ক্লোন ভয়েস, শুধু সেটিংস আলাদা। আয়নার বাইরের মানুষটা ক্লান্ত আর সন্দিহান, ভেতরের মানুষটা আত্মবিশ্বাসী।</p>
              <div className="blog-dialogue">
                <p><span className="blog-caps">ক্লিপ এক</span>চুলের কিছু একটা করা লাগবে ভাই। / আমি জানি কী করা লাগবে, সাজদাহ। / সাজদাহ? ওটা তো চিনি।</p>
                <p><span className="blog-caps">ক্লিপ দুই</span>চিনেন না। মেথি, আমলা, নিম, ভৃঙ্গরাজ, একদম প্রকৃতির জিনিস। / মানে খুশকি, চুল পড়া, আগা ফাটা, সব? / ভাই হ্যাঁ, বিশ্বাস করেন কাজ করে।</p>
              </div>
              <Note>ভয়েস বানানোর পর আমরা প্রতিটা লাইন কোন সেকেন্ডে শুরু হয় আর কোন সেকেন্ডে শেষ হয়, সেটা মেপে নিয়েছি। ঐ সময়গুলোই ভিডিও প্রম্পটে শট টাইমিং হিসেবে বসেছে। এই এক কাজটা করলেই লিপ সিংক অনেক ভালো হয়।</Note>
              <Soft>ভয়েস নিয়ে যেটা শিখেছি। প্রম্পটে pause ট্যাগ বসালে কথা ঝুলে যায়, কৃত্রিম শোনায়। এর বদলে শুধু দাঁড়ি আর কমা দিয়ে ছন্দ ঠিক করলে কথা অনেক বেশি মানুষের মতো আসে। স্পিড সামান্য বাড়িয়ে রাখা ভালো, কারণ বাংলা টেক্সট টু স্পিচ ডিফল্টে একটু ধীর পড়ে।</Soft>
              <Gallery cols={2} items={[{ src: `${D}/after-mirror.jpg`, caption: 'আয়নার ভেতরের মানুষটা উত্তর দিচ্ছে' }, { src: `${D}/shot-oil.jpg`, caption: 'ম্যাক্রো শট, হাতে তেল' }]} />
            </Step>

            <Step n="05" title="ভিডিও প্রম্পট, যেখানে সবকিছু লক করা থাকে">
              <p>ত্রিশ সেকেন্ডের অ্যাড এক প্রম্পটে হয় না। আমরা তিনটা ক্লিপে ভাগ করেছি। প্রতিটা প্রম্পটে একই কাঠামো, কোন ছবি কোনটা, কার মুখ লক, কে কোন সেকেন্ডে কথা বলবে, ক্যামেরা কী করবে, আর কী কী যেন না হয়।</p>
              <p>খেয়াল করুন প্রম্পটে একটা আলাদা লাইন আছে, কে আয়নার ভেতরে আর কে বাইরে। এই এক লাইন না দিলে মডেল সাদা গেঞ্জির মানুষটাকে ঘরের ভেতর এনে ফেলে, আর পুরো গল্পটা ভেঙে যায়।</p>
              <Prompt label="ক্লিপ এক, ভিডিও প্রম্পট" text={clipPrompt} />
              {Discord('এটা তিনটার মধ্যে একটা। বাকি দুই ক্লিপের প্রম্পট আর এন্ড কার্ডেরটা ডিসকর্ডের রিসোর্স রুমে।', 'বাকিগুলো নিন')}
            </Step>

            <Step n="06" title="যা জেনারেট হয়নি, সেটা মানুষ করেছে">
              <p>এই জায়গাটা নিয়ে কেউ কথা বলে না, অথচ এখানেই অ্যাডটা আসল হয়ে ওঠে। জেনারেট হওয়া ফুটেজ পাওয়ার পর যা যা করা হয়েছে।</p>
              <ul className="blog-list">
                <li>কালার গ্রেড, যাতে তিনটা ক্লিপ এক সেট আর এক আলোয় মনে হয়</li>
                <li>বাংলা টেক্সট, কারণ এআই বাংলা লেখা এখনো ভেঙে ফেলে, তাই টেক্সট পরে এডিটে বসানো</li>
                <li>সাউন্ড ডিজাইন, বাথরুমের রুম টোন, তেল ঢালার শব্দ, আয়নার কাচে হাত ঢোকার শব্দ</li>
                <li>মিউজিক, যেটা কথার নিচে ডাক করা, কথার সময় নেমে যায় আর শেষে উঠে আসে</li>
                <li>এন্ড কার্ড, লোগো আর তিনটা প্রোডাক্ট, আলাদা করে বানানো</li>
              </ul>
              <Compare before={{ src: `${D}/loc-endcard.jpg`, label: 'খালি ব্যাকড্রপ' }} after={{ src: `${D}/after-end.jpg`, label: 'এন্ড কার্ড' }} />
            </Step>

            <Step n="07" title="যা যা ভুল হয়েছিল">
              <p>প্রথম চেষ্টায় কিছুই ঠিক হয়নি। যেগুলো ভুল হয়েছিল, সেগুলোই সবচেয়ে কাজের শিক্ষা।</p>
              <ul className="blog-list">
                <li><strong>টুল নিজের ভয়েস বানিয়ে দিয়েছিল।</strong> প্রম্পটে বাংলা সংলাপ লেখা ছিল, তাই মডেল সেটা পড়ে নিজের মতো একটা নকল বাংলা গলা বানিয়ে ফেলেছিল। সমাধান, প্রম্পট থেকে সংলাপের টেক্সট পুরো বাদ, শুধু অডিও ফাইল রেফারেন্স।</li>
                <li><strong>আয়নার নিয়ম ভেঙে গিয়েছিল।</strong> সাদা গেঞ্জির মানুষটা ঘরের ভেতর চলে এসেছিল। সমাধান, আলাদা একটা WHO IS WHERE লাইন।</li>
                <li><strong>মুখ বদলে যাচ্ছিল।</strong> এক প্রম্পটে এক ক্যারেক্টার শিট দিলে ঠিক থাকে, দুইজন একসাথে দিলে মিশে যায়। সমাধান, দুইটা আলাদা শিট, আর প্রতিটা শটে কে কোনটা সেটা লিখে দেওয়া।</li>
                <li><strong>ক্লিপ ত্রিশ সেকেন্ডের বেশি হচ্ছিল না।</strong> তাই তিনটা ক্লিপে ভাগ, আর অডিও আগে মেপে নিয়ে শট টাইমিং ঠিক করা।</li>
              </ul>
              {Discord('এই ভুলগুলো ধরতে আমাদের কয়েক দিন গেছে। ভেতরে জিজ্ঞেস করলে আপনার কয়েক মিনিট যাবে।', 'যোগ দিন')}
            </Step>
          </div>

          <Section>
            <h2>শুটে করলে কী লাগত</h2>
            <div className="blog-table-wrap blog-frame" style={{ marginTop: 24 }}>
              <table className="blog-table">
                <thead><tr><th>যা লাগত</th><th>শুটিং করলে</th><th>এভাবে</th></tr></thead>
                <tbody>
                  {[
                    ['সেট আর লোকেশন', 'স্টুডিও ভাড়া, আর্ট ডিপার্টমেন্ট, লাল টাইলস বসানো', 'তিনটা ইমেজ'],
                    ['মডেল', 'একজনের দিনের রেট, মেকআপ, ওয়ার্ড্রোব', 'দুইটা ক্যারেক্টার শিট'],
                    ['ক্রু', 'ডিপি, লাইট, সাউন্ড, অ্যাসিস্ট্যান্ট', 'একজন ডিরেক্টর, একজন এডিটর'],
                    ['সময়', 'প্রি প্রোডাকশন থেকে ডেলিভারি, দুই থেকে তিন সপ্তাহ', 'প্রথম কাট পাঁচ দিনে'],
                    ['নতুন সিজনে', 'পুরো শুট আবার', 'নতুন প্রোডাক্টের ছবি, একই মুখ'],
                  ].map(row => <tr key={row[0]}>{row.map(c => <td key={c}>{c}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </Section>
          <Note>পরিষ্কার করে বলি। এটা শুটের বিকল্প না, এটা আলাদা একটা জিনিস। যে ব্র্যান্ড বছরে একটা বড় ফিল্ম বানায় তার শুট করাই উচিত। কিন্তু যে ব্র্যান্ডকে প্রতি মাসে নতুন কন্টেন্ট দিতে হয়, তার জন্য শুট গাণিতিকভাবেই সম্ভব না। সেই জায়গাটাই এটা ভরাট করে।</Note>
        </div>
      </article>

      <Section className="blog-band">
        <div className="blog-band-inner">
          <h2>এরকম প্রসেস আমরা <span className="blog-serif">প্রতি সপ্তাহে</span> খুলে দেখাই</h2>
          <p>আমরা বাংলাদেশের সবচেয়ে বড় এআই কমিউনিটি বানাচ্ছি। যে প্রম্পট আর ওয়ার্কফ্লো দিয়ে আসল ক্লায়েন্টের কাজ করি, সেগুলোই ভেতরে শেয়ার করা হয়। কিছু কিনতে হবে না, কোনো কোর্স নাই, বিক্রির কোনো কথা নাই।</p>
          <div className="blog-qr-grid">
            <div className="blog-qr-card">
              <div className="blog-qr"><SafeImg src={`${D}/qr-discord.png`} alt="ডিসকর্ড QR কোড" ratio="1 / 1" /></div>
              <div>
                <h3>Bangladesh AI Talent Alliance</h3>
                <p>ডিসকর্ড সার্ভার। প্রতি সপ্তাহে একটা চ্যালেঞ্জ, লাইভ সেশন, ব্রেইনস্টর্ম রুম, আর আলাদা রুম ভিডিও, কোডিং, রাইটিং, বিজনেস আর স্টুডেন্টদের জন্য। যারা নিজের বানানো একটা জিনিস দেখাতে পারে, তাদের জন্য রিসোর্স লাইব্রেরি আর কানেকশন বোর্ড খুলে যায়।</p>
                <PillLink href={DISCORD_URL} variant="discord">ডিসকর্ডে যোগ দিন →</PillLink>
              </div>
            </div>
            <div className="blog-qr-card">
              <div className="blog-qr"><SafeImg src={`${D}/qr-whatsapp.png`} alt="হোয়াটসঅ্যাপ QR কোড" ratio="1 / 1" /></div>
              <div>
                <h3>প্রতিদিন এআই আপডেট, হোয়াটসঅ্যাপে</h3>
                <p>প্রতিদিন সকালে তিনটা আপডেট। কোন টুল নতুন এলো, কোনটা বাদ দেওয়ার সময় হলো, আর বাংলাদেশে বসে আপনি সেটা দিয়ে কী করতে পারেন। মাসে একবার ভেতরের একটা ওয়ার্কফ্লো পুরোটা খুলে দেখাই, ঠিক এই লেখাটার মতো করে। স্প্যাম নাই, বের হতে চাইলে এক ক্লিক।</p>
                <PillLink href={WHATSAPP_GROUP_URL} variant="whatsapp">হোয়াটসঅ্যাপ গ্রুপে ঢুকুন →</PillLink>
              </div>
            </div>
          </div>
          <Soft>একটা কথা সোজাসুজি। কমিউনিটিটা এখনো ছোট। মানে এখন ঢুকলে আপনার প্রতিটা প্রশ্নের উত্তর পাবেন, আপনার কাজ সবার চোখে পড়বে, আর যারা এটা চালাচ্ছে তাদের সাথে সরাসরি কথা বলতে পারবেন। ছয় মাস পর হাজার মানুষ হলে এই তিনটার একটাও আর সম্ভব না।</Soft>
          <p className="blog-signoff">Admakai, একটি Branta Tech প্রতিষ্ঠান.</p>
        </div>
      </Section>
    </div>
  );
}
