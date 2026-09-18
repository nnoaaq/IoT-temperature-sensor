"use client";

import { useEffect, useState } from "react";
import { getTemperatureLimits, saveTemperatureLimits } from "../lib/Api";
export const Modal = ({
  selectedSensor,
  onClose,
  chartY,
  updateYLimits,
  temperatureLimits,
}: {
  selectedSensor: string;
  onClose: () => void;
  chartY: {
    max: undefined | string;
    min: undefined | string;
  };
  temperatureLimits: {
    minTemperature: string;
    maxTemperature: string;
  };
  updateYLimits: (field: string, value: string) => void;
}) => {
  // LÄMPÖTILAN RAJA-ARVOT
  const [ModaltemperatureLimits, setModalTemperatureLimits] = useState({
    minTemperature: "",
    maxTemperature: "",
  });

  // VARMENNETAAN JA PÄIVITETÄÄN RAJA-ARVOT
  const verifyTemperatureLimits = async () => {
    if (!selectedSensor) return;
    if (
      ModaltemperatureLimits.minTemperature.length === 0 ||
      ModaltemperatureLimits.maxTemperature.length === 0
    )
      return;
    await saveTemperatureLimits(selectedSensor, ModaltemperatureLimits);
  };

  return (
    <dialog
      onClose={() => onClose()}
      open={true}
      closedby="any"
      className="border border-zinc-300 rounded-xl shadow-xs p-2 absolute z-50 right-0 top-0 max-w-md left-auto modal-open"
    >
      <div className="flex justify-between border-b border-zinc-200">
        <h2 className=" uppercase text-amber-500 text-md tracking-widest">
          Asetukset
        </h2>
        <button
          onClick={() => onClose()}
          className="cursor-pointer hover:text-amber-500 transition-color focus:text-amber-500 outline-none"
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
      <div className="mt-2 shadow-xs">
        <p className="text-zinc-700 text-xs uppercase">Vaihda raja-arvoja</p>
        <div className="flex  gap-2">
          <div>
            <label
              htmlFor="minTemperature"
              className="text-zinc-500 text-xs uppercase"
            >
              Min °C
            </label>
            <input
              onChange={(e) =>
                setModalTemperatureLimits((prevLimits) => ({
                  ...prevLimits,
                  minTemperature: e.target.value,
                }))
              }
              placeholder={temperatureLimits.minTemperature}
              type="number"
              name="minTemperature"
              className="p-2 w-full border border-zinc-300 rounded-md rounded-tl-none shadow-xs hover:border-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="maxTemperature"
              className="text-zinc-500 text-xs uppercase"
            >
              Max °C
            </label>
            <input
              onChange={(e) =>
                setModalTemperatureLimits((prevLimits) => ({
                  ...prevLimits,
                  maxTemperature: e.target.value,
                }))
              }
              placeholder={temperatureLimits.maxTemperature}
              type="number"
              name="maxTemperature"
              className="p-2 w-full border border-zinc-300 rounded-md rounded-tl-none shadow-xs hover:border-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => verifyTemperatureLimits()}
          className=" w-full mt-2 p-2 bg-emerald-800 cursor-pointer text-zinc-50 focus:bg-emerald-900 hover:bg-emerald-900 transition rounded-xl h-fit outline-none"
        >
          Tallenna raja-arvot
        </button>
      </div>
      <div className="mt-2 shadow-xs">
        <p className="text-zinc-700 text-xs uppercase">
          Vaihda Y-akselin raja-arvoja
        </p>
        <div className="flex  gap-2">
          <div>
            <label
              htmlFor="minTemperature"
              className="text-zinc-500 text-xs uppercase"
            >
              Min
            </label>
            <input
              onChange={(e) => updateYLimits("min", e.target.value)}
              placeholder={chartY.min === undefined ? "-" : chartY.min}
              type="number"
              name="minTemperature"
              className="p-2 w-full border border-zinc-300 rounded-md rounded-tl-none shadow-xs hover:border-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="maxTemperature"
              className="text-zinc-500 text-xs uppercase"
            >
              Max
            </label>
            <input
              onChange={(e) => updateYLimits("max", e.target.value)}
              placeholder={chartY.max === undefined ? "-" : chartY.max}
              type="number"
              name="maxTemperature"
              className="p-2 w-full border border-zinc-300 rounded-md rounded-tl-none shadow-xs hover:border-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      </div>
    </dialog>
  );
};
