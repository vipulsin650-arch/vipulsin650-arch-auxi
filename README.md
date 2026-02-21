# AgriSarthi - Voice-Powered Farming Assistant

A comprehensive mobile farming application powered by AI voice assistance. AgriSarthi helps farmers with crop management, disease detection, market prices, government schemes, and more - all through voice commands.

## Features

### Voice Assistant
AI-powered voice assistant using Google Gemini API to answer farming questions in multiple languages (Hindi, English, and more)

### Crop Management
- **Crop Advice**: Get expert recommendations for crops based on season and location
- **Crop Planner**: Plan your cropping schedule efficiently
- **Crop Schedule**: Track and manage crop cycles

### Disease Detection
Check crops for diseases and get treatment recommendations

### Market Prices
Real-time market prices for your produce

### Government Schemes
Information about government schemes and subsidies for farmers

### Marketplace
Buy and sell agricultural products

### Tutorials
Educational content and farming tutorials

### Sensor Dashboard
Connect with Arduino sensors to monitor:
- Soil moisture
- Temperature
- Humidity

## Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **AI**: Google Gemini API
- **Styling**: Custom CSS with dark mode support
- **Mobile**: PWA-ready responsive design

## Getting Started

### Prerequisites
- Node.js 18+
- Gemini API Key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variable
# Create .env.local file and add:
GEMINI_API_KEY=your_gemini_api_key_here

# Run locally
npm run dev
```

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment

Deploy to Vercel:
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import the repository
4. Add `GEMINI_API_KEY` in environment variables
5. Deploy

## Project Structure

```
├── screens/          # App screens (Home, Voice Assistant, Market, etc.)
├── components/       # Reusable UI components
├── services/         # API services (Gemini, Arduino, Sensor advice)
├── types.ts          # TypeScript type definitions
├── App.tsx           # Main app component
├── index.tsx         # Entry point
└── vite.config.ts   # Vite configuration
```

## Languages Supported

- English
- Hindi
- And more...

## License

MIT License
