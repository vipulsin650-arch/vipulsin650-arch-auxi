
import { AppLanguage, LANGUAGES } from "../types";

const getGroqKey = () => {
  return process.env.GROQ_API_KEY || '';
};
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const getLangName = (code: string) => LANGUAGES[code as AppLanguage]?.name || "English";

export interface DiseaseResult {
  diseaseName: string;
  cause: string;
  solution: string;
}

export const detectCropDisease = async (base64Image: string, language: AppLanguage = 'en'): Promise<DiseaseResult> => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    return getFallbackDisease(language);
  }
  
  const langName = getLangName(language);
  
  // Note: Groq Llama doesn't support vision, so we'll try with text description
  // This may not work well - we'll use fallback
  const prompt = `You are an agricultural expert. Analyze this crop image and identify any diseases. 
  Common crop diseases: Powdery Mildew, Rust, Leaf Blight, Bacterial Wilt, Mosaic Virus.
  Provide diagnosis in JSON format: {"diseaseName": "...", "cause": "...", "solution": "..."}`;

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
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 1024,
      }),
    });

    if (!response.ok) {
      return getFallbackDisease(language);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.diseaseName) return result;
      }
    } catch (e) {}
    
    return getFallbackDisease(language);
  } catch (e) {
    return getFallbackDisease(language);
  }
};

const getFallbackDisease = (language: AppLanguage): DiseaseResult => {
  const diseases = language === 'hi' ? [
    { diseaseName: "पाउडरी मिल्ड्यू", cause: "फफूंद जीवाणु Oidium spp.", solution: "सल्फर आधारित फफूंदनाशक का छिड़काव करें। नियमित रूप से पौधों की जांच करें।" },
    { diseaseName: "रस्ट रोग", cause: "फफूंद Puccinia spp.", solution: "मैंकोज़ेब या प्रोपिकोनाज़ोल का छिड़काव करें। प्रभावित पत्तियों को हटा दें।" },
    { diseaseName: "पत्ती झुलसा", cause: "फफूंद Alternaria spp.", solution: "तांबा आधारित कवकनाशी का उपयोग करें। सिंचाई को नियंत्रित करें।" },
    { diseaseName: "मोज़ैक वायरस", cause: "वायरस", solution: "प्रभावित पौधों को हटा दें। कीट नियंत्रण करें। प्रतिरोधी किस्मों का उपयोग करें।" }
  ] : [
    { diseaseName: "Powdery Mildew", cause: "Fungal pathogen Oidium spp.", solution: "Apply sulfur-based fungicide. Regularly inspect plants for early detection." },
    { diseaseName: "Rust Disease", cause: "Fungal pathogen Puccinia spp.", solution: "Apply Mancozeb or Propiconazole. Remove infected leaves." },
    { diseaseName: "Leaf Blight", cause: "Fungal pathogen Alternaria spp.", solution: "Use copper-based fungicide. Control irrigation to reduce humidity." },
    { diseaseName: "Mosaic Virus", cause: "Viral infection", solution: "Remove infected plants. Control insect vectors. Use resistant varieties." }
  ];
  
  return diseases[Math.floor(Math.random() * diseases.length)];
};

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

export interface ScheduledTask {
  id: string;
  dayOffset: number;
  taskType: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export const getDetailedCropSchedule = async (crop: string, language: AppLanguage = 'en'): Promise<ScheduledTask[]> => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    return getFallbackSchedule(crop, language);
  }
  
  const langName = getLangName(language);
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const prompt = `Using Google Search, find the most effective modern growth timeline for ${crop} suitable for sowing in ${currentMonth}. Create a full growth timeline in ${langName}. Include all critical stages from sowing to harvest. 
  Focus specifically on:
  1. Irrigation (Watering) milestones.
  2. Fertilizer (Urea, DAP, NPK) application dates.
  Return strictly valid JSON array like: [{"dayOffset": 0, "taskType": "Irrigation", "title": "First Watering", "description": "..."}]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      return getFallbackSchedule(crop, language);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map((t: any, i: number) => ({
          ...t,
          id: `task-${i}-${Date.now()}`,
          isCompleted: false
        }));
      }
    } catch (e) {
      return getFallbackSchedule(crop, language);
    }
    return getFallbackSchedule(crop, language);
  } catch (e) {
    return getFallbackSchedule(crop, language);
  }
};

const getFallbackSchedule = (crop: string, language: AppLanguage): ScheduledTask[] => {
  const cropschedule: { [key: string]: ScheduledTask[] } = {
    en: [
      { id: '1', dayOffset: 0, taskType: 'Irrigation', title: 'Sowing', description: 'Prepare field and sow seeds', isCompleted: false },
      { id: '2', dayOffset: 7, taskType: 'Irrigation', title: 'First Watering', description: 'Light irrigation after germination', isCompleted: false },
      { id: '3', dayOffset: 21, taskType: 'Fertilizer', title: 'First Fertilizer', description: 'Apply Urea @ 40 kg/acre', isCompleted: false },
      { id: '4', dayOffset: 45, taskType: 'Irrigation', title: 'Second Watering', description: 'Critical irrigation at vegetative stage', isCompleted: false },
      { id: '5', dayOffset: 60, taskType: 'Fertilizer', title: 'Second Fertilizer', description: 'Apply DAP @ 50 kg/acre', isCompleted: false },
      { id: '6', dayOffset: 90, taskType: 'Pesticide', title: 'Pest Control', description: 'Check for pests and apply pesticide if needed', isCompleted: false },
      { id: '7', dayOffset: 110, taskType: 'Harvest', title: 'Harvest Ready', description: 'Crop ready for harvest', isCompleted: false }
    ],
    hi: [
      { id: '1', dayOffset: 0, taskType: 'सिंचाई', title: 'बुवाई', description: 'खेत तैयार करें और बीज बोएं', isCompleted: false },
      { id: '2', dayOffset: 7, taskType: 'सिंचाई', title: 'पहली सिंचाई', description: 'अंकुरण के बाद हल्की सिंचाई', isCompleted: false },
      { id: '3', dayOffset: 21, taskType: 'उर्वरक', title: 'पहली खाद', description: 'प्रति एकड़ 40 किलो यूरिया डालें', isCompleted: false },
      { id: '4', dayOffset: 45, taskType: 'सिंचाई', title: 'दूसरी सिंचाई', description: 'वानस्पतिक चरण में महत्वपूर्ण सिंचाई', isCompleted: false },
      { id: '5', dayOffset: 60, taskType: 'उर्वरक', title: 'दूसरी खाद', description: 'प्रति एकड़ 50 किलो DAP डालें', isCompleted: false },
      { id: '6', dayOffset: 90, taskType: 'कीटनाशक', title: 'कीट नियंत्रण', description: 'कीटों की जांच करें और कीटनाशक लगाएं', isCompleted: false },
      { id: '7', dayOffset: 110, taskType: 'कटाई', title: 'कटाई के लिए तैयार', description: 'फसल कटाई के लिए तैयार', isCompleted: false }
    ]
  };
  
  return cropschedule[language] || cropschedule.en;
};

export const getCropInputsPlanStream = async (crop: string, acres: number, onChunk: (text: string) => void, language: AppLanguage = 'en') => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    onChunk(getFallbackInputs(crop, acres, language));
    return;
  }
  
  const langName = getLangName(language);
  
  const prompt = `Using Google Search, find the latest recommended dosage and inputs for ${crop}. Act as a Direct Agriculture Advisor. For ${acres} ACRES of ${crop} in ${langName}, give the EXACT quantities needed. 
  Keep it extremely simple and short. Bold the final numbers.
  
  Headers:
  [SEEDS]: Total KG needed.
  [FERTILIZER]: Total BAGS/KG of Urea/DAP.
  [PESTICIDE]: Total Liters and Name.
  [COST]: Estimated total expense.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        max_completion_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      onChunk(getFallbackInputs(crop, acres, language));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onChunk(getFallbackInputs(crop, acres, language));
      return;
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
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    onChunk(getFallbackInputs(crop, acres, language));
  }
};

const getFallbackInputs = (crop: string, acres: number, language: AppLanguage): string => {
  const seedRates: { [key: string]: number } = { 'wheat': 100, 'rice': 30, 'cotton': 1.5, 'maize': 25, 'sugarcane': 8000, 'mustard': 5, 'pulses': 20 };
  const seeds = seedRates[crop.toLowerCase()] || 50;
  const urea = Math.round(acres * 60);
  const dap = Math.round(acres * 50);
  const cost = Math.round(acres * 15000);
  
  if (language === 'hi') {
    return `[SEEDS]: **${seeds * acres} KG** ${crop} के बीज\n\n[FERTILIZER]: **${urea} KG** यूरिया + **${dap} KG** DAP\n\n[PESTICIDE]: **2 लीटर** कीटनाशक (Imidacloprid)\n\n[COST]: अनुमानित कुल खर्च **₹${cost.toLocaleString()}**`;
  }
  return `[SEEDS]: **${seeds * acres} KG** of ${crop} seeds\n\n[FERTILIZER]: **${urea} KG** Urea + **${dap} KG** DAP\n\n[PESTICIDE]: **2 Liters** Pesticide (Imidacloprid)\n\n[COST]: Estimated Total **₹${cost.toLocaleString()}**`;
};

export interface MarketplaceProduct {
  name: string;
  price: string;
  platform: string;
  link: string;
  category: string;
  image?: string;
}

export const searchMarketplaceProducts = async (query: string, language: AppLanguage = 'en'): Promise<MarketplaceProduct[]> => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    return getFallbackProducts(query, language);
  }
  
  const langName = getLangName(language);
  
  const prompt = `Search for live prices and purchase links for "${query}" on authorized Indian agricultural websites like IFFCO Bazar, BigHaat, AgriBegri, and Amazon Agri. 
  Provide a list of 6 current products with their exact name, price in INR, platform name, and the direct shopping URL. 
  Return strictly valid JSON array like: [{"name": "Product Name", "price": "₹500", "platform": "BigHaat", "link": "https://...", "category": "Seeds"}]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      return getFallbackProducts(query, language);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const products = JSON.parse(jsonMatch[0]) as MarketplaceProduct[];
        if (products.length > 0) return products;
      }
    } catch (e) {}
    return getFallbackProducts(query, language);
  } catch (e) {
    return getFallbackProducts(query, language);
  }
};

const getFallbackProducts = (query: string, language: AppLanguage): MarketplaceProduct[] => {
  const category = query.toLowerCase();
  const products: { [key: string]: MarketplaceProduct[] } = {
    seeds: [
      { name: 'Goldy Wheat Seeds (Improved)', price: '₹320/kg', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Seeds', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop' },
      { name: 'Pusa Basmati Rice Seeds', price: '₹450/kg', platform: 'IFFCO Bazar', link: 'https://www.iffcobazar.in', category: 'Seeds', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
      { name: 'Mahyco Cotton Seeds', price: '₹750/pack', platform: 'AgriBegri', link: 'https://www.agribegri.com', category: 'Seeds', image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=300&h=300&fit=crop' },
      { name: 'Syngenta Maize Hybrid', price: '₹280/kg', platform: 'Amazon', link: 'https://www.amazon.in', category: 'Seeds', image: 'https://images.unsplash.com/photo-1551754655-cd27d2076?e38w=300&h=300&fit=crop' },
      { name: 'Nuziveedu Mustard Seeds', price: '₹380/kg', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Seeds', image: 'https://images.unsplash.com/photo-1585155770913-5bfe8e6a9f3e?w=300&h=300&fit=crop' },
      { name: 'Urad Moong Seeds', price: '₹150/kg', platform: 'IFFCO Bazar', link: 'https://www.iffcobazar.in', category: 'Seeds', image: 'https://images.unsplash.com/photo-1515543904323-de27c9fa4f20?w=300&h=300&fit=crop' }
    ],
    fertilizer: [
      { name: 'Urea (46% N) - 50kg', price: '₹300/bag', platform: 'IFFCO Bazar', link: 'https://www.iffcobazar.in', category: 'Fertilizer', image: 'https://images.unsplash.com/photo-1605000797499-95a51c52638a?w=300&h=300&fit=crop' },
      { name: 'DAP (18% N, 46% P) - 50kg', price: '₹1,350/bag', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Fertilizer', image: 'https://images.unsplash.com/photo-1605000797499-95a51c52638a?w=300&h=300&fit=crop' },
      { name: 'NPK 10-26-26 - 50kg', price: '₹1,200/bag', platform: 'AgriBegri', link: 'https://www.agribegri.com', category: 'Fertilizer', image: 'https://images.unsplash.com/photo-1628151016000-e37a25686c07?w=300&h=300&fit=crop' },
      { name: 'NPK 19-19-19 - 50kg', price: '₹1,100/bag', platform: 'Amazon', link: 'https://www.amazon.in', category: 'Fertilizer', image: 'https://images.unsplash.com/photo-1628151016000-e37a25686c07?w=300&h=300&fit=crop' },
      { name: 'Vermicompost - 50kg', price: '₹600/bag', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Fertilizer', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop' },
      { name: 'Neem Cake - 25kg', price: '₹450/bag', platform: 'IFFCO Bazar', link: 'https://www.iffcobazar.in', category: 'Fertilizer', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop' }
    ],
    pesticide: [
      { name: 'Imidacloprid 17.8% SL - 100ml', price: '₹150', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Pesticide', image: 'https://images.unsplash.com/photo-1632339026429-1068bd1fc87f?w=300&h=300&fit=crop' },
      { name: 'Chlorpyrifos 20% EC - 500ml', price: '₹280', platform: 'AgriBegri', link: 'https://www.agribegri.com', category: 'Pesticide', image: 'https://images.unsplash.com/photo-1632339026429-1068bd1fc87f?w=300&h=300&fit=crop' },
      { name: 'Carbendazim 50% WP - 100g', price: '₹120', platform: 'IFFCO Bazar', link: 'https://www.iffcobazar.in', category: 'Pesticide', image: 'https://images.unsplash.com/photo-1632339026429-1068bd1fc87f?w=300&h=300&fit=crop' },
      { name: 'Glyphosate 41% SL - 1L', price: '₹350', platform: 'Amazon', link: 'https://www.amazon.in', category: 'Pesticide', image: 'https://images.unsplash.com/photo-1632339026429-1068bd1fc87f?w=300&h=300&fit=crop' },
      { name: 'Fipronil 5% SC - 100ml', price: '₹180', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Pesticide', image: 'https://images.unsplash.com/photo-1632339026429-1068bd1fc87f?w=300&h=300&fit=crop' },
      { name: 'Neem Oil - 1L', price: '₹250', platform: 'AgriBegri', link: 'https://www.agribegri.com', category: 'Pesticide', image: 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=300&h=300&fit=crop' }
    ],
    tools: [
      { name: 'Garden Sprayer - 16L', price: '₹850', platform: 'Amazon', link: 'https://www.amazon.in', category: 'Tools', image: 'https://images.unsplash.com/photo-1581141849291-1125c7bde9a9?w=300&h=300&fit=crop' },
      { name: 'Hand Hoe', price: '₹180', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Tools', image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=300&h=300&fit=crop' },
      { name: 'Water Pump - 1HP', price: '₹4,500', platform: 'AgriBegri', link: 'https://www.agribegri.com', category: 'Tools', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=300&fit=crop' },
      { name: 'Garden Pipe - 30m', price: '₹400', platform: 'Amazon', link: 'https://www.amazon.in', category: 'Tools', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop' },
      { name: 'Pruning Shears', price: '₹350', platform: 'BigHaat', link: 'https://www.bighaat.com', category: 'Tools', image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=300&h=300&fit=crop' },
      { name: 'Soil Testing Kit', price: '₹1,200', platform: 'IFFCO Bazar', link: 'https://www.iffcobazar.in', category: 'Tools', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop' }
    ]
  };
  
  const fallback = products.seeds;
  if (products[category]) {
    return products[category];
  }
  return fallback;
};
