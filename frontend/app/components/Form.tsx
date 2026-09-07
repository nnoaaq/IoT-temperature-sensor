"use client";
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { MeasurementType } from "../types/measurement";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";
import { useState } from "react";
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);
export const Form = ({
  measurementsData,
}: {
  measurementsData: MeasurementType[];
}) => {
  if (measurementsData.length === 0) {
    return <div>Mittaustuloksia ei löytynyt</div>;
  }
  // Kerätään taulukko kaikista sensoreista
  const allSensors = measurementsData.map((measurement) => {
    return {
      sensorName: measurement.measurementData.sensorName,
      sensorId: measurement.measurementData.sensorId,
    };
  });

  // Muodostetaan taulukko uniikeista sensoreista (ei duplikaatteja)
  const uniqueSensors = Array.from(
    new Map(allSensors.map((sensor) => [sensor.sensorId, sensor])).values(),
  );
  // useState valitulle sensorille, default = ensimmäinen uniikki sensori.
  const [selectedSensor, setSelectedSensor] = useState(
    uniqueSensors[0]?.sensorId,
  );
  // useState valitulle päivälle, default = kaikki päivät
  const [selectedDay, setSelectedDay] = useState("all");

  // Näytetään vain haluttujen sensoreiden data
  const filteredMeasurements: MeasurementType[] = measurementsData
    .filter((measurement) => {
      const sensors = measurement.measurementData.sensorId === selectedSensor;
      const days =
        selectedDay == "all"
          ? true
          : convertUnixTimestamp(measurement.measurementData.timeStamp) ==
            convertUnixTimestamp(selectedDay);
      return sensors && days;
    })
    .sort(
      (a, b) =>
        Number(a.measurementData.timeStamp) -
        Number(b.measurementData.timeStamp),
    );

  // Muodostetaan taulukko uniikeista päivämääristä (ei duplikaatteja)
  const uniqueDays = Array.from(
    new Map(
      measurementsData.map((measurement) => [
        convertUnixTimestamp(measurement.measurementData.timeStamp),
        measurement,
      ]),
    ).values(),
  );
  // Luodaan labelit löytyneistä päivämääristä
  const labels = [
    ...filteredMeasurements.map((measurement) => {
      return convertUnixTimestampWithHoursAndMinutes(
        measurement.measurementData.timeStamp,
      );
    }),
  ];

  // Asetukset taulukkoa varten
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Anturin ${uniqueSensors.filter((sensor) => sensor.sensorId === selectedSensor).map((sensor) => sensor.sensorName)} mittausdata`,
      },
    },
  };
  // Määritellään datasetit taulukkoon
  const data = {
    labels,
    datasets: [
      {
        label: "Lämpötila °C",
        data: [
          ...filteredMeasurements.map((measurement) => {
            return measurement.measurementData.temperature;
          }),
        ],
        borderColor: "#8B5CF6",
        backgroundColor: "#8B5CF6",
      },
      {
        label: "Kosteus %",
        data: [
          ...filteredMeasurements.map((measurement) => {
            return measurement.measurementData.humidity;
          }),
        ],
        borderColor: "#6366F1",
        backgroundColor: "#6366F1",
      },
    ],
  };
  return (
    <div>
      <h1 className="text-amber-500 uppercase tracking-widest">
        Mittaustulokset
      </h1>
      <div className="border border-zinc-100 p-2 rounded-xl shadow-xs">
        <label
          className="uppercase text-xs text-zinc-500 tracking-widest"
          htmlFor="selectSensor"
        >
          Valitse näytettävä sensori
        </label>
        <select
          onChange={(e) => {
            setSelectedSensor(e.target.value);
          }}
          name="selectSensor"
          className="p-2 border border-zinc-200 w-full rounded-lg bg-zinc-50 shadow-xs cursor-pointer outline-none focus:border-amber-500 hover:border-amber-500 "
        >
          {uniqueSensors &&
            uniqueSensors.map((sensor) => (
              <option key={sensor.sensorId} value={sensor.sensorId}>
                {sensor.sensorName}
              </option>
            ))}
        </select>
      </div>
      <div className="border border-zinc-100 p-2 rounded-xl shadow-xs">
        <label
          className="uppercase text-xs text-zinc-500 tracking-widest"
          htmlFor="selectSensor"
        >
          Valitse näytettävä päivä
        </label>
        <select
          onChange={(e) => setSelectedDay(e.target.value)}
          name="selectDate"
          className="p-2 border border-zinc-200 w-full rounded-lg bg-zinc-50 shadow-xs cursor-pointer outline-none focus:border-amber-500 hover:border-amber-500 "
        >
          <option value="all">Kaikki päivät</option>
          {uniqueDays &&
            uniqueDays.map((measurement) => (
              <option
                key={measurement.measurementData.timeStamp}
                value={measurement.measurementData.timeStamp}
              >
                {convertUnixTimestamp(measurement.measurementData.timeStamp)}
              </option>
            ))}
        </select>
      </div>
      <div>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
