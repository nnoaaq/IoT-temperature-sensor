import { Chart2 } from "./components/Chart";
import { getMeasurements, getMeasurementsFromDay, getSensors } from "./lib/Api";
import { Measurement } from "./types/measurement";
import { Sensor } from "./types/sensor";

export default async function Home() {
  const measurements: {
    sensorId: string;
    measurements: Measurement[];
  } = await getMeasurements("ssa"); // ENSIMMÄINEN HAKU
  const sensors: Sensor[] = await getSensors();
  return (
    <div className="flex flex-col  w-full ">
      <div className="border border-zinc-200 m-2 rounded-xl shadow-sm p-2">
        <Chart2 sensorsData={sensors} data={measurements || {}} />
      </div>
    </div>
  );
}
