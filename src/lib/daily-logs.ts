import type { DailyLog } from "./types";

export async function fetchLogs(
  email: string
): Promise<{ ok: boolean; logs?: DailyLog[]; error?: string }> {
  try {
    const res = await fetch(`/api/daily-logs?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erro ao carregar" };
    return { ok: true, logs: data.logs };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}

export async function saveLog(
  log: {
    id?: number;
    userEmail: string;
    date: string;
    goalAmount: string;
    kmDriven: string;
    fuelCost: string;
    otherExpenses: string;
    grossEarnings: string;
    workedMs: string;
  }
): Promise<{ ok: boolean; log?: DailyLog; error?: string }> {
  try {
    const res = await fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || "Erro ao salvar" };
    }
    return { ok: true, log: data.log };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}

export async function updateLog(
  log: Pick<
    DailyLog,
    | "id"
    | "date"
    | "goalAmount"
    | "kmDriven"
    | "fuelCost"
    | "otherExpenses"
    | "grossEarnings"
    | "workedMs"
  >
): Promise<{ ok: boolean; log?: DailyLog; error?: string }> {
  try {
    const res = await fetch("/api/daily-logs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || "Erro ao atualizar" };
    }
    return { ok: true, log: data.log };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}
