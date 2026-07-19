export type ProFeature =
  | "complete_costs"
  | "pro_net_calculations"
  | "earnings_insights";

export const PRO_FEATURES: Record<ProFeature, string> = {
  complete_costs: "Calculadora completa de custos",
  pro_net_calculations: "Lucro líquido real (com todos os custos)",
  earnings_insights: "Melhoria de até 30% dos ganhos",
};

export function canAccess(feature: ProFeature, isPro: boolean): boolean {
  return isPro;
}
