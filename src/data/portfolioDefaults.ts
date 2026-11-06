import type { Service, ServicePortfolioItem } from './services';

export const portfolioDefaults: Record<string, ServicePortfolioItem[]> = {
  "video-ads": [
    {
      "vimeoId": "1183677915",
      "aspect": "16:9",
      "title": "OVC: The pink bus",
      "tag": "OVC",
      "client": ""
    },
    {
      "vimeoId": "1183677848",
      "aspect": "16:9",
      "title": "OVC: A family moment",
      "tag": "OVC",
      "client": ""
    },
    {
      "vimeoId": "1211608926",
      "aspect": "16:9",
      "title": "Riders in the mountains",
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
      "vimeoId": "1205218979",
      "aspect": "1:1",
      "title": "Salicylic cleanser",
      "tag": "Skincare",
      "client": ""
    },
    {
      "vimeoId": "1205218971",
      "aspect": "1:1",
      "title": "Rose water",
      "tag": "Skincare",
      "client": ""
    },
    {
      "vimeoId": "1232801813",
      "aspect": "9:16",
      "title": "Menswear look 1",
      "tag": "Fashion",
      "client": ""
    },
    {
      "vimeoId": "1205218964",
      "aspect": "1:1",
      "title": "Low pH cleanser",
      "tag": "Skincare",
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
      "vimeoId": "1211608607",
      "aspect": "16:9",
      "title": "AI host on a podcast set",
      "tag": "Presenter",
      "client": ""
    }
  ],
  "social": [
    {
      "vimeoId": "1211611228",
      "aspect": "1:1",
      "title": "Ghee reel 1",
      "tag": "Reels",
      "client": ""
    },
    {
      "vimeoId": "1205218586",
      "aspect": "1:1",
      "title": "Authentic products, delivered",
      "tag": "Motion",
      "client": ""
    },
    {
      "vimeoId": "1232974660",
      "aspect": "16:9",
      "title": "Brand identity reveal",
      "tag": "Motion",
      "client": ""
    },
    {
      "vimeoId": "1205218183",
      "aspect": "9:16",
      "title": "Hair oil hook",
      "tag": "Reels",
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