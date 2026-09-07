import { Form } from "./components/Form";
import { getMeasurements } from "./lib/Api";
import { MeasurementType } from "./types/measurement";

export default async function Home() {
  const measurements: MeasurementType[] = await getMeasurements(); // aina vähintään tyhjä taulukko
  return (
    <div className="flex flex-col mx-auto max-w-md w-full border border-zinc-200 rounded p-2">
      <Form measurementsData={measurements} />
    </div>
  );
}
