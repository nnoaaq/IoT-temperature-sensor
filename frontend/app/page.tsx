import { Form } from "./components/Form";
import { getMeasurements } from "./lib/Api";
import { MeasurementType } from "./types/measurement";

export default async function Home() {
  const measurements: MeasurementType[] = await getMeasurements(); // aina vähintään tyhjä taulukko
  return (
    <div className="flex flex-col border w-full border-zinc-200 rounded-xl shadow-xs p-2 md:m-2">
      <Form measurementsData={measurements} />
    </div>
  );
}
