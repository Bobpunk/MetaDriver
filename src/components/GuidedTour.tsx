"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, X } from "lucide-react";

export const TOUR_VERSION = "metadriver-tour-v1";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
};

const STEPS: TourStep[] = [
  {
    id: "navigation",
    title: "Conheça seu copiloto",
    body: "Use estas áreas para acompanhar a jornada, analisar resultados e corrigir seu histórico.",
    target: '[data-tour="navigation"]',
  },
  {
    id: "journey",
    title: "Comece sua jornada",
    body: "Inicie quando estiver disponível para trabalhar. O tempo parado entre corridas também entra na hora bruta.",
    target: '[data-tour="journey"]',
  },
  {
    id: "daily-fields",
    title: "Defina o dia",
    body: "Confira o horário inicial, informe sua meta de faturamento bruto e atualize os quilômetros rodados.",
    target: '[data-tour="daily-fields"]',
  },
  {
    id: "fuel",
    title: "Configure o combustível",
    body: "Informe o preço por litro e o consumo do veículo. Esses dados calculam o custo da jornada.",
    target: '[data-tour="fuel"]',
  },
  {
    id: "earnings",
    title: "Registre cada ganho",
    body: "Some os valores recebidos em Uber, 99Pop, inDrive e Extra. Você pode atualizar durante todo o trabalho.",
    target: '[data-tour="earnings"]',
  },
  {
    id: "indicators",
    title: "Leia seus indicadores",
    body: "A hora bruta considera todo o tempo trabalhado. Use a referência mínima para comparar as próximas corridas.",
    target: '[data-tour="indicators"]',
  },
  {
    id: "dashboard",
    title: "Entenda seu resultado",
    body: "O Dashboard reúne faturamento, custos, meta, hora bruta e a projeção mínima para não trabalhar no prejuízo.",
    target: '[data-tour="dashboard"]',
  },
  {
    id: "history",
    title: "Corrija pelo calendário",
    body: "Dias trabalhados aparecem em verde. Toque em uma data para abrir e editar cada jornada separadamente.",
    target: '[data-tour="history"]',
  },
  {
    id: "profile-work",
    title: "Informe sua rotina",
    body: "Escolha dias fixos ou escala rotativa, horas dirigidas e meta semanal. Isso define sua meta diária padrão.",
    target: '[data-tour="profile-work"]',
  },
  {
    id: "profile-vehicle",
    title: "Escolha seu veículo",
    body: "Selecione carro ou moto para manter seu perfil coerente com a forma como você trabalha.",
    target: '[data-tour="profile-vehicle"]',
  },
  {
    id: "profile-costs",
    title: "Complete seus custos",
    body: "Preencha financiamento, manutenção, seguro, taxas e reservas. Use valores mensais, exceto onde a tela indicar anual.",
    target: '[data-tour="profile-costs"]',
  },
  {
    id: "complete",
    title: "Você já pode começar",
    body: "Preencha o que souber agora e volte quando precisar. O tour fica disponível no botão “Ver tour”.",
  },
];

export function GuidedTour({
  open,
  onClose,
  onComplete,
  onStepChange,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  onStepChange: (step: TourStep) => void;
}) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    onStepChange(step);
    let attempts = 0;
    let timer = 0;
    const highlightTarget = () => {
      document
        .querySelectorAll(".tour-highlight")
        .forEach((element) => element.classList.remove("tour-highlight"));
      if (!step.target) return;
      const target = document.querySelector<HTMLElement>(step.target);
      if (!target) {
        attempts += 1;
        if (attempts < 15) {
          timer = window.setTimeout(highlightTarget, 200);
        }
        return;
      }
      target.classList.add("tour-highlight");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    timer = window.setTimeout(highlightTarget, 180);

    return () => {
      window.clearTimeout(timer);
      document
        .querySelectorAll(".tour-highlight")
        .forEach((element) => element.classList.remove("tour-highlight"));
    };
  }, [index, onStepChange, open, step]);

  if (!open) return null;

  const finish = () => {
    onComplete();
    setIndex(0);
  };

  return (
    <>
      {!step.target && (
        <div className="pointer-events-none fixed inset-0 z-[60] bg-slate-950/50" />
      )}
      <aside
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[80] mx-auto w-auto max-w-md overflow-hidden rounded-2xl border border-blue-400/30 bg-slate-900 shadow-[0_20px_70px_rgba(0,0,0,.55)]"
        role="dialog"
        aria-modal="true"
        aria-label="Tour guiado do MetaDriver"
      >
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-[width] duration-300"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              {index === STEPS.length - 1 ? <Check size={20} /> : <Compass size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
                Passo {index + 1} de {STEPS.length}
              </p>
              <h2 className="mt-1 text-base font-bold text-white">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.body}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Fechar tour"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              disabled={index === 0}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:invisible"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            {index === STEPS.length - 1 ? (
              <button
                type="button"
                onClick={finish}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                <Check size={17} />
                Concluir tour
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setIndex((current) => Math.min(STEPS.length - 1, current + 1))
                }
                className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Próximo
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
