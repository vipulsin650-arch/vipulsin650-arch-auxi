
import { GoogleGenAI, Type } from "@google/genai";
import { DiseaseResult, ScheduledTask, AppLanguage, LANGUAGES } from "../types";

const getAPIKey = () => {
  return process.env.GEMINI_API_KEY || process.env.API_KEY || 'AIzaSyA0QPL6rL4YsGUGyZUnxjFrG955060EkZc';
};

const getAI = () => new GoogleGenAI({ apiKey: getAPIKey() });

// Helper to get the full English name of the language for the prompt
const getLangName = (code: string) => LANGUAGES[code as AppLanguage]?.name || "English";

export const detectCropDisease = async (base64Image: string, language: AppLanguage = 'en'): Promise<DiseaseResult> => {
  const ai = getAI();
  const langName = getLangName(language);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: `Identify the crop disease in this image. Use Google Search to verify the latest 2024-2025 treatment protocols. Provide a professional diagnosis including: 1. Disease Name, 2. Root Cause, 3. Critical Treatment Solution (Include modern chemical and organic controls). Output must be valid JSON in ${langName}.` }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diseaseName: { type: Type.STRING },
          cause: { type: Type.STRING },
          solution: { type: Type.STRING }
        },
        required: ["diseaseName", "cause", "solution"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as DiseaseResult;
};

export const getCropAdviceStream = async (crop: string, onChunk: (text: string) => void, language: AppLanguage = 'en') => {
  const ai = getAI();
  const langName = getLangName(language);
  const currentYear = new Date().getFullYear();
  
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: `Using Google Search, find the absolute latest ${currentYear}-${currentYear + 1} scientific farming practices for ${crop}. Act as a Senior Agricultural Scientist. Provide a highly structured professional guide in ${langName} language. Highlight key variables like [FERTILIZER NAME] in bold. Headers: [SUMMARY], [CRITICAL FACTORS], [NUTRITION], [IRRIGATION], [YIELD MAXIMIZER].`,
    config: { 
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }] 
    }
  });

  let fullText = "";
  for await (const chunk of response) {
    onChunk(fullText += chunk.text);
  }
};

export const getDetailedCropSchedule = async (crop: string, language: AppLanguage = 'en'): Promise<ScheduledTask[]> => {
  const ai = getAI();
  const langName = getLangName(language);
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Using Google Search, find the most effective modern growth timeline for ${crop} suitable for sowing in ${currentMonth}. Create a full growth timeline in ${langName}. Include all critical stages from sowing to harvest. 
    Focus specifically on:
    1. Irrigation (Watering) milestones.
    2. Fertilizer (Urea, DAP, NPK) application dates.
    Return a JSON array of tasks with dayOffset (number of days after sowing).`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dayOffset: { type: Type.NUMBER },
            taskType: { type: Type.STRING, enum: ['Irrigation', 'Fertilizer', 'Pesticide', 'Harvest'] },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["dayOffset", "taskType", "title", "description"]
        }
      }
    }
  });

  const tasks = JSON.parse(response.text || '[]');
  return tasks.map((t: any, i: number) => ({
    ...t,
    id: `task-${i}-${Date.now()}`,
    isCompleted: false
  }));
};

export const getCropInputsPlanStream = async (crop: string, acres: number, onChunk: (text: string) => void, language: AppLanguage = 'en') => {
  const ai = getAI();
  const langName = getLangName(language);
  
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: `Using Google Search, find the latest recommended dosage and inputs for ${crop}. Act as a Direct Agriculture Advisor. For ${acres} ACRES of ${crop} in ${langName}, give the EXACT quantities needed. 
    Keep it extremely simple and short. Bold the final numbers.
    
    Headers:
    [SEEDS]: Total KG needed.
    [FERTILIZER]: Total BAGS/KG of Urea/DAP.
    [PESTICIDE]: Total Liters and Name.
    [COST]: Estimated total expense.`,
    config: { 
      thinkingConfig: { thinkingBudget: 0 },
      tools: [{ googleSearch: {} }] 
    }
  });

  let fullText = "";
  for await (const chunk of response) {
    onChunk(fullText += chunk.text);
  }
};

export const getWeatherByLocationName = async (locationName: string, language: AppLanguage = 'en'): Promise<{ location: string, temp: string, condition: string }> => {
  const ai = getAI();
  const langName = getLangName(language);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide the current live weather for "${locationName}". Mention exact temperature in Celsius and general sky condition. Return text in ${langName}.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  
  const rawText = response.text || '';

  try {
    const tempMatch = rawText.match(/(\d+)°C/) || rawText.match(/(\d+)\s*degree/i);
    const temp = tempMatch ? `${tempMatch[1]}°C` : "26°C";
    
    return {
      location: locationName,
      temp: temp,
      condition: rawText.toLowerCase().includes('rain') ? 'Rainy' : rawText.toLowerCase().includes('cloud') ? 'Cloudy' : 'Sunny'
    };
  } catch (e) {
    return { location: locationName, temp: "26°C", condition: "Clear" };
  }
};

export const getRealtimeWeather = async (lat: number, lng: number, language: AppLanguage = 'en'): Promise<{ location: string, temp: string, condition: string, sources?: any[] }> => {
  const ai = getAI();
  const langName = getLangName(language);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Coordinates: ${lat}, ${lng}. Identify the exact Village, block, and nearest Mandi. Provide current temp and sky condition. Return text in ${langName}.`,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });
  
  const rawText = response.text || '';
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  try {
    const tempMatch = rawText.match(/(\d+)°C/) || rawText.match(/(\d+)\s*degree/i);
    const temp = tempMatch ? `${tempMatch[1]}°C` : "28°C";
    const location = rawText.split(/[.\n]/)[0].replace(/Location:|स्थान:|Here is|Based on/gi, '').trim() || "Local Village";

    return {
      location: location,
      temp: temp,
      condition: rawText.includes('rain') ? 'Rainy' : rawText.includes('cloud') ? 'Cloudy' : 'Sunny',
      sources
    };
  } catch (e) {
    return { location: language === 'hi' ? "आपका क्षेत्र" : "Your Area", temp: "28°C", condition: "Ready", sources };
  }
};

export const getCityFromCoords = async (lat: number, lng: number, language: AppLanguage = 'en'): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide ONLY the Village name and District for Lat ${lat}, Lng ${lng}.`,
    config: { 
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    }
  });
  return (response.text || '').trim().split('\n')[0];
};

export const getMarketInsightsStream = async (crop: string, onChunk: (text: string) => void, location?: string, language: AppLanguage = 'en') => {
  const ai = getAI();
  const langName = getLangName(language);
  const today = new Date().toLocaleDateString();
  
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: `Search TODAY'S (${today}) LIVE market arrivals and prices for ${crop} in Mandi/Location: "${location || 'India'}". 
    Provide a professional commodity terminal report in ${langName}.
    
    CRITICAL: 
    1. Highlight PRICE NUMBERS in **bold** (e.g., **₹5,400/qtl**).
    2. Compare with Govt MSP.
    3. Use exact headers: [CURRENT RATE], [MARKET ARRIVALS], [MSP COMPARISON], [PRICE FORECAST].`,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 0 } 
    }
  });

  let fullText = "";
  for await (const chunk of response) {
    onChunk(fullText += chunk.text);
  }
};

export interface LiveScheme {
  title: string;
  description: string;
  url: string;
}

export const getLiveGovernmentSchemes = async (language: AppLanguage = 'en'): Promise<LiveScheme[]> => {
  const ai = getAI();
  const langName = getLangName(language);
  const currentYear = new Date().getFullYear();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Search for the latest LIVE ${currentYear}-${currentYear + 1} Government of India agriculture schemes and subsidies (e.g., PM-Kisan, PM-FBY, Fertilizer subsidies). 
    Provide a list of at least 5 active schemes with their title, a brief 1-sentence description, and the OFFICIAL GOVT PORTAL URL (ending in .gov.in if possible). 
    Return strictly valid JSON in ${langName}.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            url: { type: Type.STRING }
          },
          required: ["title", "description", "url"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]') as LiveScheme[];
  } catch (e) {
    return [];
  }
};

export interface MarketplaceProduct {
  name: string;
  price: string;
  platform: string;
  link: string;
  category: string;
}

export const searchMarketplaceProducts = async (query: string, language: AppLanguage = 'en'): Promise<MarketplaceProduct[]> => {
  const ai = getAI();
  const langName = getLangName(language);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Search for live prices and purchase links for "${query}" on authorized Indian agricultural websites like IFFCO Bazar, BigHaat, AgriBegri, and Amazon Agri. 
    Provide a list of current products with their exact name, price in INR, platform name, and the direct shopping URL. 
    Return strictly valid JSON in ${langName}.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.STRING },
            platform: { type: Type.STRING },
            link: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["name", "price", "platform", "link"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]') as MarketplaceProduct[];
  } catch (e) {
    return [];
  }
};
