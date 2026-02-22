
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
#define RELAY_PIN 5

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SENSOR_DATA_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define RELAY_CONTROL_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a9"
#define DATA_REQUEST_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26aa"

DHT dht(DHTPIN, DHTTYPE);

BLEServer* pServer = NULL;
BLECharacteristic* pSensorDataChar = NULL;
BLECharacteristic* pRelayControlChar = NULL;
BLECharacteristic* pDataRequestChar = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

float humidity = 0;
float temperature = 0;
int soilMoisture = 0;
bool relayStatus = false;

unsigned long lastReadTime = 0;
const unsigned long readInterval = 5000;

void readSensors();
void sendSensorData();

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      oldDeviceConnected = true;
      Serial.println("Client connected");
      delay(100);
      readSensors();
      sendSensorData();
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client disconnected");
    }
};

class MyCharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();
      
      if (rxValue.length() > 0) {
        Serial.print("Received: ");
        for (int i = 0; i < rxValue.length(); i++) {
          Serial.print(rxValue[i]);
        }
        Serial.println();
        
        if (rxValue.find("ON") != std::string::npos) {
          digitalWrite(RELAY_PIN, HIGH);
          relayStatus = true;
          Serial.println("Relay ON");
        } else if (rxValue.find("OFF") != std::string::npos) {
          digitalWrite(RELAY_PIN, LOW);
          relayStatus = false;
          Serial.println("Relay OFF");
        } else if (rxValue.find("TOGGLE") != std::string::npos) {
          relayStatus = !relayStatus;
          digitalWrite(RELAY_PIN, relayStatus ? HIGH : LOW);
          Serial.print("Relay Toggled: ");
          Serial.println(relayStatus ? "ON" : "OFF");
        } else if (rxValue.find("READ") != std::string::npos) {
          Serial.println("Data read requested");
        }
        
        sendSensorData();
      }
    }
};

void sendSensorData() {
  if (deviceConnected && pSensorDataChar != NULL) {
    String json = "{";
    json += "\"temperature\":" + String(int(temperature)) + ",";
    json += "\"humidity\":" + String(int(humidity)) + ",";
    json += "\"soilMoisture\":" + String(soilMoisture) + ",";
    json += "\"relayStatus\":" + String(relayStatus ? "true" : "false");
    json += "}";
    
    pSensorDataChar->setValue(json.c_str());
    pSensorDataChar->notify();
    Serial.println("Sent sensor data via BLE");
  }
}

void readSensors() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (!isnan(h)) humidity = h;
  if (!isnan(t)) temperature = t;
  
  int soilRaw = analogRead(SOIL_PIN);
  soilMoisture = map(soilRaw, 0, 4095, 100, 0);
  soilMoisture = constrain(soilMoisture, 0, 100);
}

void setup() {
  Serial.begin(115200);
  
  dht.begin();
  pinMode(SOIL_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  
  Serial.println("Starting BLE Server...");
  
  BLEDevice::init("AgriSarthi-ESP32");
  
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pSensorDataChar = pService->createCharacteristic(
    SENSOR_DATA_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pSensorDataChar->addDescriptor(new BLE2902());
  
  pRelayControlChar = pService->createCharacteristic(
    RELAY_CONTROL_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pRelayControlChar->setCallbacks(new MyCharacteristicCallbacks());
  
  pDataRequestChar = pService->createCharacteristic(
    DATA_REQUEST_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
  );
  pDataRequestChar->setCallbacks(new MyCharacteristicCallbacks());
  pDataRequestChar->addDescriptor(new BLE2902());
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("BLE Server started!");
  Serial.println("Device name: AgriSarthi-ESP32");
  Serial.println("Waiting for client connection...");
  
  readSensors();
}

void loop() {
  unsigned long currentTime = millis();
  if (currentTime - lastReadTime >= readInterval) {
    readSensors();
    sendSensorData();
    lastReadTime = currentTime;
    
    Serial.println("--- Sensor Data ---");
    Serial.print("Temperature: ");
    Serial.print(int(temperature));
    Serial.println(" C");
    Serial.print("Humidity: ");
    Serial.print(int(humidity));
    Serial.println("%");
    Serial.print("Soil Moisture: ");
    Serial.print(soilMoisture);
    Serial.println("%");
    Serial.print("Relay: ");
    Serial.println(relayStatus ? "ON" : "OFF");
  }
  
  if (!deviceConnected && oldDeviceConnected) {
    Serial.println("Restarting advertising...");
    BLEDevice::startAdvertising();
    oldDeviceConnected = false;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = true;
  }
  
  delay(100);
}
