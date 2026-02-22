import express from 'express';
import cors from 'cors';
import { Groq } from 'groq-sdk';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3007;

const GROQ_API_KEY = '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';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const groq = new Groq({ apiKey: GROQ_API_KEY });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    console.log('Received transcribe request');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const language = req.body.language || 'en';
    console.log('Language:', language);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-large-v3',
      language: language,
      response_format: 'json',
    });

    console.log('Transcription result:', transcription.text);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;

    console.log('Received chat request:', message);

    const chatCompletion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_completion_tokens: 512,
      top_p: 1,
    });

    const response = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not understand.';
    console.log('Chat response:', response);

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
