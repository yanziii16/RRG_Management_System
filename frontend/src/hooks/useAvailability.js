import { useCallback, useState } from "react";
import { accommodationService } from "../services/accommodationService";
function useAvailability() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const check = useCallback(
    async (params) => {
      setChecking(true);
      try {
        const res = await accommodationService.checkAvailability(params);
        setResult(res);
        return res;
      } catch {
        const fallback = {
          available: false,
          reason: "Could not verify availability right now."
        };
        setResult(fallback);
        return fallback;
      } finally {
        setChecking(false);
      }
    },
    []
  );
  return { checking, result, check, setResult };
}
export {
  useAvailability
};
