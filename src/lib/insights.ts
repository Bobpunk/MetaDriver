export function calculateFuelProjection(
  totalFuelLast30Days: number,
  daysWithRecords: number,
  horizonDays: number
): number | null {
  if (
    !Number.isFinite(totalFuelLast30Days) ||
    !Number.isFinite(daysWithRecords) ||
    !Number.isFinite(horizonDays) ||
    totalFuelLast30Days < 0 ||
    daysWithRecords <= 0 ||
    horizonDays <= 0
  ) {
    return null;
  }

  const dailyAverage = totalFuelLast30Days / daysWithRecords;
  return dailyAverage * horizonDays;
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
