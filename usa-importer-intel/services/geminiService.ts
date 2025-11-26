
import { GoogleGenAI } from "@google/genai";
import type { ImporterSummary, DetailedImporterResult, ScrapedData } from '../types';
import { ShipmentScraper } from "./scraper";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (text: string): string => {
    // Remove markdown code block syntax if present
    let jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find the outer curly braces to extract the JSON object
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    } else {
        // If no JSON object is found, return empty object to prevent parse errors on conversational text
        return "{}";
    }
    
    return jsonText;
};

// Hybrid Search: Scraper + AI Grounding
export const searchImporters = async (params: { query: string; city: string; state: string; industry: string; }): Promise<ImporterSummary[]> => {
  const { query, city, state, industry } = params;

  try {
      // 1. EXECUTE SCRAPERS (Best Effort)
      let scrapedLeads: any[] = [];
      try {
          const [yeti, alibaba] = await Promise.allSettled([
              ShipmentScraper.scrapeImportYeti(query),
              ShipmentScraper.scrapeAlibabaBuyers(query)
          ]);
          
          if (yeti.status === 'fulfilled') scrapedLeads = [...scrapedLeads, ...yeti.value];
          if (alibaba.status === 'fulfilled') scrapedLeads = [...scrapedLeads, ...alibaba.value];
      } catch (e) {
          console.warn("Scraping execution error:", e);
      }

      // 2. ENHANCED AI SEARCH ("Deep Scraping")
      const aiSearchPrompt = `
      Act as a master trade data aggregator. Find USA-based importers matching: "${query}" ${city ? `in ${city}` : ''} ${state ? `in ${state}` : ''} ${industry ? `industry: ${industry}` : ''}.
      
      SEARCH SOURCES (Execute these specific checks via googleSearch):
      1. Search "site:panjiva.com ${query || industry} imports".
      2. Search "site:importgenius.com ${query || industry} supplier list".
      3. Search "site:tradeindata.com ${query}".
      4. Search "site:52wmb.com ${query} US customs data".
      5. Search "site:seair.co.in ${query} USA import data".
      6. General search: "list of importers of ${query || industry} in USA contact details".

      EXTERNAL DATA INTEGRATION (CRITICAL):
      I have scraped the following raw leads from external databases (ImportYeti, Alibaba, etc.):
      ${JSON.stringify(scrapedLeads)}
      
      INSTRUCTION:
      1. **INTEGRATE** valid scraped leads into your final list. Do not discard them.
      2. **MERGE** duplicates. If a scraped company matches a search result, combine the data. 
         - **CRITICAL**: ALWAYS use the **LATEST** (most recent) "lastShipmentDate" found from either source.
         - If the scraped data has a date of "2024-05-01" and AI finds "2023-12-01", use "2024-05-01".
      3. **ADD** unique scraped leads as new entries if they are not in the search results.
      4. Extract source attribution (e.g. "ImportYeti + Panjiva") if possible.
      
      Deduplicate and return a JSON list of unique importers.
      `;

      const aiSearchResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: aiSearchPrompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
      });

      // 3. COMBINE & CLEAN
      const cleaningPrompt = `
      You are a data cleaner. Extract the final list of importers from the AI search results.
      
      Rules:
      1. Deduplicate based on company name.
      2. **DATE PRIORITY**: Ensure "lastShipmentDate" is the MOST RECENT date available from all combined sources.
      3. Format as VALID JSON. No comments.
      
      Data Input:
      ${aiSearchResponse.text}
      
      Required Output JSON Structure:
      {
        "importers": [
          {
            "importerName": "Example Company Inc",
            "location": "Miami, FL",
            "primaryCommodities": "Textiles, Cotton",
            "lastShipmentDate": "2023-11-01",
            "contactInformation": "info@example.com",
            "source": "Panjiva, Scraper"
          }
        ]
      }
      `;

      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: cleaningPrompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });

      const parsed = JSON.parse(cleanJsonString(finalResponse.text));
      return parsed.importers || [];

  } catch (error: any) {
      console.error("Error in searchImporters:", error);
      return [];
  }
};


export const fetchDetailedImporterData = async (importerName: string): Promise<DetailedImporterResult> => {
  try {
    // Run parallel scraping to find "Additional Data"
    let scrapedAlternatives: ScrapedData[] = [];
    try {
        const scraperResults = await ShipmentScraper.scrapeImportYeti(importerName);
        scrapedAlternatives = scraperResults.slice(0, 3).map(lead => ({
            source: lead.source,
            lastShipmentDate: lead.lastShipmentDate,
            commodity: lead.commodity,
            origin: lead.origin
        }));
    } catch (e) {
        console.warn("Parallel detail scraping failed:", e);
    }

    const prompt = `Act as a Senior Trade Compliance Analyst. Retrieve detailed US Customs (CBP) data, Automated Manifest System (AMS) records, and ACE data summaries for the US importer: '${importerName}'.
    
    CRITICAL SEARCH INSTRUCTIONS (GET COMPLETE DATA):
    1. **SOURCES**: You MUST search specifically using **site:tradeindata.com** for this importer's records. Also check Panjiva, ImportGenius, and 52wmb.
    2. **LATEST DATA**: Find the MOST RECENT shipment data available.
    3. **SHIPPER/SUPPLIER DETAIL**: Identify the top foreign suppliers (shippers) exporting to this company.
    4. **BILL OF LADING DETAILS**: You must find specific shipment details from the Bill of Lading (BOL).
       - **Shipper/Supplier**: Who is the foreign exporter?
       - **Port of Discharge**: Which US port did it enter?
       - **Carrier/Vessel**: Which shipping line carried the goods?
       - **HS Codes**: What is the Harmonized System code?
       - **BOL Number**: Extract a representative Bill of Lading number.
    
    Output the result as a STRICT valid JSON object. 
    - DO NOT include comments like // or /* */ inside the JSON.
    - DO NOT include markdown formatting.
    - DO NOT use single quotes for keys.
    - Return ONLY the raw JSON string.
    
    Structure Example (Follow this format exactly):
    {
      "importerName": "${importerName}",
      "location": "City, State",
      "lastShipmentDate": "2024-01-01",
      "information": "Business summary here...",
      "shipmentActivity": "Executive summary of trade activity...",
      "shipmentCounts": { 
          "lastMonth": "5", 
          "lastQuarter": "15", 
          "lastYear": "60" 
      },
      "shipmentHistory": [ 
          { 
            "date": "2024-01-15", 
            "shipper": "Foreign Supplier Name",
            "origin": "China",
            "portOfDischarge": "Long Beach",
            "commodity": "Widgets",
            "volume": "15000 KG",
            "carrier": "Maersk",
            "hsCode": "8501.10",
            "bolNumber": "MAEU123456789",
            "source": "CBP AMS"
          } 
      ],
      "shipmentVolumeHistory": [ { "year": 2023, "volume": 500 } ],
      "commodities": "Electronics, Textiles",
      "contact": { "phone": "555-0199", "email": "contact@example.com", "website": "www.example.com", "address": "123 Trade St" },
      "riskAssessment": { "financialStability": "Stable", "regulatoryCompliance": "High", "geopoliticalRisk": "Low" },
      "topTradePartners": [ { "country": "China", "tradeVolume": "High" } ],
      "topSuppliers": [
        { "name": "Supplier A", "location": "Shanghai, China", "product": "Textiles", "lastShipment": "2023-12-01" }
      ],
      "topCommodityFlows": [ 
          { 
              "name": "Widgets", 
              "percentage": "40%", 
              "averagePrice": "100 USD", 
              "marketTrend": "Increasing", 
              "topSupplier": "Supplier A",
              "priceTrendData": [10, 12, 15],
              "importVolumeTrendData": [100, 120, 150]
          } 
      ]
    }`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = cleanJsonString(response.text || "{}");
    const parsedData = JSON.parse(jsonText);
    
    // Inject scraped alternatives if found
    if (scrapedAlternatives.length > 0) {
        parsedData.scrapedData = scrapedAlternatives;
    }

    return { parsedData };
  } catch (error: any) {
    console.error("Error fetching detailed data from Gemini API:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to process data from the API. The response was not in the expected JSON format.");
    }
    throw new Error("Failed to retrieve data. " + error.message);
  }
};


export const searchSimilarImporters = async (query: string): Promise<ImporterSummary[]> => {
  try {
    const prompt = `Find 3-4 similar or related USA-based importers based on the query: "${query}". 
    Search records on **www.tradeindata.com**, **Panjiva**, and **ImportGenius**.
    
    STRICT OUTPUT RULES:
    1. Return ONLY valid JSON. Do not include any conversational text (e.g. "I couldn't find...").
    2. If NO results are found, return exactly: { "importers": [] }
    
    Structure:
    {
        "importers": [
            {
                "importerName": "Example Inc",
                "location": "New York, NY",
                "primaryCommodities": "Apparel",
                "lastShipmentDate": "2023-12-01",
                "source": "Panjiva"
            }
        ]
    }`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 0 },
        },
    });

    const jsonText = cleanJsonString(response.text || "{}");
    
    try {
        const parsedJson = JSON.parse(jsonText);
        return parsedJson.importers || [];
    } catch (parseError) {
        console.warn("Failed to parse JSON for similar importers. Response was likely conversational:", jsonText);
        return [];
    }

  } catch (error: any) {
    console.error("Error searching for similar importers from Gemini API:", error);
    return [];
  }
};
