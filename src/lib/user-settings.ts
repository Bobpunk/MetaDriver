import type { AppSettings } from "@/components/SettingsPanel";

export async function fetchSettings(): Promise<{
  ok: boolean;
  settings?: AppSettings;
  error?: string;
}> {
  try {
    const res = await fetch("/api/user-settings");
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erro ao carregar" };
    return { ok: true, settings: data.settings };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}

export async function saveSettingsApi(
  settings: AppSettings
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/user-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erro ao salvar" };
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro de conexão." };
  }
}
