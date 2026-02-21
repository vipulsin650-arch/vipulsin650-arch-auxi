
import { GoogleGenAI, Type } from "@google/genai";
import { SensorData, AppLanguage, LANGUAGES } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getLangName = (code: AppLanguage) => LANGUAGES[code]?.name || "English";

export const getSensorAdvice = async (data: SensorData, language: AppLanguage = 'en'): Promise<string> => {
  const ai = getAI();
  const langName = getLangName(language);

  const soilStatus = data.soilMoisture < 30 ? 'LOW' : data.soilMoisture < 60 ? 'OPTIMAL' : 'HIGH';
  const tempStatus = data.temperature < 15 ? 'LOW' : data.temperature > 35 ? 'HIGH' : 'OPTIMAL';
  const humidityStatus = data.humidity < 40 ? 'LOW' : data.humidity > 80 ? 'HIGH' : 'OPTIMAL';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an agricultural expert. Analyze the following sensor readings from a farm and provide actionable advice for Indian farmers.

Current Sensor Readings:
- Soil Moisture: ${data.soilMoisture}% (Status: ${soilStatus})
- Temperature: ${data.temperature}°C (Status: ${tempStatus})
- Humidity: ${data.humidity}% (Status: ${humidityStatus})
- Irrigation Status: ${data.relayStatus ? 'ON' : 'OFF'}

Provide advice in ${langName} language. Include:
1. Current status summary (2-3 sentences)
2. Specific recommendations (bullet points)
3. Whether to turn irrigation ON or OFF

Keep it concise and practical for Indian farmers.`,
    config: {
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text || '';
};

export interface IrrigationRecommendation {
  shouldIrrigate: boolean;
  reason: string;
  duration?: string;
}

export const getIrrigationRecommendation = async (data: SensorData, language: AppLanguage = 'en'): Promise<IrrigationRecommendation> => {
  const ai = getAI();
  const langName = getLangName(language);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Based on these sensor readings, should irrigation be turned on?
- Soil Moisture: ${data.soilMoisture}%
- Temperature: ${data.temperature}°C
- Humidity: ${data.humidity}%

Return ONLY valid JSON in ${langName}:
{"shouldIrrigate": true/false, "reason": "short reason", "duration": "optional duration"}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shouldIrrigate: { type: Type.BOOLEAN },
          reason: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["shouldIrrigate", "reason"]
      },
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as IrrigationRecommendation;
  } catch {
    return {
      shouldIrrigate: data.soilMoisture < 40,
      reason: 'Based on soil moisture levels'
    };
  }
};
