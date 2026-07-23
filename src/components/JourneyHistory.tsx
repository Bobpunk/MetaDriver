"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Fuel,
  MapPinned,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { fetchLogs, updateLog } from "@/lib/daily-logs";
import { formatMoney } from "@/lib/driver";
import type { DailyLog } from "@/lib/types";

type EditForm = {
  date: string;
  grossEarnings: string;
  goalAmount: string;
  kmDriven: string;
  fuelCost: string;
  otherExpenses: string;
  workedHours: string;
  workedMinutes: string;
};

function numberValue(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number.parseFloat(String(value ?? "").replace(",", ".")) || 0;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatWorkedTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}min`;
}

function dateLabel(dateKey: string): { day: string; weekday: string; full: string } {
  const date = new Date(`${dateKey}T12:00:00`);
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
    weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
      .format(date)
      .replace(".", ""),
    full: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
    }).format(date),
  };
}

export function JourneyHistory({ email }: { email: string }) {
  const availableMonths = useMemo(() => {
    const current = new Date();
    current.setDate(1);
    current.setHours(12, 0, 0, 0);
    const previous = new Date(current);
    previous.setMonth(previous.getMonth() - 1);
    return [current, previous];
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(0);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<DailyLog | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const result = await fetchLogs(email);
    if (result.ok) setLogs(result.logs ?? []);
    else setLoadError(result.error || "Não foi possível carregar o histórico.");
    setLoading(false);
  }, [email]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthLogs = useMemo(() => {
    const key = monthKey(availableMonths[selectedMonth]);
    return logs
      .filter((log) => log.date.startsWith(key))
      .sort(
        (first, second) =>
          second.date.localeCompare(first.date) || second.id - first.id
      );
  }, [availableMonths, logs, selectedMonth]);

  const groupedLogs = useMemo(() => {
    const groups = new Map<string, DailyLog[]>();
    monthLogs.forEach((log) => {
      groups.set(log.date, [...(groups.get(log.date) ?? []), log]);
    });
    return Array.from(groups.entries());
  }, [monthLogs]);

  const logsByDate = useMemo(
    () => new Map(groupedLogs),
    [groupedLogs]
  );

  const calendarDays = useMemo(() => {
    const month = availableMonths[selectedMonth];
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1, 12).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0, 12).getDate();
    const cells: Array<string | null> = Array.from(
      { length: firstWeekday },
      () => null
    );
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(
        `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      );
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [availableMonths, selectedMonth]);

  const monthSummary = useMemo(() => {
    const gross = monthLogs.reduce(
      (total, log) => total + numberValue(log.grossEarnings),
      0
    );
    const workedMs = monthLogs.reduce(
      (total, log) => total + numberValue(log.workedMs),
      0
    );
    return {
      gross,
      workedMs,
      hourly: workedMs > 0 ? gross / (workedMs / 3600000) : 0,
    };
  }, [monthLogs]);

  function beginEdit(log: DailyLog) {
    setSelectedDate(null);
    const totalMinutes = Math.floor(numberValue(log.workedMs) / 60000);
    setEditing(log);
    setForm({
      date: log.date,
      grossEarnings: log.grossEarnings,
      goalAmount: log.goalAmount,
      kmDriven: log.kmDriven,
      fuelCost: log.fuelCost,
      otherExpenses: log.otherExpenses,
      workedHours: String(Math.floor(totalMinutes / 60)),
      workedMinutes: String(totalMinutes % 60),
    });
    setSaveError("");
  }

  function closeEdit() {
    if (saving) return;
    setEditing(null);
    setForm(null);
    setSaveError("");
  }

  function changeField(field: keyof EditForm, value: string) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  async function saveEdit() {
    if (!editing || !form) return;
    const hours = Number(form.workedHours);
    const minutes = Number(form.workedMinutes);
    const values = [
      form.grossEarnings,
      form.goalAmount,
      form.kmDriven,
      form.fuelCost,
      form.otherExpenses,
    ].map(numberValue);

    if (!form.date) {
      setSaveError("Informe a data da jornada.");
      return;
    }
    if (
      values.some((value) => value < 0) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59
    ) {
      setSaveError("Revise os valores. Os minutos devem ficar entre 0 e 59.");
      return;
    }

    setSaving(true);
    setSaveError("");
    const result = await updateLog({
      id: editing.id,
      date: form.date,
      grossEarnings: String(values[0]),
      goalAmount: String(values[1]),
      kmDriven: String(values[2]),
      fuelCost: String(values[3]),
      otherExpenses: String(values[4]),
      workedMs: String((hours * 60 + minutes) * 60000),
    });
    setSaving(false);

    if (!result.ok || !result.log) {
      setSaveError(result.error || "Não foi possível salvar as alterações.");
      return;
    }

    setLogs((current) =>
      current.map((log) => (log.id === result.log?.id ? result.log : log))
    );
    setSavedId(result.log.id);
    setEditing(null);
    setForm(null);
    window.setTimeout(() => setSavedId(null), 2500);
  }

  return (
    <section data-tour="history" className="flex flex-col gap-3 pb-4" aria-label="Histórico de jornadas">
      <header className="flex items-center gap-3 px-1 py-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
          <CalendarRange size={24} />
        </div>
        <div>
          <h1 className="text-lg font-black text-white">Histórico</h1>
          <p className="text-xs text-slate-400">Consulte e corrija suas jornadas</p>
        </div>
      </header>

      <nav
        className="grid grid-cols-[3rem_1fr_3rem] items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
        aria-label="Navegação por mês"
      >
        <button
          type="button"
          onClick={() => {
            setSelectedDate(null);
            setSelectedMonth(1);
          }}
          disabled={selectedMonth === 1}
          className="flex min-h-12 items-center justify-center border-r border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          aria-label="Ver mês anterior"
        >
          <ChevronLeft size={19} />
        </button>
        <strong className="text-center text-sm text-white">
          {monthLabel(availableMonths[selectedMonth])}
        </strong>
        <button
          type="button"
          onClick={() => {
            setSelectedDate(null);
            setSelectedMonth(0);
          }}
          disabled={selectedMonth === 0}
          className="flex min-h-12 items-center justify-center border-l border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          aria-label="Ver mês atual"
        >
          <ChevronRight size={19} />
        </button>
      </nav>

      {!loading && !loadError && monthLogs.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-slate-700 rounded-xl bg-slate-800 p-4">
          <Summary label="Faturamento" value={formatMoney(monthSummary.gross)} />
          <Summary label="Hora bruta" value={`${formatMoney(monthSummary.hourly)}/h`} />
          <Summary label="Tempo" value={formatWorkedTime(monthSummary.workedMs)} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-label="Carregando histórico">
          <div className="h-80 animate-pulse rounded-xl bg-slate-800" />
        </div>
      ) : loadError ? (
        <div className="rounded-xl bg-slate-800 p-5 text-center">
          <p className="text-sm text-red-300">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <MonthCalendar
          days={calendarDays}
          logsByDate={logsByDate}
          onSelect={setSelectedDate}
        />
      )}

      <p className="px-1 text-center text-[11px] leading-relaxed text-slate-500">
        Disponível para o mês atual e o mês anterior. Cada jornada é editada
        separadamente.
      </p>

      {editing && form && (
        <EditSheet
          log={editing}
          form={form}
          saving={saving}
          error={saveError}
          onChange={changeField}
          onClose={closeEdit}
          onSave={() => void saveEdit()}
        />
      )}

      {selectedDate && logsByDate.has(selectedDate) && (
        <DayJourneysSheet
          date={selectedDate}
          logs={logsByDate.get(selectedDate) ?? []}
          savedId={savedId}
          onClose={() => setSelectedDate(null)}
          onEdit={beginEdit}
        />
      )}
    </section>
  );
}

function MonthCalendar({
  days,
  logsByDate,
  onSelect,
}: {
  days: Array<string | null>;
  logsByDate: Map<string, DailyLog[]>;
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 p-3 shadow-xl">
      <div className="mb-2 grid grid-cols-7">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} className="aspect-square" />;
          }
          const dayLogs = logsByDate.get(date) ?? [];
          const worked = dayLogs.length > 0;
          const gross = dayLogs.reduce(
            (total, log) => total + numberValue(log.grossEarnings),
            0
          );

          return (
            <button
              key={date}
              type="button"
              disabled={!worked}
              onClick={() => onSelect(date)}
              className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl border text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                worked
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(52,211,153,.08)] hover:-translate-y-0.5 hover:bg-emerald-500/30"
                  : date === todayKey
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-200"
                    : "border-transparent bg-slate-800/55 text-slate-500"
              }`}
              aria-label={
                worked
                  ? `${dateLabel(date).full}, ${dayLogs.length} ${dayLogs.length === 1 ? "jornada" : "jornadas"}, ${formatMoney(gross)}. Abrir para editar`
                  : `${dateLabel(date).full}, sem jornada`
              }
            >
              <span>{Number(date.slice(-2))}</span>
              {worked && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
              {dayLogs.length > 1 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-300 px-1 text-[9px] font-black text-emerald-950">
                  {dayLogs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-700/60 pt-3">
        <span className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Dia trabalhado
        </span>
        <span className="text-xs text-slate-500">
          {logsByDate.size} {logsByDate.size === 1 ? "dia" : "dias"} no mês
        </span>
      </div>
    </section>
  );
}

function DayJourneysSheet({
  date,
  logs,
  savedId,
  onClose,
  onEdit,
}: {
  date: string;
  logs: DailyLog[];
  savedId: number | null;
  onClose: () => void;
  onEdit: (log: DailyLog) => void;
}) {
  const label = dateLabel(date);
  const dayGross = logs.reduce(
    (total, log) => total + numberValue(log.grossEarnings),
    0
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-journeys-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-700 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-emerald-500/15">
              <strong className="text-lg leading-none text-white">{label.day}</strong>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                {label.weekday}
              </span>
            </div>
            <div>
              <h2 id="day-journeys-title" className="text-base font-bold capitalize text-white">
                {label.full}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {logs.length} {logs.length === 1 ? "jornada" : "jornadas"} · {formatMoney(dayGross)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar jornadas do dia"
          >
            <X size={20} />
          </button>
        </header>

        <div className="max-h-[65dvh] divide-y divide-slate-700/50 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {logs.map((log, index) => (
            <JourneyRow
              key={log.id}
              log={log}
              index={index}
              multiple={logs.length > 1}
              saved={savedId === log.id}
              onEdit={() => onEdit(log)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function JourneyRow({
  log,
  index,
  multiple,
  saved,
  onEdit,
}: {
  log: DailyLog;
  index: number;
  multiple: boolean;
  saved: boolean;
  onEdit: () => void;
}) {
  const gross = numberValue(log.grossEarnings);
  const workedMs = numberValue(log.workedMs);
  const hourly = workedMs > 0 ? gross / (workedMs / 3600000) : 0;

  return (
    <article className={`p-4 transition-colors ${saved ? "bg-emerald-500/10" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {multiple ? `Jornada ${index + 1}` : "Jornada encerrada"}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="text-lg text-white">{formatMoney(gross)}</strong>
            <span className="text-xs font-bold text-blue-300">{formatMoney(hourly)}/h</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-600 px-3 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <JourneyDatum icon={<Clock3 size={14} />} value={formatWorkedTime(workedMs)} />
        <JourneyDatum
          icon={<MapPinned size={14} />}
          value={`${numberValue(log.kmDriven).toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
          })} km`}
        />
        <JourneyDatum icon={<Fuel size={14} />} value={formatMoney(numberValue(log.fuelCost))} />
      </div>

      {saved && <p className="mt-3 text-xs font-semibold text-emerald-400">Alterações salvas</p>}
    </article>
  );
}

function JourneyDatum({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-slate-400">
      <span className="shrink-0 text-slate-500">{icon}</span>
      <span className="truncate">{value}</span>
    </span>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
      <p className="text-[10px] leading-tight text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function EditSheet({
  log,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: {
  log: DailyLog;
  form: EditForm;
  saving: boolean;
  error: string;
  onChange: (field: keyof EditForm, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-history-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
              Corrigir jornada
            </p>
            <h2 id="edit-history-title" className="mt-1 text-lg font-bold text-white">
              {dateLabel(log.date).full}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar edição"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs leading-relaxed text-blue-100">
            Esta correção atualiza os totais do dashboard sem alterar outras
            jornadas do mesmo dia.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <EditField
              label="Data"
              type="date"
              value={form.date}
              onChange={(value) => onChange("date", value)}
              className="col-span-2"
            />
            <EditField label="Faturamento bruto" prefix="R$" value={form.grossEarnings} onChange={(value) => onChange("grossEarnings", value)} />
            <EditField label="Meta" prefix="R$" value={form.goalAmount} onChange={(value) => onChange("goalAmount", value)} />
            <EditField label="Quilômetros" suffix="km" value={form.kmDriven} onChange={(value) => onChange("kmDriven", value)} />
            <EditField label="Combustível" prefix="R$" value={form.fuelCost} onChange={(value) => onChange("fuelCost", value)} />
            <EditField label="Outras despesas" prefix="R$" value={form.otherExpenses} onChange={(value) => onChange("otherExpenses", value)} className="col-span-2" />
          </div>

          <fieldset className="mt-4 rounded-xl border border-slate-700 p-3">
            <legend className="px-1 text-xs font-semibold text-slate-300">
              Tempo efetivamente trabalhado
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <EditField label="Horas" suffix="h" step="1" value={form.workedHours} onChange={(value) => onChange("workedHours", value)} />
              <EditField label="Minutos" suffix="min" step="1" max="59" value={form.workedMinutes} onChange={(value) => onChange("workedMinutes", value)} />
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        <footer className="grid grid-cols-[0.8fr_1.2fr] gap-2 border-t border-slate-700 bg-slate-950/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-12 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800">
            Cancelar
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={17} />
                Salvar alterações
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  type = "number",
  step = "0.01",
  max,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  type?: "number" | "date";
  step?: string;
  max?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <span className="flex min-h-12 items-center rounded-xl border border-slate-700 bg-slate-950 px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {prefix && <span className="mr-2 text-sm text-slate-500">{prefix}</span>}
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          min={type === "number" ? "0" : undefined}
          max={max}
          step={type === "number" ? step : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none [color-scheme:dark]"
        />
        {suffix && <span className="ml-2 text-xs text-slate-500">{suffix}</span>}
      </span>
    </label>
  );
}
