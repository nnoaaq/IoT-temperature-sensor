export type MeasurementType = {
  measurementId: string;
  measurementData: {
    timeStamp: string;
    humidity: number;
    temperature: number;
    sensorId: string;
    sensorName: string;
  };
};
