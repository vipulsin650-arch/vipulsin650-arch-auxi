
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
