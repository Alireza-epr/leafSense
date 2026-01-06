// useUrlHydration.ts
import { useEffect, useRef } from "react";
import { parseUrl } from "../utils";
import { TURLState } from "../types";

export const useUrlHydration = (
  a_Ready: boolean,
  a_Hydrate: (state: TURLState) => void
) => {
  const hydrated = useRef(false);

  useEffect(() => {
    if (!a_Ready || hydrated.current) return;

    const urlState = parseUrl(window.location.search);
    a_Hydrate(urlState);

    hydrated.current = true;
  }, [a_Ready]);

  return hydrated;
}
