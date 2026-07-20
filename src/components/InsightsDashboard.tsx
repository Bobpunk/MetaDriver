"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Target,
  Flame,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
  Loader2,
} from "lucide-react";
import type { DailyLog } from "@/lib/types";
import { fetchLogs, saveLog, deleteLog } from "@/lib/daily-logs";
import { formatMoney } from "@/lib/driver";

type Period = "today" | "week" | "month" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
];

function toNum(s: string): number {
  return parseFloat(String(s).replace(",", ".")) || 0;
}

function within(year: number, month: number, day: number, date: Date) {
  if (date.getFullYear() !== year) return false;
  if (month >= 0 && date.getMonth() !== month) return false;
  if (day >= 0 && date.getDate() !== day) return false;
  return true;
}

function periodRange(period: Period, ref: Date): { start: Date; end: Date } {
  const start = new Date(ref);
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "year") {
    start.setMonth(0, 1);
  }
  return { start, end };
}

function periodLabel(period: Period, ref: Date): string {
  if (period === "today") {
    return ref.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  if (period === "week") {
    const { start, end } = periodRange(period, ref);
    return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  }
  if (period === "month") {
    return ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  return ref.toLocaleDateString("pt-BR", { year: "numeric" });
}

function shiftRef(ref: Date, period: Period, dir: -1 | 1): Date {
  const next = new Date(ref);
  if (period === "today") next.setDate(next.getDate() + dir);
  else if (period === "week") next.setDate(next.getDate() + 7 * dir);
  else if (period === "month") next.setMonth(next.getMonth() + dir);
  else next.setFullYear(next.getFullYear() + dir);
  return next;
}

function ptDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function shortDay(date: Date): string {
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

type FormState = {
  date: string;
  goal: string;
  km: string;
  fuel: string;
  other: string;
  gross: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function InsightsDashboard({
  email,
  prefillGoal,
  prefillKm,
  prefillFuel,
  prefillGross,
}: {
  email: string;
  prefillGoal: string;
  prefillKm: string;
  prefillFuel: string;
  prefillGross: string;
}) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");
  const [refDate, setRefDate] = useState<Date>(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [replaceWarning, setReplaceWarning] = useState("");
  const [confirmPending, setConfirmPending] = useState<{
    form: FormState;
    oldestLog: DailyLog;
  } | null>(null);
  const [form, setForm] = useState<FormState>({
    date: todayStr(),
    goal: "",
    km: "",
    fuel: "",
    other: "",
    gross: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetchLogs(email).then((res) => {
      if (res.ok && res.logs) setLogs(res.logs);
      setLoading(false);
    });
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      goal: prefillGoal,
      km: prefillKm,
      fuel: prefillFuel,
      gross: prefillGross,
      other: f.other || "",
    }));
  }, [prefillGoal, prefillKm, prefillFuel, prefillGross]);

  const filtered = useMemo(() => {
    const { start, end } = periodRange(period, refDate);
    return logs
      .filter((l) => {
        const d = new Date(l.date + "T00:00:00");
        return d >= start && d <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, period, refDate]);

  const stats = useMemo(() => {
    let gross = 0;
    let fuel = 0;
    let other = 0;
    let km = 0;
    let goalSum = 0;
    let bestDay: { date: string; net: number } | null = null;
    let bestStreak = 0;
    let currentStreak = 0;

    filtered.forEach((l) => {
      const g = toNum(l.grossEarnings);
      const f = toNum(l.fuelCost);
      const o = toNum(l.otherExpenses);
      const net = g - f - o;
      gross += g;
      fuel += f;
      other += o;
      km += toNum(l.kmDriven);
      goalSum += toNum(l.goalAmount);
      if (!bestDay || net > bestDay.net) bestDay = { date: l.date, net };

      if (net > 0) {
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    const net = gross - fuel - other;
    const goalHit = goalSum > 0 ? gross >= goalSum : false;
    const achievement = goalSum > 0 ? Math.min(100, (gross / goalSum) * 100) : 0;

    return {
      gross,
      net,
      fuel,
      other,
      km,
      goalSum,
      count: filtered.length,
      bestDay,
      bestStreak,
      achievement,
      goalHit,
    };
  }, [filtered]);

  const chartData = useMemo(() => {
    return filtered.map((l) => {
      const g = toNum(l.grossEarnings);
      const f = toNum(l.fuelCost);
      const o = toNum(l.otherExpenses);
      const net = g - f - o;
      const goal = toNum(l.goalAmount);
      return {
        date: ptDate(l.date),
        net: Math.round(net * 100) / 100,
        gross: Math.round(g * 100) / 100,
        goal: Math.round(goal * 100) / 100,
      };
    });
  }, [filtered]);

  const weekdayData = useMemo(() => {
    const buckets: { label: string; net: number; count: number }[] = [];
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    days.forEach((d) => buckets.push({ label: d, net: 0, count: 0 }));
    filtered.forEach((l) => {
      const d = new Date(l.date + "T00:00:00").getDay();
      const net = toNum(l.grossEarnings) - toNum(l.fuelCost) - toNum(l.otherExpenses);
      buckets[d].net += net;
      buckets[d].count += 1;
    });
    return buckets.map((b) => ({
      label: b.label,
      net: Math.round((b.count > 0 ? b.net / b.count : 0) * 100) / 100,
    }));
  }, [filtered]);

  function openNewForm() {
    setEditingId(null);
    setForm({
      date: todayStr(),
      goal: prefillGoal,
      km: prefillKm,
      fuel: prefillFuel,
      other: "",
      gross: prefillGross,
    });
    setShowForm(true);
  }

  function openEditForm(log: DailyLog) {
    setEditingId(log.id);
    setForm({
      date: log.date,
      goal: log.goalAmount,
      km: log.kmDriven,
      fuel: log.fuelCost,
      other: log.otherExpenses,
      gross: log.grossEarnings,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setReplaceWarning("");
    const payload = {
      userEmail: email,
      date: form.date,
      goalAmount: form.goal,
      kmDriven: form.km,
      fuelCost: form.fuel,
      otherExpenses: form.other,
      grossEarnings: form.gross,
    };
    const res = await saveLog(payload);
    setSaving(false);
    if (res.ok) {
      if (res.replaced) {
        setReplaceWarning("Limite de 3 registros por dia. O registro mais antigo foi substituído.");
        setTimeout(() => setReplaceWarning(""), 5000);
      }
      closeForm();
      load();
    } else if (res.code === "MAX_LOGS" && res.oldestLog) {
      setConfirmPending({ form: { ...form }, oldestLog: res.oldestLog });
    } else {
      setError(res.error || "Erro ao salvar.");
    }
  }

  async function handleConfirmReplace() {
    if (!confirmPending) return;
    const { form: f } = confirmPending;
    setConfirmPending(null);
    setSaving(true);
    const res = await saveLog({
      userEmail: email,
      date: f.date,
      goalAmount: f.goal,
      kmDriven: f.km,
      fuelCost: f.fuel,
      otherExpenses: f.other,
      grossEarnings: f.gross,
      confirmReplace: true,
    });
    setSaving(false);
    if (res.ok) {
      setReplaceWarning("Registro mais antigo substituído.");
      setTimeout(() => setReplaceWarning(""), 5000);
      closeForm();
      load();
    } else {
      setError(res.error || "Erro ao salvar.");
    }
  }

  function handleCancelReplace() {
    setConfirmPending(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este registro?")) return;
    const res = await deleteLog(id);
    if (res.ok) load();
  }

  const isTodayInPeriod = useMemo(() => {
    const now = new Date();
    const { start, end } = periodRange(period, refDate);
    return now >= start && now <= end;
  }, [period, refDate]);

  let bestDayBlock: React.ReactNode = null;
  if (stats.bestDay && stats.count > 1) {
    const bd: { date: string; net: number } = stats.bestDay;
    bestDayBlock = (
      <div className="bg-gradient-to-br from-emerald-900/30 to-slate-800 rounded-xl p-3 shadow-lg border border-emerald-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Flame size={14} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-[9px] text-emerald-400 uppercase font-bold">Melhor dia</div>
            <div className="text-[11px] font-bold text-white">{ptDate(bd.date)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-slate-400 uppercase font-bold">Líquido</div>
          <div className="text-sm font-black text-emerald-400">{formatMoney(bd.net)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header: Period selector + navigation */}
      <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700/50">
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 mb-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              type="button"
              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                period === p.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setRefDate((r) => shiftRef(r, period, -1))}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-white capitalize">
              {periodLabel(period, refDate)}
            </span>
            {!isTodayInPeriod && (
              <button
                onClick={() => setRefDate(new Date())}
                type="button"
                className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider mt-0.5"
              >
                Voltar pra hoje
              </button>
            )}
          </div>
          <button
            onClick={() => setRefDate((r) => shiftRef(r, period, 1))}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* New record button */}
      <button
        onClick={openNewForm}
        type="button"
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[11px] font-bold py-2.5 rounded-xl shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 transition-all active:scale-95 border border-white/10"
      >
        <Plus size={14} /> Adicionar Registro
      </button>

      {replaceWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[10px] text-amber-400 font-bold text-center flex items-center justify-center gap-2">
          <Trash2 size={12} /> {replaceWarning}
        </div>
      )}

      {loading ? (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 text-center">
          <Loader2 className="animate-spin mx-auto text-slate-400" size={20} />
          <p className="text-[10px] text-slate-500 mt-2">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 text-center">
          <div className="text-slate-500 mb-2">
            <Calendar size={28} className="mx-auto opacity-50" />
          </div>
          <p className="text-[11px] text-slate-400 font-bold mb-1">
            Nenhum registro neste período
          </p>
          <p className="text-[9px] text-slate-500">
            Adicione um novo registro para começar a ver suas estatísticas
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2">
            <KpiCard
              label="Líquido"
              value={formatMoney(stats.net)}
              tone={stats.net >= 0 ? "positive" : "negative"}
              icon={stats.net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            />
            <KpiCard
              label="Bruto"
              value={formatMoney(stats.gross)}
              tone="neutral"
              icon={<Wallet size={12} />}
            />
            <KpiCard
              label="Despesas"
              value={formatMoney(stats.fuel + stats.other)}
              tone="negative"
              icon={<TrendingDown size={12} />}
            />
            <KpiCard
              label="Registros"
              value={String(stats.count)}
              tone="neutral"
              icon={<Calendar size={12} />}
            />
          </div>

          {/* Goal achievement bar */}
          {stats.goalSum > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 shadow-lg border border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Target size={11} /> Meta do Período
                </div>
                <div
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stats.goalHit
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "bg-blue-600/20 text-blue-400"
                  }`}
                >
                  {stats.goalHit ? "BATIDA" : `${stats.achievement.toFixed(0)}%`}
                </div>
              </div>
              <div className="flex justify-between items-end mb-1.5">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Realizado</div>
                  <div className="text-sm font-black text-white">
                    {formatMoney(stats.gross)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Meta</div>
                  <div className="text-sm font-bold text-slate-300">
                    {formatMoney(stats.goalSum)}
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.achievement}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    stats.goalHit
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                      : "bg-gradient-to-r from-blue-600 to-cyan-500"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Net profit chart */}
          {chartData.length > 1 && (
            <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <TrendingUp size={11} /> Evolução do Lucro
              </h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 8,
                      fontSize: 10,
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#94a3b8", fontSize: 9 }}
                    formatter={(value) => formatMoney(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#netGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekday performance chart */}
          {period !== "today" && weekdayData.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Flame size={11} /> Média por Dia da Semana
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weekdayData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 8,
                      fontSize: 10,
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#94a3b8", fontSize: 9 }}
                    formatter={(value) => formatMoney(Number(value))}
                  />
                  <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                    {weekdayData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.net >= 0 ? "#3b82f6" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {bestDayBlock}

          {/* History list */}
          <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700/50">
            <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">
              Histórico
            </h3>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
              {[...filtered].reverse().map((log) => {
                const g = toNum(log.grossEarnings);
                const f = toNum(log.fuelCost);
                const o = toNum(log.otherExpenses);
                const net = g - f - o;
                const goal = toNum(log.goalAmount);
                const progress = goal > 0 ? Math.min(100, (g / goal) * 100) : 0;
                return (
                  <div
                    key={log.id}
                    className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-200">
                        {ptDate(log.date)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(log)}
                          className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          aria-label="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        <span>
                          Bruto <strong className="text-white">{formatMoney(g)}</strong>
                        </span>
                        <span>
                          Líq{" "}
                          <strong className={net >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {formatMoney(net)}
                          </strong>
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {toNum(log.kmDriven).toFixed(0)} km
                      </span>
                    </div>
                    {goal > 0 && (
                      <div className="mt-1.5 w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            progress >= 100 ? "bg-emerald-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Confirm Replace Modal */}
      <AnimatePresence>
        {confirmPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Limite de registros</h3>
              <p className="text-[11px] text-slate-400 mb-2">
                Máximo de <strong className="text-white">3 registros</strong> por dia.
              </p>
              <p className="text-[10px] text-slate-500 mb-4">
                O registro mais antigo deste dia será substituído.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelReplace}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-2.5 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReplace}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-2.5 rounded-lg transition-all"
                >
                  Substituir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
            onClick={closeForm}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">
                  {editingId ? "Editar Registro" : "Novo Registro"}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-[10px] text-red-400 font-bold text-center">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">
                    Data
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    label="Meta (R$)"
                    value={form.goal}
                    onChange={(v) => setForm({ ...form, goal: v })}
                  />
                  <FormField
                    label="KM Rodados"
                    value={form.km}
                    onChange={(v) => setForm({ ...form, km: v })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    label="Gasolina (R$)"
                    value={form.fuel}
                    onChange={(v) => setForm({ ...form, fuel: v })}
                  />
                  <FormField
                    label="Outras (R$)"
                    value={form.other}
                    onChange={(v) => setForm({ ...form, other: v })}
                  />
                </div>
                <FormField
                  label="Ganho Bruto (R$)"
                  value={form.gross}
                  onChange={(v) => setForm({ ...form, gross: v })}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2.5 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> Salvar
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-400 border-emerald-700/40"
      : tone === "negative"
        ? "text-red-400 border-red-700/40"
        : "text-blue-400 border-blue-700/40";
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-slate-800 rounded-xl p-2.5 shadow-lg border ${toneClass}`}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className={toneClass.split(" ")[0]}>{icon}</span>
        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
          {label}
        </span>
      </div>
      <div className={`text-sm font-black ${toneClass.split(" ")[0]}`}>{value}</div>
    </motion.div>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 outline-none"
      />
    </div>
  );
}
