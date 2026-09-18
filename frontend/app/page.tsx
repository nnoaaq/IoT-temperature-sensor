import { LineChart } from "./components/Chart";
import { getMeasurements } from "./lib/Api";
import { MeasurementType } from "./types/measurement";

export default async function Home() {
  const measurements: MeasurementType[] =
    await getMeasurements("10:00:3B:BC:76:1C"); // aina vähintään tyhjä taulukko
  return (
    <div className="flex flex-col  w-full ">
      <div className="border border-zinc-200 m-2 rounded-xl shadow-sm p-2">
        <LineChart measurements={measurements} />
      </div>
    </div>
  );
}
