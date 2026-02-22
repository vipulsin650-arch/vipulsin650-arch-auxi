
import { SensorData } from '../types';

type SensorCallback = (data: SensorData) => void;

const SENSOR_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const SENSOR_DATA_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const RELAY_CONTROL_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
const DATA_REQUEST_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26aa';

class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private sensorDataChar: BluetoothRemoteGATTCharacteristic | null = null;
  private relayControlChar: BluetoothRemoteGATTCharacteristic | null = null;
  private dataRequestChar: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected: boolean = false;
  private callbacks: Set<SensorCallback> = new Set();
  private lastData: SensorData | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not supported. Use Chrome/Edge browser.');
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SENSOR_SERVICE_UUID] },
          { namePrefix: 'ESP32' },
          { namePrefix: 'AgriSarthi' }
        ],
        optionalServices: [SENSOR_SERVICE_UUID]
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(SENSOR_SERVICE_UUID);

      this.sensorDataChar = await service.getCharacteristic(SENSOR_DATA_CHAR_UUID);
      await this.sensorDataChar.startNotifications();
      this.sensorDataChar.addEventListener('characteristicvaluechanged', this.handleSensorData.bind(this));

      try {
        this.relayControlChar = await service.getCharacteristic(RELAY_CONTROL_CHAR_UUID);
      } catch (e) {
        console.log('Relay control characteristic not available');
      }

      try {
        this.dataRequestChar = await service.getCharacteristic(DATA_REQUEST_CHAR_UUID);
      } catch (e) {
        console.log('Data request characteristic not available');
      }

      this.isConnected = true;
      
      setTimeout(() => {
        this.requestData();
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  private handleSensorData(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;
    this.handleSensorDataValue(value);
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.sensorDataChar = null;
    this.relayControlChar = null;
    this.dataRequestChar = null;
    this.lastData = null;
    this.reconnectAttempts = 0;
  }

  async disconnect(): Promise<void> {
    if (this.sensorDataChar) {
      try {
        await this.sensorDataChar.stopNotifications();
      } catch (e) {}
    }

    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }

    this.handleDisconnect();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getLastData(): SensorData | null {
    return this.lastData;
  }

  subscribe(callback: SensorCallback): () => void {
    this.callbacks.add(callback);
    if (this.lastData) {
      callback(this.lastData);
    }
    return () => this.callbacks.delete(callback);
  }

  async sendRelayCommand(command: 'ON' | 'OFF' | 'TOGGLE'): Promise<boolean> {
    if (!this.relayControlChar || !this.isConnected) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      await this.relayControlChar.writeValue(data);
      return true;
    } catch (error) {
      console.error('Error sending relay command:', error);
      return false;
    }
  }

  async requestData(): Promise<boolean> {
    if (!this.dataRequestChar || !this.isConnected) {
      if (this.sensorDataChar && this.isConnected) {
        try {
          const value = await this.sensorDataChar.readValue();
          this.handleSensorDataValue(value);
          return true;
        } catch (e) {
          console.error('Error reading sensor data:', e);
        }
      }
      return false;
    }

    try {
      const encoder = new TextEncoder();
      await this.dataRequestChar.writeValue(encoder.encode('READ'));
      return true;
    } catch (error) {
      console.error('Error requesting data:', error);
      return false;
    }
  }

  private handleSensorDataValue(value: DataView) {
    if (!value) return;

    const decoder = new TextDecoder();
    const str = decoder.decode(value);
    const trimmed = str.trim();

    console.log('Raw sensor data:', str);

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

export const bluetoothService = new BluetoothService();
