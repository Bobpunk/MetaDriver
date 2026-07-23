"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Bike, HelpCircle, Save, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { fetchSettings, saveSettingsApi } from "@/lib/user-settings";

export type WorkSettings = {
  workDays: boolean[];
  hoursPerDay: string;
  weeklyGoal: string;
  scheduleMode: "fixed" | "rotation";
  cycleWorkDays: string;
  cycleRestDays: string;
};

export type VehicleType = "car" | "motorcycle";

export type CostSettings = {
  financing: string;
  maintenance: string;
  insurance: string;
  otherMonthly: string;
  annualTaxes: string;
  emergencyFund: string;
  leisure: string;
};

export type AppSettings = {
  work: WorkSettings;
  vehicle: VehicleType;
  costs: CostSettings;
};

const DEFAULTS: AppSettings = {
  work: {
    workDays: [false, true, true, true, true, true, false],
    hoursPerDay: "8",
    weeklyGoal: "",
    scheduleMode: "fixed",
    cycleWorkDays: "6",
    cycleRestDays: "1",
  },
  vehicle: "car",
  costs: {
    financing: "",
    maintenance: "",
    insurance: "",
    otherMonthly: "",
    annualTaxes: "",
    emergencyFund: "",
    leisure: "",
  },
};

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type SettingsTab = "profile";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Perfil Financeiro", icon: <Wallet size={14} /> },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 first:mt-0">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-700/30" />
    </div>
  );
}

export function SettingsPanel({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (open) {
      setTab("profile");
      setLoading(true);
      fetchSettings().then((res) => {
        if (res.ok && res.settings) {
          setSettings(res.settings);
        } else {
          setSettings(DEFAULTS);
        }
        setLoading(false);
      });
    }
  }, [open]);

  const update = useCallback(
    <K extends keyof AppSettings>(section: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [section]: value }));
    },
    []
  );

  async function handleSave() {
    setLoading(true);
    const res = await saveSettingsApi(settings);
    setLoading(false);
    if (res.ok) {
      onSaved?.();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }

  function toggleDay(idx: number) {
    const days = [...settings.work.workDays];
    days[idx] = !days[idx];
    update("work", { ...settings.work, workDays: days });
  }

  function setRotation(workDays: number, restDays: number) {
    update("work", {
      ...settings.work,
      scheduleMode: "rotation",
      cycleWorkDays: String(workDays),
      cycleRestDays: String(restDays),
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 shrink-0">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Configurações
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-28 shrink-0 bg-slate-950/50 border-r border-slate-700/50 p-2 flex flex-col gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all text-[9px] font-bold uppercase tracking-wider ${
                      tab === t.id
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 size={20} className="text-slate-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SectionDivider label="Trabalho" />

                    <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-950/60 p-1">
                      <button
                        type="button"
                        onClick={() =>
                          update("work", { ...settings.work, scheduleMode: "fixed" })
                        }
                        className={`min-h-11 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
                          settings.work.scheduleMode === "fixed"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        Dias fixos
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          update("work", { ...settings.work, scheduleMode: "rotation" })
                        }
                        className={`min-h-11 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
                          settings.work.scheduleMode === "rotation"
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        Escala rotativa
                      </button>
                    </div>

                    {settings.work.scheduleMode === "fixed" ? (
                      <div className="mb-4">
                        <label className="mb-2 block text-[10px] font-medium text-slate-400">
                          Dias trabalhados por semana
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {DAY_LABELS.map((label, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleDay(idx)}
                              className={`min-h-11 rounded-lg text-[10px] font-semibold transition-colors ${
                                settings.work.workDays[idx]
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <label className="mb-2 block text-[10px] font-medium text-slate-400">
                          Escolha uma escala
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { work: 6, rest: 1 },
                            { work: 5, rest: 2 },
                            { work: 4, rest: 1 },
                          ].map((preset) => {
                            const selected =
                              settings.work.cycleWorkDays === String(preset.work) &&
                              settings.work.cycleRestDays === String(preset.rest);
                            return (
                              <button
                                key={`${preset.work}x${preset.rest}`}
                                type="button"
                                onClick={() => setRotation(preset.work, preset.rest)}
                                className={`min-h-11 rounded-lg text-xs font-bold transition-colors ${
                                  selected
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                              >
                                {preset.work}×{preset.rest}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mb-2 mt-3 text-[10px] text-slate-400">
                          Personalizada
                        </p>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                          <ConfigField
                            label="Dias trabalhando"
                            value={settings.work.cycleWorkDays}
                            onChange={(value) =>
                              update("work", {
                                ...settings.work,
                                cycleWorkDays: value,
                              })
                            }
                            placeholder="4"
                          />
                          <span className="pb-2.5 text-sm font-bold text-slate-500">×</span>
                          <ConfigField
                            label="Dias de folga"
                            value={settings.work.cycleRestDays}
                            onChange={(value) =>
                              update("work", {
                                ...settings.work,
                                cycleRestDays: value,
                              })
                            }
                            placeholder="1"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <ConfigField
                        label="Horas dirigidas/dia"
                        value={settings.work.hoursPerDay}
                        onChange={(v) =>
                          update("work", { ...settings.work, hoursPerDay: v })
                        }
                        placeholder="8"
                      />
                      <ConfigField
                        label="Meta semanal (R$)"
                        value={settings.work.weeklyGoal}
                        onChange={(v) =>
                          update("work", { ...settings.work, weeklyGoal: v })
                        }
                        placeholder="0"
                      />
                    </div>
                    <SectionDivider label="Veículo" />

                    <div className="flex gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => update("vehicle", "car")}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                          settings.vehicle === "car"
                            ? "border-blue-500 bg-blue-500/10 text-blue-400"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700"
                        }`}
                      >
                        <Car size={24} />
                        <span className="text-[10px] font-semibold uppercase">Carro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => update("vehicle", "motorcycle")}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                          settings.vehicle === "motorcycle"
                            ? "border-blue-500 bg-blue-500/10 text-blue-400"
                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700"
                        }`}
                      >
                        <Bike size={24} />
                        <span className="text-[10px] font-semibold uppercase">Moto</span>
                      </button>
                    </div>
                    {settings.vehicle === "motorcycle" && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-[10px] text-amber-400 text-center leading-relaxed">
                        A função moto ainda não está otimizada. Os cálculos podem não
                        refletir valores reais.
                      </div>
                    )}

                    <SectionDivider label="Custos Mensais" />

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <ConfigField
                          label="Financiamento (R$)"
                          value={settings.costs.financing}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, financing: v })
                          }
                          placeholder="0"
                        />
                        <ConfigField
                          label="Manutenção (R$)"
                          value={settings.costs.maintenance}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, maintenance: v })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ConfigField
                          label="Seguro (R$)"
                          value={settings.costs.insurance}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, insurance: v })
                          }
                          placeholder="0"
                        />
                        <ConfigField
                          label="Outros custos (R$)"
                          value={settings.costs.otherMonthly}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, otherMonthly: v })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="relative">
                        <ConfigField
                          label="Impostos e Taxas anuais (R$)"
                          value={settings.costs.annualTaxes}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, annualTaxes: v })
                          }
                          placeholder="0"
                        />
                        <div className="absolute top-0 right-0 group">
                          <HelpCircle
                            size={13}
                            className="text-slate-500 hover:text-slate-300 cursor-help transition-colors"
                          />
                          <div className="absolute right-0 top-5 w-48 bg-slate-800 border border-slate-700 rounded-lg p-2 text-[9px] text-slate-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10">
                            Ex.: IPVA, licenciamento, DPVAT, multas, etc.
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ConfigField
                          label="Fundo de emergência (R$)"
                          value={settings.costs.emergencyFund}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, emergencyFund: v })
                          }
                          placeholder="0"
                        />
                        <ConfigField
                          label="Lazer (R$)"
                          value={settings.costs.leisure}
                          onChange={(v) =>
                            update("costs", { ...settings.costs, leisure: v })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 bg-slate-900 border-t border-slate-700/50 px-5 py-3.5 relative">
              <AnimatePresence>
                {showToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-emerald-600 text-white text-[10px] font-semibold px-4 py-2 rounded-lg shadow-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle2 size={12} />
                    Configurações salvas!
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-[11px] font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Save size={13} /> Salvar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none placeholder-slate-600 transition-colors"
      />
    </div>
  );
}
