"use client";
import { useState } from "react";
import { LimitType } from "../types/limit";

export const Modal = ({
  onClose,
  chartY,
  changeChartY,
  temperatureLimits,
  editTemperatureLimits,
}: {
  onClose: () => void;
  chartY: { min: number | undefined; max: number | undefined };
  changeChartY: (field: "min" | "max", value: string) => void;
  temperatureLimits: LimitType;
  editTemperatureLimits: (limits: LimitType) => void;
}) => {
  const [tempLimits, setTempLimits] = useState({
    maxTemperature: temperatureLimits.maxTemperature ?? "",
    minTemperature: temperatureLimits.minTemperature ?? "",
  });
  return (
    <div className="absolute right-0 z-50 bg-zinc-50 w-full max-w-md  modal-open">
      <dialog
        onClose={() => onClose()}
        closedby="any"
        open={true}
        className="bg-white absolute top-0 left-auto right-0 p-2 w-full h-fit border border-zinc-200 shadow-xs rounded-xl "
      >
        <div className="flex justify-between border-b border-zinc-200 ">
          <h2 className="text-amber-500 uppercase">Asetukset</h2>
          <button
            onClick={() => onClose()}
            className="cursor-pointer transition-colors hover:text-amber-500 outline-none focus:ring-2 focus:ring-amber-500"
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
        <div className="flex flex-col">
          <h3 className="text-zinc-700 uppercase text-xs mt-2 ">
            Muokkaa sensorin raja-arvoja
          </h3>
          <div className="flex gap-2 ">
            <div className="flex flex-col">
              <label
                htmlFor="minTemperature"
                className="translate-x-2 translate-y-2 bg-white w-fit text-zinc-500 uppercase text-xs"
              >
                Min °C
              </label>
              <input
                onChange={(e) =>
                  setTempLimits((prevLimits) => ({
                    ...prevLimits,
                    minTemperature: String(e.target.value),
                  }))
                }
                value={String(tempLimits.minTemperature)}
                placeholder="-"
                type="number"
                name="minTemperature"
                className="p-2 border border-zinc-200 rounded-md rounded-tl-none hover:border-amber-500 focus:border-amber-500 outline-none w-full placeholder:text-center"
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
                onChange={(e) =>
                  setTempLimits((prevLimits) => ({
                    ...prevLimits,
                    maxTemperature: String(e.target.value),
                  }))
                }
                value={String(tempLimits.maxTemperature)}
                placeholder="-"
                type="number"
                name="maxTemperature"
                className="p-2 border border-zinc-200 rounded-md rounded-tl-none hover:border-amber-500 focus:border-amber-500 outline-none w-full placeholder:text-center"
              />
            </div>
            <button
              onClick={() => editTemperatureLimits(tempLimits)}
              className="mt-2 cursor-pointer hover:text-emerald-800 transition-colors outline-none focus:text-emerald-800 focus:ring-2 focus:ring-emerald-800"
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
                  d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-zinc-700 uppercase text-xs mt-2 ">
            Muokkaa kaavion raja-arvoja
          </h3>
          <div className="flex gap-2">
            <div className="flex flex-col">
              <label
                htmlFor="minY"
                className="translate-x-2 translate-y-2 bg-white w-fit text-zinc-500 uppercase text-xs"
              >
                Min
              </label>
              <input
                onChange={(e) => changeChartY("min", e.target.value)}
                placeholder={!chartY.min ? "-" : String(chartY.min)}
                type="number"
                name="minY"
                className="p-2 border border-zinc-200 rounded-md rounded-tl-none hover:border-amber-500 focus:border-amber-500 outline-none w-full placeholder:text-center placeholder:italic"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="minY"
                className="translate-x-2 translate-y-2 bg-white w-fit text-zinc-500 uppercase text-xs"
              >
                Max
              </label>
              <input
                onChange={(e) => changeChartY("max", e.target.value)}
                placeholder={!chartY.max ? "-" : String(chartY.max)}
                type="number"
                name="maxY"
                className="p-2 border border-zinc-200 rounded-md rounded-tl-none hover:border-amber-500 focus:border-amber-500 outline-none w-full placeholder:text-center placeholder:italic"
              />
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};
