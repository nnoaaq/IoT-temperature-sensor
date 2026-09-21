"use client";

import { useEffect, useMemo, useState } from "react";
import { Measurement } from "../types/measurement";
import { Sensor } from "../types/sensor";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";
import {
  getMeasurements,
  getMeasurementsFromDay,
  getSensorTemperatureLimits,
  saveTemperatureLimits,
} from "../lib/Api";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Modal } from "./Modal";
import { LimitType } from "../types/limit";
import annotationPlugin from "chartjs-plugin-annotation";
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  annotationPlugin,
);
export const Chart2 = ({
  sensorsData,
  data,
}: {
  sensorsData: Sensor[];
  data: {
    sensorId: string;
    measurements: Measurement[];
  };
}) => {
  // MAP SENSOREILLE
  const sensors = useMemo(() => {
    const map = new Map<
      string,
      {
        sensorId: string;
        sensorName: string;
        measuredDays: string[];
      }
    >();
    sensorsData?.forEach((sensor) => {
      map.set(sensor.sensorId, {
        sensorId: sensor.sensorId,
        sensorName: sensor.sensorName,
        measuredDays: sensor.measurementDates,
      });
    });
    return map;
  }, []);

  // USE STATE CACHETETYILLE MITTAUSTULOKSILLE _____ DEFAULTTINA LISÄTÄÄN ENSIMMÄINEN DATA (SENSORS-TAULUN ENSIMMÄINEN LÖYTYNYT SENSORID)
  const [measurementsCache, setMeasurementsCache] = useState<
    Map<
      string,
      {
        temperatureLimits: LimitType;
        measurements: Measurement[];
        measuredDays: Set<string>;
      }
    >
  >(() => {
    const map = new Map();
    if (data.measurements.length === 0) return map; // EI TULLUTKAAN DATAA - TYHJÄ MAP
    const set = new Set();
    data.measurements.forEach((measurement) => {
      set.add(convertUnixTimestamp(measurement.timeStamp));
    });
    map.set(data.sensorId, {
      measurements: data.measurements,
      measuredDays: set,
    });
    return map;
  });

  // USE STATE VALITULLE SENSORILLE _____ DEFAULT ENSIMMÄINEN LÖYTYNYT SENSORI CACHESTA
  const [selectedSensor, setSelectedSensor] = useState<string>(
    measurementsCache.entries().next().value?.[0] || "",
  );

  // USE STATE VALITULLE PÄIVÄLLE _____ DEFAULT "ALL" - KAIKKI PÄIVÄT
  const [selectedDay, setSelectedDay] = useState<string>("all");

  // USE STATE MODAALIN NÄKYVYYDELLE
  const [showModal, setShowModal] = useState(false);

  const filteredMeasurements = measurementsCache
    .get(selectedSensor)
    ?.measurements.filter((measurement) => {
      // SUODATETAAN YKSITTÄINEN HAKUTULOS
      if (selectedDay == "all") return measurement; // PÄIVÄLLÄ EI OLE VÄLIÄ
      if (selectedDay == convertUnixTimestamp(measurement.timeStamp))
        return measurement; // PÄIVÄ ON OIKEA
    })
    .sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));
  const temperatureLimits =
    measurementsCache.get(selectedSensor)?.temperatureLimits;

  // USE STATE RAJA-ARVOJEN PIIRTÄMISELLE
  const [showLimitLines, setShowLimitLines] = useState(false);

  // __________TARVITTAVAT MUUTTUJAT ESITELTY____________

  // TARKISTETAAN CACHE, KUN VALITTU SENSORI VAIHTUU (VIIMEISET 7 PÄIVÄÄ HAKEE)
  useEffect(() => {
    setShowLimitLines(false);
    const fetch = async () => {
      if (!selectedDay || !selectedSensor) return; // EI OLE MILLÄ HAKEA
      if (measurementsCache.get(selectedSensor)?.temperatureLimits) return; // RAJA-ARVOT ON JO TALLENNETTU
      if (
        measurementsCache.get(selectedSensor)?.measurements &&
        measurementsCache.get(selectedSensor)?.temperatureLimits
      )
        return; // TIEDOT ON JO TALLENNETTU CACHEEN
      const fetchedLimits = await getSensorTemperatureLimits(selectedSensor);
      if (fetchedLimits?.maxTemperature) setShowLimitLines(true);
      const fetchedMeasurements: {
        sensorId: string;
        measurements: Measurement[];
      } = await getMeasurements(selectedSensor);
      if (
        !fetchedMeasurements ||
        !fetchedMeasurements.measurements ||
        !fetchedMeasurements.sensorId
      )
        return;
      setMeasurementsCache((previouslyCachedMeasurements) => {
        const map = new Map(previouslyCachedMeasurements);
        const set = new Set<string>();
        fetchedMeasurements.measurements.forEach((measurement) => {
          set.add(convertUnixTimestamp(measurement.timeStamp));
        });
        map.set(fetchedMeasurements.sensorId, {
          measurements: fetchedMeasurements.measurements,
          measuredDays: set,
          temperatureLimits: fetchedLimits || {},
        });
        return map;
      });
    };
    fetch();
  }, [selectedSensor]);
  // TARKISTETAAN CACHE, KUN VALITTU PÄIVÄ VAIHTUU (HAKEE TIETYN PÄIVÄN)
  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay || !selectedSensor || selectedDay == "all") return;
      const alreadyInCache = measurementsCache
        .get(selectedSensor)
        ?.measuredDays.has(selectedDay);
      if (alreadyInCache) return; // LÖYTYI CACHESTA
      const [day, month, year] = selectedDay.split(".");
      const startTime = Math.floor(
        new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          0,
          0,
          0,
        ).getTime() / 1000,
      );
      const endTime = startTime + 24 * 60 * 60;
      const fetchedMeasurements = await getMeasurementsFromDay(
        selectedSensor,
        startTime,
        endTime,
      );
      if (
        !fetchedMeasurements ||
        !fetchedMeasurements.measurements ||
        !fetchedMeasurements.sensorId
      )
        return;
      setMeasurementsCache((previouslyCachedMeasurements) => {
        const map = new Map(previouslyCachedMeasurements);
        const alreadyInCache = map.get(selectedSensor);
        if (alreadyInCache) {
          map.set(selectedSensor, {
            measurements: [
              ...alreadyInCache.measurements,
              ...fetchedMeasurements.measurements,
            ],
            measuredDays: new Set([
              ...alreadyInCache.measuredDays,
              selectedDay,
            ]),
            temperatureLimits: alreadyInCache.temperatureLimits,
          });
        }
        return map;
      });
    };
    fetch();
  }, [selectedDay]);

  // SENSORIN VAIHTUESSA NÄYTETÄÄN KAIKKI PÄIVÄT JA SULJETAAN ASETUKSET-MODAALi
  useEffect(() => {
    setShowModal(false);
    setSelectedDay("all");
  }, [selectedSensor]);

  // ___________________ KAAVION ASETUKSET JA DATA ____________________
  // USE STATE Y-RAJA-ARVOILLE
  const [chartY, setChartY] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({
    min: undefined,
    max: undefined,
  });
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
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
  const temperatureChartOptions = {
    ...chartOptions,
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
    plugins: {
      annotation: {
        annotations:
          showLimitLines &&
          measurementsCache.get(selectedSensor)?.temperatureLimits
            ?.maxTemperature
            ? {
                min: {
                  type: "line" as const,
                  yMin:
                    measurementsCache.get(selectedSensor)?.temperatureLimits
                      ?.minTemperature || undefined,
                  yMax:
                    measurementsCache.get(selectedSensor)?.temperatureLimits
                      ?.minTemperature || undefined,
                  borderWidth: 1,
                  borderColor: "oklch(35.9% 0.144 278.697)",
                },
                max: {
                  type: "line" as const,
                  yMin:
                    measurementsCache.get(selectedSensor)?.temperatureLimits
                      ?.maxTemperature || undefined,
                  yMax:
                    measurementsCache.get(selectedSensor)?.temperatureLimits
                      ?.maxTemperature || undefined,
                  borderWidth: 1,
                  borderColor: "oklch(71.2% 0.194 13.428)",
                },
              }
            : {},
      },
    },
  };
  const chartData = (field: "temperature" | "humidity") => {
    return {
      labels: filteredMeasurements?.map((measurement) => {
        return convertUnixTimestampWithHoursAndMinutes(measurement.timeStamp);
      }),
      datasets: [
        {
          backgroundColor:
            field == "temperature"
              ? "oklch(76.9% 0.188 70.08)"
              : "oklch(48.8% 0.243 264.376)",
          borderColor:
            field == "temperature"
              ? "oklch(76.9% 0.188 70.08)"
              : "oklch(48.8% 0.243 264.376)",
          label: field == "temperature" ? "Lämpötila °C" : "Kosteus %",
          data: filteredMeasurements?.map((measurement) => {
            return measurement[field];
          }),
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 25,
        },
      ],
    };
  };

  return (
    <div className="relative">
      {showModal && (
        <Modal
          limitLinesStatus={showLimitLines}
          showLimitLines={(value: boolean) => setShowLimitLines(value)}
          editTemperatureLimits={async (limits: LimitType) => {
            await saveTemperatureLimits(selectedSensor, {
              maxTemperature: limits.maxTemperature as string,
              minTemperature: limits.minTemperature as string,
            });
            setMeasurementsCache((previouslyCachedMeasurements) => {
              const map = new Map(previouslyCachedMeasurements);
              const alreadyInCache = map.get(selectedSensor);
              if (alreadyInCache) {
                map.set(selectedSensor, {
                  ...alreadyInCache,
                  temperatureLimits: limits,
                });
              }
              return map;
            });
          }}
          temperatureLimits={temperatureLimits || {}}
          onClose={() => setShowModal(false)}
          chartY={chartY}
          changeChartY={(field: "min" | "max", value: string) => {
            setChartY((previousValues) => ({
              ...previousValues,
              [field]: !value ? undefined : Number(value),
            }));
          }}
        />
      )}
      <div className="flex justify-between">
        <h1 className="text-amber-500 text-lg">Mittaustulokset</h1>
        <button
          onClick={() => setShowModal(true)}
          className="cursor-pointer transition-colors hover:text-amber-500"
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
      <div className="flex flex-col">
        <label
          htmlFor="selectSensor"
          className="text-zinc-500 text-xs uppercase tracking-wide translate-y-2 translate-x-2 bg-white w-fit"
        >
          Valitse sensori
        </label>
        <select
          value={selectedSensor}
          onChange={(e) => setSelectedSensor(e.target.value)}
          name="selectSensor"
          className="p-2 border border-zinc-200 rounded-md cursor-pointer hover:border-amber-500 focus:border-amber-500 outline-none"
        >
          {sensors &&
            [...sensors.values()].map((sensor) => (
              <option key={sensor.sensorId} value={sensor.sensorId}>
                {sensor.sensorName} - {sensor.sensorId}
              </option>
            ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label
          htmlFor="selectDay"
          className="text-zinc-500 text-xs uppercase tracking-wide translate-y-2 translate-x-2 bg-white w-fit"
        >
          Valitse päivä
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          name="selectSensor"
          className="p-2 border border-zinc-200 rounded-md cursor-pointer hover:border-amber-500 focus:border-amber-500 outline-none"
        >
          <option value="all">Kaikki päivät</option>
          {sensors &&
            sensors.get(selectedSensor)?.measuredDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
        </select>
      </div>
      <div className="h-100 w-full">
        <Line
          options={temperatureChartOptions}
          data={chartData("temperature")}
        ></Line>
      </div>
      <div className="h-100 w-full">
        <Line options={chartOptions} data={chartData("humidity")}></Line>
      </div>
    </div>
  );
};
