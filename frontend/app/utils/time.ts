export const convertUnixTimestampWithHoursAndMinutes = (timestamp: number) => {
  // palauttaa ajan dd/mm/yyyy muodossa
  try {
    const timeObj = new Date(Number(timestamp) * 1000);
    return new Intl.DateTimeFormat("fi-FI", {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timeObj);
  } catch (error) {
    return "0";
  }
};
export const convertUnixTimestamp = (timestamp: number) => {
  // palauttaa ajan dd.mm.yyyy muodossa
  try {
    const timeObj = new Date(Number(timestamp) * 1000);
    return new Intl.DateTimeFormat("fi-FI", {
      timeZone: "Europe/Helsinki",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(timeObj);
  } catch (error) {
    return "0";
  }
};
