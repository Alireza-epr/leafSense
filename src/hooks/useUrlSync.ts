// useUrlSync.ts
import { useEffect } from "react";
import { buildUrl } from "../utils";
import { TURLState } from "../types";

export const useUrlSync = (a_Enabled: boolean, a_State: TURLState) => {
  useEffect(() => {
    if (!a_Enabled) return;

    const params = buildUrl(a_State);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [a_Enabled, JSON.stringify(a_State)]);
};
