"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useT } from "@/components/lang-provider";
import type { Pic } from "@/lib/types";

const Ctx = createContext<((pic: Pic) => void) | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pic, setPic] = useState<Pic | null>(null);

  const open = useCallback((next: Pic) => setPic(next), []);

  useEffect(() => {
    if (pic && !dialog.current?.open) dialog.current?.showModal();
  }, [pic]);

  function close() {
    dialog.current?.close();
    setPic(null);
  }

  return (
    <Ctx.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-label={t("card.zoom")}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={close}
        className="confirm m-auto max-h-[92dvh] w-[min(94vw,34rem)] rounded-3xl border border-line bg-panel p-0 text-text shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-md"
      >
        {pic && (
          <div className="relative p-4">
            <div className="flex justify-center rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimised WebP */}
              <img src={pic.src} width={pic.w} height={pic.h} alt="" className="h-auto max-h-[70dvh] w-full object-contain" />
            </div>
            <button
              type="button"
              autoFocus
              onClick={close}
              className="press mt-3 min-h-12 w-full rounded-2xl border border-line font-medium"
            >
              {t("close")}
            </button>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  );
}

export function useLightbox(): (pic: Pic) => void {
  const open = useContext(Ctx);
  if (!open) throw new Error("useLightbox must be used inside LightboxProvider");
  return open;
}
