
import axios from "axios";
import * as cheerio from "cheerio";

export interface RawLead {
  importer: string;
  cnee?: string;
  commodity?: string;
  hsCode?: string;
  origin?: string;
  destination?: string;
  lastShipmentDate?: string;
  weight?: string;
  containerCount?: string;
  source: string;
  url?: string;
}

export class ShipmentScraper {
  
  // Scrape public manifest sites (example: ImportYeti)
  static async scrapeImportYeti(query: string): Promise<RawLead[]> {
    // Note: Direct calls to this URL from the browser will likely be blocked by CORS 
    // unless a CORS proxy is used or the user has a browser extension.
    const url = `https://www.importyeti.com/search?q=${encodeURIComponent(query)}`;
    const leads: RawLead[] = [];

    try {
      const resp = await axios.get(url);
      const $ = cheerio.load(resp.data);

      $(".company-result").each((i, el) => {
        leads.push({
          importer: $(el).find(".company-name").text().trim(),
          commodity: $(el).find(".product-list").text().trim(),
          source: "ImportYeti",
          url
        });
      });
    } catch (e) {
        console.warn("ImportYeti scrape failed (likely CORS or Network Error):", e);
    }

    return leads;
  }


  // Scrape trade directories (example: alibaba buyer list)
  static async scrapeAlibabaBuyers(keyword: string): Promise<RawLead[]> {
    const url = `https://www.alibaba.com/trade/search?keywords=${encodeURIComponent(keyword)}`;
    const leads: RawLead[] = [];
    
    try {
        // Replaced Puppeteer with Axios to allow running in browser environment.
        const resp = await axios.get(url);
        const $ = cheerio.load(resp.data);

        $(".supplier-card").each((i, el) => {
            leads.push({
                importer: $(el).find(".supplier-name").text().trim(),
                commodity: keyword,
                source: "Alibaba Buyers",
                url
            });
        });
    } catch (e) {
        console.warn("Alibaba scrape failed (likely CORS or Network Error):", e);
    }
    return leads;
  }


  // Foreign customs API (India example)
  static async scrapeIndianHSCode(hs: string): Promise<RawLead[]> {
    const url = `https://api.cbic-gov.in/public/hs?code=${hs}`;
    const leads: RawLead[] = [];

    try {
      const resp = await axios.get(url);
      const data = resp.data.records || [];

      data.forEach((item: any) => {
        leads.push({
          importer: item.importer || "",
          hsCode: hs,
          origin: item.country,
          lastShipmentDate: item.date,
          source: "India Customs API"
        });
      });
    } catch (e) {
        console.warn("Indian HS Code scrape failed:", e);
    }

    return leads;
  }


  // Port schedule (example: Port of LA API)
  static async scrapePortOfLA(): Promise<RawLead[]> {
    const url = "https://www.portoflosangeles.org/api/vessel_schedule";
    const leads: RawLead[] = [];

    try {
      const resp = await axios.get(url);
      if (Array.isArray(resp.data)) {
        resp.data.forEach((v: any) => {
            leads.push({
            importer: "",
            commodity: "",
            origin: v.lastPort,
            destination: "Los Angeles",
            lastShipmentDate: v.arrival,
            source: "Port of LA"
            });
        });
      }
    } catch (e) {
        console.warn("Port of LA scrape failed:", e);
    }

    return leads;
  }

}
