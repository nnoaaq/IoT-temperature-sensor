#include "secrets.h"
#include <Arduino.h>
#include <WiFi.h>
#include <time.h>

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
  Serial.println("Synkronoidaan kelloa");
  while (!getLocalTime(&timeinfo))
  {
    Serial.print(".");
    delay(10);
  }
  time_t now;
  time(&now);
  Serial.println("\r\nKello synkronoitu");
  Serial.println(&timeinfo, "%Y-%m-%d %H:%M:%S");
  Serial.println(now);
}

void loop()
{
  delay(10);
}
