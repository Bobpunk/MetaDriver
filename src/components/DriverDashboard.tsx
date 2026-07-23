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
import type { CompletedJourney, DriverState, JourneyState } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { HelpModal } from "./HelpModal";
import { ShareButton } from "./ShareButton";
import { InsightsDashboard } from "./InsightsDashboard";
import { SettingsPanel } from "./SettingsPanel";
import { JourneyControl } from "./JourneyControl";
import {
  DEFAULT_JOURNEY,
  currentWeakWindow,
  effectiveWorkedMs,
  finishActivePause,
  hourlyReference,
  isDeadHourWarning,
  loadJourney,
  saveCompletedJourneyLocal,
  saveJourney,
} from "@/lib/journey";
import { saveLog } from "@/lib/daily-logs";
import { fetchSettings } from "@/lib/user-settings";

const NUMERIC_INPUTS: (keyof DriverState)[] = [
  "uberInput",
  "ninenineInput",
  "indriveInput",
  "tipsInput",
  "proFinancing",
  "proMaintenance",
  "proInsurance",
  "proOtherMonthly",
  "proAnnualTaxes",
];

export function DriverDashboard() {
  const { user, login, register, logout } = useAuth();
  const [state, setState] = useState<DriverState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [journey, setJourney] = useState<JourneyState>(DEFAULT_JOURNEY);
  const [endingJourney, setEndingJourney] = useState(false);
  const [journeyError, setJourneyError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"painel" | "insights">("painel");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(loadState());
    setJourney(loadJourney());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveJourney(journey);
  }, [journey, hydrated]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    const today = localDate(new Date());
    const storedGoalDate = window.localStorage.getItem("metadriver_goal_date");
    if (storedGoalDate === today) return;

    void fetchSettings().then((result) => {
      const work = result.settings?.work;
      const selectedDays = work?.workDays.filter(Boolean).length ?? 0;
      const weeklyGoal = Number(work?.weeklyGoal) || 0;
      if (selectedDays > 0 && weeklyGoal > 0) {
        setState((previous) => ({
          ...previous,
          goalAmount: String(weeklyGoal / selectedDays),
        }));
      }
      window.localStorage.setItem("metadriver_goal_date", today);
    });
  }, [hydrated, user]);

  const workedMs = useMemo(
    () => effectiveWorkedMs(journey, now),
    [journey, now]
  );
  const results = useMemo(
    () => calculate(state, now, workedMs),
    [state, now, workedMs]
  );
  const reference = useMemo(
    () =>
      hourlyReference(
        results.hourlyGross,
        results.gross,
        now,
        journey.raining
      ),
    [journey.raining, now, results.gross, results.hourlyGross]
  );
  const weakWindow = useMemo(() => currentWeakWindow(now), [now]);
  const deadHourWarning = useMemo(() => isDeadHourWarning(now), [now]);

  function update<K extends keyof DriverState>(key: K, value: string) {
    setState((prev) => ({
      ...prev,
      [key]: NUMERIC_INPUTS.includes(key) ? sanitizeNumericInput(value) : value,
    }));
  }

  function updateStartTime(value: string) {
    update("startTime", value);
    if (journey.status === "idle" || !journey.startedAt) return;
    const [hours, minutes] = value.split(":").map(Number);
    const adjusted = new Date(journey.startedAt);
    adjusted.setHours(hours || 0, minutes || 0, 0, 0);
    setJourney((prev) => ({
      ...prev,
      startedAt: adjusted.toISOString(),
    }));
  }

  function startJourney() {
    const startedAt = new Date();
    setNow(startedAt);
    setJourney({
      status: "active",
      startedAt: startedAt.toISOString(),
      pauseStartedAt: null,
      pausePlannedUntil: null,
      pausedMs: 0,
      raining: false,
    });
    setState((prev) => ({
      ...prev,
      startTime: startedAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      uberInput: "",
      ninenineInput: "",
      indriveInput: "",
      tipsInput: "",
      kmInput: "",
    }));
    setJourneyError("");
  }

  function pauseJourney(minutes: number) {
    const pauseStartedAt = new Date();
    setNow(pauseStartedAt);
    setJourney((prev) => ({
      ...prev,
      status: "paused",
      pauseStartedAt: pauseStartedAt.toISOString(),
      pausePlannedUntil: new Date(
        pauseStartedAt.getTime() + minutes * 60000
      ).toISOString(),
    }));
  }

  function resumeJourney() {
    const resumedAt = new Date();
    setNow(resumedAt);
    setJourney((prev) => finishActivePause(prev, resumedAt));
  }

  function localDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function endJourney() {
    if (
      !confirm(
        "Encerrar esta jornada? Os valores serão congelados e salvos no histórico."
      )
    ) {
      return;
    }

    const endedAt = new Date();
    const completedState = finishActivePause(journey, endedAt);
    const completedWorkedMs = effectiveWorkedMs(completedState, endedAt);
    const completedResults = calculate(state, endedAt, completedWorkedMs);
    setEndingJourney(true);
    setJourneyError("");

    if (user) {
      const saved = await saveLog({
        userEmail: user.email,
        date: localDate(endedAt),
        goalAmount: state.goalAmount,
        kmDriven: state.kmInput,
        fuelCost: String(completedResults.fuelCost),
        otherExpenses: "0",
        grossEarnings: String(completedResults.gross),
        workedMs: String(completedWorkedMs),
      });
      if (!saved.ok) {
        setEndingJourney(false);
        setJourneyError(
          saved.error ||
            "Não foi possível salvar a jornada. Seus dados continuam no painel."
        );
        return;
      }
    }

    const completed: CompletedJourney = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(endedAt.getTime()),
      date: localDate(endedAt),
      startedAt: completedState.startedAt || endedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      pausedMs: completedState.pausedMs,
      workedMs: completedWorkedMs,
      gross: completedResults.gross,
      hourlyGross: completedResults.hourlyGross,
      goalAmount: Number(state.goalAmount) || 0,
      kmDriven: Number(state.kmInput) || 0,
      fuelCost: completedResults.fuelCost,
    };
    saveCompletedJourneyLocal(completed);

    setJourney(DEFAULT_JOURNEY);
    setState((prev) => ({
      ...prev,
      startTime: endedAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      uberInput: "",
      ninenineInput: "",
      indriveInput: "",
      tipsInput: "",
      kmInput: "",
    }));
    setEndingJourney(false);
  }

  const [loginMode, setLoginMode] = useState<"login" | "register">("login");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    const result = await login(loginEmail, loginPassword, loginRemember);
    setLoginBusy(false);
    if (result.ok) {
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginRemember(false);
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
          {user ? (
            <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
              <button
                onClick={() => setTab("painel")}
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${tab === "painel" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                type="button"
              >
                <i className="fas fa-chart-simple mr-1" /> Painel
              </button>
              <button
                onClick={() => setTab("insights")}
                className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${tab === "insights" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                type="button"
              >
                <i className="fas fa-chart-line mr-1" /> Dashboard
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-[9px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider rounded-lg px-2 py-1"
                type="button"
                title="Configurações"
              >
                <i className="fas fa-cog text-[10px]" /> Config
              </button>
            )}
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
        {tab === "insights" && user ? (
          <InsightsDashboard email={user.email} />
        ) : (
        <div>
          <Header gross={results.gross} net={results.netIncome} />
          <div className="mb-3 mt-3">
            <JourneyControl
              journey={journey}
              now={now}
              workedMs={workedMs}
              hourlyGross={results.hourlyGross}
              reference={reference.final}
              peak={reference.peak}
              weakWindow={journey.status === "active" ? weakWindow : null}
              deadHourWarning={
                journey.status === "active" && deadHourWarning
              }
              ending={endingJourney}
              error={journeyError}
              onStart={startJourney}
              onToggleRain={() =>
                setJourney((prev) => ({ ...prev, raining: !prev.raining }))
              }
              onPause={pauseJourney}
              onResume={resumeJourney}
              onEnd={endJourney}
            />
          </div>
          <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700/50">
            <div className="grid grid-cols-3 gap-3">
              <Field label="INÍCIO">
                <input
                  type="time"
                  value={state.startTime}
                  onChange={(e) => updateStartTime(e.target.value)}
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
                  className={inputCls("focus:border-blue-500")}
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

          <div className="bg-slate-800 rounded-xl p-3 shadow-xl border border-slate-700 relative overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <i className="fas fa-wallet text-blue-500" /> Lançamentos (Brutos)
            </h2>
            <div className="divide-y divide-slate-700">
              <PlatformInput label="Uber" value={state.uberInput} onChange={(v) => update("uberInput", v)} brand="uber" />
              <PlatformInput label="99Pop" value={state.ninenineInput} onChange={(v) => update("ninenineInput", v)} brand="99" />
              <PlatformInput label="inDrive" value={state.indriveInput} onChange={(v) => update("indriveInput", v)} brand="indrive" />
              <PlatformInput label="Extra" value={state.tipsInput} onChange={(v) => update("tipsInput", v)} brand="extra" />
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
        <ShareButton targetRef={dashboardRef} />
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={loginRemember}
                    onChange={(e) => setLoginRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Manter conectado</span>
                </label>
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
              Saldo após combustível
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

function PlatformInput({
  label,
  value,
  onChange,
  brand,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  brand: "uber" | "99" | "indrive" | "extra";
}) {
  return (
    <label className="flex min-h-14 items-center gap-3 py-2">
      <BrandIcon brand={brand} />
      <span className="min-w-20 text-base font-semibold text-slate-100">
        {label}
      </span>
      <span className="ml-auto text-sm text-slate-400">R$</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Ganhos ${label}`}
        className="min-h-11 w-28 rounded-lg border border-slate-600 bg-slate-900 px-3 text-right text-base font-semibold tabular-nums text-white transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}

function BrandIcon({
  brand,
}: {
  brand: "uber" | "99" | "indrive" | "extra";
}) {
  if (brand === "uber") {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-black text-[10px] font-bold tracking-tight text-white"
      >
        UBER
      </span>
    );
  }
  if (brand === "99") {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffdd00] text-xl font-black tracking-tighter text-[#121212]"
      >
        99
      </span>
    );
  }
  if (brand === "indrive") {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b7f000] text-sm font-black tracking-tighter text-[#162100]"
      >
        in
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-2xl font-semibold text-white"
    >
      +
    </span>
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
