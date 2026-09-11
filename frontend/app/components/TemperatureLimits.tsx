import { useState } from "react";

export const TemperatureLimits = ({
  callUpdateTemperatureLimits,
  limits,
  closeModal,
}: {
  callUpdateTemperatureLimits: (newLimits: {
    temperatureLimitMax: string;
    temperatureLimitMin: string;
  }) => void;
  limits: {
    temperatureLimitMin: string;
    temperatureLimitMax: string;
  };
  closeModal: () => void;
}) => {
  // useState raja-arvoa varten
  const [temperatureLimits, setTemperatureLimits] = useState({
    sensorId: "",
    temperatureLimitMax: "0",
    temperatureLimitMin: "0",
  });
  return (
    <div className="absolute inset-0 w-full flex justify-center  bg-zinc-900/80 ">
      <div className="bg-zinc-100 w-full max-w-md h-fit max-h-70 m-2 rounded-xl p-2  flex flex-col gap-5">
        <div className="flex justify-between">
          <p className="text-zinc-500 uppercase tracking-widest text-sm mb-2">
            Vaihda raja-arvot hälytykselle
          </p>
          <span
            className="cursor-pointer hover:text-rose-500 transition"
            onClick={() => closeModal()}
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
          </span>
        </div>
        <div className="flex flex-col gap-2 justify-center sm:justify-normal">
          <div className="flex gap-2">
            <div className="w-full">
              <div className="relative flex items-center">
                <input
                  onChange={(e) =>
                    setTemperatureLimits((prevLimits) => ({
                      ...prevLimits,
                      temperatureLimitMin: e.target.value,
                    }))
                  }
                  placeholder={limits.temperatureLimitMin}
                  min="-40"
                  max="80"
                  onFocus={(e) => e.target.select()}
                  type="number"
                  className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 w-full text-center shadow-xs cursor-pointer  hover:border-amber-500 outline-amber-500 "
                />
                <span className="absolute right-3">°C</span>
              </div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest text-sm text-center">
                Alin
              </p>
            </div>
            <div className="w-full">
              <div className="relative flex items-center">
                <input
                  onChange={(e) =>
                    setTemperatureLimits((prevLimits) => ({
                      ...prevLimits,
                      temperatureLimitMax: e.target.value,
                    }))
                  }
                  placeholder={limits.temperatureLimitMax}
                  min="-40"
                  max="80"
                  onFocus={(e) => e.target.select()}
                  type="number"
                  className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 w-full text-center shadow-xs cursor-pointer  hover:border-amber-500 outline-amber-500"
                />
                <span className="absolute right-3">°C</span>
              </div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest text-sm text-center">
                Ylin
              </p>
            </div>
          </div>
          <div>
            <button
              className="w-full border border-emerald-900 cursor-pointer rounded-xl p-2 bg-emerald-800 text-white hover:bg-emerald-950 transition"
              onClick={() => callUpdateTemperatureLimits(temperatureLimits)}
            >
              Tallenna
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
