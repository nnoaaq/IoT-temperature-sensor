#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include "secrets.h"
#include <DHTesp.h>
#include <HTTPClient.h>

#define DHT_PIN 14
#define DHT_TYPE DHT22
#define CUSTOM_SENSOR_NAME "Jääkaappi"
HTTPClient http;
DHTesp dht;
// Viimeinen mittaus-muuttuja
TempAndHumidity latestMeasuredData = {-999.0, -999.0};

void setup()
{
  Serial.begin(115200);

  // Muodostetaan WiFi yhteys
  Serial.println("Haetaan internet-yhteyttä");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(100);
  }
  Serial.println("\r\nWiFi yhdistetty");

  // Synkronoidaan kello
  configTzTime("EET-2EEST,M3.5.0/3,M10.5.0/4", NTP_SERVER);
  struct tm timeinfo;
  Serial.println("\nSynkronoidaan kelloa");
  while (!getLocalTime(&timeinfo))
  {
    Serial.print(".");
  }
  time_t unixTime;
  time(&unixTime);
  // unixTime = UNIX aikaleima nykyisestä hetkestä
  Serial.println("\r\nKello synkronoitu");
  Serial.println(&timeinfo, "%Y-%m-%d %H:%M:%S");
  Serial.println(unixTime);

  // Otetaan DHT22-sensori käyttöön
  dht.setup(DHT_PIN, DHTesp::DHT_TYPE);
}

void sendData(TempAndHumidity data)
{
  // Lähetetään tiedot backendille
  Serial.println("Tallennetaan dataa");
  http.begin(String(SERVER_URL) + "/measurements");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"temperature\":" + String(data.temperature, 1) + ",\"humidity\":" + String(data.humidity, 1) + ",\"sensorId\":\"" + String(WiFi.macAddress()) + "\"" + ",\"sensorName\":\"" + String(CUSTOM_SENSOR_NAME) + "\"" + "}";
  Serial.println(body);
  int statusCode = http.POST(body);
  if (statusCode > 0)
  {
    Serial.println("Tiedot lähetetty onnistuneesti.");
  }
  else
  {
    Serial.printf("Virhe tietojen lähetyksessä. Error : %s", http.errorToString(statusCode).c_str());
  }
}

void loop()
{
  // Luetaan DHT-22 sensorin arvot
  TempAndHumidity measuredData = dht.getTempAndHumidity();

  if ((!isnan(measuredData.temperature) && measuredData.temperature != latestMeasuredData.temperature) || (!isnan(measuredData.humidity) && measuredData.humidity != latestMeasuredData.humidity))
  {
    Serial.println("TIEDOT MUUTTUNEET;::");
    // aloitetaan datan lähetys backendille
    sendData(measuredData);
    // vaihdetaan viimeisin mittaustulos
    latestMeasuredData = measuredData;
  }

  delay(5000); // Viive....
}
