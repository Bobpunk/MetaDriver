import type { DriverState, DriverResults } from "./types";

const STORAGE_KEYS = {
  startTime: "drv_start",
  goalAmount: "drv_goal",
  kmInput: "drv_km",
  fuelPrice: "drv_fuel",
  consumption: "drv_cons",
  uberInput: "drv_uber",
  ninenineInput: "drv_99",
  indriveInput: "drv_indrive",
  tipsInput: "drv_tips",
  proFinancing: "drv_pro_fin",
  proMaintenance: "drv_pro_maint",
  proInsurance: "drv_pro_ins",
  proOtherMonthly: "drv_pro_other",
  proAnnualTaxes: "drv_pro_tax",
} as const;

export const DEFAULTS: DriverState = {
  startTime: "06:00",
  goalAmount: "300",
  kmInput: "",
  fuelPrice: "5.89",
  consumption: "10",
  uberInput: "",
  ninenineInput: "",
  indriveInput: "",
  tipsInput: "",
  proFinancing: "",
  proMaintenance: "",
  proInsurance: "",
  proOtherMonthly: "",
  proAnnualTaxes: "",
};

export function loadState(): DriverState {
  if (typeof window === "undefined") return DEFAULTS;
  const out: DriverState = { ...DEFAULTS };
  (Object.keys(STORAGE_KEYS) as (keyof DriverState)[]).forEach((key) => {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
    if (raw !== null) {
      out[key] = raw;
    }
  });
  return out;
}

export function saveState(state: DriverState): void {
  if (typeof window === "undefined") return;
  (Object.keys(STORAGE_KEYS) as (keyof DriverState)[]).forEach((key) => {
    window.localStorage.setItem(STORAGE_KEYS[key], state[key] ?? "");
  });
}

export function parseMath(str: string): number {
  if (!str) return 0;
  const clean = str.toString().replace(/\s/g, "").replace(",", ".");
  try {
    if (clean.includes("+")) {
      return clean
        .split("+")
        .reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
    }
    return parseFloat(clean) || 0;
  } catch {
    return 0;
  }
}

export function formatMoney(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function calculate(
  state: DriverState,
  now = new Date(),
  workedMsOverride?: number
): DriverResults {
  const gross =
    parseMath(state.uberInput) +
    parseMath(state.ninenineInput) +
    parseMath(state.indriveInput) +
    parseMath(state.tipsInput);

  const km = parseMath(state.kmInput);
  const fuelPrice = parseFloat(state.fuelPrice) || 0;
  const consumption = parseFloat(state.consumption) || 1;

  const liters = km / consumption;
  const fuelCost = liters * fuelPrice;
  const netIncome = gross - fuelCost;

  let diffMins: number;
  if (workedMsOverride !== undefined) {
    diffMins = Math.max(0, workedMsOverride / 60000);
  } else {
    const [h, m] = state.startTime.split(":").map(Number);
    const startDt = new Date(now);
    startDt.setHours(h || 0, m || 0, 0, 0);
    diffMins = (now.getTime() - startDt.getTime()) / 60000;
    if (diffMins < 0) diffMins = 0;
  }
  const hoursDec = diffMins / 60;

  const workedHours = Math.floor(diffMins / 60);
  const workedMinutes = Math.floor(diffMins % 60);

  const hourlyGross = hoursDec > 0 ? gross / hoursDec : 0;
  const kmValue = km > 0 ? gross / km : 0;

  const goal = parseFloat(state.goalAmount) || 0;
  const remaining = goal - gross;
  const goalHit = remaining <= 0;
  const progressPct = goal > 0 ? Math.min((gross / goal) * 100, 100) : 0;

  let estimatedFinish = "--:--";
  if (goalHit) {
    estimatedFinish = "LIVRE";
  } else if (hourlyGross > 0) {
    const hoursNeeded = remaining / hourlyGross;
    const finishTime = new Date(now.getTime() + hoursNeeded * 3600000);
    estimatedFinish = `${finishTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${finishTime.getMinutes().toString().padStart(2, "0")}`;
  }

  const proFinancing = parseMath(state.proFinancing);
  const proMaintenance = parseMath(state.proMaintenance);
  const proInsurance = parseMath(state.proInsurance);
  const proOtherMonthly = parseMath(state.proOtherMonthly);
  const proAnnualTaxes = parseMath(state.proAnnualTaxes);

  const daysInMonth = 30;
  const proDailyFinancing = proFinancing / daysInMonth;
  const proDailyMaintenance = proMaintenance / daysInMonth;
  const proDailyInsurance = proInsurance / daysInMonth;
  const proDailyOther = proOtherMonthly / daysInMonth;
  const proDailyTaxes = proAnnualTaxes / 365;

  const proDailyCost =
    proDailyFinancing +
    proDailyMaintenance +
    proDailyInsurance +
    proDailyOther +
    proDailyTaxes;

  const proTotalCosts = fuelCost + proDailyCost * (hoursDec / 24);

  return {
    gross,
    netIncome,
    fuelCost,
    hourlyGross,
    kmValue,
    workedHours,
    workedMinutes,
    remaining,
    progressPct: Math.max(progressPct, 0),
    estimatedFinish,
    goalHit,
    proTotalCosts,
    proNetIncome: gross - proTotalCosts,
    proHourlyNet: hoursDec > 0 ? (gross - proTotalCosts) / hoursDec : 0,
    proKmNet: km > 0 ? (gross - proTotalCosts) / km : 0,
    proDailyCost,
  };
}

export function sanitizeNumericInput(value: string): string {
  return value.replace(/[^0-9+.,]/g, "");
}
