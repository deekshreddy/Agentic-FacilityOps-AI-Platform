import { useEffect, useState } from 'react';
import { getEnergyData } from '../services/energyService';
import { FacilityRecord } from '../types';

export const useEnergyData = () => {
  const [data, setData] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getEnergyData();
        if (!items || !items.length) {
          setError('Energy dataset could not be loaded.');
          setData([]);
        } else {
          setData(items);
        }
      } catch (err) {
        setError('Energy dataset could not be loaded.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { data, loading, error };
};
