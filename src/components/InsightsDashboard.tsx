"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Calculator,
  CalendarDays,
  Car,
  Clock3,
  CircleCheck,
  Fuel,
  Gauge,
  Landmark,
  MapPinned,
  MoreHorizontal,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
  Wrench,
} from "lucide-react";
import { fetchLogs } from "@/lib/daily-logs";
import { formatMoney } from "@/lib/driver";
import type { DailyLog } from "@/lib/types";
import { fetchSettings } from "@/lib/user-settings";
import type { AppSettings } from "./SettingsPanel";

type Period = "today" | "week" | "month";

const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "today", label: "Hoje", days: 1 },
  { id: "week", label: "7 dias", days: 7 },
  { id: "month", label: "30 dias", days: 30 },
];

function numberValue(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number.parseFloat(String(value ?? "").replace(",", ".")) || 0;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeFor(period: Period, now = new Date()) {
  const days = PERIODS.find((item) => item.id === period)?.days ?? 1;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end, days };
}

function formatWorkedTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function countFixedWorkDays(workDays: boolean[], days: number, from = new Date()) {
  let count = 0;
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);
  for (let index = 0; index < days; index += 1) {
    if (workDays[cursor.getDay()]) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

type CostItem = {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
};

export function InsightsDashboard({
  email,
  onOpenSettings,
}: {
  email: string;
  onOpenSettings: () => void;
}) {
  const [period, setPeriod] = useState<Period>("today");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [logsResult, settingsResult] = await Promise.all([
      fetchLogs(email),
      fetchSettings(),
    ]);
    if (logsResult.ok) setLogs(logsResult.logs ?? []);
    else setError(logsResult.error || "Não foi possível carregar o resumo.");
    if (settingsResult.ok) setSettings(settingsResult.settings ?? null);
    setLoading(false);
  }, [email]);

  useEffect(() => {
    void load();
  }, [load]);

  const report = useMemo(() => {
    const { start, end, days } = rangeFor(period);
    const filtered = logs.filter((log) => {
      const date = new Date(`${log.date}T12:00:00`);
      return date >= start && date <= end;
    });
    const workedDates = new Set(filtered.map((log) => log.date));

    const gross = filtered.reduce(
      (total, log) => total + numberValue(log.grossEarnings),
      0
    );
    const fuel = filtered.reduce(
      (total, log) => total + numberValue(log.fuelCost),
      0
    );
    const journeyExpenses = filtered.reduce(
      (total, log) => total + numberValue(log.otherExpenses),
      0
    );
    const km = filtered.reduce(
      (total, log) => total + numberValue(log.kmDriven),
      0
    );
    const workedMs = filtered.reduce(
      (total, log) => total + numberValue(log.workedMs),
      0
    );

    const costs = settings?.costs;
    const financing = (numberValue(costs?.financing) / 30) * days;
    const maintenance = (numberValue(costs?.maintenance) / 30) * days;
    const insurance = (numberValue(costs?.insurance) / 30) * days;
    const otherMonthly = (numberValue(costs?.otherMonthly) / 30) * days;
    const emergencyFund = (numberValue(costs?.emergencyFund) / 30) * days;
    const leisure = (numberValue(costs?.leisure) / 30) * days;
    const annualTaxes = (numberValue(costs?.annualTaxes) / 365) * days;
    const monthlyCosts =
      numberValue(costs?.financing) +
      numberValue(costs?.maintenance) +
      numberValue(costs?.insurance) +
      numberValue(costs?.otherMonthly) +
      numberValue(costs?.emergencyFund) +
      numberValue(costs?.leisure);
    const fixedCosts30 = monthlyCosts + (numberValue(costs?.annualTaxes) / 365) * 30;

    const costItems: CostItem[] = [
      { key: "fuel", label: "Combustível", value: fuel, icon: <Fuel size={19} /> },
      {
        key: "financing",
        label: "Financiamento",
        value: financing,
        icon: <Landmark size={19} />,
      },
      {
        key: "maintenance",
        label: "Manutenção",
        value: maintenance,
        icon: <Wrench size={19} />,
      },
      {
        key: "insurance",
        label: "Seguro",
        value: insurance,
        icon: <ShieldCheck size={19} />,
      },
      {
        key: "other",
        label: "Outros custos",
        value: otherMonthly,
        icon: <MoreHorizontal size={19} />,
      },
      {
        key: "emergency",
        label: "Fundo de emergência",
        value: emergencyFund,
        icon: <PiggyBank size={19} />,
      },
      {
        key: "leisure",
        label: "Lazer",
        value: leisure,
        icon: <WalletCards size={19} />,
      },
      {
        key: "annual",
        label: "Taxas anuais",
        value: annualTaxes,
        icon: <ReceiptText size={19} />,
      },
    ];
    if (journeyExpenses > 0) {
      costItems.splice(1, 0, {
        key: "journey",
        label: "Despesas das jornadas",
        value: journeyExpenses,
        icon: <Banknote size={19} />,
      });
    }

    const totalCosts = costItems.reduce((total, item) => total + item.value, 0);
    const balance = gross - totalCosts;
    const workedHours = workedMs / 3600000;

    const workDays = settings?.work.workDays ?? [];
    const selectedWorkDays = workDays.filter(Boolean).length;
    const configuredCycleWork = numberValue(settings?.work.cycleWorkDays);
    const configuredCycleRest = numberValue(settings?.work.cycleRestDays);
    const rotatingSchedule =
      settings?.work.scheduleMode === "rotation" &&
      configuredCycleWork > 0 &&
      configuredCycleRest > 0;
    const expectedDaysPerWeek = rotatingSchedule
      ? (7 * configuredCycleWork) /
        (configuredCycleWork + configuredCycleRest)
      : selectedWorkDays;
    const dailyGoal =
      expectedDaysPerWeek > 0
        ? numberValue(settings?.work.weeklyGoal) / expectedDaysPerWeek
        : 0;
    let goal = 0;
    const goalsByDate = new Map<string, number>();
    filtered.forEach((log) => {
      const value = numberValue(log.goalAmount);
      if (value > 0) goalsByDate.set(log.date, value);
    });
    if (rotatingSchedule) {
      goal =
        dailyGoal *
        ((days * configuredCycleWork) /
          (configuredCycleWork + configuredCycleRest));
    } else {
      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const key = localDateKey(cursor);
        const storedGoal = goalsByDate.get(key);
        if (storedGoal !== undefined) goal += storedGoal;
        else if (workDays[cursor.getDay()]) goal += dailyGoal;
      }
    }

    const historyRange = rangeFor("month");
    const historyLogs = logs.filter((log) => {
      const date = new Date(`${log.date}T12:00:00`);
      return date >= historyRange.start && date <= historyRange.end;
    });
    const historyDates = new Set(historyLogs.map((log) => log.date));
    const historicalFuel = historyLogs.reduce(
      (total, log) => total + numberValue(log.fuelCost),
      0
    );
    const averageFuel =
      historyDates.size > 0 ? historicalFuel / historyDates.size : 0;

    const scheduleMode = settings?.work.scheduleMode ?? "fixed";
    const cycleWorkDays = configuredCycleWork;
    const cycleRestDays = configuredCycleRest;
    const validRotation =
      scheduleMode === "rotation" && cycleWorkDays > 0 && cycleRestDays > 0;
    const validFixed = scheduleMode === "fixed" && selectedWorkDays > 0;
    const expectedWorkDays30 = validRotation
      ? (30 * cycleWorkDays) / (cycleWorkDays + cycleRestDays)
      : validFixed
        ? countFixedWorkDays(workDays, 30)
        : 0;
    const expectedWorkDaysInPeriod = validRotation
      ? (days * cycleWorkDays) / (cycleWorkDays + cycleRestDays)
      : validFixed
        ? countFixedWorkDays(workDays, days)
        : 0;
    const profileReady = fixedCosts30 > 0 && expectedWorkDays30 > 0;
    const requiredAfterFuel =
      profileReady ? fixedCosts30 / expectedWorkDays30 : 0;
    const requiredGross =
      historyDates.size > 0 ? requiredAfterFuel + averageFuel : 0;
    const averageActualGross =
      workedDates.size > 0 ? gross / workedDates.size : 0;
    const dailyDifference =
      requiredGross > 0 ? averageActualGross - requiredGross : 0;
    const performanceRatio =
      requiredGross > 0 ? averageActualGross / requiredGross : 0;
    const projectionStatus: Projection["projectionStatus"] =
      performanceRatio >= 1
        ? "positive"
        : performanceRatio >= 0.9
          ? "warning"
          : "negative";

    return {
      days,
      gross,
      fuel,
      km,
      workedMs,
      hourlyGross: workedHours > 0 ? gross / workedHours : 0,
      grossPerKm: km > 0 ? gross / km : 0,
      costPerKm: km > 0 ? totalCosts / km : 0,
      totalCosts,
      balance,
      goal,
      goalProgress: goal > 0 ? Math.min((gross / goal) * 100, 100) : 0,
      costItems,
      hasJourneys: filtered.length > 0,
      projection: {
        profileReady,
        hasFuelHistory: historyDates.size > 0,
        historyDays: historyDates.size,
        expectedWorkDays30,
        requiredAfterFuel,
        requiredGross,
        averageFuel,
        averageActualGross,
        dailyDifference,
        projectionStatus,
        periodRequired:
          requiredGross *
          (period === "today" ? 1 : expectedWorkDaysInPeriod),
      },
    };
  }, [logs, period, settings]);

  const periodName =
    period === "today" ? "hoje" : period === "week" ? "7 dias" : "30 dias";
  const summaryLabel = period === "today" ? "Saldo do dia" : "Saldo do período";
  const goalLabel =
    period === "today" ? "Meta diária" : `Meta de ${periodName}`;

  return (
    <section data-tour="dashboard" className="flex flex-col gap-3 pb-3" aria-label="Resumo financeiro">
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
          <TrendingUp size={25} aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <h1 className="text-xl font-black tracking-tight text-white">
            META<span className="text-blue-500">DRIVER</span>
          </h1>
          <span className="text-base font-bold text-slate-100">Resumo</span>
        </div>
      </div>

      <div
        className="flex min-h-12 overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
        role="group"
        aria-label="Período do resumo"
      >
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPeriod(item.id)}
            aria-pressed={period === item.id}
            className={`min-h-12 flex-1 border-r border-slate-700 px-2 text-sm font-semibold transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${
              period === item.id
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="rounded-xl bg-slate-800 p-5 text-center">
          <p className="text-sm font-semibold text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-slate-800 p-4 shadow-sm">
            <div className="grid grid-cols-3 divide-x divide-slate-700">
              <SummaryValue
                label={summaryLabel}
                value={formatMoney(report.balance)}
                tone={report.balance >= 0 ? "positive" : "negative"}
              />
              <SummaryValue label="Faturamento bruto" value={formatMoney(report.gross)} />
              <SummaryValue
                label="Custos totais"
                value={formatMoney(report.totalCosts)}
                tone="negative"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-800 p-4 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">{goalLabel}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  <strong className="text-blue-400">{formatMoney(report.gross)}</strong>
                  {" de "}
                  {formatMoney(report.goal)}
                </p>
              </div>
              <strong className="text-3xl font-black text-blue-500">
                {Math.round(report.goalProgress)}%
              </strong>
            </div>
            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-700"
              role="progressbar"
              aria-label={goalLabel}
              aria-valuenow={Math.round(report.goalProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                style={{ width: `${report.goalProgress}%` }}
              />
            </div>
          </div>

          <ProjectionPanel
            projection={report.projection}
            period={period}
            onOpenSettings={onOpenSettings}
          />

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Gauge size={19} />}
              label="Hora bruta"
              value={`${formatMoney(report.hourlyGross)}/h`}
            />
            <MetricCard
              icon={<Clock3 size={19} />}
              label="Tempo trabalhado"
              value={formatWorkedTime(report.workedMs)}
            />
            <MetricCard
              icon={<MapPinned size={19} />}
              label="Ganho por km"
              value={`${formatMoney(report.grossPerKm)}/km`}
            />
            <MetricCard
              icon={<Fuel size={19} />}
              label="Custo por km"
              value={`${formatMoney(report.costPerKm)}/km`}
              cost
            />
            <MetricCard
              icon={<Car size={19} />}
              label="Quilômetros"
              value={`${report.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`}
            />
            <MetricCard
              icon={<Fuel size={19} />}
              label="Combustível"
              value={formatMoney(report.fuel)}
              cost
            />
          </div>

          <div className="rounded-xl bg-slate-800 p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-base font-bold text-white">
                Custos {period === "today" ? "de hoje" : `em ${periodName}`}
              </h2>
              <span className="max-w-32 text-right text-[11px] leading-tight text-slate-400">
                Somente jornadas encerradas
              </span>
            </div>
            <div className="space-y-4">
              {report.costItems.map((item) => (
                <CostRow key={item.key} item={item} total={report.totalCosts} />
              ))}
            </div>
          </div>

          {!report.hasJourneys && (
            <div className="flex items-start gap-3 rounded-xl bg-blue-500/10 p-4 text-blue-100">
              <CalendarDays className="mt-0.5 shrink-0 text-blue-400" size={18} />
              <p className="text-sm leading-relaxed">
                Nenhuma jornada encerrada neste período. Os custos fixos continuam
                sendo considerados para mostrar o resultado real.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

type Projection = {
  profileReady: boolean;
  hasFuelHistory: boolean;
  historyDays: number;
  expectedWorkDays30: number;
  requiredAfterFuel: number;
  requiredGross: number;
  averageFuel: number;
  averageActualGross: number;
  dailyDifference: number;
  projectionStatus: "positive" | "warning" | "negative";
  periodRequired: number;
};

function ProjectionPanel({
  projection,
  period,
  onOpenSettings,
}: {
  projection: Projection;
  period: Period;
  onOpenSettings: () => void;
}) {
  if (!projection.profileReady) {
    return (
      <div className="rounded-xl bg-slate-800 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Mínimo para não trabalhar no prejuízo
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Complete seus custos e sua escala para calcular quanto precisa fazer.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-4 min-h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Completar perfil financeiro
        </button>
      </div>
    );
  }

  if (!projection.hasFuelHistory) {
    return (
      <div className="rounded-xl bg-slate-800 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Projeção aguardando combustível
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Encerre a primeira jornada para estimarmos o bruto necessário com
              base no seu consumo real.
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-slate-900 p-3 text-sm text-slate-300">
          Após combustível necessário:{" "}
          <strong className="text-white">
            {formatMoney(projection.requiredAfterFuel)}/dia
          </strong>
        </p>
      </div>
    );
  }

  const statusClass =
    projection.projectionStatus === "positive"
      ? "bg-emerald-500/10 text-emerald-300"
      : projection.projectionStatus === "warning"
        ? "bg-amber-500/10 text-amber-300"
        : "bg-red-500/10 text-red-300";
  const StatusIcon =
    projection.projectionStatus === "positive" ? CircleCheck : AlertTriangle;
  const periodLabel =
    period === "today" ? "hoje" : period === "week" ? "em 7 dias" : "em 30 dias";

  return (
    <div className="rounded-xl bg-slate-800 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Mínimo para não trabalhar no prejuízo
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            {projection.historyDays < 7
              ? `Estimativa inicial · ${projection.historyDays} dia${projection.historyDays === 1 ? "" : "s"} de histórico`
              : "Baseado nos últimos 30 dias"}
          </p>
        </div>
        <Calculator className="shrink-0 text-blue-400" size={21} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-900 p-3">
          <p className="text-[11px] leading-tight text-slate-400">
            Após combustível necessário
          </p>
          <p className="mt-1 text-base font-black text-white">
            {formatMoney(projection.requiredAfterFuel)}
            <span className="text-xs font-semibold text-slate-400">/dia</span>
          </p>
        </div>
        <div className="rounded-lg bg-blue-500/10 p-3">
          <p className="text-[11px] leading-tight text-blue-200">
            Bruto necessário estimado
          </p>
          <p className="mt-1 text-base font-black text-blue-400">
            {formatMoney(projection.requiredGross)}
            <span className="text-xs font-semibold text-blue-300">/dia</span>
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-slate-700 pt-3 text-sm">
        <ProjectionLine
          label="Combustível médio"
          value={`${formatMoney(projection.averageFuel)}/dia`}
        />
        <ProjectionLine
          label="Sua média no período"
          value={`${formatMoney(projection.averageActualGross)}/dia`}
        />
        <ProjectionLine
          label={`Necessário ${periodLabel}`}
          value={formatMoney(projection.periodRequired)}
        />
        <ProjectionLine
          label="Dias previstos nos próximos 30"
          value={projection.expectedWorkDays30.toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
          })}
        />
      </div>

      <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 ${statusClass}`}>
        <StatusIcon size={18} className="shrink-0" />
        <p className="text-sm font-semibold">
          {projection.dailyDifference >= 0
            ? `${formatMoney(projection.dailyDifference)} acima do mínimo por dia`
            : `${formatMoney(Math.abs(projection.dailyDifference))} abaixo do mínimo por dia`}
        </p>
      </div>
    </div>
  );
}

function ProjectionLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <strong className="text-right text-slate-100">{value}</strong>
    </div>
  );
}

function SummaryValue({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-white";
  return (
    <div className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
      <p className="min-h-8 text-[10px] leading-tight text-slate-400 sm:text-xs">{label}</p>
      <p className={`mt-1 truncate text-sm font-black sm:text-base ${toneClass}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  cost = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  cost?: boolean;
}) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-xl bg-slate-800 p-3 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          cost ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] leading-tight text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-bold leading-tight text-white">{value}</p>
      </div>
    </div>
  );
}

function CostRow({ item, total }: { item: CostItem; total: number }) {
  const pct = percentage(item.value, total);
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-semibold text-slate-100">{item.label}</span>
          <span className="shrink-0 text-sm font-bold text-white">{formatMoney(item.value)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-red-400">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3" aria-label="Carregando resumo">
      <div className="h-28 animate-pulse rounded-xl bg-slate-800" />
      <div className="h-32 animate-pulse rounded-xl bg-slate-800" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-800" />
    </div>
  );
}
