import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PieChart as ChartPie } from "lucide-react";
import { StatusDistributionPoint } from "../../services/occupancyService";
import { UtilizationStatus } from "../../config/occupancyThresholds";

interface Props {
  distribution: StatusDistributionPoint[];
  totalRecords: number;
}

const STATUS_COLOR: Record<UtilizationStatus, string> = {
  Low: "#34d399",
  Medium: "#60a5fa",
  High: "#fbbf24",
  Critical: "#f87171",
} as const;

export const StatusDistribution = ({
  distribution,
  totalRecords,
}: Props) => {
  const data = distribution.filter((d) => d.count > 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <ChartPie className="h-4 w-4 text-purple-400" />
        <div>
          <h3 className="text-sm font-semibold text-white">
            Occupancy Status Distribution
          </h3>
          <p className="text-[11px] text-slate-500">
            {totalRecords.toLocaleString()} records classified by facility
            utilization
          </p>
        </div>
      </div>

      {totalRecords === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">
          No occupancy records available for the selected filters.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.status} fill={STATUS_COLOR[d.status as UtilizationStatus]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  color: "#e2e8f0",
                }}
                formatter={(value, name) => [
                  `${value} records`,
                  `${name}`,
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-400">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid w-full shrink-0 grid-cols-2 gap-2 lg:w-48 lg:grid-cols-1">
            {distribution.map((d) => (
              <div
                key={d.status}
                className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-1.5"
              >
                <span className="flex items-center gap-2 text-xs text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[d.status as UtilizationStatus] }}
                  />
                  {d.status}
                </span>
                <span className="text-xs font-semibold text-white">
                  {d.count.toLocaleString()}
                  <span className="ml-1 font-normal text-slate-500">
                    ({d.percentage}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
