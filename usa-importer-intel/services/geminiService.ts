
import { GoogleGenAI, Type } from "@google/genai";
import type { ImporterSummary, DetailedImporterResult } from '../types';

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

// Types definitions for reference in prompts (though not used in config anymore due to tool restrictions)
// These schemas were previously passed to the API but are now incompatible with googleSearch.

export const searchImporters = async (params: { query: string; city: string; state: string; industry: string; }): Promise<ImporterSummary[]> => {
    const { query, city, state, industry } = params;
    try {
        let prompt = `Find 3-4 USA-based importers based on the provided criteria. You MUST search for importer records on global trade intelligence platforms (like Panjiva, ImportGenius, 52wmb) to gather this data.

        IMPORTANT SEARCH INSTRUCTIONS:
        1. Case-Insensitive: Treat the user's query as case-insensitive (e.g., "apple", "APPLE", "Apple" are the same).
        2. Variations: If a company name is provided, include the exact legal entity match AND importers with very similar names (e.g. typos, variations like "Inc", "LLC", "USA").
        3. Scrape Public Data: actively look for public profile summaries on Panjiva, ImportGenius, Seair, and Volza.
        \n\n`;

        if (query) {
            prompt += `Natural language query: "${query}"\n`;
        }
        
        const constraints = [];
        if (city) constraints.push(`City: ${city}`);
        if (state) constraints.push(`State: ${state}`);
        if (industry) constraints.push(`Industry/Keywords: ${industry}`);
        
        if (constraints.length > 0) {
            prompt += `Strict constraints: ${constraints.join(', ')}\n\n`;
        }

        if (industry) {
            prompt += `**Industry Matching Rules:**\n`;
            prompt += `1.  **Prioritize Direct Matches:** Focus on importers whose primary business directly matches the keywords.\n`;
            prompt += `2.  **Disambiguate Broad Terms:** For broad terms like "textiles," ensure results are for specific commodities.\n`;
            prompt += `3.  **Avoid Weak Associations:** The link between keywords and the importer's core business must be strong.\n\n`;
        }

        prompt += `\nOutput the result as a valid JSON object. Do not include any markdown formatting, code blocks, or conversational text. Return ONLY the raw JSON string.
        Structure:
        {
          "importers": [
            {
              "importerName": "string",
              "location": "string",
              "primaryCommodities": "string",
              "lastShipmentDate": "string",
              "contactInformation": "string (optional)"
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
        console.error("Error searching for importers from Gemini API:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to process data from the API. The response was not valid JSON.");
        }
        throw new Error("Failed to retrieve importer list. " + error.message);
    }
};


export const fetchDetailedImporterData = async (importerName: string): Promise<DetailedImporterResult> => {
  try {
    const prompt = `Find detailed public trade data and contact information for the USA-based importer named '${importerName}'.
    
    CRITICAL SEARCH INSTRUCTIONS (GET DATA AT ANY COST):
    1. **SOURCES**: Search Panjiva, ImportGenius, 52wmb, Seair, Volza, and official company websites.
    2. **CONTACT INFO**: You MUST find a specific Phone Number, Email, Website, and PHYSICAL ADDRESS. Check the company's "Contact Us" page if trade directories are empty. Do not return "N/A" unless absolutely no digital footprint exists.
    3. **SHIPMENT HISTORY**: Extract specific recent shipment events from trade data snippets (Date, Supplier, Commodity, Volume in TEUs/KG, Origin).
    4. **TRADE FOOTPRINT**: Get quantitative data for trade partners (e.g., "150 shipments", "25% of total volume").
    
    Output the result as a valid JSON object. Do not include any markdown formatting, code blocks, or conversational text. Return ONLY the raw JSON string.
    Structure:
    {
      "importerName": "string",
      "location": "string",
      "lastShipmentDate": "string",
      "information": "string (comprehensive business summary)",
      "shipmentActivity": "string (summary of recent activity including supplier names and ports)",
      "shipmentCounts": { "lastMonth": "string/number", "lastQuarter": "string/number", "lastYear": "string/number" },
      "shipmentHistory": [ { "date": "string", "event": "string (format: 'Imported [Volume] of [Commodity] from [Supplier] in [Origin]')" } ],
      "shipmentVolumeHistory": [ { "year": number, "volume": number } ],
      "commodities": "string",
      "contact": { "phone": "string", "email": "string", "website": "string", "address": "string" },
      "riskAssessment": { "financialStability": "string", "regulatoryCompliance": "string", "geopoliticalRisk": "string" },
      "topTradePartners": [ { "country": "string", "tradeVolume": "string (e.g. 'High', '150 shipments', '2000 TEU')" } ],
      "topCommodityFlows": [ 
          { 
              "name": "string", 
              "percentage": "string", 
              "averagePrice": "string (optional)", 
              "marketTrend": "string (optional)", 
              "topSupplier": "string (optional)",
              "priceTrendData": [number] (optional, array of numbers),
              "importVolumeTrendData": [number] (optional, array of numbers)
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
    const prompt = `Find 3-4 similar or related USA-based importers based on the query: "${query}". You MUST search for records on global trade intelligence platforms (Panjiva, ImportGenius) and use market intelligence to find true peers based on commodities, trade partners, or business profile.
    
    Output the result as a valid JSON object. Do not include any markdown formatting, code blocks, or conversational text. Return ONLY the raw JSON string.
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
