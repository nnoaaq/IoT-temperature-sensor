"use server";
export const getMeasurements = async () => {
  // haetaan mittaustulokset tietokannasta
  const API_SERVER = process.env.API_URL || "";
  const response = await fetch(`${API_SERVER}/measurements`);
  if (!response.ok) return [];
  return await response.json();
};
