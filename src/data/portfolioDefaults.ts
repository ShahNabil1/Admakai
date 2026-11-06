import type { Service, ServicePortfolioItem } from './services';

export const portfolioDefaults: Record<string, ServicePortfolioItem[]> = {
  "video-ads": [
    {
      "vimeoId": "1244169947",
      "aspect": "16:9",
      "title": "Admakai brand film",
      "tag": "Brand film",
      "client": ""
    },
    {
      "vimeoId": "1183677915",
      "aspect": "16:9",
      "title": "The pink bus",
      "tag": "OVC",
      "client": ""
    },
    {
      "vimeoId": "1232739772",
      "aspect": "16:9",
      "title": "Regal Furniture commercial",
      "tag": "OVC",
      "client": ""
    },
    {
      "vimeoId": "1211611248",
      "aspect": "16:9",
      "title": "Teddy bear and the honey jar",
      "tag": "Cinematic",
      "client": ""
    },
    {
      "vimeoId": "1205218185",
      "aspect": "9:16",
      "title": "Skincare product review",
      "tag": "UGC",
      "client": ""
    }
  ],
  "imagery": [
    {
      "vimeoId": "1205218926",
      "aspect": "1:1",
      "title": "Gel moisturiser jar",
      "tag": "Product shot",
      "client": ""
    },
    {
      "vimeoId": "1232801813",
      "aspect": "9:16",
      "title": "Menswear look 3",
      "tag": "Fashion",
      "client": ""
    },
    {
      "vimeoId": "1205218742",
      "aspect": "1:1",
      "title": "Olive oil bottle",
      "tag": "Product shot",
      "client": ""
    },
    {
      "vimeoId": "1205218784",
      "aspect": "1:1",
      "title": "Body radiance serum",
      "tag": "Product shot",
      "client": ""
    }
  ],
  "people": [
    {
      "vimeoId": "1211608608",
      "aspect": "16:9",
      "title": "AI presenter on the sofa",
      "tag": "Presenter",
      "client": ""
    },
    {
      "vimeoId": "1211608609",
      "aspect": "16:9",
      "title": "AI presenter with a product",
      "tag": "Presenter",
      "client": ""
    },
    {
      "vimeoId": "1244171284",
      "aspect": "16:9",
      "title": "AI host in an edit studio",
      "tag": "AI host",
      "client": ""
    }
  ],
  "social": [
    {
      "vimeoId": "1205218727",
      "aspect": "1:1",
      "title": "Niacinamide launch",
      "tag": "Static",
      "client": ""
    },
    {
      "vimeoId": "1211608606",
      "aspect": "9:16",
      "title": "Hair serum billboard",
      "tag": "CGI",
      "client": ""
    },
    {
      "vimeoId": "1232974660",
      "aspect": "16:9",
      "title": "Brand identity reveal",
      "tag": "Logo",
      "client": ""
    },
    {
      "vimeoId": "1205218183",
      "aspect": "9:16",
      "title": "Hair oil hook",
      "tag": "UGC",
      "client": ""
    }
  ],
  "voice": [],
  "strategy": [],
};
export function servicePortfolio(service: Service): ServicePortfolioItem[] {
  return service.portfolio?.length ? service.portfolio : portfolioDefaults[service.category] ?? [];
}
export function portfolioTags(items: ServicePortfolioItem[]) {
  return [...new Set(items.flatMap(item => item.tag ? [item.tag] : []))];
}
export function playingPreviews(visible: number[]) { return [...new Set(visible)].sort((a, b) => a - b).slice(0, 4); }