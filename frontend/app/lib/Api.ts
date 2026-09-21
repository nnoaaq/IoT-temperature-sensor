"use server";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL;

// _____ /measurements _____
// GET (getMeasurements - BACKEND)
export const getMeasurements = async (sensorId: string | null) => {
  // ?sensorId = sensorId:string | null
  // null > ensimmäinen haku sivulle tultaessa (sensori-taulusta ensimmäinen id backendin toimesta)
  // PALAUTTAA {sensorId:string, measurements: Measurement[]}
  if (!API_URL) return {};
  try {
    const searchQueryParameters = sensorId ? `?sensorId=${sensorId}` : "";
    const foundMeasurements = await fetch(
      `${API_URL}/measurements${searchQueryParameters}`,
    );
    if (!foundMeasurements.ok) return null;
    return await foundMeasurements.json();
  } catch (error) {
    return null;
  }
};

// _____ /measurement/sensorId _____
// GET (getMeasurementsFromDay - BACKEND)
export const getMeasurementsFromDay = async (
  sensorId: string,
  startTime: number,
  endTime: number,
) => {
  // PALAUTTAA {sensorId:string, measurements: Measurement[]}
  if (!API_URL || !sensorId || !startTime || !endTime) return {};
  try {
    const foundMeasurements = await fetch(
      `${API_URL}/measurements/${sensorId}?startTime=${startTime}&endTime=${endTime}`,
    );
    if (!foundMeasurements.ok) return null;
    return {
      sensorId: sensorId,
      measurements: await foundMeasurements.json(),
    };
  } catch (error) {
    return null;
  }
};

// _____ /sensor _____
// POST (saveTemperatureLimits - BACKEND)
export const saveTemperatureLimits = async (
  sensorId: string,
  limits: { maxTemperature: string; minTemperature: string },
) => {
  if (!PRIVATE_KEY || !sensorId || !limits) return null;
  // {sensorId, maxTemperature, minTemperature}
  try {
    await fetch(`${API_URL}/sensor`, {
      method: "POST",
      headers: {
        authorization: PRIVATE_KEY,
      },
      body: JSON.stringify({
        sensorId: sensorId,
        ...limits,
      }),
    });
    return true;
  } catch (error) {
    return null;
  }
};

// _____ /sensor/sensorId _____
// GET (getSensorTemperatureLimits - BACKEND)
export const getSensorTemperatureLimits = async (sensorId: string) => {
  if (!API_URL || !sensorId) return null;
  try {
    const foundLimits = await fetch(`${API_URL}/sensor/${sensorId}`);
    if (!foundLimits.ok) return null;
    return await foundLimits.json();
  } catch (error) {
    return null;
  }
};

// _____ /sensors _____
// GET (getSensors - BACKEND)
export const getSensors = async () => {
  if (!API_URL) return null;
  try {
    const foundSensors = await fetch(`${API_URL}/sensors`, {
      cache: "no-cache",
    });
    if (!foundSensors.ok) return null;
    return await foundSensors.json();
  } catch (error) {
    return null;
  }
};
