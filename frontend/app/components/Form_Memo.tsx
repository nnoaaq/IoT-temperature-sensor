"use client";
import { useEffect, useMemo, useState } from "react";
import { MeasurementType } from "../types/measurement";
import { SensorType } from "../types/sensor";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  elements,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Chart } from "chart.js";
import {
  convertUnixTimestamp,
  convertUnixTimestampWithHoursAndMinutes,
} from "../utils/time";
import { getTemperatureLimits, updateTemperatureLimits } from "../lib/Api";
import { TemperatureLimits } from "./TemperatureLimits";
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip,
);

export const Form = ({ measurements }: { measurements: MeasurementType[] }) => {
  if (measurements.length === 0) {
    return (
      <div>
        <p>Mittaustuloksia ei löytynyt</p>
      </div>
    );
  }
  // jokainen sensori (ei duplikaatteja)
  const sensors = useMemo(() => {
    // poimitaan uniikit sensorit sensorId perusteella mappiin
    // sensorId : {sensorId:string, sensorName:string}
    const sensorMap = new Map<string, SensorType>();
    measurements.forEach((measurement) => {
      const { sensorId, sensorName } = measurement.measurementData;
      sensorMap.set(sensorId, {
        sensorId: sensorId,
        sensorName: sensorName,
      });
    });
    return sensorMap;
  }, [measurements]);

  // luokitellaan data sensorin perusteella
  // käytetään useMemo niin ei tule turhia laskuja, vain kerran
  const measurementsBySensorId: Record<string, MeasurementType[]> =
    useMemo(() => {
      if (measurements.length === 0) return {};
      const result = [...measurements]
        .sort(
          (a, b) =>
            Number(a.measurementData.timeStamp) -
            Number(b.measurementData.timeStamp),
        )
        .reduce<Record<string, MeasurementType[]>>(
          (accumulator, currentMeasurement) => {
            const { sensorId } = currentMeasurement.measurementData;
            if (!accumulator[sensorId]) accumulator[sensorId] = []; // tyhjä taulukko
            accumulator[sensorId].push(currentMeasurement);
            return accumulator; // palautetaan seuraavaa kierrosta varten
          },
          {}, // ensimmäisen kierroksen arvo
        );
      return result;
    }, [measurements]);
  // useState valittua sensoria varten
  // sensorId, DEFAULT = ensimmäinen löytynyt sensori
  const [selectedSensor, setSelectedSensor] = useState(
    sensors.values().next().value?.sensorId || "",
  );

  // useState raja-arvoa varten
  const [temperatureLimits, setTemperatureLimits] = useState({
    sensorId: "",
    temperatureLimitMax: "0",
    temperatureLimitMin: "0",
  });
  // haetaan raja-arvo valitulle sensorille
  useEffect(() => {
    const fetchLimits = async () => {
      const response = (await getTemperatureLimits(selectedSensor)) as {
        statusCode: number;
        limits?: {
          sensorId: string;
          temperatureLimitMax: string;
          temperatureLimitMin: string;
        };
      };
      if (response.statusCode != 200) return {};
      if (response.limits) setTemperatureLimits(response.limits);
      return response.limits;
    };
    fetchLimits();
  }, [selectedSensor]);
  const callUpdateTemperatureLimits = (newLimits: {
    temperatureLimitMax: string;
    temperatureLimitMin: string;
  }) => {
    // painettu ala-komponentissa
    updateTemperatureLimits(selectedSensor, newLimits);
    // suljetaan modaali
    setShowSettings(!showSettings);
  };
  // setti uniikkeja päiviä kohden
  // päivittyy aina kun vaihdetaan sensoria
  const days = new Set<string>();
  measurementsBySensorId[selectedSensor]?.forEach((measurement) => {
    days.add(convertUnixTimestamp(measurement.measurementData.timeStamp));
  });
  // useState valittua päivää varten
  // dd/mm/yyyy, DEFAULT = kaikki päivät
  const [selectedDay, setSelectedDay] = useState("all");
  useEffect(() => {
    setSelectedDay("all");
  }, [selectedSensor]);
  // data kaaviota varten
  const chartLabels = measurementsBySensorId[selectedSensor]
    ?.filter((measurement) => {
      const { timeStamp } = measurement.measurementData;
      const filterByDate =
        selectedDay == "all"
          ? true
          : convertUnixTimestamp(timeStamp) == selectedDay;
      return filterByDate;
    })
    .map((measurement) =>
      convertUnixTimestampWithHoursAndMinutes(
        measurement.measurementData.timeStamp,
      ),
    );
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: "Lämpötila °C",
        data: measurementsBySensorId[selectedSensor]
          ?.filter((measurement) => {
            const { timeStamp } = measurement.measurementData;
            const filterByDate =
              selectedDay == "all"
                ? true
                : convertUnixTimestamp(timeStamp) == selectedDay;
            return filterByDate;
          })
          .map((measurement) => measurement.measurementData.temperature),
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b",
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 25,
      },
    ],
  };
  const dataHumidity = {
    labels: chartLabels,
    datasets: [
      {
        label: "Kosteus %",
        data: measurementsBySensorId[selectedSensor]
          ?.filter((measurement) => {
            const { timeStamp } = measurement.measurementData;
            const filterByDate =
              selectedDay == "all"
                ? true
                : convertUnixTimestamp(timeStamp) == selectedDay;
            return filterByDate;
          })
          .map((measurement) => measurement.measurementData.humidity),
        borderColor: "#2a59f1",
        backgroundColor: "#2a59f1",
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 25,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    scales: {
      x: {
        ticks: {
          // maxTicksLimit: 10,
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {},
    },
    plugins: {
      title: {
        display: true,
        text: `Sensorin ${sensors.get(selectedSensor)?.sensorName} mittaustulokset`,
      },
      legend: {
        display: true,
        labels: {
          color: "rgb(0, 0, 0)",
        },
      },
    },
  };
  const [showSettings, setShowSettings] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {showSettings && (
        <TemperatureLimits
          closeModal={() => setShowSettings(!showSettings)}
          callUpdateTemperatureLimits={callUpdateTemperatureLimits}
          limits={temperatureLimits}
        />
      )}
      <div className="flex justify-between">
        <h1 className="text-amber-500 text-lg uppercase tracking-wide">
          Mittaustiedot
        </h1>
        <span
          className="cursor-pointer hover:text-emerald-600"
          onClick={(e) => setShowSettings(!showSettings)}
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
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </span>
      </div>
      <div>
        <p className="text-zinc-500 uppercase tracking-widest text-sm">
          Valitse näytettävä sensori
        </p>
        <select
          onChange={(e) => setSelectedSensor(e.target.value)}
          value={selectedSensor}
          name="selectSensor"
          className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 w-full shadow-xs cursor-pointer  hover:border-amber-500 outline-amber-500"
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
        <p className="text-zinc-500 uppercase tracking-widest text-sm">
          Valitse näytettävä päivä
        </p>
        <select
          onChange={(e) => setSelectedDay(e.target.value)}
          value={selectedDay}
          name="selectSensor"
          className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 w-full shadow-xs cursor-pointer  hover:border-amber-500 outline-amber-500"
        >
          <option value="all">Kaikki päivät</option>
          {days &&
            [...days].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
        </select>
      </div>

      <div className="w-full h-75">
        <Line options={chartOptions} data={data} />
      </div>
      <div className="w-full  h-75">
        <Line options={chartOptions} data={dataHumidity} />
      </div>
    </div>
  );
};
