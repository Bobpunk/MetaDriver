"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculate,
  formatMoney,
  loadState,
  sanitizeNumericInput,
  saveState,
  DEFAULTS,
} from "@/lib/driver";
import type { DriverState } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { canAccess } from "@/lib/pro";
import { CampaignModal } from "./CampaignModal";
import { HelpModal } from "./HelpModal";
import { ShareButton } from "./ShareButton";
import { DailyAgenda } from "./DailyAgenda";
import { useTimedPopup } from "@/hooks/useTimedPopup";

const NUMERIC_INPUTS: (keyof DriverState)[] = [
  "uberInput",
  "ninenineInput",
  "tipsInput",
  "proFinancing",
  "proMaintenance",
  "proInsurance",
  "proOtherMonthly",
  "proAnnualTaxes",
];

export function DriverDashboard() {
  const [state, setState] = useState<DriverState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tab, setTab] = useState<"painel" | "agenda">("painel");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useTimedPopup(() => setCampaignOpen(true), hydrated);

  const results = useMemo(() => calculate(state, now), [state, now]);

  function update<K extends keyof DriverState>(key: K, value: string) {
    setState((prev) => ({
      ...prev,
      [key]: NUMERIC_INPUTS.includes(key) ? sanitizeNumericInput(value) : value,
    }));
  }

  function resetData() {
    if (
      confirm(
        "Tem certeza que deseja zerar os valores de hoje? (Preço e Consumo serão mantidos)"
      )
    ) {
      setState((prev) => ({
        ...prev,
        uberInput: "",
        ninenineInput: "",
        tipsInput: "",
        kmInput: "",
      }));
    }
  }

  const { user, login, register, logout } = useAuth();
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    const result = await login(loginEmail, loginPassword);
    setLoginBusy(false);
    if (result.ok) {
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    } else {
      setLoginError(result.error || "Erro ao fazer login.");
    }
  }

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerBusy, setRegisterBusy] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError("");
    setRegisterBusy(true);
    const result = await register(registerName, registerEmail, registerPassword, registerConfirmPassword);
    setRegisterBusy(false);
    if (result.ok) {
      setShowLogin(false);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } else {
      setRegisterError(result.error || "Erro ao cadastrar.");
    }
  }

  function resetLoginForm() {
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterError("");
  }

  const remainingText = results.goalHit
    ? "META BATIDA!"
    : `Falta ${formatMoney(results.remaining)}`;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3 p-4">
      <div ref={dashboardRef} className="relative">
        <div className="flex justify-between items-center gap-2 mb-2">
          {user && user.pro ? (
            <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
              <button
                onClick={() => setTab("painel")}
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${tab === "painel" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                type="button"
              >
                <i className="fas fa-chart-simple mr-1" /> Painel
              </button>
              <button
                onClick={() => setTab("agenda")}
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${tab === "agenda" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                type="button"
              >
                <i className="fas fa-calendar-days mr-1" /> Agenda
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHelpOpen(true)}
              className="text-[9px] text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
              type="button"
            >
              <i className="fas fa-circle-question text-[10px]" /> Ajuda
            </button>

            {user ? (
            <button
              onClick={logout}
              className="text-[9px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
              type="button"
              title={user.email}
            >
              <i className="fas fa-sign-out-alt text-[10px]" /> Sair
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
              type="button"
            >
              <i className="fas fa-lock text-[10px]" /> Entrar
            </button>
          )}
          </div>
        </div>
        <Header gross={results.gross} net={results.netIncome} />

        {tab === "agenda" && user ? (
          <DailyAgenda
            email={user.email}
            currentGoal={state.goalAmount}
            currentKm={state.kmInput}
            currentFuelCost={String(results.fuelCost)}
            currentGross={String(results.gross)}
          />
        ) : (
        <div>
          <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700/50">
            <div className="grid grid-cols-3 gap-3">
              <Field label="INÍCIO">
                <input
                  type="time"
                  value={state.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className={inputCls("focus:border-blue-500")}
                />
              </Field>
              <Field label="META">
                <input
                  type="number"
                  value={state.goalAmount}
                  onChange={(e) => update("goalAmount", e.target.value)}
                  className={inputCls("focus:border-blue-500")}
                />
              </Field>
              <Field label="KM ATUAL">
                <input
                  type="number"
                  value={state.kmInput}
                  placeholder="0"
                  onChange={(e) => update("kmInput", e.target.value)}
                  className={inputCls(
                    "border-l-4 border-l-purple-500 focus:border-purple-500"
                  )}
                />
              </Field>
            </div>

            <details className="mt-3 group">
              <summary className="text-[10px] text-blue-400 font-bold cursor-pointer hover:text-blue-300 flex justify-center items-center gap-2 bg-slate-900/50 rounded py-2 select-none">
                <i className="fas fa-gas-pump" /> CONFIGURAR COMBUSTÍVEL
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-700">
                <Field label="R$/LITRO" small>
                  <input
                    type="number"
                    step="0.01"
                    value={state.fuelPrice}
                    placeholder="5.89"
                    onChange={(e) => update("fuelPrice", e.target.value)}
                    className={inputSmall("focus:border-blue-500")}
                  />
                </Field>
                <Field label="KM/L" small>
                  <input
                    type="number"
                    step="0.1"
                    value={state.consumption}
                    placeholder="10"
                    onChange={(e) => update("consumption", e.target.value)}
                    className={inputSmall("focus:border-blue-500")}
                  />
                </Field>
              </div>
            </details>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 shadow-xl border-l-4 border-blue-500 relative overflow-hidden">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fas fa-wallet text-blue-500" /> Lançamentos (Brutos)
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <LabeledInput label="Uber" value={state.uberInput} onChange={(v) => update("uberInput", v)} tone="white" />
              <LabeledInput label="99Pop" value={state.ninenineInput} onChange={(v) => update("ninenineInput", v)} tone="yellow-500" />
              <LabeledInput label="Extra" value={state.tipsInput} onChange={(v) => update("tipsInput", v)} tone="emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatBox tone="red" label="Gasolina" value={formatMoney(results.fuelCost)} />
            <StatBox tone="blue" label="Hora Bruta" value={formatMoney(results.hourlyGross)} />
          </div>

          <div className="bg-slate-800/80 rounded-xl p-2 border border-purple-500/20 flex flex-col justify-center items-center py-2">
            <div className="text-[9px] text-purple-400 uppercase font-bold mb-0.5">Valor do KM Rodado</div>
            <div className="text-base font-black text-purple-400">{formatMoney(results.kmValue)}</div>
          </div>

          {user && canAccess("complete_costs", user.pro) ? (
            <>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-lg border border-emerald-700/40">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-crown" /> Custos Pro
                  </h2>
                  <span className="text-[9px] bg-emerald-600/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
                </div>
                <details className="group">
                  <summary className="text-[10px] text-emerald-400 font-bold cursor-pointer hover:text-emerald-300 flex items-center gap-2 bg-slate-900/50 rounded py-2 px-3 select-none">
                    <i className="fas fa-calculator" /> Custos Fixos Mensais
                  </summary>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-emerald-900/30">
                    <Field label="Financiamento" small>
                      <input type="text" value={state.proFinancing} onChange={(e) => update("proFinancing", sanitizeNumericInput(e.target.value))} placeholder="0" className={inputSmall("focus:border-emerald-500")} />
                    </Field>
                    <Field label="Manutenção" small>
                      <input type="text" value={state.proMaintenance} onChange={(e) => update("proMaintenance", sanitizeNumericInput(e.target.value))} placeholder="0" className={inputSmall("focus:border-emerald-500")} />
                    </Field>
                    <Field label="Seguro" small>
                      <input type="text" value={state.proInsurance} onChange={(e) => update("proInsurance", sanitizeNumericInput(e.target.value))} placeholder="0" className={inputSmall("focus:border-emerald-500")} />
                    </Field>
                    <Field label="Outros" small>
                      <input type="text" value={state.proOtherMonthly} onChange={(e) => update("proOtherMonthly", sanitizeNumericInput(e.target.value))} placeholder="0" className={inputSmall("focus:border-emerald-500")} />
                    </Field>
                    <div className="col-span-2">
                      <Field label="Impostos / Taxas (anual)" small>
                        <input type="text" value={state.proAnnualTaxes} onChange={(e) => update("proAnnualTaxes", sanitizeNumericInput(e.target.value))} placeholder="0" className={inputSmall("focus:border-emerald-500")} />
                      </Field>
                    </div>
                  </div>
                </details>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox tone="emerald" label="Lucro Líquido (Real)" value={formatMoney(results.proNetIncome)} />
                <StatBox tone="emerald" label="Hora Líquida" value={formatMoney(results.proHourlyNet)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox tone="emerald" label="KM Líquido" value={formatMoney(results.proKmNet)} />
                <StatBox tone="emerald" label="Custo Fixo/Dia" value={formatMoney(results.proDailyCost)} />
              </div>
            </>
          ) : user ? (
            <div className="bg-gradient-to-br from-slate-800 to-indigo-900/30 rounded-xl p-4 shadow-lg border border-indigo-700/30 text-center">
              <div className="text-[9px] text-indigo-400 uppercase font-bold mb-2 flex items-center justify-center gap-2">
                <i className="fas fa-crown" /> MetaDriver Pro
              </div>
              <p className="text-[11px] text-slate-300 mb-3">Desbloqueie a calculadora completa de custos e tenha uma visão real dos seus ganhos.</p>
              <p className="text-[9px] text-slate-500 mb-3 leading-relaxed">Financiamento, manutenção, seguro, impostos e muito mais.</p>
              <button type="button" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-2 px-4 rounded-lg transition-all">
                <i className="fas fa-star mr-1" /> Seja Pro
              </button>
            </div>
          ) : null}

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-lg border border-slate-700">
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-bold">Jornada</div>
                <div className="text-sm font-mono font-bold text-white">{results.workedHours}h {results.workedMinutes.toString().padStart(2, "0")}m</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Término</div>
                <div className={`text-sm font-bold ${results.goalHit ? "text-emerald-400" : "text-white"}`}>{results.estimatedFinish}</div>
              </div>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner border border-slate-800">
              <div className={`h-full rounded-full transition-all duration-700 relative bg-gradient-to-r ${results.goalHit ? "from-emerald-600 to-emerald-400" : "from-blue-600 to-cyan-500"}`} style={{ width: `${results.progressPct}%` }}>
                <div className="absolute right-0 top-0 h-full w-1 bg-white/50 blur-[1px]" />
              </div>
            </div>
            <div className="text-center bg-slate-950/30 rounded py-1">
              <span className={`text-[11px] font-bold ${results.goalHit ? "text-emerald-400" : "text-slate-300"}`}>{remainingText}</span>
            </div>
          </div>
        </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        <button
          type="button"
          onClick={resetData}
          data-share-exclude="true"
          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider border border-slate-700/50 hover:border-red-900/50 rounded-lg px-4 py-2 w-full"
        >
          <i className="fas fa-trash-alt mr-2" /> Reiniciar
        </button>

        <button
          type="button"
          onClick={() => setCampaignOpen(true)}
          data-share-exclude="true"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/20 animate-pulse flex justify-center items-center gap-2 transition-all active:scale-95 border border-white/10"
        >
          <i className="fas fa-rocket" /> AJUDE A CRIAR O APP OFICIAL
        </button>

        <ShareButton targetRef={dashboardRef} />
      </div>

      <CampaignModal open={campaignOpen} onClose={() => setCampaignOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 max-w-xs w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
                <button
                  onClick={() => { setLoginMode("login"); resetLoginForm(); }}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${loginMode === "login" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setLoginMode("register"); resetLoginForm(); }}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${loginMode === "register" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                  type="button"
                >
                  Cadastro
                </button>
              </div>
              <button onClick={() => setShowLogin(false)} className="text-slate-400 hover:text-white p-1" type="button">
                <i className="fas fa-times" />
              </button>
            </div>

            {loginMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-3">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-[10px] text-red-400 font-bold text-center">
                    {loginError}
                  </div>
                )}
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="E-mail"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-blue-500 outline-none placeholder-slate-600"
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Senha"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-blue-500 outline-none placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={loginBusy}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {loginBusy ? (
                    <span className="inline-flex items-center gap-1">
                      <i className="fas fa-spinner fa-spin" /> Entrando...
                    </span>
                  ) : "Entrar"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                {registerError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-[10px] text-red-400 font-bold text-center">
                    {registerError}
                  </div>
                )}
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  minLength={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-blue-500 outline-none placeholder-slate-600"
                />
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="E-mail"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-blue-500 outline-none placeholder-slate-600"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Senha (mín. 8 caracteres, 1 maiúscula, 1 especial)"
                    required
                    minLength={8}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pr-9 text-white text-xs focus:border-blue-500 outline-none placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 text-sm"
                    tabIndex={-1}
                  >
                    <i className={`fas fa-eye${showPassword ? "-slash" : ""}`} />
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Confirmar senha"
                    required
                    minLength={8}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pr-9 text-white text-xs focus:border-blue-500 outline-none placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 text-sm"
                    tabIndex={-1}
                  >
                    <i className={`fas fa-eye${showConfirmPassword ? "-slash" : ""}`} />
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  A senha deve ter no mínimo <strong className="text-slate-300">8 caracteres</strong>,
                  incluindo <strong className="text-slate-300">1 letra maiúscula</strong> e{' '}
                  <strong className="text-slate-300">1 caractere especial</strong>.
                </p>
                <button
                  type="submit"
                  disabled={registerBusy}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {registerBusy ? (
                    <span className="inline-flex items-center gap-1">
                      <i className="fas fa-spinner fa-spin" /> Cadastrando...
                    </span>
                  ) : "Criar conta"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ gross, net }: { gross: number; net: number }) {
  return (
    <div className="mb-1">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shadow-lg shrink-0">
            <i className="fas fa-bullseye text-blue-500 text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tight">
              META<span className="text-blue-500">DRIVER</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Seu copiloto
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="text-right bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-500/20 shadow-sm">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">
              Bruto
            </div>
            <div className="text-sm font-black text-blue-400 leading-none">
              {formatMoney(gross)}
            </div>
          </div>
          <div className="text-right bg-slate-800 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm">
            <div className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">
              Líquido
            </div>
            <div className="text-sm font-black text-emerald-400 leading-none">
              {formatMoney(net)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  small,
  children,
}: {
  label: string;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`block ${
          small ? "text-[9px]" : "text-[10px]"
        } text-slate-400 font-bold mb-1 text-center`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  "w-full bg-slate-900 border border-slate-700 text-center text-sm font-bold text-white outline-none transition-colors";

function inputCls(extra = "") {
  return `${inputBase} rounded-lg py-2 px-1 ${extra}`;
}

function inputSmall(extra = "") {
  return `${inputBase} rounded p-2 ${extra}`;
}

function LabeledInput({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tone: "white" | "yellow-500" | "emerald-500";
}) {
  const ringClass =
    tone === "white"
      ? "focus:border-white focus:ring-1 focus:ring-white"
      : tone === "yellow-500"
      ? "focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
      : "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
  const labelClass =
    tone === "yellow-500"
      ? "text-yellow-500/80"
      : tone === "emerald-500"
      ? "text-emerald-500/80"
      : "text-slate-400";
  return (
    <div className="relative group">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-900 border border-slate-700 rounded-xl pt-5 pb-2 px-1 text-center font-bold text-lg text-white transition-all ${ringClass}`}
      />
      <span
        className={`absolute top-1.5 left-0 w-full text-center text-[9px] ${labelClass} uppercase font-bold pointer-events-none`}
      >
        {label}
      </span>
    </div>
  );
}

function StatBox({
  tone,
  label,
  value,
}: {
  tone: "red" | "blue" | "emerald";
  label: string;
  value: string;
}) {
  const border = tone === "red" ? "border-red-500/20" : tone === "emerald" ? "border-emerald-500/20" : "border-blue-500/20";
  const valueColor = tone === "red" ? "text-red-400" : tone === "emerald" ? "text-emerald-400" : "text-white";
  const labelColor = tone === "red" ? "text-red-400" : tone === "emerald" ? "text-emerald-400" : "text-blue-400";
  return (
    <div
      className={`bg-slate-800/80 rounded-xl p-2 border ${border} flex flex-col justify-center items-center py-3`}
    >
      <div className={`text-[9px] ${labelColor} uppercase font-bold mb-0.5`}>
        {label}
      </div>
      <div className={`text-base font-black ${valueColor}`}>{value}</div>
    </div>
  );
}
