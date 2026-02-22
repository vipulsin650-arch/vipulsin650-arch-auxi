export type VoiceEventCallback = (event: string, data?: any) => void;

const GROQ_API_KEY = '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';

class GroqVoiceService {
  private isConnected: boolean = false;
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private callbacks: Set<VoiceEventCallback> = new Set();
  private language: string = 'en';
  private synth: SpeechSynthesis | null = null;
  private synthvoices: SpeechSynthesisVoice[] = [];
  private currentStream: MediaStream | null = null;

  initialize() {
    console.log('Initializing Groq Voice Service');
    this.synth = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    if (this.synth) {
      this.synthvoices = this.synth.getVoices();
      if (this.synthvoices.length === 0) {
        this.synth.onvoiceschanged = () => {
          this.synthvoices = this.synth!.getVoices();
        };
      }
    }
  }

  subscribe(callback: VoiceEventCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private emit(event: string, data?: any) {
    console.log('Groq Voice - Emitting event:', event, data);
    this.callbacks.forEach(cb => cb(event, data));
  }

  async connect(): Promise<boolean> {
    try {
      this.initialize();
      this.isConnected = true;
      this.emit('connected');
      this.emit('status', 'connected');
      return true;
    } catch (error) {
      console.error('Groq connection error:', error);
      this.emit('error', 'Failed to initialize');
      return false;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isConnected) {
      console.error('Not connected');
      return;
    }

    if (this.isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      console.log('Starting recording...');
      this.isRecording = true;
      this.emit('listening', true);
      this.emit('userSpeaking', true);
      this.emit('status', 'listening');

      this.currentStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      
      this.audioChunks = [];
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/mp4';
      }
      
      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: mimeType
      });

      console.log('Using mimeType:', mimeType);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing...');
        this.isRecording = false;
        this.emit('listening', false);
        await this.processAudio();
        
        if (this.currentStream) {
          this.currentStream.getTracks().forEach(track => track.stop());
          this.currentStream = null;
        }
      };

      this.mediaRecorder.start(100);

    } catch (error) {
      console.error('Error starting recording:', error);
      this.emit('error', 'Microphone access denied');
      this.isRecording = false;
      this.emit('listening', false);
      this.emit('userSpeaking', false);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) {
      console.log('Not recording');
      return;
    }

    console.log('Stopping recording...');
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  private async processAudio(): Promise<void> {
    if (this.audioChunks.length === 0) {
      this.emit('userSpeaking', false);
      return;
    }

    try {
      this.emit('thinking', true);
      this.emit('status', 'processing');
      this.emit('userSpeaking', false);

      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      console.log('Transcribing with Whisper...');
      
      const transcribedText = await this.transcribeWithWhisper(audioBlob);

      if (!transcribedText || !transcribedText.trim()) {
        this.emit('thinking', false);
        this.emit('userSpeaking', false);
        this.emit('error', 'Could not understand. Please try again.');
        return;
      }

      console.log('Transcribed:', transcribedText);
      this.emit('userSpeech', transcribedText);

      console.log('Getting response from Llama...');
      
      const aiResponse = await this.getLlamaResponse(transcribedText);

      console.log('AI Response:', aiResponse);
      this.emit('assistantSpeech', aiResponse);
      this.emit('thinking', false);

      await this.speakResponse(aiResponse);

    } catch (error) {
      console.error('Error processing audio:', error);
      this.emit('error', 'Failed to process audio');
      this.emit('thinking', false);
    } finally {
      this.emit('userSpeaking', false);
    }
  }

  private async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    const fileName = 'audio.webm';
    const file = new File([audioBlob], fileName, { type: audioBlob.type || 'audio/webm' });
    formData.append('file', file);
    formData.append('language', this.language === 'hi' ? 'hi' : 'en');

    console.log('Sending request to transcription API...');
    console.log('Audio blob type:', audioBlob.type);
    console.log('Audio blob size:', audioBlob.size);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('Transcribe response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcribe API error:', errorText);
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Transcribe result:', result);
      return result.text || '';
    } catch (error) {
      console.error('Transcribe error:', error);
      throw error;
    }
  }

  private async getLlamaResponse(userMessage: string): Promise<string> {
    const systemPrompt = this.language === 'hi'
      ? `आप एग्रीसारथी हैं, भारतीय किसानों के लिए एक सहायक कृषि सहायक। हिंदी में संक्षिप्त और व्यावहारिक सलाह दें। आप खेत की सिफारिशों, मिट्टी प्रबंधन, सिंचाई, कीट नियंत्रण, सरकारी योजनाओं, बाजार मूल्यों और बीमारी का पता लगाने में मदद कर सकते हैं। जवाब बहुत छोटा और संक्षिप्त रखें।`
      : `You are AgriSarthi, a helpful farming assistant for Indian farmers. Provide advice in English. Keep responses very short and concise. You can help with crop recommendations, soil management, weather advice, irrigation, pest control, government schemes, market prices, and disease detection.`;

    console.log('Sending request to chat API...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: systemPrompt,
        }),
      });

      console.log('Chat response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error:', errorText);
        throw new Error(`Chat failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Chat result:', result);
      return result.response || 'Sorry, I could not understand.';
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  private async speakResponse(text: string): Promise<void> {
    if (!this.synth) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }

    this.emit('agentSpeaking', true);

    const utterance = new SpeechSynthesisUtterance(text);
    
    const lang = this.language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = lang;

    const hindiVoices = this.synthvoices.filter(v => v.lang.startsWith('hi'));
    const englishVoices = this.synthvoices.filter(v => v.lang.startsWith('en'));

    if (this.language === 'hi' && hindiVoices.length > 0) {
      utterance.voice = hindiVoices[0];
    } else if (englishVoices.length > 0) {
      utterance.voice = englishVoices[0];
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      this.emit('agentSpeaking', false);
      this.emit('status', 'ready');
    };

    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      this.emit('agentSpeaking', false);
    };

    this.synth.speak(utterance);
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }

    if (this.synth) {
      this.synth.cancel();
    }

    this.emit('disconnected');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  setLanguage(language: string) {
    this.language = language === 'hi' ? 'hi' : 'en';
  }
}

export const groqVoiceService = new GroqVoiceService();
