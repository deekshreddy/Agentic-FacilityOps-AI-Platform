import { useEffect, useState } from 'react';

export type MaintenanceRecord = Record<string, any>;

const API_URL = 'http://127.0.0.1:8000/api/maintenance/';

const normalizeMaintenanceRecord = (
  record: MaintenanceRecord
): MaintenanceRecord => {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      if (
        record[key] !== undefined &&
        record[key] !== null &&
        record[key] !== ''
      ) {
        return record[key];
      }
    }

    return '';
  };

  return {
    ...record,

    // Machine ID
    product_id: get(
      'product_id',
      'Product ID',
      'Product_ID',
      'productId'
    ),

    // Machine type
    Type: get('Type', 'type'),

    // Temperatures
    air_temp: Number(
      get(
        'air_temp',
        'Air temperature [K]',
        'Air Temperature [K]',
        'Air_temperature'
      )
    ),

    process_temp: Number(
      get(
        'process_temp',
        'Process temperature [K]',
        'Process Temperature [K]',
        'Process_temperature'
      )
    ),

    // Speed
    speed: Number(
      get(
        'speed',
        'rotational_speed',
        'Rotational speed [rpm]'
      )
    ),

    rotational_speed: Number(
      get(
        'speed',
        'rotational_speed',
        'Rotational speed [rpm]'
      )
    ),

    // Torque
    torque: Number(
      get(
        'torque',
        'Torque [Nm]',
        'Torque'
      )
    ),

    // Tool wear
    tool_wear: Number(
      get(
        'tool_wear',
        'Tool wear [min]',
        'Tool Wear [min]',
        'Tool_wear'
      )
    ),

    // Failure information
    target_real: get(
      'target_real',
      'Target_Real'
    ),

    target: get(
      'target',
      'Target'
    ),

    machine_failure: get(
      'machine_failure',
      'Machine failure',
      'Machine Failure',
      'target',
      'Target'
    ),
  };
};

export const useMaintenanceData = () => {
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Fetching maintenance data from:', API_URL);

        const response = await fetch(API_URL, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(
            `Maintenance API returned ${response.status}`
          );
        }

        /* Guard: never parse an HTML error page as JSON */
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          throw new Error(
            `Maintenance API returned non-JSON response (${contentType || 'unknown type'}). Is the backend running at ${API_URL}?`
          );
        }

        const result = await response.json();

        console.log('Maintenance API response:', result);

        const records = Array.isArray(result)
          ? result
          : Array.isArray(result.records)
            ? result.records
            : [];

        const normalized = records.map(
          normalizeMaintenanceRecord
        );

        if (!cancelled) {
          console.log(
            `M2 maintenance dataset loaded: ${normalized.length} records`
          );

          console.log(
            'First maintenance record:',
            normalized[0]
          );

          setData(normalized);
        }

      } catch (err: any) {
        console.error(
          'Maintenance backend error:',
          err
        );

        if (!cancelled) {
          setData([]);

          setError(
            `Maintenance Backend Error: ${
              err?.message || 'Failed to fetch'
            }`
          );
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
};