#include <Arduino.h>
#include <secrets.h>
#include <WiFi.h>
#include <time.h>
#include <HTTPClient.h>
#include <DHTesp.h>

DHTesp DHT;

const int LED_PIN = 5;
const int SENSOR_PIN = 1;
const char *SSID = WIFI_SSID;
const char *PASSWORD = WIFI_PASSWORD;
const char *SERVER_URL = BACKEND_SERVER_URL;
const char *TIMEZONE_INFO = "EET-2EEST,M3.5.0/3,M10.5.0/4"; // Koodi Suomen ajalle
const char *NTP_SERVER = "fi.pool.ntp.org";                 // NTP - palvelin
const char *CUSTOM_SENSOR_NAME = "Keittiö";                 // Sensorin nimi (näkyy frontendissä)

void saveMeasurements(TempAndHumidity measurements)
{
  // Alustetaan HTTP
  HTTPClient HTTP;
  HTTP.begin(String(SERVER_URL) + "/measurement");
  HTTP.addHeader("Content-Type", "application/json");
  HTTP.addHeader("authorization", PRIVATE_KEY);
  // Kellonaika
  time_t unixTime;
  time(&unixTime);

  // HTTP - post pyynnön body
  String body = "{\"temperature\":" + String(measurements.temperature, 1) +
                ",\"humidity\":" + String(measurements.humidity, 1) +
                ",\"sensorId\":\"" + String(WiFi.macAddress()) + "\"" +
                ",\"sensorName\":\"" + String(CUSTOM_SENSOR_NAME) + "\"" +
                ",\"timeStamp\":\"" + String(unixTime) + "\""
                                                         "}";
  int statusCode = HTTP.POST(body);
  if (statusCode > 0)
  {
    // Onnistunut lähetys
    // Tieto onnistumisesta näytölle | vilkuta vihreää lediä...
    Serial.println("Tiedot lähetetty onnistuneesti");
  }
  else
  {
    // Epäonnistunut lähetys
    // Tieto epäonnistumisesta näytölle | vilkuta punaista lediä...
    Serial.printf("\nVirhe tietojen lähettämisessä. Error : %s", HTTP.errorToString(statusCode));
  }
  HTTP.end();
}

void setup()
{
  Serial.begin(115200);
  delay(5000); // Serial kerittävä mukaan

  // Asetetaan LED - pin (GPIO_5) OUTPUT - tilaan
  pinMode(LED_PIN, OUTPUT);
  // Asetetaan DHT11 - pin (GPIO_1) INPUT - tilaan
  pinMode(SENSOR_PIN, INPUT);

  // Haetaan WiFi - yhteys
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    // WiFi - ei yhdistetty vielä
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
    delay(500);
  }
  // WiFi yhdistetty
  Serial.println("WiFi yhdistetty!");
  digitalWrite(LED_PIN, HIGH);

  // Synkronoidaan kello
  struct tm timeinfo;
  configTzTime(TIMEZONE_INFO, NTP_SERVER);
  while (!getLocalTime(&timeinfo))
  {
    Serial.print(".");
    delay(500);
  }

  // Otetaan DHT - anturi käyttöön
  DHT.setup(SENSOR_PIN, DHTesp::DHT11);
  delay(500);

  // Luetaan lämpötila ja kosteus
  TempAndHumidity measurement = DHT.getTempAndHumidity();
  saveMeasurements(measurement);

  // Deep Sleep
  esp_sleep_enable_timer_wakeup(15 * 60 * 1000000); // 15 minuuttia
  esp_deep_sleep_start();
}

void loop()
{
}
