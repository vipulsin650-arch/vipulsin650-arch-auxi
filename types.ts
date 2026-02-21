
/**
 * KrishiSure Shared Types
 */

export enum AppScreen {
  SPLASH = 'SPLASH',
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  CROP_ADVICE = 'CROP_ADVICE',
  DISEASE_CHECK = 'DISEASE_CHECK',
  MARKET_PRICES = 'MARKET_PRICES',
  SCHEMES = 'SCHEMES',
  PROFILE = 'PROFILE',
  CROP_PLANNER = 'CROP_PLANNER',
  VOICE_ASSISTANT = 'VOICE_ASSISTANT',
  MARKETPLACE = 'MARKETPLACE',
  CROP_SCHEDULE = 'CROP_SCHEDULE',
  TUTORIALS = 'TUTORIALS',
  SENSOR_DASHBOARD = 'SENSOR_DASHBOARD'
}

export type Theme = 'light' | 'dark' | 'system';

// Supported Languages
export type AppLanguage = 'en' | 'hi' | 'pa' | 'mr' | 'gu' | 'bn' | 'ta' | 'te' | 'kn' | 'ml';

export const LANGUAGES: Record<AppLanguage, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  mr: { name: 'Marathi', nativeName: 'मराठी' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  bn: { name: 'Bengali', nativeName: 'বাংলা' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்' },
  te: { name: 'Telugu', nativeName: 'తెలుగు' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം' }
};

export interface User {
  name: string;
  phone: string;
  locationName: string;
}

export interface DiseaseResult {
  diseaseName: string;
  cause: string;
  solution: string;
}

export interface ScheduledTask {
  id: string;
  dayOffset: number;
  taskType: 'Irrigation' | 'Fertilizer' | 'Pesticide' | 'Harvest';
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface ActiveCrop {
  id: string;
  cropName: string;
  sowingDate: string;
  tasks: ScheduledTask[];
}

export interface SensorData {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  relayStatus: boolean;
}
