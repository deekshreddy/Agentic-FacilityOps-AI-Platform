import axios from 'axios';
import { parseCSV } from '../utils/dataParser';
import { MachineRecord } from '../types';

const maintenanceSource = '/data/YOUR_M2_DATASET.csv';

const fetchCsv = async (url: string): Promise<MachineRecord[]> => {
  const response = await axios.get(url, {
    responseType: 'text',
  });

  return parseCSV(response.data) as MachineRecord[];
};

export const getMaintenanceData = async (): Promise<MachineRecord[]> => {
  try {
    const data = await fetchCsv(maintenanceSource);

    console.info(
      `maintenanceDataService: loaded ${data.length} maintenance records`
    );

    return data;
  } catch (error) {
    console.error(
      'maintenanceDataService: failed to load maintenance dataset',
      error
    );

    return [];
  }
};