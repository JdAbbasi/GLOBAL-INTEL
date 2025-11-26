
import { GoogleGenAI } from "@google/genai";
import type { ImporterSummary, DetailedImporterResult } from '../types';
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
    }
    
    return jsonText;
};

// Hybrid Search: Scraper + AI Grounding
export const searchImporters = async (params: { query: string; city: string; state: string; industry: string; }): Promise<ImporterSummary[]> => {
  const { query, city, state, industry } = params;

  try {
      // 1. EXECUTE SCRAPERS (Best Effort)
      // Note: In a browser environment, direct scraping often fails due to CORS. 
      // We attempt it, but rely heavily on the AI search as a fallback.
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
      // We instruct the AI to perform targeted searches that mimic a scraper's behavior to find data.
      const aiSearchPrompt = `
      Act as a master trade data scraper. Find USA-based importers matching: "${query}" ${city ? `in ${city}` : ''} ${state ? `in ${state}` : ''} ${industry ? `industry: ${industry}` : ''}.
      
      SEARCH STRATEGY (Execute these checks via googleSearch):
      1. Search "list of importers of ${query || industry} in USA".
      2. Search "buyers of ${query || industry} USA customs data".
      3. Search site:tradeindata.com "${query}".
      4. Search site:importyeti.com "${query}".
      5. Search site:panjiva.com "${query}".
      6. Search site:52wmb.com "${query}".

      For each distinct company found, extract:
      - Company Name (Legal Entity)
      - Location (City, State)
      - Exact Products Imported (be specific from BOL descriptions)
      - Latest shipment date (look for "last shipment", "recent activity", "2024", "2025")
      - Any contact info visible in snippets.
      
      Combine this with any provided scraped data: ${JSON.stringify(scrapedLeads.slice(0, 15))}
      
      Deduplicate and return a JSON list.
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
      You are a data aggregator. Combine the AI Search Results into a single unique list of USA Importers.
      
      Rules:
      1. Deduplicate based on company name.
      2. Prioritize data from tradeindata.com if available.
      3. Ensure "lastShipmentDate" is populated if possible.
      4. Format as JSON.

      Data Input:
      ${aiSearchResponse.text}
      
      Required Output JSON Structure:
      {
        "importers": [
          {
            "importerName": "string",
            "location": "string (City, State)",
            "primaryCommodities": "string",
            "lastShipmentDate": "string (YYYY-MM-DD or 'Recent')",
            "contactInformation": "string (optional)",
            "source": "string (e.g. 'TradeInData', 'ImportYeti', 'Panjiva')"
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
    const prompt = `Act as a Senior Trade Compliance Analyst. Retrieve detailed US Customs (CBP) data, Automated Manifest System (AMS) records, and ACE data summaries for the US importer: '${importerName}'.
    
    CRITICAL SEARCH INSTRUCTIONS (GET DATA AT ANY COST):
    1. **MANDATORY SOURCE**: You MUST search specifically using **site:tradeindata.com** for this importer's records. Example query: "site:tradeindata.com ${importerName} bill of lading shipments".
    2. **SECONDARY SOURCES**: If data is incomplete on tradeindata.com, check Panjiva, ImportGenius, 52wmb, Seair, Volza.
    3. **CONTACT SCRAPING**: Look for the company's official website, LinkedIn, or business directories to find:
       - Email addresses (imports@, sales@, info@)
       - Phone numbers
       - Key personnel (Logistics Manager, Supply Chain Director)
       - Exact registered address.
    4. **BILL OF LADING DETAILS**: You must find specific shipment details from the Bill of Lading (BOL).
       - **Shipper/Supplier**: Who is the foreign exporter?
       - **Port of Discharge**: Which US port did it enter? (e.g. Los Angeles, Newark, Savannah)
       - **Carrier/Vessel**: Which shipping line carried the goods? (e.g. Maersk, MSC, COSCO)
       - **HS Codes**: What is the Harmonized System code?
       - **BOL Number**: Extract a representative Bill of Lading number if visible.
    5. **TOTALS**: Find the total number of shipments (last 12 months) and total volume (TEUs or Weight).
    
    Output the result as a valid JSON object. Do not include any markdown formatting. Return ONLY the raw JSON string.
    Structure:
    {
      "importerName": "string",
      "location": "string",
      "lastShipmentDate": "string (Specific date if found, e.g., '2023-11-15')",
      "information": "string (Comprehensive business summary utilizing CBP/AMS data context from tradeindata.com)",
      "shipmentActivity": "string (Executive summary of customs activity, including major trade lanes, carriers used, and supply chain partners)",
      "shipmentCounts": { 
          "lastMonth": "string/number", 
          "lastQuarter": "string/number", 
          "lastYear": "string/number (Total shipments in last 12 months)" 
      },
      "shipmentHistory": [ 
          { 
            "date": "string (YYYY-MM-DD)", 
            "shipper": "string (Foreign Exporter Name)",
            "origin": "string (Country/City of Origin)",
            "portOfDischarge": "string (US Port of Entry)",
            "commodity": "string (Description of Goods)",
            "volume": "string (Weight in KG or TEUs)",
            "carrier": "string (Vessel or Carrier Name)",
            "hsCode": "string (Harmonized System Code)",
            "bolNumber": "string (Bill of Lading Number)"
          } 
      ],
      "shipmentVolumeHistory": [ { "year": number, "volume": number } ],
      "commodities": "string",
      "contact": { "phone": "string", "email": "string", "website": "string", "address": "string (Registered physical address)" },
      "riskAssessment": { "financialStability": "string", "regulatoryCompliance": "string", "geopoliticalRisk": "string" },
      "topTradePartners": [ { "country": "string", "tradeVolume": "string (e.g. 'High', '150 shipments', '2000 TEU')" } ],
      "topCommodityFlows": [ 
          { 
              "name": "string", 
              "percentage": "string", 
              "averagePrice": "string (optional)", 
              "marketTrend": "string (optional)", 
              "topSupplier": "string (optional)",
              "priceTrendData": [number] (optional),
              "importVolumeTrendData": [number] (optional)
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
    // Specifically targeting tradeindata.com as requested
    const prompt = `Find 3-4 similar or related USA-based importers based on the query: "${query}". 
    You MUST search for records on **www.tradeindata.com** and global trade intelligence platforms.
    
    Output the result as a valid JSON object. Do not include any markdown formatting. Return ONLY the raw JSON string.
    Structure:
    {
        "importers": [
            {
                "importerName": "string",
                "location": "string",
                "primaryCommodities": "string",
                "lastShipmentDate": "string"
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
    const parsedJson = JSON.parse(jsonText);
    
    return parsedJson.importers || [];

  } catch (error: any) {
    console.error("Error searching for similar importers from Gemini API:", error);
    return [];
  }
};
