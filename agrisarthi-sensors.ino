#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define SOIL_PIN A0
#define RELAY_PIN 3

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(SOIL_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int soil = analogRead(SOIL_PIN);
  soil = map(soil, 0, 1023, 100, 0);
  bool relay = digitalRead(RELAY_PIN);
  
  Serial.print("{\"soilMoisture\":");
  Serial.print(soil);
  Serial.print(",\"temperature\":");
  Serial.print(int(t));
  Serial.print(",\"humidity\":");
  Serial.print(int(h));
  Serial.print(",\"relayStatus\":");
  Serial.print(relay ? "true" : "false");
  Serial.println("}");
  
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "RELAY_ON") {
      digitalWrite(RELAY_PIN, HIGH);
    }
    if (cmd == "RELAY_OFF") {
      digitalWrite(RELAY_PIN, LOW);
    }
  }
  delay(5000);
}
