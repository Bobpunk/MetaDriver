"use client";

import { useMemo, useState } from "react";
import {
  CloudRain,
  Clock3,
  Pause,
  Play,
  Square,
  Target,
} from "lucide-react";
import type { JourneyState } from "@/lib/types";
import type { WeakWindow } from "@/lib/journey";
import { formatDuration } from "@/lib/journey";
import { formatMoney } from "@/lib/driver";

type JourneyControlProps = {
  journey: JourneyState;
  now: Date;
  workedMs: number;
  hourlyGross: number;
  reference: number;
  peak: boolean;
  weakWindow: WeakWindow | null;
  deadHourWarning: boolean;
  ending: boolean;
  error: string;
  onStart: () => void;
  onToggleRain: () => void;
  onPause: (minutes: number) => void;
  onResume: () => void;
  onEnd: () => void;
};

const PAUSE_PRESETS = [15, 30, 45, 60];

export function JourneyControl({
  journey,
  now,
  workedMs,
  hourlyGross,
  reference,
  peak,
  weakWindow,
  deadHourWarning,
  ending,
  error,
  onStart,
  onToggleRain,
  onPause,
  onResume,
  onEnd,
}: JourneyControlProps) {
  const [choosingPause, setChoosingPause] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("30");

  const pauseRemaining = useMemo(() => {
    if (journey.status !== "paused" || !journey.pausePlannedUntil) return 0;
    return Math.max(
      0,
      new Date(journey.pausePlannedUntil).getTime() - now.getTime()
    );
  }, [journey.pausePlannedUntil, journey.status, now]);

  function beginPause(minutes: number) {
    onPause(minutes);
    setChoosingPause(false);
  }

  if (journey.status === "idle") {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Play size={20} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">
              Pronto para rodar?
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-300">
              Inicie a jornada para acompanhar sua hora bruta e a referência
              mínima de corridas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <Play size={18} fill="currentColor" />
          Iniciar jornada
        </button>
      </section>
    );
  }

  const paused = journey.status === "paused";

  return (
    <section
      className={`rounded-xl border p-3 ${
        paused
          ? "border-amber-500 bg-amber-950/30"
          : "border-slate-700 bg-slate-800"
      }`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-700 pb-3">
        <div
          className={`flex min-h-11 items-center gap-2 font-semibold ${
            paused ? "text-amber-300" : "text-blue-300"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              paused ? "bg-amber-400" : "bg-blue-500"
            }`}
          />
          {paused ? "Jornada pausada" : "Jornada ativa"}
        </div>
        <div className="flex min-h-11 items-center gap-2 text-sm font-semibold tabular-nums text-white">
          <Clock3 size={17} className="text-slate-400" />
          {formatDuration(workedMs)}
        </div>
        <button
          type="button"
          onClick={onToggleRain}
          aria-pressed={journey.raining}
          disabled={paused}
          className={`ml-auto flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-50 ${
            journey.raining
              ? "border-amber-500 bg-amber-500 text-amber-950"
              : "border-slate-600 bg-slate-900 text-slate-200 hover:border-slate-500"
          }`}
        >
          <CloudRain size={17} />
          Chovendo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 py-3">
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-300">
            <Clock3 size={15} className="text-blue-400" />
            Hora bruta
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-white">
            {formatMoney(hourlyGross).replace(",00", "")}/h
          </div>
        </div>
        <div className="rounded-lg border border-emerald-600 bg-emerald-950/30 p-3">
          <div className="flex items-center gap-1.5 text-sm text-emerald-200">
            <Target size={15} />
            Aceite corridas de
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-emerald-300">
            {formatMoney(reference).replace(",00", "")}/h+
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-3">
        {peak && (
          <span className="rounded-full bg-blue-950 px-2.5 py-1 text-xs font-medium text-blue-200">
            Pico +R$ 5
          </span>
        )}
        {journey.raining && (
          <span className="rounded-full bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-200">
            Chuva +R$ 5
          </span>
        )}
      </div>

      {paused ? (
        <div
          data-share-exclude="true"
          className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-amber-700 bg-slate-950 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
        >
          <p className="text-sm text-amber-100">
            O tempo desta pausa não entra na sua hora bruta.
          </p>
          {journey.pausePlannedUntil && (
            <p className="mt-1 text-xs tabular-nums text-amber-300">
              Tempo planejado restante: {formatDuration(pauseRemaining)}
            </p>
          )}
          <button
            type="button"
            onClick={onResume}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-base font-semibold text-amber-950 transition-colors hover:bg-amber-400 active:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <Play size={18} fill="currentColor" />
            Retomar jornada
          </button>
        </div>
      ) : (
        <>
          {weakWindow && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-700 bg-amber-950/30 p-3">
              <p className="text-sm leading-5 text-amber-100">
                Faixa mais fraca ({weakWindow.label}). Bom momento para uma
                pausa.
              </p>
              <button
                type="button"
                onClick={() => beginPause(weakWindow.suggestedPauseMinutes)}
                className="min-h-11 shrink-0 rounded-lg bg-amber-500 px-3 text-sm font-semibold text-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Pausar {weakWindow.suggestedPauseMinutes} min
              </button>
            </div>
          )}

          {deadHourWarning && (
            <div className="mb-3 rounded-lg border border-red-800 bg-red-950/30 p-3">
              <p className="text-sm leading-5 text-red-100">
                Demanda historicamente baixa em João Pessoa até 05:00.
                Considere encerrar e descansar.
              </p>
              <button
                type="button"
                onClick={onEnd}
                className="mt-2 min-h-11 rounded-lg border border-red-600 px-3 text-sm font-semibold text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
              >
                Encerrar jornada
              </button>
            </div>
          )}

          {choosingPause ? (
            <div
              data-share-exclude="true"
              className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-amber-700 bg-slate-950 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="flex flex-wrap gap-2">
                {PAUSE_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => beginPause(minutes)}
                    className="min-h-11 min-w-14 rounded-lg border border-slate-600 px-3 text-sm font-semibold text-white hover:border-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Duração personalizada da pausa</span>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={customMinutes}
                    onChange={(event) => setCustomMinutes(event.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-base text-white focus:border-amber-500 focus:outline-none"
                    aria-label="Minutos de pausa"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    beginPause(
                      Math.min(240, Math.max(1, Number(customMinutes) || 30))
                    )
                  }
                  className="min-h-11 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-amber-950"
                >
                  Pausar
                </button>
                <button
                  type="button"
                  onClick={() => setChoosingPause(false)}
                  className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-300"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <div
              data-share-exclude="true"
              className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-md grid-cols-2 gap-2 border-t border-slate-700 bg-slate-950 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setChoosingPause(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-base font-semibold text-amber-950 transition-colors hover:bg-amber-400 active:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                <Pause size={18} fill="currentColor" />
                Pausar
              </button>
              <button
                type="button"
                onClick={onEnd}
                disabled={ending}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-500 px-3 text-base font-semibold text-red-300 transition-colors hover:bg-red-950 active:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-wait disabled:opacity-60"
              >
                <Square size={17} fill="currentColor" />
                {ending ? "Salvando..." : "Encerrar"}
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm leading-5 text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
