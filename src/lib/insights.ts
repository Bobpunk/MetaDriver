export function calculateFuelProjection(
  totalFuelLast30Days: number,
  daysWithRecords: number,
  horizonDays: number
): number | null {
  return calculateDailyProjection(
    totalFuelLast30Days,
    daysWithRecords,
    horizonDays
  );
}

export function calculateDailyProjection(
  totalLast30Days: number,
  daysWithRecords: number,
  horizonDays: number
): number | null {
  if (
    !Number.isFinite(totalLast30Days) ||
    !Number.isFinite(daysWithRecords) ||
    !Number.isFinite(horizonDays) ||
    totalLast30Days < 0 ||
    daysWithRecords <= 0 ||
    horizonDays <= 0
  ) {
    return null;
  }

  const dailyAverage = totalLast30Days / daysWithRecords;
  return dailyAverage * horizonDays;
}

export function calculateHistoricalRate(
  numerator: number,
  denominator: number
): number | null {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    numerator < 0 ||
    denominator <= 0
  ) {
    return null;
  }
  return numerator / denominator;
}

export function calculateWorkedCostPerKm(
  variableCosts: number,
  monthlyFixedCosts: number,
  annualFixedCosts: number,
  workedDays: number,
  kilometers: number
): number {
  const values = [
    variableCosts,
    monthlyFixedCosts,
    annualFixedCosts,
    workedDays,
    kilometers,
  ];
  if (
    values.some((value) => !Number.isFinite(value) || value < 0) ||
    kilometers === 0
  ) {
    return 0;
  }

  const fixedCostPerWorkedDay =
    monthlyFixedCosts / 30 + annualFixedCosts / 365;
  const costsAllocatedToWorkedDays =
    variableCosts + fixedCostPerWorkedDay * workedDays;

  return costsAllocatedToWorkedDays / kilometers;
}
