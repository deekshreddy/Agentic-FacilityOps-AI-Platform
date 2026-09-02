import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/dashboardService';
import { FacilityRecord } from '../types';

export const useDashboardData = () => {
  const [data, setData] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getDashboardData();
        if (!items || !items.length) {
          setError('No dataset available');
          setData([]);
        } else {
          setData(items);
        }
      } catch (err) {
        setError('Unable to load facility dataset.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { data, loading, error };
};
