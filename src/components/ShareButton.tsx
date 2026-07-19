"use client";

import { useState } from "react";
import { toBlob } from "html-to-image";

export function ShareButton({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const [busy, setBusy] = useState(false);

  async function share() {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const blob = await toBlob(targetRef.current, {
        backgroundColor: "#0f172a",
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          if (node.dataset.shareExclude === "true") return false;
          return true;
        },
      });
      if (!blob) throw new Error("Falha ao gerar imagem");

      const file = new File([blob], "metadriver-resultado.png", {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ title: "MetaDriver", files: [file] });
        } catch {
          // cancelado
        }
      } else {
        const link = document.createElement("a");
        link.download = "metadriver-resultado.png";
        link.href = URL.createObjectURL(file);
        link.click();
        alert("Imagem baixada! Verifique seus downloads.");
      }
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      alert("Erro ao criar a imagem. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={busy}
      data-share-exclude="true"
      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 transition-all active:scale-95 border border-white/10 disabled:opacity-60"
    >
      {busy ? (
        <>
          <i className="fas fa-spinner fa-spin" />
          Gerando imagem...
        </>
      ) : (
        <>
          <i className="fas fa-share-alt" />
          COMPARTILHAR RESULTADO
        </>
      )}
    </button>
  );
}
