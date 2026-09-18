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
import { Measurement } from "../types/measurement";
import { Sensor } from "../types/sensor";
import { useEffect, useMemo, useState } from "react";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";
import { Modal } from "./SettingModal";
import { getMeasurements, getTemperatureLimits } from "../lib/Api";
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
  sensors,
  data,
}: {
  data: { sensorId: string; measurements: Measurement[] };
  sensors: Sensor[];
}) => {
  if (!data.sensorId)
    return (
      <div>
        <p className="text-rose-500">Mittaustuloksia ei löytynyt</p>
      </div>
    );

  // MAPPI KAIKISTA SENSOREISTA
  const sensorsMap = useMemo(() => {
    const map = new Map<string, Sensor>();
    sensors.forEach((sensor) => {
      map.set(sensor.sensorId, {
        ...sensor,
      });
    });
    return map;
  }, [sensors]);

  // CACHED_MEASUREMENTS USESTATE >> EI TURHIA GET-PYYNTÖJÄ JOS HAETTU KERTAALLEEN MITTAUSTULOKSET
  // sensorId : {measurements:[{}{}], measurementDates: Set []}
  const [cachedMeasurements, setCachedMeasurements] = useState<
    Map<string, { measurements: Measurement[]; measurementDates: Set<string> }>
  >(() => {
    const map = new Map();
    if (data.sensorId) {
      // MITTAUSTULOKSIA TULLUT ENSIMMÄISELLÄ RENDERÖINNILLÄ
      // CACHETETAAN ENSIMMÄINEN SENSORI
      const foundDays = new Set<string>();
      data.measurements.forEach((measurement) => {
        // MUUNNETAAN UNIX-AIKALEIMA DD.MM.YYYY MUOTOON
        const measurementDate = convertUnixTimestamp(measurement.timeStamp);
        foundDays.add(measurementDate);
      });
      map.set(data.sensorId, {
        measurements: data.measurements,
        measurementDates: foundDays,
      });
    }
    return map;
  });
  // VALITUN SENSORIN USESTATE >> DEFAULT = ENSIMMÄINEN LÖYTYNYT SENSORI TIETOKANNASTA
  const [selectedSensor, setSelectedSensor] = useState(data.sensorId || "");

  // VALITTU SENSORI MUUTTUU >> HAETAAN UUDET TIEDOT
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!selectedSensor) return; // EI SENSORIDTÄ
      if (cachedMeasurements.has(selectedSensor)) return; // TIEDOT ON JO
      const newMeasurements: {
        sensorId: string;
        measurements: Measurement[];
      } = await getMeasurements(selectedSensor);
      setCachedMeasurements((prevMap) => {
        const newMap = new Map(prevMap);
        const foundDays = new Set<string>();
        newMeasurements.measurements.forEach((measurement) => {
          // MUUNNETAAN UNIX-AIKALEIMA DD.MM.YYYY MUOTOON
          const measurementDate = convertUnixTimestamp(measurement.timeStamp);
          foundDays.add(measurementDate);
        });
        newMap.set(newMeasurements.sensorId, {
          measurements: newMeasurements.measurements,
          measurementDates: foundDays,
        });
        return newMap;
      });
    };
    fetchMeasurements();
  }, [selectedSensor]);

  // VALITUN PÄIVÄN USESTATE >> DEFAULT = KAIKKI PÄIVÄT
  const [selectedDay, setSelectedDay] = useState("all");

  // MEASUREMENTS >> VALITUN SENSORIN KAIKKI MITTAUSTULOKSET
  const measurements = cachedMeasurements.get(selectedSensor);
  const filteredMeasurements =
    measurements?.measurements.filter((measurement) => {
      if (selectedDay == "all") return measurement; // PÄIVÄMÄÄRÄLLÄ EI MERKITYSTÄ
      if (convertUnixTimestamp(measurement.timeStamp) != selectedDay) return; // PÄIVÄMÄÄRÄ EI VASTAA VALITTUA
      return measurement;
    }) || [];
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
      labels: filteredMeasurements.map((measurement) => {
        // YKSITTÄINEN MITTAUSTULOS
        return convertUnixTimestampWithHoursAndMinutes(measurement.timeStamp);
      }),
      datasets: [
        {
          label: label,
          data: filteredMeasurements.map((measurement) => {
            // YKSITTÄINEN MITTAUSTULOS
            return measurement[field]; // JOKO TEMPERATURE TAI HUMIDITY - RIIPPUEN KAAVIOSTA
          }),
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
      if (!response.success)
        return setTemperatureLimits({
          minTemperature: "",
          maxTemperature: "",
        });
      setTemperatureLimits(response.limits);
    };
    fetchLimits();
  }, [selectedSensor]);
  return (
    <div className="relative">
      <div>
        {isSettingsOpen && (
          <Modal
            temperatureLimits={temperatureLimits}
            updateYLimits={(field: "min" | "max", value: string) => {
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
          className="cursor-pointer hover:text-amber-500 transition-colors focus:text-amber-500 outline-none"
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
          className="block text-zinc-500 uppercase text-xs tracking-widest translate-x-1 translate-y-2 bg-white w-fit"
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
          className="block text-zinc-500 uppercase text-xs tracking-widest translate-x-1 translate-y-2 bg-white w-fit"
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
          {sensorsMap &&
            sensorsMap
              .get(selectedSensor as string)
              ?.measurementDates.map((date) => (
                <option key={date} value={date}>
                  {date}
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
