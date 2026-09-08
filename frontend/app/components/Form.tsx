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
import { SensorType } from "../types/sensor";
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
  // mäppi kaikista sensoreista (ei duplikaatteja)
  // {sensorName:string, sensorId:string}
  const sensorList = new Map<String, SensorType>();
  measurementsData.forEach((measurement) => {
    const { sensorId, sensorName } = measurement.measurementData;
    // myöhemmin löytynyt ID korvaa aiemman
    sensorList.set(sensorId, {
      sensorId: sensorId,
      sensorName: sensorName,
    });
  });

  // useState valitulle sensorille, default = ensimmäinen  sensori.
  const firstSensor = sensorList.values().next().value;
  const [selectedSensor, setSelectedSensor] = useState(firstSensor);

  // useState valitulle päivälle, default = kaikki päivät
  const [selectedDay, setSelectedDay] = useState("all");

  // Näytetään vain haluttujen sensoreiden data
  const filteredMeasurements: MeasurementType[] = measurementsData
    .filter((measurement) => {
      const sensors =
        measurement.measurementData.sensorId === selectedSensor?.sensorId;
      const days =
        selectedDay == "all"
          ? true
          : convertUnixTimestamp(measurement.measurementData.timeStamp) ==
            selectedDay;
      return sensors && days;
    })
    .sort(
      (a, b) =>
        Number(a.measurementData.timeStamp) -
        Number(b.measurementData.timeStamp),
    );

  // mäppi kaikista päivämääristä
  const dayList = new Map<String, { timeStamp: string }>();
  measurementsData.forEach((measurement) => {
    const { timeStamp } = measurement.measurementData;
    dayList.set(convertUnixTimestamp(timeStamp), {
      timeStamp: convertUnixTimestamp(timeStamp),
    });
  });

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
      title: {
        display: true,
        text: `Anturin ${selectedSensor?.sensorName} mittausdata`,
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
    <div className="">
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
            setSelectedSensor(sensorList.get(e.target.value));
          }}
          name="selectSensor"
          className="p-2 border border-zinc-200 w-full rounded-lg bg-zinc-50 shadow-xs cursor-pointer outline-none focus:border-amber-500 hover:border-amber-500 "
        >
          {sensorList &&
            [...sensorList.values()].map((sensor) => (
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
          {dayList &&
            [...dayList.values()].map((day, index) => (
              <option key={index} value={day.timeStamp}>
                {day.timeStamp}
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
