"use server";
import { LimitType } from "../types/limit";

const API_SERVER = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const getMeasurements = async () => {
  try {
    // haetaan mittaustulokset tietokannasta
    const response = await fetch(`${API_SERVER}/measurements`, {
      cache: "no-cache",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
};
export const getTemperatureLimits = async (sensorId: string) => {
  try {
    // haetaan raja-arvot tietokannasta
    const response = await fetch(`${API_SERVER}/sensor/${sensorId}`);
    if (!response.ok) return { success: false };
    return {
      success: true,
      limits: await response.json(),
    };
  } catch (error) {
    return {};
  }
};
export const updateTemperatureLimits = async (
  sensorId: string,
  temperatureLimits: LimitType,
) => {
  // päivitetään raja-arvot
  const API_SERVER = process.env.API_URL || "";
  await fetch(`${API_SERVER}/sensor/${sensorId}`, {
    method: "PUT",
    body: JSON.stringify(temperatureLimits),
  });
};

export const saveTemperatureLimits = async (
  sensorId: string,
  temperatureLimits: LimitType,
) => {
  if (!PRIVATE_KEY) return;
  const response = await fetch(`${API_SERVER}/sensor`, {
    method: "POST",
    headers: {
      authorization: PRIVATE_KEY,
    },
    body: JSON.stringify({
      sensorId: sensorId,
      ...temperatureLimits,
    }),
  });
  return response.ok;
};
