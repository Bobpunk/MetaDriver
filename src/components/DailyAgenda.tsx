"use client";

import { useEffect, useState } from "react";
import type { DailyLog } from "@/lib/types";
import { fetchLogs, saveLog, deleteLog } from "@/lib/daily-logs";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function fmt(n: string) {
  const v = parseFloat(n.replace(",", ".")) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DailyAgenda({
  email,
  currentGoal,
  currentKm,
  currentFuelCost,
  currentGross,
  onSaveDone,
}: {
  email: string;
  currentGoal: string;
  currentKm: string;
  currentFuelCost: string;
  currentGross: string;
  onSaveDone?: () => void;
}) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formDate, setFormDate] = useState(today());
  const [formGoal, setFormGoal] = useState("");
  const [formKm, setFormKm] = useState("");
  const [formFuel, setFormFuel] = useState("");
  const [formOther, setFormOther] = useState("");
  const [formGross, setFormGross] = useState("");

  useEffect(() => {
    setFormGoal(currentGoal);
    setFormKm(currentKm);
    setFormFuel(currentFuelCost);
    setFormGross(currentGross);
  }, [currentGoal, currentKm, currentFuelCost, currentGross]);

  function load() {
    setLoading(true);
    fetchLogs(email).then((res) => {
      if (res.ok && res.logs) setLogs(res.logs);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [email]);

  function prefill(log: DailyLog) {
    setFormDate(log.date);
    setFormGoal(log.goalAmount);
    setFormKm(log.kmDriven);
    setFormFuel(log.fuelCost);
    setFormOther(log.otherExpenses);
    setFormGross(log.grossEarnings);
  }

  function resetForm() {
    setFormDate(today());
    setFormGoal(currentGoal);
    setFormKm(currentKm);
    setFormFuel(currentFuelCost);
    setFormOther("");
    setFormGross(currentGross);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await saveLog({
      userEmail: email,
      date: formDate,
      goalAmount: formGoal,
      kmDriven: formKm,
      fuelCost: formFuel,
      otherExpenses: formOther,
      grossEarnings: formGross,
    });

    setSaving(false);
    if (res.ok) {
      load();
      resetForm();
      onSaveDone?.();
    } else {
      setError(res.error || "Erro ao salvar.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este registro?")) return;
    const res = await deleteLog(id);
    if (res.ok) load();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-emerald-700/30">
        <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <i className="fas fa-pen" /> Novo Registro
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-[10px] text-red-400 font-bold text-center mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[9px] text-slate-400 font-bold mb-1">Data</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-slate-400 font-bold mb-1">Meta (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 font-bold mb-1">KM Rodados</label>
              <input
                type="text"
                inputMode="decimal"
                value={formKm}
                onChange={(e) => setFormKm(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-slate-400 font-bold mb-1">Gasolina (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formFuel}
                onChange={(e) => setFormFuel(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 font-bold mb-1">Outras Despesas (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formOther}
                onChange={(e) => setFormOther(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-slate-400 font-bold mb-1">Ganho Bruto (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formGross}
              onChange={(e) => setFormGross(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
          >
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <i className="fas fa-spinner fa-spin" /> Salvando...
              </span>
            ) : (
              <><i className="fas fa-save mr-1" /> Salvar</>
            )}
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700/50">
        <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <i className="fas fa-history" /> Histórico
        </h2>

        {loading ? (
          <div className="text-center text-[10px] text-slate-500 py-4">
            <i className="fas fa-spinner fa-spin mr-1" /> Carregando...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-[10px] text-slate-500 py-4">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((log) => {
              const gross = parseFloat(log.grossEarnings) || 0;
              const fuel = parseFloat(log.fuelCost) || 0;
              const other = parseFloat(log.otherExpenses) || 0;
              const net = gross - fuel - other;
              return (
                <div
                  key={log.id}
                  className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 text-[10px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">
                      {formatDate(log.date)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="text-red-500 hover:text-red-400"
                      title="Excluir"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-400">
                    <span>Meta: <strong className="text-white">{fmt(log.goalAmount)}</strong></span>
                    <span>KM: <strong className="text-white">{log.kmDriven || "0"}</strong></span>
                    <span>Bruto: <strong className="text-white">{fmt(log.grossEarnings)}</strong></span>
                    <span>Gasolina: <strong className="text-red-400">{fmt(log.fuelCost)}</strong></span>
                    <span>Despesas: <strong className="text-yellow-400">{fmt(log.otherExpenses)}</strong></span>
                    <span>Líquido: <strong className={net >= 0 ? "text-emerald-400" : "text-red-400"}>{fmt(String(net))}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => prefill(log)}
                    className="text-[9px] text-blue-400 hover:text-blue-300 mt-1"
                  >
                    <i className="fas fa-pencil-alt mr-1" /> Editar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
