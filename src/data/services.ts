export type ServiceCategory = { id: string; name: string; intro: string };
export type Service = {
  slug: string; category: string; name: string; isNew: boolean; published: boolean;
  shortDescription: string; description: string; bestFor: string[]; signsYouNeedIt: string[];
  whatYouGet: string[]; whatWeNeed: string[]; formats: string; delivery: string;
  pricing: 'quote' | 'per-minute' | 'monthly'; priceFrom: number | null;
  goals: string[]; related: string[]; compareNote?: string;
};
export const serviceCategories: ServiceCategory[] = [
  {
    "id": "video-ads",
    "name": "Video ads",
    "intro": "Story-led and performance video ads, made without a shoot."
  },
  {
    "id": "imagery",
    "name": "Product and fashion imagery",
    "intro": "Product, catalogue and fashion images that look professionally shot."
  },
  {
    "id": "people",
    "name": "People and presenters",
    "intro": "Faces, presenters and digital twins for your brand."
  },
  {
    "id": "social",
    "name": "Social content and editing",
    "intro": "Reels, motion graphics and editing that keep your page alive."
  },
  {
    "id": "voice",
    "name": "Voice and sound",
    "intro": "Voice, music and sound that make your brand heard."
  },
  {
    "id": "strategy",
    "name": "Strategy and brand",
    "intro": "The thinking before and after the ad, so your budget works harder."
  }
];

export const services: Service[] = [
  {
    "slug": "ai-commercial-30s",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "AI Commercial, 30s",
    "isNew": false,
    "shortDescription": "A full story-led commercial with locked characters and locations, made without a shoot.",
    "description": "A complete TV and social commercial built with AI. The same characters and locations stay consistent from the first frame to the last, so it feels like a real production.",
    "bestFor": [
      "FMCG, beverage and snack brands",
      "Skincare and cosmetics",
      "Real estate and banking",
      "Any brand launching a main campaign"
    ],
    "signsYouNeedIt": [
      "You are launching a new product or campaign",
      "You want TVC quality without a TVC shoot budget",
      "You want people to remember a story, not just an offer"
    ],
    "whatYouGet": [
      "Concept and full script",
      "Character and location sheets so every scene stays consistent",
      "30s master film",
      "3 cutdowns: 15s, 6s and a 9:16 vertical",
      "Captions in Bangla or English"
    ],
    "whatWeNeed": [
      "Product photos or a sample",
      "Logo and brand colours",
      "Who your customer is",
      "Your main offer or message"
    ],
    "formats": "16:9, 9:16, 1:1",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "launch",
      "brand",
      "festival"
    ],
    "related": [
      "ai-commercial-60s",
      "cgi-product-commercial"
    ]
  },
  {
    "slug": "ai-commercial-60s",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "AI Commercial, 60s",
    "isNew": false,
    "shortDescription": "A longer brand story on the same pipeline, for when 30 seconds is not enough.",
    "description": "The same character-locked pipeline as our 30s commercial, with room for a full story arc. Built for brand films, launches and big screens.",
    "bestFor": [
      "Real estate developers",
      "Banks and financial services",
      "Hospitals and education",
      "Companies telling their brand story or mission"
    ],
    "signsYouNeedIt": [
      "You want to tell your brand's history or mission",
      "The story has several characters or features",
      "It will run as a YouTube pre-roll or on an event screen"
    ],
    "whatYouGet": [
      "Concept, script, character and location sheets",
      "60s master film",
      "4 cutdowns: 30s, 15s, 6s and 9:16",
      "Captions"
    ],
    "whatWeNeed": [
      "Product or project photos",
      "Your brand story or mission",
      "Logo and colours"
    ],
    "formats": "16:9, 9:16, 1:1",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "brand",
      "corp",
      "launch"
    ],
    "related": [
      "ai-commercial-30s",
      "corporate-avc-event-video"
    ]
  },
  {
    "slug": "ai-ugc-ads",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "AI UGC Ads",
    "isNew": false,
    "shortDescription": "Creator-style hook videos that look filmed on a phone, without hiring creators.",
    "description": "Videos that feel like a real person reviewing your product on their phone. You get several hooks and several AI creators, so you can test what your audience trusts.",
    "bestFor": [
      "Skincare and haircare",
      "Gadgets and accessories",
      "Facebook commerce pages",
      "Apps and food delivery"
    ],
    "signsYouNeedIt": [
      "Polished ads are not converting and your audience trusts real-looking content",
      "You want to test many hooks quickly",
      "Influencer fees and schedules are slowing you down"
    ],
    "whatYouGet": [
      "3 different hooks per script",
      "3 AI creators matched to your target age and look",
      "Handheld, phone-style camera",
      "Captions",
      "9:16 and 1:1 versions"
    ],
    "whatWeNeed": [
      "Product photos or video",
      "Real customer reviews or comments, if you have them",
      "Who you want to sell to"
    ],
    "formats": "9:16, 1:1",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "ecom",
      "launch"
    ],
    "related": [
      "ad-variant-pack",
      "reels-pack-of-6"
    ]
  },
  {
    "slug": "ad-variant-pack",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "Ad Variant Pack",
    "isNew": false,
    "shortDescription": "One master ad turned into 10 testable versions.",
    "description": "We take one ad that works and turn it into 10 versions with different hooks, formats, lengths and languages. Meta then finds the winner for you.",
    "bestFor": [
      "Brands running Meta ads every month",
      "Performance marketers",
      "Ad agencies"
    ],
    "signsYouNeedIt": [
      "Your best ad is getting tired and clicks are dropping",
      "You want to test which hook or length works best",
      "Different audiences need different openings"
    ],
    "whatYouGet": [
      "10 variants across hooks, formats, lengths and languages",
      "File names ready for Ads Manager",
      "A sheet showing what each variant tests"
    ],
    "whatWeNeed": [
      "A master ad, ours or yours",
      "The audiences you will run it to"
    ],
    "formats": "16:9, 9:16, 1:1",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "ecom"
    ],
    "related": [
      "ad-performance-review",
      "ai-ugc-ads"
    ]
  },
  {
    "slug": "product-film",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "Product Film",
    "isNew": false,
    "shortDescription": "A software-style launch film with UI, bold type and motion.",
    "description": "A sleek launch film for tech products, made with interface animation, large typography and motion. Built to impress on launch day and to work as a website hero video.",
    "bestFor": [
      "Software companies",
      "Mobile apps",
      "Gadget brands"
    ],
    "signsYouNeedIt": [
      "You have a product launch coming",
      "You need a hero video for your website",
      "You are pitching investors"
    ],
    "whatYouGet": [
      "30 to 60s film",
      "9:16 version",
      "Music and sound effects"
    ],
    "whatWeNeed": [
      "App screenshots or Figma files",
      "Logo and colours",
      "Your top 3 features"
    ],
    "formats": "16:9, 9:16",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "tech",
      "launch"
    ],
    "related": [
      "saas-explainer",
      "motion-ad-logo-animation"
    ],
    "compareNote": "Product Film impresses people on launch day. SaaS Explainer and App Demo teaches them how to use the product."
  },
  {
    "slug": "saas-explainer",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "SaaS Explainer and App Demo",
    "isNew": true,
    "shortDescription": "A step-by-step explainer that shows what your software does in 60 to 90 seconds.",
    "description": "We turn your software into a clear story: the problem, how your product solves it, and the key screens in action. Ideal for your website, sales calls and onboarding.",
    "bestFor": [
      "SaaS, ERP and POS software",
      "School and coaching management software",
      "Fintech and e-commerce tools",
      "Automation services"
    ],
    "signsYouNeedIt": [
      "You repeat the same demo on every sales call",
      "People sign up but never start using the product",
      "Visitors land on your website and leave confused"
    ],
    "whatYouGet": [
      "Problem-to-solution script",
      "Storyboard approval before production",
      "UI animation from your Figma files or screen recordings, with zoom-ins and callouts",
      "Voiceover",
      "Onboarding cut with a short clip for each feature",
      "Lottie animation for your website"
    ],
    "whatWeNeed": [
      "App link or a demo login",
      "Screenshots or Figma files",
      "Your customer's biggest problem and your top 3 features"
    ],
    "formats": "16:9, 9:16",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "tech",
      "edu"
    ],
    "related": [
      "product-film",
      "explainer-motion-graphics"
    ],
    "compareNote": "Product Film impresses people on launch day. SaaS Explainer and App Demo teaches them how to use the product."
  },
  {
    "slug": "cgi-product-commercial",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "CGI Product Commercial",
    "isNew": true,
    "shortDescription": "Your product as the hero, with splashes, smoke and premium light. No people needed.",
    "description": "A CGI-style commercial where the product is the star: liquid splashes, smoke, pieces coming together and studio lighting. Your label, colour and shape stay exactly as they are.",
    "bestFor": [
      "Beverages and juices",
      "Perfume and skincare",
      "Watches and gadgets",
      "Snacks and packaged food"
    ],
    "signsYouNeedIt": [
      "You want your product to look premium",
      "You need a 5 to 10 second scroll-stopper",
      "You do not want the cost or hassle of models"
    ],
    "whatYouGet": [
      "10 to 20s CGI film",
      "Label, colour and shape matched to your real product",
      "3 formats",
      "Sound design",
      "Loop version for social"
    ],
    "whatWeNeed": [
      "Clear photos of the product from every side",
      "High-resolution label artwork"
    ],
    "formats": "16:9, 9:16, 1:1",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "launch",
      "brand"
    ],
    "related": [
      "ai-product-photoshoot",
      "ai-commercial-30s"
    ]
  },
  {
    "slug": "festival-campaign-pack",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "Festival Campaign Pack",
    "isNew": true,
    "shortDescription": "A complete ad set for Eid, Puja, Pohela Boishakh, 11.11 or Black Friday in one theme.",
    "description": "One festive theme across every placement: a hero ad, offer reels, static posts and page assets. Book 3 to 4 weeks before the festival so your ads have time to learn.",
    "bestFor": [
      "Fashion and footwear",
      "Restaurants and food",
      "Electronics",
      "Facebook commerce pages"
    ],
    "signsYouNeedIt": [
      "A festival is 3 to 4 weeks away",
      "You have one offer and want it to look the same everywhere"
    ],
    "whatYouGet": [
      "1 hero ad, 20 to 30s",
      "3 offer reels",
      "5 static posts",
      "Cover photo and profile frame",
      "One colour and type system across the whole set"
    ],
    "whatWeNeed": [
      "Offer details and campaign dates",
      "Product list and photos"
    ],
    "formats": "16:9, 9:16, 1:1, 4:5",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "festival",
      "sales",
      "fashion",
      "ecom"
    ],
    "related": [
      "static-ad-creative-pack",
      "reels-pack-of-6"
    ]
  },
  {
    "slug": "ai-storyboard-animatic",
    "category": "video-ads",
    "published": true,
    "priceFrom": null,
    "name": "AI Storyboard and Animatic",
    "isNew": true,
    "shortDescription": "A moving draft of your whole ad, so you can get approval before production.",
    "description": "We turn an idea or script into a shot-by-shot storyboard and a rough animated cut with temporary voice and music. Perfect for pitches and for planning a shoot.",
    "bestFor": [
      "Ad agencies",
      "Brand marketing teams",
      "Production houses",
      "Anyone pitching an idea"
    ],
    "signsYouNeedIt": [
      "You need to pitch a concept",
      "You want a shot plan before a live shoot",
      "Your boss cannot picture the idea from a script"
    ],
    "whatYouGet": [
      "Shot-by-shot storyboard, 12 to 20 frames",
      "Animatic video with temporary voice and music",
      "Shot list PDF"
    ],
    "whatWeNeed": [
      "The idea or script",
      "References, if you have them"
    ],
    "formats": "16:9",
    "delivery": "3 days",
    "pricing": "quote",
    "goals": [
      "corp",
      "brand"
    ],
    "related": [
      "ai-commercial-30s",
      "ai-commercial-60s"
    ]
  },
  {
    "slug": "ai-product-photoshoot",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "AI Product Photoshoot",
    "isNew": false,
    "shortDescription": "Studio, lifestyle and seasonal product shots without a studio or photographer.",
    "description": "Premium product images in three different scenes, retouched and ready for your page, ads and website. Your product stays exactly as it is.",
    "bestFor": [
      "Skincare",
      "Food and drink",
      "Home decor",
      "Gadgets and handicrafts"
    ],
    "signsYouNeedIt": [
      "Your page photos look cheap",
      "You need fresh images every season",
      "You want the same product shown in different settings"
    ],
    "whatYouGet": [
      "12 images per product across 3 scenes",
      "Retouched",
      "PSD on request",
      "Product kept exactly as it is"
    ],
    "whatWeNeed": [
      "Clear product photos or a sample",
      "The mood you want"
    ],
    "formats": "4:5, 1:1",
    "delivery": "3 days",
    "pricing": "quote",
    "goals": [
      "ecom",
      "sales",
      "launch"
    ],
    "related": [
      "ecommerce-catalogue-pack",
      "static-ad-creative-pack"
    ],
    "compareNote": "Product Photoshoot gives you ad-ready scenes. E-commerce Catalogue Pack gives you many products on clean backgrounds. Virtual Try-On puts your clothing on a model."
  },
  {
    "slug": "fashion-film-lookbook",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "Fashion Film and Lookbook",
    "isNew": false,
    "shortDescription": "A runway-style film and a full lookbook for your new collection, without a model shoot.",
    "description": "A 30 second fashion film plus 20 lookbook images with AI models. Fabric, cut and colour stay true to the real garment.",
    "bestFor": [
      "Clothing brands",
      "Boutiques",
      "Jewellery"
    ],
    "signsYouNeedIt": [
      "You are launching a new collection",
      "A new season is starting",
      "You are opening a showroom"
    ],
    "whatYouGet": [
      "30s fashion film",
      "20 lookbook images",
      "3 AI models",
      "Fabric, cut and colour true to the real garment"
    ],
    "whatWeNeed": [
      "Front and back photos of each garment",
      "Fabric close-ups"
    ],
    "formats": "16:9, 9:16, 4:5",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "fashion",
      "launch",
      "brand"
    ],
    "related": [
      "virtual-try-on",
      "ai-brand-model"
    ]
  },
  {
    "slug": "ai-brand-model",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "AI Brand Model",
    "isNew": false,
    "shortDescription": "A consistent model who belongs only to your brand.",
    "description": "A custom AI model with the same face in every image, created only for you. We never offer your model to another client.",
    "bestFor": [
      "Fashion",
      "Skincare",
      "Jewellery",
      "Brands posting content every month"
    ],
    "signsYouNeedIt": [
      "Your model changes with every shoot",
      "Model fees and schedules are a hassle",
      "You want a face customers recognise"
    ],
    "whatYouGet": [
      "Model sheet: face, body and 6 expressions",
      "10 images",
      "Exclusive usage rights, never given to another client"
    ],
    "whatWeNeed": [
      "The look you want: age, style and attitude",
      "Your brand mood"
    ],
    "formats": "4:5, 1:1",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "fashion",
      "brand"
    ],
    "related": [
      "ai-brand-ambassador",
      "fashion-film-lookbook"
    ],
    "compareNote": "AI Brand Model is a one-time job: one face and 10 images. AI Brand Ambassador is a monthly service with a personality, a voice, posts and reels."
  },
  {
    "slug": "virtual-try-on",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "Virtual Try-On and Model Swap",
    "isNew": true,
    "shortDescription": "Turn flat-lay or mannequin photos into real-looking on-model images.",
    "description": "Send us clothes on a hanger or on the floor and get them back worn by models, from every angle. No shoot, no model fees, and it scales to hundreds of products.",
    "bestFor": [
      "Facebook commerce clothing pages",
      "Saree, three-piece and panjabi sellers",
      "Kidswear",
      "Wholesalers"
    ],
    "signsYouNeedIt": [
      "You have hundreds of products and cannot shoot them all",
      "You want to show different ages or body types"
    ],
    "whatYouGet": [
      "10 images per product: front, side, back and close-up",
      "2 to 3 models",
      "One consistent background theme",
      "Optional 5s movement clip"
    ],
    "whatWeNeed": [
      "Flat-lay or mannequin photos",
      "Fabric close-ups"
    ],
    "formats": "4:5, 1:1, 9:16",
    "delivery": "2 days",
    "pricing": "quote",
    "goals": [
      "fashion",
      "ecom"
    ],
    "related": [
      "ecommerce-catalogue-pack",
      "fashion-film-lookbook"
    ],
    "compareNote": "Product Photoshoot gives you ad-ready scenes. E-commerce Catalogue Pack gives you many products on clean backgrounds. Virtual Try-On puts your clothing on a model."
  },
  {
    "slug": "ecommerce-catalogue-pack",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "E-commerce Catalogue Pack",
    "isNew": true,
    "shortDescription": "Clean, consistent white-background images for many products at once.",
    "description": "Phone photos in, a marketplace-ready catalogue out. Every image matches in background, shadow and colour, sized for your website, Daraz and Facebook.",
    "bestFor": [
      "Online shops",
      "Daraz sellers",
      "Wholesalers",
      "Superstores"
    ],
    "signsYouNeedIt": [
      "Every product photo looks different",
      "Your photos are shot on a phone",
      "Marketplaces reject your image sizes"
    ],
    "whatYouGet": [
      "20 SKUs per pack",
      "White or brand-colour background",
      "Shadows and colour corrected",
      "Exports sized for Daraz, website and Facebook",
      "Files named by SKU"
    ],
    "whatWeNeed": [
      "Phone photos of each product in good light",
      "Your SKU list"
    ],
    "formats": "1:1",
    "delivery": "3 days",
    "pricing": "quote",
    "goals": [
      "ecom"
    ],
    "related": [
      "ai-product-photoshoot",
      "virtual-try-on"
    ],
    "compareNote": "Product Photoshoot gives you ad-ready scenes. E-commerce Catalogue Pack gives you many products on clean backgrounds. Virtual Try-On puts your clothing on a model."
  },
  {
    "slug": "static-ad-creative-pack",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "Static Ad Creative Pack",
    "isNew": true,
    "shortDescription": "10 image ads and a carousel with a clear message and correct Bangla text.",
    "description": "Ten static ads built around different angles, plus a carousel. Bangla text is set by a designer and never generated by AI, so it is always correct.",
    "bestFor": [
      "Any business running Meta ads",
      "Brands starting on a small budget",
      "Coaching centres, clinics and service businesses"
    ],
    "signsYouNeedIt": [
      "You do not have a video budget yet",
      "You want to test many angles fast",
      "You need offer posts"
    ],
    "whatYouGet": [
      "10 statics across angles: problem, offer, review, comparison and question",
      "1 carousel",
      "Bangla text set by hand",
      "Ad copy and headline for each"
    ],
    "whatWeNeed": [
      "Your offer or main message",
      "Product photos",
      "Logo and colours"
    ],
    "formats": "4:5, 1:1, 9:16",
    "delivery": "3 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "ecom",
      "festival"
    ],
    "related": [
      "festival-campaign-pack",
      "ad-variant-pack"
    ]
  },
  {
    "slug": "3d-product-360",
    "category": "imagery",
    "published": true,
    "priceFrom": null,
    "name": "3D Product Model and 360 View",
    "isNew": true,
    "shortDescription": "A 3D model of your product that customers can spin on your website.",
    "description": "A reusable 3D model with a 360 turntable video and a web-ready viewer. Use it on your site today and in CGI ads tomorrow.",
    "bestFor": [
      "Furniture and interiors",
      "Electronics",
      "Shoes and bags",
      "Packaging"
    ],
    "signsYouNeedIt": [
      "Customers want to see every side",
      "The product is not made yet but you want pre-orders",
      "You need a base for CGI ads"
    ],
    "whatYouGet": [
      "GLB or USDZ 3D file",
      "360 turntable video",
      "Embed code for your website",
      "5 rendered images"
    ],
    "whatWeNeed": [
      "Photos from all around the product, or design files with dimensions"
    ],
    "formats": "GLB, USDZ, MP4",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "ecom",
      "launch",
      "tech"
    ],
    "related": [
      "cgi-product-commercial",
      "ai-product-photoshoot"
    ]
  },
  {
    "slug": "digital-clone",
    "category": "people",
    "published": true,
    "priceFrom": null,
    "name": "Digital Clone",
    "isNew": false,
    "shortDescription": "Your own face and voice, cloned with consent, so you can post without filming.",
    "description": "A digital twin made from a 3 minute recording and your written consent. Post regular videos in Bangla and English without sitting in front of a camera every week.",
    "bestFor": [
      "CEOs and founders",
      "Doctors, lawyers and consultants",
      "Coaches and teachers",
      "Real estate agents"
    ],
    "signsYouNeedIt": [
      "You want to post videos but have no time",
      "Filming every week is not realistic",
      "You want content in both Bangla and English"
    ],
    "whatYouGet": [
      "Setup from a 3 minute recording and written consent",
      "4 videos per month",
      "Bangla and English",
      "Your clone is used only with your approval"
    ],
    "whatWeNeed": [
      "A 3 minute video in good light",
      "Signed consent form",
      "Topics for the month"
    ],
    "formats": "16:9, 9:16",
    "delivery": "5 days setup",
    "pricing": "monthly",
    "goals": [
      "creator",
      "corp",
      "edu"
    ],
    "related": [
      "ai-presenter-video",
      "ai-voiceover"
    ],
    "compareNote": "Digital Clone is you, with your own face and voice. AI Presenter is a new face, for when you would rather not appear."
  },
  {
    "slug": "ai-presenter-video",
    "category": "people",
    "published": true,
    "priceFrom": null,
    "name": "AI Presenter Video",
    "isNew": false,
    "shortDescription": "An AI presenter explains your product or service on camera.",
    "description": "A professional presenter speaks to camera with on-screen graphics and text. Complex products become easy to understand.",
    "bestFor": [
      "Banks and insurance",
      "Hospitals",
      "Edtech",
      "Government and NGO projects"
    ],
    "signsYouNeedIt": [
      "You do not want to appear on camera yourself",
      "You need to explain rules or terms",
      "You need an intro video for your website or page"
    ],
    "whatYouGet": [
      "Script",
      "AI presenter of your choice",
      "60 to 90s video",
      "Background graphics and text",
      "Captions"
    ],
    "whatWeNeed": [
      "What you want explained",
      "Logo and colours"
    ],
    "formats": "16:9, 9:16",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "corp",
      "edu",
      "tech"
    ],
    "related": [
      "digital-clone",
      "training-video"
    ],
    "compareNote": "Digital Clone is you, with your own face and voice. AI Presenter is a new face, for when you would rather not appear."
  },
  {
    "slug": "training-video",
    "category": "people",
    "published": true,
    "priceFrom": null,
    "name": "Training Video",
    "isNew": false,
    "shortDescription": "Training modules for staff or customers, with slides and a presenter.",
    "description": "We turn your SOPs and know-how into clear 5 to 8 minute modules your team can watch anytime. Train every branch the same way.",
    "bestFor": [
      "Corporate HR",
      "Factory safety training",
      "Banks and franchises",
      "Online courses"
    ],
    "signsYouNeedIt": [
      "You repeat the same training for every new hire",
      "You have many branches and few trainers",
      "You want to build a course"
    ],
    "whatYouGet": [
      "5 to 8 minute modules",
      "Slides and presenter",
      "Chapters",
      "Bangla or English"
    ],
    "whatWeNeed": [
      "Training content or SOPs",
      "Number of modules"
    ],
    "formats": "16:9",
    "delivery": "7 days per 5 modules",
    "pricing": "quote",
    "goals": [
      "edu",
      "corp"
    ],
    "related": [
      "ai-presenter-video",
      "explainer-motion-graphics"
    ]
  },
  {
    "slug": "ai-brand-ambassador",
    "category": "people",
    "published": true,
    "priceFrom": null,
    "name": "AI Brand Ambassador",
    "isNew": true,
    "shortDescription": "A virtual face for your brand who shows up every month, like a real ambassador.",
    "description": "A character with a name, personality and voice who appears in your posts and reels every month. Fully exclusive to your brand.",
    "bestFor": [
      "Skincare",
      "Telecom and apps",
      "Food brands",
      "Brands that post every day"
    ],
    "signsYouNeedIt": [
      "A celebrity ambassador is out of budget",
      "You need a lot of content every month",
      "You want your brand to have a personality"
    ],
    "whatYouGet": [
      "Character, name, personality and voice",
      "8 posts and 4 reels every month",
      "Monthly content calendar",
      "Exclusive rights"
    ],
    "whatWeNeed": [
      "Your brand mood and audience",
      "Products and offers for the month"
    ],
    "formats": "9:16, 4:5",
    "delivery": "Monthly",
    "pricing": "monthly",
    "goals": [
      "brand",
      "creator",
      "sales"
    ],
    "related": [
      "ai-brand-model",
      "monthly-content-subscription"
    ],
    "compareNote": "AI Brand Model is a one-time job: one face and 10 images. AI Brand Ambassador is a monthly service with a personality, a voice, posts and reels."
  },
  {
    "slug": "ai-corporate-headshots",
    "category": "people",
    "published": true,
    "priceFrom": null,
    "name": "AI Corporate Headshots",
    "isNew": true,
    "shortDescription": "Matching professional headshots for your whole team, without a photographer.",
    "description": "Send selfies and get studio-quality portraits back. Everyone gets the same background, light and style.",
    "bestFor": [
      "Corporate offices",
      "Startups",
      "Law firms and hospitals",
      "Schools and colleges"
    ],
    "signsYouNeedIt": [
      "Your website needs a team page",
      "Your team needs LinkedIn profile photos",
      "You are making ID cards",
      "Your team works from different places"
    ],
    "whatYouGet": [
      "5 images per person",
      "Same background, lighting and outfit style",
      "Sizes for website and LinkedIn"
    ],
    "whatWeNeed": [
      "8 to 10 casual selfies per person"
    ],
    "formats": "1:1, 4:5",
    "delivery": "2 days",
    "pricing": "quote",
    "goals": [
      "corp",
      "creator"
    ],
    "related": [
      "digital-clone"
    ]
  },
  {
    "slug": "reels-pack-of-6",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "Reels Pack of 6",
    "isNew": false,
    "shortDescription": "Six reels from one brief to keep your page active all month.",
    "description": "Six short reels, each with its own hook, captions and cover, planned around your business. One brief, a month of content.",
    "bestFor": [
      "Restaurants and cafes",
      "Facebook commerce",
      "Coaching centres",
      "Salons and gyms"
    ],
    "signsYouNeedIt": [
      "Your page has no regular content",
      "Your reach is dropping",
      "You do not know what to make reels about"
    ],
    "whatYouGet": [
      "6 reels, 15 to 30s each",
      "A different hook for each reel",
      "Captions",
      "Cover images",
      "Post captions written for you"
    ],
    "whatWeNeed": [
      "Business details and offers",
      "Photos or footage, if you have them"
    ],
    "formats": "9:16",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "ecom",
      "creator"
    ],
    "related": [
      "monthly-content-subscription",
      "ai-ugc-ads"
    ],
    "compareNote": "Reels Pack of 6 is a one-time order. Monthly Content Subscription gives you a set amount every month with a dedicated manager."
  },
  {
    "slug": "ai-video-editing",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "AI Video Editing",
    "isNew": false,
    "shortDescription": "Your raw footage turned into a finished, professional cut.",
    "description": "Cutting, pacing, colour grading, voice cleanup, captions and sound effects. Priced per minute of final video.",
    "bestFor": [
      "YouTubers",
      "Podcasts",
      "Events",
      "Companies with footage but no editor"
    ],
    "signsYouNeedIt": [
      "You have shot on a phone or camera",
      "You do not have the time or skills to edit"
    ],
    "whatYouGet": [
      "Cut and pacing",
      "Cinematic colour grade",
      "Voice cleanup",
      "Captions",
      "Sound effects"
    ],
    "whatWeNeed": [
      "Raw footage",
      "Transcript or key points",
      "References, if you have them"
    ],
    "formats": "16:9, 9:16, 1:1",
    "delivery": "3 days",
    "pricing": "per-minute",
    "goals": [
      "creator",
      "corp"
    ],
    "related": [
      "long-to-short-repurposing",
      "youtube-channel-pack"
    ]
  },
  {
    "slug": "motion-ad-logo-animation",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "Motion Ad or Logo Animation",
    "isNew": false,
    "shortDescription": "Kinetic type, logo reveals and product motion in 10 to 20 seconds.",
    "description": "Short, polished animation for intros, outros, offers and announcements. Eye-catching without any footage.",
    "bestFor": [
      "New brands",
      "YouTube channels",
      "Events",
      "Software companies"
    ],
    "signsYouNeedIt": [
      "You need a logo at the start or end of your videos",
      "You want to announce an offer fast",
      "You want something eye-catching without footage"
    ],
    "whatYouGet": [
      "10 to 20s animation",
      "3 formats",
      "After Effects source file on request"
    ],
    "whatWeNeed": [
      "Logo vector file (AI, SVG or PDF)",
      "Your message or offer"
    ],
    "formats": "16:9, 9:16, 1:1",
    "delivery": "4 days",
    "pricing": "quote",
    "goals": [
      "brand",
      "launch"
    ],
    "related": [
      "explainer-motion-graphics",
      "product-film"
    ],
    "compareNote": "Motion Ad is a 10 to 20 second burst for a logo or an offer. Explainer Motion Graphics runs 1 to 2 minutes and explains data or a process."
  },
  {
    "slug": "explainer-motion-graphics",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "Explainer Motion Graphics",
    "isNew": true,
    "shortDescription": "A 1 to 2 minute infographic video that makes data or a process easy to follow.",
    "description": "Charts, icons, glass UI cards and kinetic text that turn numbers, reports and complex ideas into something anyone understands. No footage needed.",
    "bestFor": [
      "NGOs and development projects",
      "Edtech",
      "Banks and finance",
      "Educational YouTube channels"
    ],
    "signsYouNeedIt": [
      "You need to present data or a report",
      "You need to explain a process, such as how to apply for a loan",
      "There is no footage to show"
    ],
    "whatYouGet": [
      "Script",
      "Style frames for approval",
      "Glass UI cards, charts and icon animation",
      "Voiceover",
      "Music and sound effects"
    ],
    "whatWeNeed": [
      "Your data, report or content",
      "Logo and colours"
    ],
    "formats": "16:9, 9:16",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "corp",
      "edu",
      "tech"
    ],
    "related": [
      "saas-explainer",
      "corporate-avc-event-video"
    ],
    "compareNote": "Motion Ad is a 10 to 20 second burst for a logo or an offer. Explainer Motion Graphics runs 1 to 2 minutes and explains data or a process."
  },
  {
    "slug": "long-to-short-repurposing",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "Long to Short Repurposing",
    "isNew": true,
    "shortDescription": "Your podcast, webinar or live stream cut into 10 to 15 short videos.",
    "description": "We find the best moments in your long video and turn them into vertical clips with hooks and animated captions. One recording, weeks of shorts.",
    "bestFor": [
      "Podcasters",
      "Coaches and speakers",
      "YouTubers",
      "Companies running webinars"
    ],
    "signsYouNeedIt": [
      "You have hour-long videos nobody watches in full",
      "You need shorts every week"
    ],
    "whatYouGet": [
      "10 to 15 clips, 30 to 60s each",
      "A hook title on every clip",
      "Animated captions",
      "Face-tracked 9:16 crop",
      "Covers"
    ],
    "whatWeNeed": [
      "The long video file or link"
    ],
    "formats": "9:16, 1:1",
    "delivery": "3 days",
    "pricing": "quote",
    "goals": [
      "creator",
      "edu"
    ],
    "related": [
      "ai-video-editing",
      "youtube-channel-pack"
    ]
  },
  {
    "slug": "corporate-avc-event-video",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "Corporate AVC and Event Video",
    "isNew": true,
    "shortDescription": "Audio visual presentations for AGMs, anniversaries, launches and event screens.",
    "description": "Your company's story, milestones and numbers on the big screen, plus an opener that sets the tone for the event.",
    "bestFor": [
      "Corporates and banks",
      "Schools and colleges",
      "NGOs",
      "Event management companies"
    ],
    "signsYouNeedIt": [
      "An AGM or annual event is coming",
      "You are inaugurating a project",
      "It will play on a large stage screen"
    ],
    "whatYouGet": [
      "2 to 5 minute AVC",
      "History, milestones and number graphics",
      "Event opener",
      "Voiceover",
      "4K export"
    ],
    "whatWeNeed": [
      "Company information, photos and figures",
      "Event date"
    ],
    "formats": "16:9",
    "delivery": "7 days",
    "pricing": "quote",
    "goals": [
      "corp"
    ],
    "related": [
      "ai-commercial-60s",
      "explainer-motion-graphics"
    ]
  },
  {
    "slug": "youtube-channel-pack",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "YouTube Thumbnail and Channel Pack",
    "isNew": true,
    "shortDescription": "Thumbnails, banner, intro and outro in one consistent style.",
    "description": "A channel that looks like a brand, with thumbnails designed to earn the click.",
    "bestFor": [
      "YouTubers",
      "Coaching centres",
      "News pages",
      "Podcasts"
    ],
    "signsYouNeedIt": [
      "Your videos are good but clicks are low",
      "Your channel looks messy",
      "You are starting a new channel"
    ],
    "whatYouGet": [
      "10 thumbnails",
      "Channel banner and profile image",
      "5s intro and 10s outro",
      "Thumbnail template"
    ],
    "whatWeNeed": [
      "Your channel link",
      "A few photos of you"
    ],
    "formats": "16:9",
    "delivery": "2 days",
    "pricing": "quote",
    "goals": [
      "creator"
    ],
    "related": [
      "long-to-short-repurposing",
      "ai-video-editing"
    ]
  },
  {
    "slug": "monthly-content-subscription",
    "category": "social",
    "published": true,
    "priceFrom": null,
    "name": "Monthly Content Subscription",
    "isNew": true,
    "shortDescription": "A set amount of reels, posts and edits every month at one rate.",
    "description": "No new quote for every job. A dedicated team and project manager keep your brand visible all year.",
    "bestFor": [
      "Restaurants and clinics",
      "Fashion and skincare brands",
      "Real estate",
      "Brands that need content all year"
    ],
    "signsYouNeedIt": [
      "You are tired of negotiating every project",
      "You want a dedicated team",
      "You need a consistent presence all year"
    ],
    "whatYouGet": [
      "Reels, statics and edits every month by package, for example 8 reels and 12 posts",
      "Monthly content calendar",
      "Dedicated project manager",
      "Short monthly report"
    ],
    "whatWeNeed": [
      "Offers and products for the month",
      "One planning call per month"
    ],
    "formats": "All formats",
    "delivery": "Monthly",
    "pricing": "monthly",
    "goals": [
      "sales",
      "brand",
      "ecom"
    ],
    "related": [
      "reels-pack-of-6",
      "ai-brand-ambassador"
    ],
    "compareNote": "Reels Pack of 6 is a one-time order. Monthly Content Subscription gives you a set amount every month with a dedicated manager."
  },
  {
    "slug": "ai-voiceover",
    "category": "voice",
    "published": true,
    "priceFrom": null,
    "name": "AI Voiceover",
    "isNew": false,
    "shortDescription": "Clean Bangla or English voice for ads, documentaries and training, original or cloned.",
    "description": "Script polish, two voice options, mixed and mastered. Priced per minute.",
    "bestFor": [
      "Agencies",
      "YouTubers",
      "Corporates",
      "Anyone whose video needs a voice"
    ],
    "signsYouNeedIt": [
      "Good voice artists are hard to find",
      "You need many versions fast"
    ],
    "whatYouGet": [
      "Script polish",
      "2 voice options",
      "Mixed and mastered"
    ],
    "whatWeNeed": [
      "Your script",
      "The tone you want"
    ],
    "formats": "Audio",
    "delivery": "2 days",
    "pricing": "per-minute",
    "goals": [
      "corp",
      "edu",
      "creator"
    ],
    "related": [
      "dubbing-lip-sync",
      "audio-ad-ivr"
    ]
  },
  {
    "slug": "dubbing-lip-sync",
    "category": "voice",
    "published": true,
    "priceFrom": null,
    "name": "Dubbing and Lip Sync",
    "isNew": false,
    "shortDescription": "Your video in another language, with matched lip movement.",
    "description": "Translation, a dubbed voice and lip sync, so your video speaks to a new audience naturally. Priced per minute.",
    "bestFor": [
      "Exporters",
      "Tourism",
      "Edtech",
      "Creators targeting international or expatriate audiences"
    ],
    "signsYouNeedIt": [
      "You want a Bangla video in English, Arabic or Hindi",
      "You want to bring a foreign ad into Bangla"
    ],
    "whatYouGet": [
      "Translation",
      "Dub in the same voice",
      "Lip sync"
    ],
    "whatWeNeed": [
      "The original video",
      "The target language"
    ],
    "formats": "16:9, 9:16",
    "delivery": "3 days",
    "pricing": "per-minute",
    "goals": [
      "corp",
      "creator",
      "edu"
    ],
    "related": [
      "ai-voiceover"
    ]
  },
  {
    "slug": "jingle-sonic-logo",
    "category": "voice",
    "published": true,
    "priceFrom": null,
    "name": "Jingle and Sonic Logo",
    "isNew": true,
    "shortDescription": "A 3 to 10 second sound people recognise as your brand, plus a 30 second Bangla jingle.",
    "description": "Your brand's audio signature for the end of every ad, plus a full jingle for reels and radio.",
    "bestFor": [
      "FMCG",
      "Telecom",
      "Restaurant chains",
      "Real estate and apps"
    ],
    "signsYouNeedIt": [
      "You want the same sound at the end of every ad",
      "You want a song for reels or radio"
    ],
    "whatYouGet": [
      "3 sonic logo options, one finalised",
      "30s jingle with lyrics",
      "Instrumental version",
      "Copyright clear"
    ],
    "whatWeNeed": [
      "Your brand mood",
      "Your slogan, if you have one"
    ],
    "formats": "Audio",
    "delivery": "4 days",
    "pricing": "quote",
    "goals": [
      "brand",
      "launch"
    ],
    "related": [
      "custom-ad-music",
      "audio-ad-ivr"
    ]
  },
  {
    "slug": "custom-ad-music",
    "category": "voice",
    "published": true,
    "priceFrom": null,
    "name": "Custom Ad Music",
    "isNew": true,
    "shortDescription": "Original background music for each ad, with no copyright claims.",
    "description": "A track composed for your ad's mood and cut to every length you need. It sounds like your brand, not like everyone else's stock music.",
    "bestFor": [
      "Agencies",
      "YouTubers",
      "Brands"
    ],
    "signsYouNeedIt": [
      "Stock music sounds like everyone else",
      "You have had copyright claims"
    ],
    "whatYouGet": [
      "1 original track",
      "15s, 30s and 60s cuts",
      "Stems on request"
    ],
    "whatWeNeed": [
      "Your video or mood references"
    ],
    "formats": "Audio",
    "delivery": "2 days",
    "pricing": "quote",
    "goals": [
      "brand",
      "creator"
    ],
    "related": [
      "jingle-sonic-logo"
    ]
  },
  {
    "slug": "audio-ad-ivr",
    "category": "voice",
    "published": true,
    "priceFrom": null,
    "name": "Audio Ad and IVR Voice",
    "isNew": true,
    "shortDescription": "Radio, Spotify and YouTube audio ads, plus your hotline voice prompts.",
    "description": "One consistent brand voice across your audio ads and your phone system.",
    "bestFor": [
      "Banks and telecom",
      "Hospitals",
      "E-commerce call centres",
      "Brands advertising on radio"
    ],
    "signsYouNeedIt": [
      "Your hotline sounds robotic or outdated",
      "You need a radio spot"
    ],
    "whatYouGet": [
      "30s audio ad with music and sound effects",
      "IVR menu script with every prompt recorded",
      "One brand voice everywhere"
    ],
    "whatWeNeed": [
      "Your hotline menu or the ad message"
    ],
    "formats": "Audio",
    "delivery": "2 days",
    "pricing": "quote",
    "goals": [
      "corp",
      "brand"
    ],
    "related": [
      "ai-voiceover",
      "jingle-sonic-logo"
    ]
  },
  {
    "slug": "creative-strategy-hook-research",
    "category": "strategy",
    "published": true,
    "priceFrom": null,
    "name": "Creative Strategy and Hook Research",
    "isNew": true,
    "shortDescription": "Research before production: what competitors run, which angles work, and 10 hooks for you.",
    "description": "We study your market and your customers so your ad budget goes into ideas that have a reason to work.",
    "bestFor": [
      "New brands",
      "Brands whose ads are not working",
      "Businesses that want certainty before a big spend"
    ],
    "signsYouNeedIt": [
      "You are spending on ads but not selling",
      "You do not know what to say",
      "You are entering a new market"
    ],
    "whatYouGet": [
      "Analysis of 10 to 15 competitors' ads from Meta Ad Library",
      "Customer language and objections from comments and reviews",
      "Angle map",
      "10 hooks and 3 scripts",
      "PDF report"
    ],
    "whatWeNeed": [
      "Your product and price",
      "Competitor names, if you know them"
    ],
    "formats": "PDF",
    "delivery": "3 days",
    "pricing": "quote",
    "goals": [
      "sales",
      "launch"
    ],
    "related": [
      "ad-variant-pack",
      "ad-performance-review"
    ]
  },
  {
    "slug": "ad-performance-review",
    "category": "strategy",
    "published": true,
    "priceFrom": null,
    "name": "Ad Performance Review and Refresh",
    "isNew": true,
    "shortDescription": "A monthly review of your ad results with clear stop, scale and refresh decisions.",
    "description": "We read your ad results and tell you what to stop, what to scale and what needs a new version. We do not run your ads. We make the creative work harder.",
    "bestFor": [
      "Brands running ads in-house or through another agency",
      "Facebook commerce and e-commerce"
    ],
    "signsYouNeedIt": [
      "Results are good one day and bad the next",
      "You cannot tell why an ad is working or not"
    ],
    "whatYouGet": [
      "Monthly review call",
      "Creative report: hook rate, hold rate, CTR and cost per order",
      "A list of what to stop and what to scale",
      "4 new variants"
    ],
    "whatWeNeed": [
      "View-only access to your ad account"
    ],
    "formats": "Report and ads",
    "delivery": "Monthly",
    "pricing": "monthly",
    "goals": [
      "sales",
      "ecom"
    ],
    "related": [
      "ad-variant-pack",
      "creative-strategy-hook-research"
    ]
  },
  {
    "slug": "ai-mascot-brand-character",
    "category": "strategy",
    "published": true,
    "priceFrom": null,
    "name": "AI Mascot and Brand Character",
    "isNew": true,
    "shortDescription": "Your brand's own cartoon or 3D character, consistent across ads, packs and posts.",
    "description": "A memorable character that makes your brand easy to recognise, delivered with a full character sheet and a usage guide.",
    "bestFor": [
      "Kids' products",
      "Snacks",
      "Apps and delivery services",
      "Schools"
    ],
    "signsYouNeedIt": [
      "You want to stand out from competitors",
      "You do not want to show human faces",
      "Your audience is children or young people"
    ],
    "whatYouGet": [
      "3 concepts and 1 final",
      "Character sheet: front, side and back",
      "8 poses and expressions",
      "Short animation test",
      "Usage guide"
    ],
    "whatWeNeed": [
      "Your brand mood and audience",
      "Logo and colours"
    ],
    "formats": "PNG and character sheet",
    "delivery": "5 days",
    "pricing": "quote",
    "goals": [
      "brand",
      "launch"
    ],
    "related": [
      "ai-brand-ambassador",
      "motion-ad-logo-animation"
    ]
  }
];

export function publishedServices(source: Service[] = services) { return source.filter(service => service.published); }
export function visibleCategories(source: Service[] = services) {
  return serviceCategories.filter(category => publishedServices(source).some(service => service.category === category.id));
}
export function findPublishedService(slug: string, source: Service[] = services) {
  return publishedServices(source).find(service => service.slug === slug);
}
export function relatedServices(service: Service, source: Service[] = services) {
  return service.related.flatMap(slug => { const related = findPublishedService(slug, source); return related ? [related] : []; });
}
export function servicePriceLine(service: Pick<Service, 'pricing' | 'priceFrom'>) {
  if (service.pricing === 'per-minute') return 'Priced per minute';
  if (service.pricing === 'monthly') return 'Monthly plan';
  return service.priceFrom === null ? 'Get a quote' : `From BDT ${service.priceFrom.toLocaleString('en-BD')}`;
}
export const projectInclusions = ['Concept and script','Two revision rounds','Licensed music and AI voice','Captions in Bangla or English','Final files yours'];
export const detailInclusions = ['Concept and script','Two revision rounds','Licensed music and AI voice','Captions in Bangla or English','Final files are yours','Every frame reviewed by a human: hands, faces and Bangla text checked.'];
export const projectExclusions = ['Media buying','Live shoots','Broadcast licensing unless requested','Extra revision rounds'];
export const serviceAliases: Record<string,string> = {
  'video':'video-ads', 'ai-commercial-30':'ai-commercial-30s', 'ai-commercial-60':'ai-commercial-60s',
  'ai-commercials':'ai-commercial-30s','brand-models-and-clones':'ai-brand-model',
  'brand-models-digital-clones':'ai-brand-model','fashion-films-lookbooks':'fashion-film-lookbook',
  'ad-variants-localisation':'ad-variant-pack'
};
