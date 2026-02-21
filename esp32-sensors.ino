#include <WiFi.h>
#include <DHT.h>
#include <WebServer.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
#define RELAY_PIN 5

DHT dht(DHTPIN, DHTTYPE);

const char* ssid = "HOTSPOT";
const char* password = "123456789";

WebServer server(80);

float humidity = 0;
float temperature = 0;
int soilMoisture = 0;
bool relayStatus = false;

unsigned long lastReadTime = 0;
const unsigned long readInterval = 5000;

void handleRoot() {
  String html = "<html><head><title>ESP32 Sensor Data</title></head><body>";
  html += "<h1>ESP32 Sensor Dashboard</h1>";
  html += "<p>Temperature: " + String(temperature) + "°C</p>";
  html += "<p>Humidity: " + String(humidity) + "%</p>";
  html += "<p>Soil Moisture: " + String(soilMoisture) + "%</p>";
  html += "<p>Relay Status: " + String(relayStatus ? "ON" : "OFF") + "</p>";
  html += "<hr>";
  html += "<p>JSON Data: <a href='/data'>/data</a></p>";
  html += "<p>Relay Control:</p>";
  html += "<ul>";
  html += "<li><a href='/relay?state=ON'>Turn ON</a></li>";
  html += "<li><a href='/relay?state=OFF'>Turn OFF</a></li>";
  html += "<li><a href='/relay?state=TOGGLE'>Toggle</a></li>";
  html += "</ul>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleData() {
  String json = "{";
  json += "\"temperature\":" + String(int(temperature)) + ",";
  json += "\"humidity\":" + String(int(humidity)) + ",";
  json += "\"soilMoisture\":" + String(soilMoisture) + ",";
  json += "\"relayStatus\":" + String(relayStatus ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handleRelay() {
  if (server.hasArg("state")) {
    String state = server.arg("state");
    if (state == "ON") {
      digitalWrite(RELAY_PIN, HIGH);
      relayStatus = true;
      server.send(200, "text/plain", "Relay ON");
    } else if (state == "OFF") {
      digitalWrite(RELAY_PIN, LOW);
      relayStatus = false;
      server.send(200, "text/plain", "Relay OFF");
    } else if (state == "TOGGLE") {
      relayStatus = !relayStatus;
      digitalWrite(RELAY_PIN, relayStatus ? HIGH : LOW);
      server.send(200, "text/plain", relayStatus ? "Relay Toggled ON" : "Relay Toggled OFF");
    } else {
      server.send(400, "text/plain", "Invalid state. Use ON, OFF, or TOGGLE");
    }
  } else {
    server.send(400, "text/plain", "Missing state parameter");
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
  
  Serial.println();
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi Connection Failed! Check your SSID and Password.");
  }
  
  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.on("/relay", handleRelay);
  
  server.begin();
  Serial.println("HTTP Server started");
  
  readSensors();
}

void loop() {
  server.handleClient();
  
  unsigned long currentTime = millis();
  if (currentTime - lastReadTime >= readInterval) {
    readSensors();
    lastReadTime = currentTime;
    
    Serial.println("--- Sensor Data ---");
    Serial.print("Temperature: ");
    Serial.print(int(temperature));
    Serial.println("°C");
    Serial.print("Humidity: ");
    Serial.print(int(humidity));
    Serial.println("%");
    Serial.print("Soil Moisture: ");
    Serial.print(soilMoisture);
    Serial.println("%");
    Serial.print("Relay: ");
    Serial.println(relayStatus ? "ON" : "OFF");
  }
}
