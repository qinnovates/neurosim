/**
 * Alert queue — newest-first, max 200 entries.
 */
import { useState, useCallback } from "react";
import type { Alert } from "../lib/protocol";

const MAX_ALERTS = 200;

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlerts = useCallback((newAlerts: Alert[]) => {
    if (newAlerts.length === 0) return;
    setAlerts((prev) => {
      const combined = [...newAlerts, ...prev];
      return combined.slice(0, MAX_ALERTS);
    });
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { alerts, addAlerts, clearAlerts };
}
