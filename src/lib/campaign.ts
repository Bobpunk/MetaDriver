import type { CampaignConfig, Milestone } from "./types";

export const CAMPAIGN_CONFIG: CampaignConfig = {
  raised: 17.52,
  goalMax: 1500.0,
  notifyUrl: "https://formspree.io/f/mlgggyzk",
  pixPayload:
    "00020126400014br.gov.bcb.pix0118dev.jcfj@gmail.com5204000053039865802BR5920JOSCECLIOFONSCAJNIOR6009Sao Paulo610901227-20062230519daqr1178951418737806304E837",
  pixKey: "dev.jcfj@gmail.com",
};

export const MILESTONES: Milestone[] = [
  {
    goal: 200,
    label: "Hospedagem & Servidor",
    amount: "R$ 200",
    icon: "fa-server",
    brand: false,
  },
  {
    goal: 600,
    label: "Refatoração Do site para um modelo profissional",
    amount: "R$ 600",
    icon: "fa-node-js",
    brand: true,
  },
  {
    goal: 1000,
    label: "Versão para Android",
    amount: "R$ 1.000",
    icon: "fa-android",
    brand: true,
  },
  {
    goal: 1500,
    label: "Publ. e licensa para iOS Apple",
    amount: "R$ 1.500",
    icon: "fa-apple",
    brand: true,
  },
];

export const POPUP_CONFIG = {
  hours: 12,
  minutes: 0,
  seconds: 0,
  delayMs: 2000,
  storageKey: "metadriver_last_seen_timestamp",
};
