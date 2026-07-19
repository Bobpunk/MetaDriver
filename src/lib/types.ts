export type DriverState = {
  startTime: string;
  goalAmount: string;
  kmInput: string;
  fuelPrice: string;
  consumption: string;
  uberInput: string;
  ninenineInput: string;
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

export type DailyLog = {
  id: number;
  userEmail: string;
  date: string;
  goalAmount: string;
  kmDriven: string;
  fuelCost: string;
  otherExpenses: string;
  grossEarnings: string;
  createdAt: string;
};

export type CampaignConfig = {
  raised: number;
  goalMax: number;
  notifyUrl: string;
  pixPayload: string;
  pixKey: string;
};

export type Milestone = {
  goal: number;
  label: string;
  amount: string;
  icon: string;
  brand: boolean;
};
