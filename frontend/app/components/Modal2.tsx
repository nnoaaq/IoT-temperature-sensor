export const Modal2 = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="absolute right-0 z-50 bg-zinc-50 w-full max-w-md modal-open">
      <div className="flex justify-between border-b border-zinc-200 ">
        <h2 className="text-amber-500 uppercase">Asetukset</h2>
        <button
          onClick={() => onClose()}
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
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-5 mt-2">
        <div className="flex gap-2">
          <div className="flex flex-col">
            <label
              htmlFor="minTemperature"
              className="translate-x-2 translate-y-2 bg-white w-fit text-zinc-500 uppercase text-xs"
            >
              Min °C
            </label>
            <input
              type="number"
              name="minTemperature"
              className="p-2 border border-zinc-200 rounded-md rounded-tl-none hover:border-amber-500 focus:border-amber-500 outline-none w-full"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="maxTemperature"
              className="translate-x-2 translate-y-2 bg-white w-fit text-zinc-500 uppercase text-xs"
            >
              Max °C
            </label>
            <input
              type="number"
              name="maxTemperature"
              className="p-2 border border-zinc-200 rounded-md rounded-tl-none hover:border-amber-500 focus:border-amber-500 outline-none w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
