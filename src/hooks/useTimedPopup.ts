"use client";

import { useEffect, useRef } from "react";
import { POPUP_CONFIG } from "@/lib/campaign";

export function useTimedPopup(onOpen: () => void, enabled = true) {
  const cbRef = useRef(onOpen);
  cbRef.current = onOpen;

  useEffect(() => {
    if (!enabled) return;

    const agora = Date.now();
    const ultimoVisto = window.localStorage.getItem(POPUP_CONFIG.storageKey);
    const tempoEsperaMs =
      POPUP_CONFIG.hours * 60 * 60 * 1000 +
      POPUP_CONFIG.minutes * 60 * 1000 +
      POPUP_CONFIG.seconds * 1000;

    if (!ultimoVisto || agora - parseInt(ultimoVisto) > tempoEsperaMs) {
      const timer = setTimeout(() => {
        cbRef.current();
        window.localStorage.setItem(POPUP_CONFIG.storageKey, String(Date.now()));
      }, POPUP_CONFIG.delayMs);
      return () => clearTimeout(timer);
    }
  }, [enabled]);
}
