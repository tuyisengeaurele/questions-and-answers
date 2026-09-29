"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive action. */
  danger?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<Confirm | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(next);
    });
  }, []);

  useEffect(() => {
    if (options && !dialog.current?.open) dialog.current?.showModal();
  }, [options]);

  function close(answer: boolean) {
    dialog.current?.close();
    resolver.current?.(answer);
    resolver.current = null;
    setOptions(null);
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close(false);
        }}
        className="confirm m-auto w-[min(92vw,26rem)] rounded-3xl border border-line bg-panel p-0 text-text shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-md"
      >
        {options && (
          <div className="p-6">
            <h2 id="confirm-title" className="text-lg font-semibold tracking-tight">
              {options.title}
            </h2>
            {options.message && (
              <p id="confirm-message" className="mt-2 text-mute">
                {options.message}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => close(false)}
                className="press min-h-12 rounded-2xl border border-line font-medium"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`press min-h-12 rounded-2xl font-semibold ${
                  options.danger ? "bg-bad text-on-bad" : "bg-lime text-on-lime"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(Ctx);
  if (!confirm) throw new Error("useConfirm must be used inside ConfirmProvider");
  return confirm;
}
