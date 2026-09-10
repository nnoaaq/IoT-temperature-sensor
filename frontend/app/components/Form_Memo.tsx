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
  const measurementsBySensorId = useMemo(() => {
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
  // setti uniikkeja päiviä kohden
  // päivittyy aina kun vaihdetaan sensoria
  const days = new Set<string>();
  measurementsBySensorId[selectedSensor].forEach((measurement) => {
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
    .filter((measurement) => {
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
          .filter((measurement) => {
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
          .filter((measurement) => {
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
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h1 className="text-amber-500 text-lg uppercase tracking-wide">
          Mittaustiedot
        </h1>
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
      <div>
        <p className="text-zinc-500 uppercase tracking-widest text-sm mb-2">
          Vaihda raja-arvot hälytykselle
        </p>
        <div className="flex gap-2 justify-center sm:justify-normal">
          <div>
            <div className="relative flex items-center">
              <input
                onFocus={(e) => e.target.select()}
                type="number"
                className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 w-30 text-center shadow-xs cursor-pointer  hover:border-amber-500 outline-amber-500 "
                placeholder="Min"
              />
              <span className="absolute right-7">°C</span>
            </div>
            <p className="text-zinc-400 text-xs uppercase tracking-widest text-sm text-center">
              Alin
            </p>
          </div>
          <div>
            <div className="relative flex items-center">
              <input
                onFocus={(e) => e.target.select()}
                type="number"
                className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 w-30 text-center shadow-xs cursor-pointer  hover:border-amber-500 outline-amber-500"
                placeholder="Max"
              />
              <span className="absolute right-7">°C</span>
            </div>
            <p className="text-zinc-400 text-xs uppercase tracking-widest text-sm text-center">
              Ylin
            </p>
          </div>
        </div>
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
