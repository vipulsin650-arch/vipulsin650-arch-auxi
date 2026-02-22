
import { createClient, AgentEvents } from '@deepgram/sdk';

export type VoiceEventCallback = (event: string, data?: any) => void;

class DeepgramVoiceService {
  private deepgram: any = null;
  private connection: any = null;
  private isConnected: boolean = false;
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private callbacks: Set<VoiceEventCallback> = new Set();
  private language: string = 'en';
  private keepAliveInterval: any = null;
  private resolveConnect: any = null;

  initialize(language: string = 'en') {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('Deepgram API key not found. Set VITE_DEEPGRAM_API_KEY in .env.local');
    }
    console.log('Initializing Deepgram with API key:', apiKey.substring(0, 8) + '...');
    this.deepgram = createClient(apiKey);
    this.language = language;
  }

  subscribe(callback: VoiceEventCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private emit(event: string, data?: any) {
    console.log('Emitting event:', event, data);
    this.callbacks.forEach(cb => cb(event, data));
  }

  async connect(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        if (!this.deepgram) {
          this.initialize(this.language);
        }

        this.emit('status', 'connecting');
        this.resolveConnect = resolve;

        console.log('Creating Deepgram agent connection...');

        // Create agent connection - this initiates the WebSocket connection
        this.connection = this.deepgram.agent();
        console.log('Agent connection created, setting up handlers...');
        
        // Set up event handlers BEFORE anything else
        this.setupEventHandlers();

        console.log('Event handlers set up, waiting for connection...');
        
        // The connection will trigger 'open' event when ready
        // resolveConnect will be called inside the open handler
        
      } catch (error) {
        console.error('Deepgram connection error:', error);
        this.emit('error', error);
        resolve(false);
      }
    });
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Open event - connection established
    this.connection.on(AgentEvents.Open, () => {
      console.log('Deepgram WebSocket OPEN - Connection established!');
      this.isConnected = true;
      this.emit('status', 'connected');
      
      // Send configuration after connection opens
      this.sendConfiguration();
      
      // Start keepAlive
      this.startKeepAlive();
      
      // Resolve the connect promise
      if (this.resolveConnect) {
        this.resolveConnect(true);
        this.resolveConnect = null;
      }
    });

    // Close event
    this.connection.on(AgentEvents.Close, (data: any) => {
      console.log('Deepgram WebSocket closed:', data);
      this.isConnected = false;
      this.isListening = false;
      this.stopKeepAlive();
      this.emit('close');
    });

    // Error event
    this.connection.on(AgentEvents.Error, (error: any) => {
      console.error('Deepgram error:', error);
      this.emit('error', error);
      if (this.resolveConnect) {
        this.resolveConnect(false);
        this.resolveConnect = null;
      }
    });

    // Conversation text
    this.connection.on(AgentEvents.ConversationText, (data: any) => {
      console.log('ConversationText:', data);
      if (data.role === 'user') {
        this.emit('userSpeech', data.content);
      } else if (data.role === 'assistant') {
        this.emit('assistantSpeech', data.content);
      }
    });

    // User started speaking
    this.connection.on(AgentEvents.UserStartedSpeaking, () => {
      console.log('User started speaking');
      this.emit('userSpeaking', true);
    });

    // Agent started speaking
    this.connection.on(AgentEvents.AgentStartedSpeaking, (data: any) => {
      console.log('Agent started speaking', data);
      this.emit('agentSpeaking', true);
    });

    // Agent audio done
    this.connection.on(AgentEvents.AgentAudioDone, () => {
      console.log('Agent audio done');
      this.emit('agentSpeaking', false);
    });

    // Agent thinking
    this.connection.on(AgentEvents.AgentThinking, (data: any) => {
      console.log('Agent thinking', data);
      this.emit('thinking', true);
    });

    // Binary audio data
    this.connection.on(AgentEvents.Audio, (audioData: ArrayBuffer) => {
      console.log('Received audio data:', audioData.byteLength, 'bytes');
      this.playAudio(audioData);
    });

    // Settings applied
    this.connection.on(AgentEvents.SettingsApplied, () => {
      console.log('Settings applied successfully');
      this.emit('configured');
      // Start listening after settings are applied
      this.startListening();
    });

    // Welcome event
    this.connection.on(AgentEvents.Welcome, (data: any) => {
      console.log('Welcome:', data);
    });

    // Unhandled messages
    this.connection.on(AgentEvents.Unhandled, (data: any) => {
      console.log('Unhandled message:', data);
    });
  }

  private sendConfiguration() {
    if (!this.connection) return;

    try {
      console.log('Sending configuration to Deepgram...');
      
      // Use 'instructions' instead of 'prompt' - per Deepgram docs
      // Use 'container: none' instead of 'wav' - per Deepgram docs
      this.connection.configure({
        audio: {
          input: {
            encoding: 'linear16',
            sample_rate: 16000,
          },
          output: {
            encoding: 'linear16',
            sample_rate: 24000,
            container: 'none',  // Fixed: was 'wav'
          },
        },
        agent: {
          language: this.language === 'hi' ? 'hi' : 'en',
          listen: {
            provider: {
              type: 'deepgram',
              model: 'nova-3',
            },
            // language: 'multi' for multilingual - optional
          },
          think: {
            provider: {
              type: 'open_ai',
              model: 'gpt-4o-mini',
            },
            instructions: 'You are AgriSarthi, a helpful farming assistant for Indian farmers. Provide advice in Hindi or English based on the user\'s language. Keep responses concise and practical. You can help with: crop recommendations, soil management, weather advice, irrigation, pest control, government schemes, market prices, and disease detection.',  // Fixed: was 'prompt'
          },
          speak: {
            provider: {
              type: 'deepgram',
              model: 'aura-2-thalia-en',
            },
          },
          greeting: this.language === 'hi' 
            ? 'नमस्ते! मैं एग्रीसारथी हूं, आपका कृषि सहायक। मैं आपकी खेती में कैसे मदद कर सकता हूं?' 
            : 'Hello! I am AgriSarthi, your farming assistant. How can I help you with your farming today?',
        },
      });
      
      console.log('Configuration sent!');
    } catch (error) {
      console.error('Error sending configuration:', error);
      this.emit('error', error);
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    // Send keepAlive every 8 seconds to prevent timeout
    this.keepAliveInterval = setInterval(() => {
      if (this.connection && this.isConnected) {
        try {
          this.connection.keepAlive();
          console.log('KeepAlive sent');
        } catch (e) {
          console.error('KeepAlive error:', e);
        }
      }
    }, 8000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private async startListening() {
    try {
      console.log('Starting microphone...');
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      const bufferSize = 4096;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      this.processorNode.onaudioprocess = (event) => {
        if (!this.isListening || !this.connection) return;
        
        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16
        const pcmData = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
        }
        
        // Send audio data
        try {
          if (this.connection && this.connection.send) {
            this.connection.send(pcmData.buffer);
          }
        } catch (error) {
          console.error('Error sending audio:', error);
        }
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
      
      this.isListening = true;
      this.emit('listening', true);
      this.emit('status', 'listening');
      
      console.log('Microphone started, audio being sent to Deepgram');
    } catch (error) {
      console.error('Error starting microphone:', error);
      this.emit('error', 'Microphone access denied');
    }
  }

  private async playAudio(audioData: ArrayBuffer) {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const arrayBuffer = audioData;
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async disconnect(): Promise<void> {
    this.isListening = false;
    this.isConnected = false;
    this.stopKeepAlive();

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (this.connection) {
      try {
        if (this.connection.stopListening) {
          this.connection.stopListening();
        }
      } catch (e) {}
      this.connection = null;
    }

    this.emit('disconnected');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getListeningStatus(): boolean {
    return this.isListening;
  }

  setLanguage(language: string) {
    this.language = language;
  }
}

export const deepgramVoiceService = new DeepgramVoiceService();
