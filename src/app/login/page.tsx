"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold">Carregando...</div>
      </div>
    );
  }

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Erro ao fazer login.");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg mx-auto mb-4">
            <i className="fas fa-bullseye text-blue-500 text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            META<span className="text-blue-500">DRIVER</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Acesse sua conta
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700/50 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 font-bold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none transition-colors placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-60"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin" /> ENTRANDO...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-lock" /> ENTRAR
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
