import assert from "node:assert/strict";
import test from "node:test";
import { calculate, DEFAULTS } from "../src/lib/driver";
import {
  DEFAULT_JOURNEY,
  currentWeakWindow,
  effectiveWorkedMs,
  finishActivePause,
  formatDuration,
  hourlyReference,
  isDeadHourWarning,
  isPeakTime,
} from "../src/lib/journey";

function localDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

test("usa R$ 35/h antes do primeiro ganho", () => {
  const result = hourlyReference(0, 0, localDate(2026, 7, 20, 10), false);
  assert.equal(result.base, 35);
  assert.equal(result.final, 35);
});

test("aplica a regra dinâmica, pico e chuva", () => {
  const normal = hourlyReference(
    29,
    100,
    localDate(2026, 7, 20, 10),
    false
  );
  assert.equal(normal.base, 34);
  assert.equal(normal.final, 34);

  const peakAndRain = hourlyReference(
    29,
    100,
    localDate(2026, 7, 20, 7, 30),
    true
  );
  assert.equal(peakAndRain.base, 34);
  assert.equal(peakAndRain.final, 44);
  assert.equal(peakAndRain.peak, true);
});

test("limita a referência-base em R$ 35/h", () => {
  assert.equal(
    hourlyReference(40, 200, localDate(2026, 7, 20, 10), false).base,
    35
  );
});

test("reconhece os três horários de pico", () => {
  assert.equal(isPeakTime(localDate(2026, 7, 20, 7)), true);
  assert.equal(isPeakTime(localDate(2026, 7, 20, 8, 29)), true);
  assert.equal(isPeakTime(localDate(2026, 7, 20, 8, 30)), false);
  assert.equal(isPeakTime(localDate(2026, 7, 20, 12, 30)), true);
  assert.equal(isPeakTime(localDate(2026, 7, 20, 18, 59)), true);
  assert.equal(isPeakTime(localDate(2026, 7, 20, 19)), false);
});

test("sugere pausas nas janelas corretas", () => {
  const mondayMorning = currentWeakWindow(
    localDate(2026, 7, 20, 10, 10)
  );
  assert.equal(mondayMorning?.label, "10:00–11:00");
  assert.equal(mondayMorning?.suggestedPauseMinutes, 40);

  const saturday = currentWeakWindow(localDate(2026, 7, 25, 9, 10));
  assert.equal(saturday?.label, "09:00–10:00");
  assert.equal(saturday?.suggestedPauseMinutes, 40);

  assert.equal(currentWeakWindow(localDate(2026, 7, 25, 14)), null);
});

test("alerta horário morto somente nos dias configurados", () => {
  assert.equal(
    isDeadHourWarning(localDate(2026, 7, 20, 2)),
    true,
    "segunda-feira de madrugada"
  );
  assert.equal(
    isDeadHourWarning(localDate(2026, 7, 24, 2)),
    false,
    "sexta-feira de madrugada"
  );
  assert.equal(
    isDeadHourWarning(localDate(2026, 7, 19, 23, 55)),
    true,
    "domingo antes da segunda-feira"
  );
});

test("exclui da hora bruta o tempo realmente pausado", () => {
  const startedAt = localDate(2026, 7, 20, 7);
  const pauseStartedAt = localDate(2026, 7, 20, 8);
  const paused = {
    ...DEFAULT_JOURNEY,
    status: "paused" as const,
    startedAt: startedAt.toISOString(),
    pauseStartedAt: pauseStartedAt.toISOString(),
  };

  assert.equal(
    effectiveWorkedMs(paused, localDate(2026, 7, 20, 8, 30)),
    60 * 60 * 1000
  );

  const resumed = finishActivePause(
    paused,
    localDate(2026, 7, 20, 8, 30)
  );
  assert.equal(resumed.pausedMs, 30 * 60 * 1000);
  assert.equal(
    effectiveWorkedMs(resumed, localDate(2026, 7, 20, 9)),
    90 * 60 * 1000
  );
  assert.equal(formatDuration(90 * 60 * 1000), "01h 30m");
});

test("inclui inDrive no faturamento e na hora bruta", () => {
  const result = calculate(
    {
      ...DEFAULTS,
      uberInput: "10",
      ninenineInput: "20",
      indriveInput: "30",
      tipsInput: "5",
    },
    localDate(2026, 7, 20, 8),
    60 * 60 * 1000
  );
  assert.equal(result.gross, 65);
  assert.equal(result.hourlyGross, 65);
});
