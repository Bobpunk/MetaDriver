"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CAMPAIGN_CONFIG, MILESTONES } from "@/lib/campaign";

type Step = "invite" | "payment";

export function CampaignModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("invite");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("invite");
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.dataset.backdrop === "campaign") onClose();
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, onClose]);

  if (!open) return null;

  const pct = Math.min(
    (CAMPAIGN_CONFIG.raised / CAMPAIGN_CONFIG.goalMax) * 100,
    100
  );

  async function goToPayment(e: React.MouseEvent<HTMLButtonElement>) {
    if (email.length < 5 || !email.includes("@")) {
      alert(
        "Por favor, digite um e-mail válido para garantirmos seu acesso vitalício!"
      );
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message: "Novo interessado no Vitalício (MetaDriver)",
          origin: "App Web",
        }),
      });

      if (CAMPAIGN_CONFIG.notifyUrl.includes("formspree")) {
        await fetch(CAMPAIGN_CONFIG.notifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            data: new Date().toLocaleString(),
            mensagem: "Novo interessado no Vitalício (MetaDriver)",
            origem: "App Web",
          }),
        });
      }
    } catch {
      // silent — liberamos o mesmo assim
    } finally {
      setSubmitting(false);
      setStep("payment");
    }
  }

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(CAMPAIGN_CONFIG.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div
      data-backdrop="campaign"
      className={`fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-slate-800 border border-slate-700 rounded-xl p-4 max-w-sm w-full shadow-2xl relative transform transition-all ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-white p-2 z-10"
          aria-label="Fechar"
          type="button"
        >
          <i className="fas fa-times text-lg" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-indigo-500/50">
            <i className="fas fa-rocket text-indigo-400 text-xl" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Rumo a Versão Pro
          </h3>

          {step === "invite" && (
            <div id="step-invite">
              <p className="text-xs text-slate-300 mb-4 leading-relaxed px-2">
                Para o Projeto continuar de pé, precisamos da sua colaboração
                para arcar com os custos e publicar nas lojas.
              </p>

              <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-lg p-3 mb-4 animate-pulse-slow">
                <p className="text-xs text-indigo-200 leading-relaxed">
                  <i className="fas fa-star text-yellow-400 mr-1 text-sm shadow-glow" />
                  Colabore com <strong>R$ 15,00</strong> e ganhe a versão{" "}
                  <strong className="text-white bg-indigo-600 px-1 rounded text-[10px]">
                    PRO VITALÍCIA
                  </strong>{" "}
                  quando lançar!
                </p>
              </div>

              <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700 mb-4 text-left">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Total Arrecadado
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    {CAMPAIGN_CONFIG.raised.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 mb-1 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full relative"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4 text-left">
                {MILESTONES.map((m) => {
                  const reached = CAMPAIGN_CONFIG.raised >= m.goal;
                  return (
                    <div
                      key={m.goal}
                      className={`flex items-center gap-3 transition-all duration-500 ${
                        reached ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors ${
                          reached
                            ? "bg-emerald-500/20 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-slate-800 border border-slate-600"
                        }`}
                      >
                        <i
                          className={`${m.brand ? "fab" : "fas"} ${m.icon} text-[10px] ${
                            reached ? "text-emerald-400" : "text-slate-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-300">
                          <span>{m.label}</span>
                          <span>{m.amount}</span>
                        </div>
                      </div>
                      <i
                        className={`text-xs ${
                          reached
                            ? "fas fa-check-circle text-emerald-400 shadow-glow"
                            : "fas fa-lock text-slate-600"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mb-4 text-left border-t border-slate-700 pt-3">
                <label className="text-[10px] font-bold text-indigo-300 uppercase ml-1">
                  Seu E-mail (Para receber o acesso):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full mt-1 bg-slate-900 border border-slate-600 rounded p-3 text-white text-sm focus:border-indigo-500 outline-none placeholder-slate-600"
                />
              </div>

              <button
                onClick={goToPayment}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2" />
                    REGISTRANDO...
                  </>
                ) : (
                  <>
                    QUERO APOIAR AGORA <i className="fas fa-arrow-right ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="animate-fade-in pt-2">
              <p className="text-xs text-white mb-2 font-bold">
                Escaneie o QR Code no App do Banco:
              </p>

              <div className="bg-white p-3 rounded-lg inline-block shadow-lg mb-4">
                <QRCodeCanvas
                  value={CAMPAIGN_CONFIG.pixPayload}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              <p className="text-[10px] text-slate-400 mb-2">
                Ou use o Copia e Cola:
              </p>

              <button
                onClick={copyPix}
                className={`w-full border text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-3 transition-all ${
                  copied
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-slate-700 border-slate-600 text-slate-300"
                }`}
              >
                {copied ? (
                  <>
                    <i className="fas fa-check-double" />
                    <span>SUCESSO!</span>
                  </>
                ) : (
                  <>
                    <i className="far fa-copy" />
                    COPIAR CÓDIGO PIX
                  </>
                )}
              </button>

              <button
                onClick={() => setStep("invite")}
                className="text-xs text-slate-500 underline hover:text-white"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
