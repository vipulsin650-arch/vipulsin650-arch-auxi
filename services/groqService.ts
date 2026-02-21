
import { AppLanguage, LANGUAGES } from "../types";

const getGroqKey = () => {
  return process.env.GROQ_API_KEY || '';
};
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const getLangName = (code: string) => LANGUAGES[code as AppLanguage]?.name || "English";

export const getCropAdviceStream = async (crop: string, onChunk: (text: string) => void, language: AppLanguage = 'en') => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  
  const langName = getLangName(language);
  const currentYear = new Date().getFullYear();
  
  const prompt = `Using Google Search, find the absolute latest ${currentYear}-${currentYear + 1} scientific farming practices for ${crop}. Act as a Senior Agricultural Scientist. Provide a highly structured professional guide in ${langName} language. Highlight key variables like [FERTILIZER NAME] in bold. Headers: [SUMMARY], [CRITICAL FACTORS], [NUTRITION], [IRRIGATION], [YIELD MAXIMIZER].`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
};

export const getMarketInsightsStream = async (crop: string, onChunk: (text: string) => void, location?: string, language: AppLanguage = 'en') => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  
  const langName = getLangName(language);
  const today = new Date().toLocaleDateString();
  
  const prompt = `Search TODAY'S (${today}) LIVE market arrivals and prices for ${crop} in Mandi/Location: "${location || 'India'}". 
  Provide a professional commodity terminal report in ${langName}.
  
  CRITICAL: 
  1. Highlight PRICE NUMBERS in **bold** (e.g., **₹5,400/qtl**).
  2. Compare with Govt MSP.
  3. Use exact headers: [CURRENT RATE], [MARKET ARRIVALS], [MSP COMPARISON], [PRICE FORECAST].`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
};

export interface LiveScheme {
  title: string;
  description: string;
  url: string;
}

export const getLiveGovernmentSchemes = async (language: AppLanguage = 'en'): Promise<LiveScheme[]> => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    return getFallbackSchemes(language);
  }
  
  const langName = getLangName(language);
  const currentYear = new Date().getFullYear();
  
  const prompt = `Search for the latest LIVE ${currentYear}-${currentYear + 1} Government of India agriculture schemes and subsidies for farmers (e.g., PM-Kisan, PM-FBY, Fertilizer subsidies, Kisan Credit Card, Soil Health Card). 
  Provide a list of at least 7 active schemes with their exact title, a brief 1-sentence description, and the OFFICIAL Government Portal URL (ending in .gov.in if possible).
  Return strictly valid JSON array like: [{"title": "Scheme Name", "description": "Brief description", "url": "https://..."}]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      return getFallbackSchemes(language);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const schemes = JSON.parse(jsonMatch[0]) as LiveScheme[];
        if (schemes.length > 0) return schemes;
      }
      return JSON.parse(content) as LiveScheme[];
    } catch (e) {
      return getFallbackSchemes(language);
    }
  } catch (e) {
    return getFallbackSchemes(language);
  }
};

const getFallbackSchemes = (language: AppLanguage): LiveScheme[] => {
  if (language === 'hi') {
    return [
      { title: "PM-Kisan Samman Nidhi", description: "प्रधानमंत्री किसान सम्मान निधि - प्रति वर्ष ₹6000 किसानों को", url: "https://pmkisan.gov.in" },
      { title: "PM-FBY", description: "प्रधानमंत्री फसल बीमा योजना - फसल बीमा का लाभ", url: "https://pmfby.gov.in" },
      { title: "Kisan Credit Card", description: "किसान क्रेडिट कार्ड - खेती के लिए आसान ऋण", url: "https://nabard.org" },
      { title: "Soil Health Card", description: "मृदा स्वास्थ्य कार्ड - मिट्टी की जांच और सुझाव", url: "https://soilhealth.dac.gov.in" },
      { title: "Fertilizer Subsidy", description: "उर्वरक सब्सिडी - खाद पर सब्सिडी", url: "https://dafof.gov.in" },
      { title: "Agricultural Infrastructure Fund", description: "कृषि अवसंरचना कोष - खेतो में इंफ्रास्ट्रक्चर", url: "https://agriinfra.gov.in" },
      { title: "e-NAM", description: "ई-राष्ट्रीय कृषि बाजार - ऑनलाइन मंडी", url: "https://enam.gov.in" }
    ];
  }
  return [
    { title: "PM-Kisan Samman Nidhi", description: "Pradhan Mantri Kisan Samman Nidhi - ₹6000/year to farmers", url: "https://pmkisan.gov.in" },
    { title: "PM-FBY", description: "Pradhan Mantri Fasal Bima Yojana - Crop insurance coverage", url: "https://pmfby.gov.in" },
    { title: "Kisan Credit Card", description: "Kisan Credit Card - Easy loans for farming", url: "https://nabard.org" },
    { title: "Soil Health Card", description: "Soil Health Card - Soil testing and recommendations", url: "https://soilhealth.dac.gov.in" },
    { title: "Fertilizer Subsidy", description: "Fertilizer Subsidy - Subsidy on fertilizers", url: "https://dafof.gov.in" },
    { title: "Agricultural Infrastructure Fund", description: "Agricultural Infrastructure Fund for farm assets", url: "https://agriinfra.gov.in" },
    { title: "e-NAM", description: "Electronic National Agricultural Market - Online mandi", url: "https://enam.gov.in" }
  ];
};
