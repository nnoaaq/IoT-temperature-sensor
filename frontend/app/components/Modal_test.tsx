"use client";
import { useState, useEffect } from "react";
import { saveTemperatureLimits } from "../lib/Api";
import { LimitType } from "../types/limit";

export const Modal = ({
  modalTitle,
  sensorId,
  temperatureLimits,
  updateYLimits,
  modalClose,
  updateSensorTemperatureLimits,
}: {
  modalTitle: string;
  sensorId: string;
  temperatureLimits: LimitType;
  updateYLimits: (field: "max" | "min", value: string) => void;
  modalClose: () => void;
  updateSensorTemperatureLimits: ({
    maxTemperature,
    minTemperature,
  }: {
    maxTemperature: number;
    minTemperature: number;
  }) => void;
}) => {
  // Sensorin raja-arvot
  const [sensorTemperatureLimits, setSensorTemperatureLimits] = useState(
    temperatureLimits || {
      maxTemperature: "-",
      minTemperature: "-",
    },
  );

  // Päivitetään raja-arvot aina, kun tulee uutta tietoa
  useEffect(() => {
    if (temperatureLimits) {
      setSensorTemperatureLimits({
        minTemperature: temperatureLimits.minTemperature,
        maxTemperature: temperatureLimits.maxTemperature,
      });
    }
  }, [temperatureLimits]);
  // kokonaan pois scrollaus kun modal auki
  useEffect(() => {
    // Estetään scrollaus kun komponentti latautuu / avautuu
    document.body.style.overflow = "hidden";

    // Palautetaan scrollaus kun komponentti poistuu (cleanup function)
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);
  // Tarkistetaan onko numeroita. KYLLÄ > tietokantaan
  const submitTemperatureLimits = async () => {
    // Varmennetaan onko numeroita
    const min = sensorTemperatureLimits.minTemperature;
    const max = sensorTemperatureLimits.maxTemperature;
    if (
      min !== "" &&
      !isNaN(Number(min)) &&
      max !== "" &&
      !isNaN(Number(max))
    ) {
      // molemmat on numeroita
      const temperatureLimits = {
        minTemperature: Number(sensorTemperatureLimits.minTemperature),
        maxTemperature: Number(sensorTemperatureLimits.maxTemperature),
      };
      await saveTemperatureLimits(sensorId, temperatureLimits);
      // päivitetään temperatureLimits
      updateSensorTemperatureLimits(temperatureLimits);
    }
  };

  return (
    <div className="border border-zinc-200 p-5 rounded-xl shadow-xs">
      <div
        className={`fixed inset-y-0 left-0 w-full bg-black/10 backdrop-blur-xs border`}
      >
        <dialog
          onClose={() => {
            modalClose();
          }}
          open={true}
          closedby="any"
          className="fixed top-0 left-auto right-0 animate-show m-2 p-2 border border-zinc-200 rounded-xl shadow-xs max-w-md  md:w-full w-auto"
        >
          {sensorTemperatureLimits && (
            <div>
              <div className="flex justify-between border-b border-zinc-400">
                <h2 className="text-amber-500 text-xl  ">{modalTitle}</h2>
                <button
                  onClick={() => modalClose()}
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
              <div className="flex flex-col gap-2 mt-2">
                <div className="border border-zinc-200 rounded-xl shadow-xs p-2">
                  <h3 className="text-zinc-700 text-xs uppercase">
                    Muokkaa lämpötilan raja-arvoja
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex flex-col">
                      <label
                        htmlFor="minTemperature"
                        className="text-zinc-500 text-xs uppercase translate-x-1 translate-y-2 bg-zinc-50 w-fit"
                      >
                        Min °C
                      </label>
                      <input
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setSensorTemperatureLimits(
                            (previousTemperatureLimits) => ({
                              ...previousTemperatureLimits,
                              minTemperature: e.target.value,
                            }),
                          )
                        }
                        type="number"
                        name="minTemperature"
                        id="minTemperature"
                        className="hover:outline focus:outline cursor-pointer outline-amber-500 w-full p-2 border border-zinc-300 rounded-md rounded-tl-none shadow-xs text-center placeholder:italic"
                        value={String(sensorTemperatureLimits.minTemperature)}
                        placeholder="-"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="minTemperature"
                        className="text-zinc-500 text-xs uppercase translate-x-1 translate-y-2 bg-zinc-50 w-fit"
                      >
                        Max °C
                      </label>
                      <input
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setSensorTemperatureLimits(
                            (previousTemperatureLimits) => ({
                              ...previousTemperatureLimits,
                              maxTemperature: e.target.value,
                            }),
                          )
                        }
                        type="number"
                        name="maxTemperature"
                        id="maxTemperature"
                        className="hover:outline focus:outline cursor-pointer outline-amber-500 w-full p-2 border border-zinc-300 rounded-md rounded-tl-none shadow-xs text-center placeholder:italic"
                        value={String(sensorTemperatureLimits.maxTemperature)}
                        placeholder="-"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => submitTemperatureLimits()}
                    className="outline-none bg-emerald-800 focus:bg-emerald-900 hover:bg-emerald-900 transition cursor-pointer text-zinc-50 p-2 w-full rounded-xl mt-2"
                  >
                    Päivitä raja-arvot
                  </button>
                </div>
                <div className="border border-zinc-200 rounded-xl shadow-xs p-2">
                  <h3 className="text-zinc-700 text-xs uppercase">
                    Muokkaa kaavion näytettäviä arvoja
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex flex-col">
                      <label
                        htmlFor="showMinTemperature"
                        className="text-zinc-500 text-xs uppercase translate-x-1 translate-y-2 bg-zinc-50 w-fit"
                      >
                        Alin näytettävä
                      </label>
                      <input
                        onChange={(e) => updateYLimits("min", e.target.value)}
                        type="number"
                        name="showMinTemperature"
                        id="showMinTemperature"
                        className="hover:outline focus:outline cursor-pointer outline-amber-500 w-full p-2 border border-zinc-300 rounded-md rounded-tl-none shadow-xs text-center placeholder:italic"
                        placeholder="-"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        htmlFor="showMaxTemperature"
                        className="text-zinc-500 text-xs uppercase translate-x-1 translate-y-2 bg-zinc-50 w-fit"
                      >
                        Ylin näytettävä
                      </label>
                      <input
                        onChange={(e) => updateYLimits("max", e.target.value)}
                        type="number"
                        name="showMaxTemperature"
                        id="showMaxTemperature"
                        className="hover:outline focus:outline cursor-pointer outline-amber-500 w-full p-2 border border-zinc-300 rounded-md rounded-tl-none shadow-xs text-center placeholder:italic"
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </dialog>
      </div>
    </div>
  );
};
