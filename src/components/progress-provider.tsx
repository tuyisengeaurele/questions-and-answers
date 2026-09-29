"use client";

import { createContext, useContext, useEffect, useReducer, useState, type Dispatch } from "react";
import { initialProgress, reducer, type Action, type Progress } from "@/lib/progress";
import { getStorage, loadProgress, saveProgress } from "@/lib/storage";

interface Value {
  progress: Progress;
  dispatch: Dispatch<Action>;
  ready: boolean;
  persisted: boolean;
}

const Ctx = createContext<Value | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, undefined, initialProgress);
  const [ready, setReady] = useState(false);
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    // Read after mount so server and first client render match.
    dispatch({ type: "load", state: loadProgress(getStorage()) });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect whether the save worked
    setPersisted(saveProgress(getStorage(), progress));
  }, [progress, ready]);

  return <Ctx.Provider value={{ progress, dispatch, ready, persisted }}>{children}</Ctx.Provider>;
}

export function useProgress(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress must be used inside ProgressProvider");
  return v;
}
