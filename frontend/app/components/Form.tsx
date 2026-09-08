"use client";
import { MeasurementType } from "../types/measurement";
import { SensorType } from "../types/sensor";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const Form = ({ measurements }: { measurements: MeasurementType[] }) => {
  // mäppi sensoreista
  // sensorId : {sensorId:string, sensorName:string}
  const sensors = new Map<String, SensorType>();
  measurements.forEach((measurement) => {
    // yksittäinen mittaustulos
    const { sensorId, sensorName } = measurement.measurementData;
    sensors.set(sensorId, {
      sensorId: sensorId,
      sensorName: sensorName,
    });
  });

  // setti päivämääristä
  const days = new Set<string>();
  [...measurements]
    .sort(
      (a, b) =>
        Number(a.measurementData.timeStamp) -
        Number(b.measurementData.timeStamp),
    )
    .forEach((measurement) => {
      // yksittäinen mittaustulos
      const { timeStamp } = measurement.measurementData;
      days.add(convertUnixTimestamp(timeStamp));
    });

  // valitun sensorin useState - DEFAULT = ensimmäinen sensori mapista
  const [selectedSensor, setSelecterSensor] = useState<SensorType>(
    sensors.values().next().value || { sensorId: "", sensorName: "" },
  );

  // valitun päivän useState - DEFAULT = kaikki päivät
  const [selectedDay, setSelectedDay] = useState("all");

  // suodatettu taulukko mittaustuloksista
  const filteredMeasurements = measurements.filter((measurement) => {
    const filterBySensor =
      measurement.measurementData.sensorId == selectedSensor.sensorId;
    const filterByDay =
      selectedDay == "all"
        ? true
        : convertUnixTimestamp(measurement.measurementData.timeStamp) ==
          selectedDay;
    return filterBySensor && filterByDay;
  });

  // poistettu duplikaatiot
  const uniqueDays = new Set<string>();
  [...measurements]
    .filter(
      (measurement) =>
        measurement.measurementData.sensorId == selectedSensor.sensorId,
    )
    .sort(
      (a, b) =>
        Number(a.measurementData.timeStamp) -
        Number(b.measurementData.timeStamp),
    )
    .forEach((measurement) => {
      uniqueDays.add(
        convertUnixTimestamp(measurement.measurementData.timeStamp),
      );
    });

  // kaavion labelit = ["dd/mm/yy","dd/mm/yy"]
  const chartLabels = new Set<String>();
  filteredMeasurements
    .sort(
      (a, b) =>
        Number(a.measurementData.timeStamp) -
        Number(b.measurementData.timeStamp),
    )
    .forEach((measurement) => {
      const { timeStamp } = measurement.measurementData;
      chartLabels.add(convertUnixTimestampWithHoursAndMinutes(timeStamp));
    });

  // muotoillaan data Line - kaaviota varten
  const data = {
    labels: [...chartLabels],
    datasets: [
      {
        label: "Lämpötila °C",
        data: filteredMeasurements.map(
          (measurement) => measurement.measurementData.temperature,
        ),
        borderColor: "#8B5CF6",
        backgroundColor: "#8B5CF6",
      },
      {
        label: "Kosteus %",
        data: filteredMeasurements.map(
          (measurement) => measurement.measurementData.humidity,
        ),
        borderColor: "#5e85da",
        backgroundColor: "#5e85da",
      },
    ],
  };

  // line - kaavion asetukset
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Sensorin ${selectedSensor.sensorName} tiedot`,
      },
    },
  };

  return (
    <div>
      <h1 className="text-amber-500 text-xl">Mittaustulokset</h1>
      <div className="">
        <div className="p-2 w-full">
          <p className="text-zinc-500 uppercase tracking-widest text-xs">
            Valitse sensori
          </p>
          <select
            value={selectedSensor.sensorId}
            onChange={(e) => {
              setSelectedDay("all");
              setSelecterSensor(
                sensors.get(e.target.value) || { sensorId: "", sensorName: "" },
              );
            }}
            name="selectSensor"
            className="border border-zinc-200 p-2 rounded-xl w-full bg-zinc-50 cursor-pointer outline-none focus:border-amber-500 hover:border-amber-500"
          >
            {sensors &&
              [...sensors.values()].map((sensor) => (
                <option key={sensor.sensorId} value={sensor.sensorId}>
                  {sensor.sensorName}
                </option>
              ))}
          </select>
        </div>
        <div className="p-2 w-full">
          <p className="text-zinc-500 uppercase tracking-widest text-xs">
            Valitse päivä
          </p>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            name="selectDay"
            className="border border-zinc-200 p-2 rounded-xl w-full bg-zinc-50 cursor-pointer outline-none focus:border-amber-500 hover:border-amber-500"
          >
            <option value="all">Kaikki päivät</option>
            {uniqueDays && [
              ...uniqueDays.values().map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              )),
            ]}
          </select>
        </div>
      </div>
      <Line options={options} data={data} />
    </div>
  );
};
