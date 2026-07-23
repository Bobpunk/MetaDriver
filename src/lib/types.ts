export type DriverState = {
  startTime: string;
  goalAmount: string;
  kmInput: string;
  fuelPrice: string;
  consumption: string;
  uberInput: string;
  ninenineInput: string;
  indriveInput: string;
  tipsInput: string;
  proFinancing: string;
  proMaintenance: string;
  proInsurance: string;
  proOtherMonthly: string;
  proAnnualTaxes: string;
};

export type DriverResults = {
  gross: number;
  netIncome: number;
  fuelCost: number;
  hourlyGross: number;
  kmValue: number;
  workedHours: number;
  workedMinutes: number;
  remaining: number;
  progressPct: number;
  estimatedFinish: string;
  goalHit: boolean;
  proTotalCosts: number;
  proNetIncome: number;
  proHourlyNet: number;
  proKmNet: number;
  proDailyCost: number;
};

export type JourneyStatus = "idle" | "active" | "paused";

export type JourneyState = {
  status: JourneyStatus;
  startedAt: string | null;
  pauseStartedAt: string | null;
  pausePlannedUntil: string | null;
  pausedMs: number;
  raining: boolean;
};

export type CompletedJourney = {
  id: string;
  date: string;
  startedAt: string;
  endedAt: string;
  pausedMs: number;
  workedMs: number;
  gross: number;
  hourlyGross: number;
  goalAmount: number;
  kmDriven: number;
  fuelCost: number;
};

export type DailyLog = {
  id: number;
  userEmail: string;
  date: string;
  goalAmount: string;
  kmDriven: string;
  fuelCost: string;
  otherExpenses: string;
  grossEarnings: string;
  workedMs: string;
  createdAt: string;
};
