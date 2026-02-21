
import { SensorData } from '../types';

type SensorCallback = (data: SensorData) => void;

class ArduinoService {
  private port: any = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private isConnected: boolean = false;
  private callbacks: Set<SensorCallback> = new Set();
  private lastData: SensorData | null = null;

  async connect(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported. Use Chrome/Edge browser.');
      }

      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 115200 });

      this.isConnected = true;
      this.startReading();
      return true;
    } catch (error) {
      console.error('Serial connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getLastData(): SensorData | null {
    return this.lastData;
  }

  subscribe(callback: SensorCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  async sendRelayCommand(command: 'ON' | 'OFF'): Promise<boolean> {
    if (!this.port || !this.isConnected) {
      return false;
    }

    try {
      const writer = this.port.writable.getWriter();
      const commandStr = command === 'ON' ? 'RELAY_ON\n' : 'RELAY_OFF\n';
      await writer.write(new TextEncoder().encode(commandStr));
      writer.releaseLock();
      return true;
    } catch (error) {
      console.error('Error sending relay command:', error);
      return false;
    }
  }

  private startReading(): void {
    if (!this.port) return;

    const decoder = new TextDecoder();
    let buffer = '';

    const readLoop = async () => {
      try {
        if (!this.port) return;
        
        this.reader = this.port.readable.getReader();
        
        while (this.isConnected) {
          const { value, done } = await this.reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                const data: SensorData = JSON.parse(trimmed);
                this.lastData = data;
                this.callbacks.forEach(cb => cb(data));
              } catch (e) {
                console.error('JSON parse error:', e);
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Read error:', error);
        }
      }
    };

    readLoop();
  }
}

export const arduinoService = new ArduinoService();
