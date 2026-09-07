export const convertUnixTimestampWithHoursAndMinutes = (timestamp: string) => {
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
    return 0;
  }
};
export const convertUnixTimestamp = (timestamp: string) => {
  // palauttaa ajan dd/mm/yyyy muodossa
  try {
    const timeObj = new Date(Number(timestamp) * 1000);
    return new Intl.DateTimeFormat("fi-FI").format(timeObj);
  } catch (error) {
    return 0;
  }
};
