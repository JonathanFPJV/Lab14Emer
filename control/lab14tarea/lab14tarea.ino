#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ESP32Servo.h>

const char* ssid = "Redmi Note 11 Pro";
const char* password = "13579a123";
const char* serverAddress = "192.168.129.24";
const int serverPort = 8080;

const int potPin = 35;
const int servoPin = 26;
const int ledArranquePin = 16;
const int ledReinicioPin = 27;
const int botonPin = 17;

Servo myServo;
WebSocketsClient webSocket;
bool controlEnabled = false;

int previousPotValue = -1; // Variable para almacenar el valor anterior del potenciómetro
int smoothedPotValue = 0; // Variable para el valor suavizado del potenciómetro
const int smoothingFactor = 5; // Factor para el suavizado (cuántas lecturas se promedian)

// Función para suavizar la lectura del potenciómetro
int smoothReading(int newReading) {
  smoothedPotValue = (smoothedPotValue * (smoothingFactor - 1) + newReading) / smoothingFactor;
  return smoothedPotValue;
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("Desconectado del servidor WebSocket");
      break;

    case WStype_CONNECTED:
      Serial.println("Conectado al servidor WebSocket");
      webSocket.sendTXT("ESP32 conectado");
      break;

    case WStype_TEXT:
      Serial.printf("Mensaje recibido: %s\n", payload);
      if (strcmp((char*)payload, "TOGGLE_CONTROL") == 0) {
        controlEnabled = !controlEnabled;
        digitalWrite(ledArranquePin, controlEnabled ? HIGH : LOW);
      }
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ledArranquePin, OUTPUT);
  pinMode(ledReinicioPin, OUTPUT);
  pinMode(botonPin, INPUT_PULLUP);
  digitalWrite(ledArranquePin, LOW);
  digitalWrite(ledReinicioPin, LOW);
  
  myServo.attach(servoPin);
  myServo.write(0);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println("\nConectado al WiFi");

  webSocket.begin(serverAddress, serverPort, "/");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();

  if (digitalRead(botonPin) == LOW) {
    myServo.write(0);
    digitalWrite(ledReinicioPin, HIGH);
    delay(500);
    digitalWrite(ledReinicioPin, LOW);
  }

  if (controlEnabled) {
    int potValue = analogRead(potPin); // Leer el valor del potenciómetro
    int smoothedPotValue = smoothReading(potValue); // Suavizar la lectura

    int servoPos = map(smoothedPotValue, 0, 4095, 0, 180); // Mapeo a 180 grados
    myServo.write(servoPos);
    
    // Solo enviar datos si el valor del potenciómetro ha cambiado significativamente
    if (abs(smoothedPotValue - previousPotValue) > 10) {
      String potMessage = "POT:" + String(smoothedPotValue) + ",POS:" + String(servoPos);
      webSocket.sendTXT(potMessage);
      previousPotValue = smoothedPotValue; // Actualizar el valor anterior
    }
  }

  delay(100);
}
