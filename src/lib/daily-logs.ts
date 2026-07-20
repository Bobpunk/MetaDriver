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
  log: Omit<DailyLog, "id" | "createdAt"> & { confirmReplace?: boolean }
): Promise<{ ok: boolean; log?: DailyLog; replaced?: boolean; maxPerDay?: number; code?: string; message?: string; oldestLog?: DailyLog; error?: string }> {
  try {
    const res = await fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409 && data.code === "MAX_LOGS") {
        return { ok: false, code: "MAX_LOGS", message: data.message, oldestLog: data.oldestLog, maxPerDay: data.maxPerDay };
      }
      return { ok: false, error: data.error || "Erro ao salvar" };
    }
    return { ok: true, log: data.log, replaced: data.replaced, maxPerDay: data.maxPerDay };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}

export async function deleteLog(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/daily-logs?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || "Erro ao excluir" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}
