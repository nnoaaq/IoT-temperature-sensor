"use client";
import { useEffect, useState } from "react";
import { LimitType } from "../types/limit";
import { saveTemperatureLimits, updateTemperatureLimits } from "../lib/Api";

export const SettingModal = ({
  closeModal,
  limits,
  sensorId,
}: {
  closeModal: () => void;
  limits: LimitType;
  sensorId: string;
}) => {
  const [newTemperatureLimits, setNewTemperatureLimits] = useState({
    maxTemperature: "",
    minTemperature: "",
  });
  const [temperatureLimits, setTemperatureLimits] = useState({
    maxTemperature: String(limits.maxTemperature),
    minTemperature: String(limits.minTemperature),
  });
  const updateLimits = async (newLimits: LimitType) => {
    console.log("muutettu", newLimits);
    console.log("sensori", limits.sensorId);
    if (!limits.sensorId) return;
    await updateTemperatureLimits(limits.sensorId, newLimits);
  };
  const saveLimits = async () => {
    await saveTemperatureLimits(sensorId, {
      maxTemperature: Number(newTemperatureLimits.maxTemperature),
      minTemperature: Number(newTemperatureLimits.minTemperature),
    });
  };
  return (
    <div
      onClick={() => closeModal()}
      className="absolute inset-0 w-full h-full bg-zinc-950/80 p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className=" bg-zinc-50 w-full max-w-md mx-auto h-fit rounded-xl p-2 pointer-events-auto"
      >
        <div className="flex justify-between">
          <h1 className="text-amber-500 uppercase tracking-wider text-lg">
            Asetukset
          </h1>
          <button
            onClick={() => closeModal()}
            className="hover:text-rose-500 cursor-pointer transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6 "
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {limits.sensorId ? (
            <div>
              <h2 className="text-zinc-500 text-md uppercase">
                Vaihda raja-arvoja
              </h2>
              <div className="flex gap-5 w-full">
                <div className="w-full">
                  <label
                    className="text-zinc-500 text-xs tracking-widest"
                    htmlFor="minTemperature"
                  >
                    MIN °C
                  </label>
                  <input
                    min="-255"
                    max="255"
                    name="minTemperature"
                    type="number"
                    className="p-2 w-full border border-zinc-200 rounded-xl shadow-xs text-center outline-none hover:border-amber-500 focus:outline-amber-500"
                    value={temperatureLimits.minTemperature}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      setTemperatureLimits((prevLimits) => ({
                        ...prevLimits,
                        minTemperature: e.target.value,
                      }));
                    }}
                    onBlur={(e) =>
                      updateLimits({ minTemperature: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="w-full">
                  <label
                    className="text-zinc-500 text-xs tracking-widest"
                    htmlFor="maxTemperature"
                  >
                    MAX °C
                  </label>
                  <input
                    min="-255"
                    max="255"
                    name="maxTemperature"
                    type="number"
                    className="p-2 w-full border border-zinc-200 rounded-xl shadow-xs text-center outline-none hover:border-amber-500 focus:outline-amber-500"
                    value={temperatureLimits.maxTemperature}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      setTemperatureLimits((prevLimits) => ({
                        ...prevLimits,
                        maxTemperature: e.target.value,
                      }));
                    }}
                    onBlur={(e) =>
                      updateLimits({ maxTemperature: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-zinc-500 text-md uppercase">
                Lisää raja-arvot sensorille
              </h2>
              <div className="flex gap-5 w-full">
                <div className="w-full">
                  <label
                    className="text-zinc-500 text-xs tracking-widest"
                    htmlFor="minTemperature"
                  >
                    MIN °C
                  </label>
                  <input
                    onChange={(e) =>
                      setNewTemperatureLimits((prevLimits) => ({
                        ...prevLimits,
                        minTemperature: e.target.value,
                      }))
                    }
                    min="-255"
                    max="255"
                    name="minTemperature"
                    type="number"
                    className="p-2 w-full border border-zinc-200 rounded-xl shadow-xs text-center outline-none hover:border-amber-500 focus:outline-amber-500 placeholder:italic"
                    placeholder="-25"
                  />
                </div>
                <div className="w-full">
                  <label
                    className="text-zinc-500 text-xs tracking-widest"
                    htmlFor="maxTemperature"
                  >
                    MAX °C
                  </label>
                  <input
                    onChange={(e) =>
                      setNewTemperatureLimits((prevLimits) => ({
                        ...prevLimits,
                        maxTemperature: e.target.value,
                      }))
                    }
                    min="-255"
                    max="255"
                    name="maxTemperature"
                    type="number"
                    className="p-2 w-full border border-zinc-200 rounded-xl shadow-xs text-center outline-none hover:border-amber-500 focus:outline-amber-500 placeholder:italic"
                    placeholder="25"
                  />
                </div>
              </div>
              <div>
                <button
                  onClick={() => saveLimits()}
                  className="mt-2 p-2 w-full bg-emerald-800 cursor-pointer hover:bg-emerald-900 text-zinc-50 text-center rounded-lg transition"
                >
                  Tallenna raja-arvot
                </button>
              </div>
            </div>
          )}
          <div>
            <h2 className="text-zinc-500 text-md uppercase">
              Vaihda taulukon Y-akselin arvoja
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};
