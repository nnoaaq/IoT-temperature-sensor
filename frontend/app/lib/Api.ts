"use server";
export const getMeasurements = async () => {
  try {
    // haetaan mittaustulokset tietokannasta
    const API_SERVER = process.env.API_URL || "";
    const response = await fetch(`${API_SERVER}/measurements`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
};
export const getTemperatureLimits = async (sensorId: string) => {
  try {
    const API_SERVER = process.env.API_URL || "";
    const response = await fetch(`${API_SERVER}/temperature/${sensorId}`);
    if (!response.ok)
      return {
        statusCode: 404,
      };
    return {
      statusCode: 200,
      limits: await response.json(),
    };
    // haetaan raja-arvot tietokannasta
  } catch (error) {
    return [];
  }
};
export const updateTemperatureLimits = async (
  sensorId: string,
  temperatureLimits: {
    temperatureLimitMin: string;
    temperatureLimitMax: string;
  },
) => {
  // päivitetään raja-arvot
  const API_SERVER = process.env.API_URL || "";
  await fetch(`${API_SERVER}/temperature/limit`, {
    method: "PUT",
    body: JSON.stringify({
      sensorId: sensorId,
      minTemperature: Number(temperatureLimits.temperatureLimitMin),
      maxTemperature: Number(temperatureLimits.temperatureLimitMax),
    }),
  });
};
