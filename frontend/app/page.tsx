import { LineChart } from "./components/Chart";
import { getMeasurements, getSensors } from "./lib/Api";
import { MeasurementType } from "./types/measurement";
import { SensorType } from "./types/sensor";

export default async function Home() {
  const measurements: MeasurementType[] = await getMeasurements(null); // aina vähintään tyhjä taulukko
  const sensors: SensorType[] = await getSensors();
  return (
    <div className="flex flex-col  w-full ">
      <div className="border border-zinc-200 m-2 rounded-xl shadow-sm p-2">
        <LineChart measurementsData={measurements} sensors={sensors} />
      </div>
    </div>
  );
}
