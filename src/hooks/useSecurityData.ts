import { useCallback, useEffect, useState } from "react";
import {
  loadSecurityData,
  SecurityRecord,
} from "../services/securityService";
import { runSecurityAgent, SecurityAgentReport } from "../agents/securityAgent";

export const useSecurityData = () => {
  const [records, setRecords] = useState<SecurityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SecurityAgentReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadSecurityData();
      setRecords(data);
      setReport(runSecurityAgent(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load security dataset."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { records, loading, error, report, reload: load };
};
