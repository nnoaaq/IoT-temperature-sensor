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

export const FormTest = ({
  measurements,
}: {
  measurements: MeasurementType[];
}) => {
  console.log("vastaanotettu : ", measurements);

  // funktio joka suodattaa mittaustulokset
  const filterMeasurements = (sensorId: string) => {
    console.log("halutaan !", sensorId);
    const filteredMeasurements = measurements
      .filter((measurement) => {
        const filteredBySensors =
          measurement.measurementData.sensorId == sensorId;
        return filteredBySensors;
      })
      .sort(
        (a, b) =>
          Number(a.measurementData.timeStamp) -
          Number(b.measurementData.timeStamp),
      );
    console.log("filtteröidyt:", filteredMeasurements);
    return filteredMeasurements;
  };

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
  console.log("sensors:", sensors);

  // setti päivämääristä

  // useStatet
  // näytettävän sensorin tiedot - default = ensimmäinen löytynyt sensori
  const [showSensor, setShowSensor] = useState<SensorType>(
    sensors.values().next().value || { sensorId: "", sensorName: "" },
  );

  // suodatettujen mittausten tiedot
  const [filteredMeasurements, setFilteredMeasurements] = useState<
    MeasurementType[]
  >(filterMeasurements(showSensor.sensorId));

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
      console.log("measurements!!", measurement);
      console.log(convertUnixTimestampWithHoursAndMinutes(timeStamp));
      chartLabels.add(convertUnixTimestampWithHoursAndMinutes(timeStamp));
    });
  console.log("chartLabels:", chartLabels);
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
        text: `Sensorin ${showSensor?.sensorName} tiedot`,
      },
    },
  };

  return (
    <div>
      <h1 className="text-amber-500 text-xl">Mittaustulokset</h1>
      <div className="border border-zinc-100 shadow-xs p-2 rounded-xl">
        <p className="text-zinc-500 uppercase tracking-widest text-xs">
          Valitse sensori
        </p>
        <select
          onChange={(e) => {
            setShowSensor(sensors.get(e.target.value) as SensorType);
            setFilteredMeasurements(filterMeasurements(e.target.value));
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
      <Line options={options} data={data} />
    </div>
  );
};
