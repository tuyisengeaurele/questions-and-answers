"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type MouseEvent } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { useT } from "@/components/lang-provider";

export interface Guard {
  title: string;
  message: string;
}

interface Value {
  setGuard: (guard: Guard | null) => void;
  /** Use as a link's onClick: asks first when a guard is active. */
  guardClick: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
}

const Ctx = createContext<Value | null>(null);

export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { t } = useT();
  const guard = useRef<Guard | null>(null);

  const setGuard = useCallback((next: Guard | null) => {
    guard.current = next;
  }, []);

  const guardClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      const g = guard.current;
      if (!g || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      void confirm({ title: g.title, message: g.message, confirmLabel: t("leave.confirm"), cancelLabel: t("leave.stay") }).then((ok) => {
        if (!ok) return;
        guard.current = null;
        router.push(href);
      });
    },
    [confirm, router, t],
  );

  const value = useMemo(() => ({ setGuard, guardClick }), [setGuard, guardClick]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLeaveGuardContext(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLeaveGuardContext must be used inside LeaveGuardProvider");
  return v;
}

/** While `active`, leaving through the navigation bar asks first, and closing the tab shows the browser's own warning. */
export function useLeaveGuard(active: boolean, guard: Guard) {
  const { setGuard } = useLeaveGuardContext();
  const { title, message } = guard;

  useEffect(() => {
    if (!active) return;
    setGuard({ title, message });
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      setGuard(null);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, title, message, setGuard]);
}
