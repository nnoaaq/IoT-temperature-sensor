import { Form } from "./components/Form";
import { FormTest } from "./components/FormTest";
import { getMeasurements } from "./lib/Api";
import { MeasurementType } from "./types/measurement";

export default async function Home() {
  const measurements: MeasurementType[] = await getMeasurements(); // aina vähintään tyhjä taulukko
  return (
    <div className="flex flex-col  w-full ">
      {/*}
      <div className="border border-zinc-200 md:m-2 rounded-xl shadow-sm p-2">
        <Form measurementsData={measurements} />
      </div>
      {*/}
      <div className="border border-zinc-200 md:m-2 rounded-xl shadow-sm p-2">
        <FormTest measurements={measurements} />
      </div>
    </div>
  );
}
