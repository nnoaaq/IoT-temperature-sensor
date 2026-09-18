"use client";

import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Chart } from "chart.js";
import { MeasurementType } from "../types/measurement";
import { SensorType } from "../types/sensor";
import { useEffect, useMemo, useState } from "react";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";
import { Modal } from "./SettingModal";
import { getTemperatureLimits } from "../lib/Api";
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip,
);
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
  const [chartY, setChartY] = useState<{
    min: undefined | string;
    max: undefined | string;
  }>({
    min: undefined,
    max: undefined,
  });
  // ASETUKSET - MODAALIN NÄKYVYYS
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // KAAVION ASETUKSET
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
  const lineChartData = (field: "temperature" | "humidity") => {
    const borderColor =
      field === "temperature"
        ? "oklch(76.9% 0.188 70.08)"
        : "oklch(48.8% 0.243 264.376)";
    const backgroundColor =
      field === "temperature"
        ? "oklch(76.9% 0.188 70.08)"
        : "oklch(48.8% 0.243 264.376)";
    const label = field === "temperature" ? "Lämpötila °C" : "Kosteus %";
    return {
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
          label: label,
          data: measurementsGroupedBySensor
            .get(selectedSensor as string)
            ?.filter((measurement) => {
              const { timeStamp } = measurement.measurementData;
              if (selectedDay == "all") return measurement;
              if (convertUnixTimestamp(timeStamp) != selectedDay) return;
              return measurement;
            })
            .map((measurement) => measurement.measurementData[field]),
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          tension: 0.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 25,
        },
      ],
    };
  };

  // LÄMPÖTILAN RAJA-ARVOT
  const [temperatureLimits, setTemperatureLimits] = useState({
    minTemperature: "",
    maxTemperature: "",
  });

  // PÄIVITETÄÄN RAJA-ARVOT UUSIKSI KUN VALITTU SENSORI MUUTTUU
  useEffect(() => {
    const fetchLimits = async () => {
      if (!selectedSensor) return;
      const response = await getTemperatureLimits(selectedSensor);
      if (!response.success) return;
      setTemperatureLimits(response.limits);
    };
    fetchLimits();
  }, [selectedSensor]);
  return (
    <div className="relative">
      <div className="">
        {isSettingsOpen && (
          <Modal
            temperatureLimits={temperatureLimits}
            updateYLimits={(field: string, value: string) => {
              if (value.length === 0) {
                return setChartY((prevLimits) => ({
                  ...prevLimits,
                  [field]: undefined,
                }));
              }
              setChartY((prevLimits) => ({
                ...prevLimits,
                [field]: Number(value),
              }));
            }}
            chartY={chartY}
            selectedSensor={selectedSensor as string}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
      <div className="flex justify-between">
        <h1 className="text-amber-500 text-lg uppercase">Mittaustiedot</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="cursor-pointer hover:text-amber-500 transition-color focus:text-amber-500 outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
          </svg>
        </button>
      </div>
      <div>
        <label
          htmlFor="selectSensor"
          className="block text-zinc-500 uppercase text-xs tracking-widest translate-x-1 translate-y-2 bg-zinc-50 w-fit"
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
          className="p-2 w-full border border-zinc-300 rounded-md rounded-tl-none shadow-xs hover:border-amber-500 focus:border-amber-500 outline-none"
        >
          {sensors &&
            [...sensors.values()].map((sensor) => (
              <option key={sensor.sensorId} value={sensor.sensorId}>
                {sensor.sensorName} - ({sensor.sensorId})
              </option>
            ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="selectDay"
          className="block text-zinc-500 uppercase text-xs tracking-widest translate-x-1 translate-y-2 bg-zinc-50 w-fit"
        >
          Valitse näytettävä päivä
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          name="selectDay"
          className="p-2 w-full border border-zinc-300 rounded-md rounded-tl-none shadow-xs hover:border-amber-500 focus:border-amber-500 outline-none"
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
        <Line options={lineChartOptions} data={lineChartData("temperature")} />
      </div>
      <div className=" h-100 w-full">
        <Line options={lineChartOptions} data={lineChartData("humidity")} />
      </div>
    </div>
  );
};
