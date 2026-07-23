import type {
  CompletedJourney,
  JourneyState,
} from "./types";

const JOURNEY_KEY = "metadriver_active_journey_v1";
const COMPLETED_KEY = "metadriver_completed_journeys_v1";

export const DEFAULT_JOURNEY: JourneyState = {
  status: "idle",
  startedAt: null,
  pauseStartedAt: null,
  pausePlannedUntil: null,
  pausedMs: 0,
  raining: false,
};

export type WeakWindow = {
  label: string;
  displayEndsAt: Date;
  suggestedPauseMinutes: number;
};

function isJourneyState(value: unknown): value is JourneyState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<JourneyState>;
  return (
    (candidate.status === "idle" ||
      candidate.status === "active" ||
      candidate.status === "paused") &&
    (candidate.startedAt === null ||
      typeof candidate.startedAt === "string") &&
    (candidate.pauseStartedAt === null ||
      typeof candidate.pauseStartedAt === "string") &&
    (candidate.pausePlannedUntil === null ||
      typeof candidate.pausePlannedUntil === "string") &&
    typeof candidate.pausedMs === "number" &&
    typeof candidate.raining === "boolean"
  );
}

export function loadJourney(): JourneyState {
  if (typeof window === "undefined") return DEFAULT_JOURNEY;
  const raw = window.localStorage.getItem(JOURNEY_KEY);
  if (!raw) return DEFAULT_JOURNEY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isJourneyState(parsed) ? parsed : DEFAULT_JOURNEY;
  } catch {
    return DEFAULT_JOURNEY;
  }
}

export function saveJourney(journey: JourneyState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOURNEY_KEY, JSON.stringify(journey));
}

export function saveCompletedJourneyLocal(
  journey: CompletedJourney
): void {
  if (typeof window === "undefined") return;
  let previous: CompletedJourney[] = [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(COMPLETED_KEY) || "[]"
    );
    if (Array.isArray(parsed)) previous = parsed as CompletedJourney[];
  } catch {
    previous = [];
  }
  window.localStorage.setItem(
    COMPLETED_KEY,
    JSON.stringify([journey, ...previous].slice(0, 100))
  );
}

export function effectiveWorkedMs(
  journey: JourneyState,
  now = new Date()
): number {
  if (journey.status === "idle" || !journey.startedAt) return 0;
  const startedAt = new Date(journey.startedAt).getTime();
  const currentEnd =
    journey.status === "paused" && journey.pauseStartedAt
      ? new Date(journey.pauseStartedAt).getTime()
      : now.getTime();
  return Math.max(0, currentEnd - startedAt - journey.pausedMs);
}

export function finishActivePause(
  journey: JourneyState,
  now = new Date()
): JourneyState {
  if (journey.status !== "paused" || !journey.pauseStartedAt) {
    return journey;
  }
  const pauseMs = Math.max(
    0,
    now.getTime() - new Date(journey.pauseStartedAt).getTime()
  );
  return {
    ...journey,
    status: "active",
    pauseStartedAt: null,
    pausePlannedUntil: null,
    pausedMs: journey.pausedMs + pauseMs,
  };
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function inWindow(
  minute: number,
  start: number,
  end: number
): boolean {
  return minute >= start && minute < end;
}

export function isPeakTime(now = new Date()): boolean {
  const minute = minutesOfDay(now);
  return (
    inWindow(minute, 7 * 60, 8 * 60 + 30) ||
    inWindow(minute, 12 * 60, 13 * 60 + 30) ||
    inWindow(minute, 17 * 60, 19 * 60)
  );
}

export function hourlyReference(
  hourlyGross: number,
  gross: number,
  now = new Date(),
  raining = false
): {
  base: number;
  final: number;
  peak: boolean;
} {
  const base =
    gross <= 0 ? 35 : Math.min(Math.max(hourlyGross, 0) + 5, 35);
  const peak = isPeakTime(now);
  return {
    base,
    final: base + (peak ? 5 : 0) + (raining ? 5 : 0),
    peak,
  };
}

function atMinuteOnSameDay(now: Date, minute: number): Date {
  const result = new Date(now);
  result.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  return result;
}

export function currentWeakWindow(
  now = new Date()
): WeakWindow | null {
  const day = now.getDay();
  const minute = minutesOfDay(now);
  const weekend = day === 0 || day === 6;
  const windows = weekend
    ? [{ start: 9 * 60, end: 10 * 60 }]
    : [
        { start: 10 * 60, end: 11 * 60 },
        { start: 14 * 60, end: 15 * 60 },
        { start: 20 * 60, end: 21 * 60 },
      ];

  for (const window of windows) {
    const displayStart = window.start - 10;
    const displayEnd = window.end - 10;
    if (inWindow(minute, displayStart, displayEnd)) {
      return {
        label: `${String(Math.floor(window.start / 60)).padStart(2, "0")}:00–${String(Math.floor(window.end / 60)).padStart(2, "0")}:00`,
        displayEndsAt: atMinuteOnSameDay(now, displayEnd),
        suggestedPauseMinutes: Math.max(1, displayEnd - minute),
      };
    }
  }
  return null;
}

function isDeadDay(day: number): boolean {
  return day === 0 || (day >= 1 && day <= 4);
}

export function isDeadHourWarning(now = new Date()): boolean {
  const minute = minutesOfDay(now);
  if (minute < 5 * 60) return isDeadDay(now.getDay());
  if (minute >= 23 * 60 + 50) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isDeadDay(tomorrow.getDay());
  }
  return false;
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}
