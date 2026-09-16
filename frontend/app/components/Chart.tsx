"use client";

import { Line } from "react-chartjs-2";
import { MeasurementType } from "../types/measurement";
import { SensorType } from "../types/sensor";
import { use, useMemo, useState } from "react";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";

export const LineChart = ({
  measurements,
}: {
  measurements: MeasurementType[];
}) => {
  // USEMEMO = LAJITELLAAN VAIN KERRAN SIVULLE TULLESSA
  const { sensors, measurementsGroupedBySensor } = useMemo(() => {
    // SENSORIT (JOKAINEN LÖYTYNYT VAIN KERRAN)
    // sensorId => {sensorId, sensorName}
    const sensorsMap = new Map<string, SensorType>();

    // MITTAUSTULOKSET RYHMITELTYNÄ SENSOREITTAIN
    // sensorId => [{measurementId, measurementData:{........}}]
    const measurementsGroupedBySensorMap = new Map<string, MeasurementType[]>();
    [...measurements]
      .sort(
        (a, b) =>
          Number(a.measurementData.timeStamp) -
          Number(b.measurementData.timeStamp),
      )
      .forEach((measurement) => {
        const { sensorId, sensorName } = measurement.measurementData;
        sensorsMap.set(sensorId, {
          sensorId: sensorId,
          sensorName: sensorName,
        });
        if (!measurementsGroupedBySensorMap.get(sensorId)) {
          measurementsGroupedBySensorMap.set(sensorId, []);
        }
        measurementsGroupedBySensorMap.get(sensorId)?.push(measurement);
      });
    return {
      sensors: sensorsMap,
      measurementsGroupedBySensor: measurementsGroupedBySensorMap,
    };
  }, [measurements]);

  // VALITUN SENSORIN KÄYTTÖ
  // DEFAULT = ENSIMMÄINEN LÖYTYNYT SENSORI ID
  const [selectedSensor, setSelectedSensor] = useState(
    sensors.keys().next().value,
  );

  // VALITUN SENSORIN MITTAUSTULOSTEN PÄIVÄMÄÄRÄT
  const sensorMeasuredDays = new Set<string>();
  for (let measurement of measurementsGroupedBySensor.get(
    selectedSensor as string,
  ) || []) {
    const { timeStamp } = measurement.measurementData;
    sensorMeasuredDays.add(convertUnixTimestamp(timeStamp));
  }

  // VALITUN PÄIVÄMÄÄRÄN KÄYTTÖ
  // DEFAULT = KAIKKI PÄIVÄT (ALL)
  const [selectedDay, setSelectedDay] = useState("all");

  // Y-AKSELIN RAJA-ARVOT
  const [chartY, setChartY] = useState({
    min: undefined,
    max: undefined,
  });

  // ASETUKSET
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    scales: {
      y: {
        min: chartY.min,
        max: chartY.max,
      },
      x: {
        ticks: {
          maxTicksLimit: 5,
          font: {
            size: 10,
          },
        },
      },
    },
  };

  // DATA
  const lineChartData = {
    labels: measurementsGroupedBySensor
      .get(selectedSensor as string)
      ?.filter((measurement) => {
        const { timeStamp } = measurement.measurementData;
        if (selectedDay == "all") return measurement;
        if (convertUnixTimestamp(timeStamp) != selectedDay) return;
        return measurement;
      })
      .map((measurement) =>
        convertUnixTimestampWithHoursAndMinutes(
          measurement.measurementData.timeStamp,
        ),
      ),
    datasets: [
      {
        label: "Lämpötila °C",
        data: measurementsGroupedBySensor
          .get(selectedSensor as string)
          ?.filter((measurement) => {
            const { timeStamp } = measurement.measurementData;
            if (selectedDay == "all") return measurement;
            if (convertUnixTimestamp(timeStamp) != selectedDay) return;
            return measurement;
          })
          .map((measurement) => measurement.measurementData.temperature),
        borderColor: "oklch(76.9% 0.188 70.08)",
        backgroundColor: "oklch(76.9% 0.188 70.08)",
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 25,
      },
    ],
  };

  return (
    <div>
      <div>
        <label
          htmlFor="selectSensor"
          className="block text-zinc-500 uppercase text-xs tracking-widest translate-x-5 translate-y-2 bg-zinc-50 w-fit"
        >
          Valitse näytettävä sensori
        </label>
        <select
          value={selectedSensor}
          onChange={(e) => {
            setSelectedDay("all");
            setSelectedSensor(e.target.value);
          }}
          name="selectSensor"
          className="p-2 w-full border border-zinc-300 rounded-xl shadow-xs"
        >
          {sensors &&
            [...sensors.values()].map((sensor) => (
              <option key={sensor.sensorId} value={sensor.sensorId}>
                {sensor.sensorName}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="selectDay"
          className="block text-zinc-500 uppercase text-xs tracking-widest translate-x-5 translate-y-2 bg-zinc-50 w-fit"
        >
          Valitse näytettävä päivä
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          name="selectDay"
          className="p-2 w-full border border-zinc-300 rounded-xl shadow-xs"
        >
          <option value="all">Kaikki päivät</option>
          {sensorMeasuredDays &&
            [...sensorMeasuredDays.values()].map((day, index) => (
              <option key={index} value={day}>
                {day}
              </option>
            ))}
        </select>
      </div>
      <div className=" h-100 w-full">
        <Line options={lineChartOptions} data={lineChartData} />
      </div>
    </div>
  );
};
