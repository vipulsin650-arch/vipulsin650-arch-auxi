
import { SensorData } from '../types';

type SensorCallback = (data: SensorData) => void;

class ESP32Service {
  private ipAddress: string = '';
  private pollInterval: number | null = null;
  private isConnected: boolean = false;
  private callbacks: Set<SensorCallback> = new Set();
  private lastData: SensorData | null = null;
  private readonly PORT = 80;
  private readonly POLL_RATE = 5000;

  setIpAddress(ip: string): void {
    this.ipAddress = ip.trim();
  }

  getIpAddress(): string {
    return this.ipAddress;
  }

  async connect(): Promise<boolean> {
    if (!this.ipAddress) {
      console.error('No IP address set');
      return false;
    }

    try {
      const response = await fetch(`http://${this.ipAddress}:${this.PORT}/data`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: SensorData = await response.json();
      this.lastData = data;
      this.isConnected = true;
      this.startPolling();
      return true;
    } catch (error) {
      console.error('ESP32 connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  disconnect(): void {
    this.stopPolling();
    this.isConnected = false;
    this.lastData = null;
    this.ipAddress = '';
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

  async sendRelayCommand(command: 'ON' | 'OFF' | 'TOGGLE'): Promise<boolean> {
    if (!this.ipAddress || !this.isConnected) {
      return false;
    }

    try {
      const response = await fetch(
        `http://${this.ipAddress}:${this.PORT}/relay?state=${command}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await this.fetchData();
      return true;
    } catch (error) {
      console.error('Error sending relay command:', error);
      return false;
    }
  }

  private async fetchData(): Promise<void> {
    if (!this.ipAddress) return;

    try {
      const response = await fetch(`http://${this.ipAddress}:${this.PORT}/data`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: SensorData = await response.json();
      this.lastData = data;
      this.isConnected = true;
      this.callbacks.forEach(cb => cb(data));
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      this.isConnected = false;
    }
  }

  private startPolling(): void {
    if (this.pollInterval) return;

    this.fetchData();
    this.pollInterval = window.setInterval(() => {
      this.fetchData();
    }, this.POLL_RATE);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const esp32Service = new ESP32Service();
