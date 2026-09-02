import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import {
  HourlyZoneMatrixRow,
  HourZoneCell,
} from "../../services/occupancyService";
import {
  OCCUPANCY_ZONES,
  OCCUPANCY_FLOORS,
  getUtilizationStatus,
  UtilizationStatus,
} from "../../config/occupancyThresholds";

interface Props {
  matrix: HourlyZoneMatrixRow[];
}

const STATUS_STYLE: Record<UtilizationStatus, string> = {
  Low: "bg-emerald-500/15 text-emerald-300",
  Medium: "bg-blue-500/20 text-blue-300",
  High: "bg-amber-500/25 text-amber-300",
  Critical: "bg-rose-500/30 text-rose-300",
};

const cellShade = (cell: HourZoneCell): string => {
  const u = cell.utilization;
  if (u === 0) return "bg-slate-800/60";
  if (u <= 40) return `bg-emerald-500/${Math.max(10, Math.round(u / 4))}`;
  if (u <= 70) return `bg-blue-500/${Math.max(20, Math.round(u / 2.2))}`;
  if (u <= 90) return `bg-amber-500/${Math.max(30, Math.round(u / 1.6))}`;
  return "bg-rose-500/70";
};

export const OccupancyHeatmap = ({ matrix }: Props) => {
  const [floor, setFloor] = useState<string>("ALL_FLOORS");
  const [zone, setZone] = useState<string>("ALL_ZONES");
  const [hovered, setHovered] = useState<HourZoneCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const visibleZones = useMemo(() => {
    return OCCUPANCY_ZONES.filter((z) => {
      if (zone !== "ALL_ZONES") return z.id === zone;
      if (floor !== "ALL_FLOORS") {
        const f = OCCUPANCY_FLOORS.find((fl) => fl.id === floor);
        return f ? f.zones.includes(z.id) : true;
      }
      return true;
    });
  }, [floor, zone]);

  const visibleRows = useMemo(
    () =>
      matrix.map((row) => ({
        hour: row.hour,
        cells: visibleZones
          .map((z) => row.cells[z.id])
          .filter(Boolean),
      })),
    [matrix, visibleZones]
  );

  if (matrix.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <HeatmapHeader
          floor={floor}
          zone={zone}
          setFloor={setFloor}
          setZone={setZone}
        />
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No heatmap data available — dataset is empty or unreadable.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
      <HeatmapHeader
        floor={floor}
        zone={zone}
        setFloor={setFloor}
        setZone={setZone}
      />

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[520px]">
          {/* column headers: zones */}
          <div
            className="mb-1 grid gap-1.5 pl-14"
            style={{
              gridTemplateColumns: `repeat(${visibleZones.length}, minmax(0, 1fr))`,
            }}
          >
            {visibleZones.map((z) => (
              <div
                key={z.id}
                className="truncate text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {z.name}
              </div>
            ))}
          </div>

          {/* rows: hours × zones */}
          {visibleRows.map((row) => (
            <div key={row.hour} className="mb-1 flex items-center gap-1.5">
              <div className="w-12 shrink-0 text-right text-[11px] font-medium text-slate-500">
                {row.hour}
              </div>
              <div
                className="grid flex-1 gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${visibleZones.length}, minmax(0, 1fr))`,
                }}
              >
                {row.cells.map((cell) => (
                  <button
                    key={cell.zoneId}
                    type="button"
                    onMouseEnter={(e) => {
                      setHovered(cell);
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      setTooltipPos({ x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setHovered(null)}
                    className={`group relative h-9 rounded-lg border border-slate-800/60 transition-transform hover:scale-[1.04] hover:border-slate-500 ${cellShade(
                      cell
                    )}`}
                  >
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-200/90">
                      {cell.occupancy > 0 ? cell.occupancy : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
        <span className="font-medium uppercase tracking-wider">
          Utilization
        </span>
        {(["Low", "Medium", "High", "Critical"] as UtilizationStatus[]).map(
          (s) => (
            <span
              key={s}
              className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLE[s]}`}
            >
              {s}
            </span>
          )
        )}
        <span className="ml-auto">Cell value = avg occupants in that hour</span>
      </div>

      {/* hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none fixed z-50 w-52 rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur"
          style={{
            left: Math.min(tooltipPos.x, window.innerWidth - 220),
            top: tooltipPos.y - 8,
            transform: "translateY(-100%)",
          }}
        >
          <p className="text-xs font-semibold text-white">
            {hovered.zoneName} · {hovered.floor}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            {hovered.hour}
          </p>
          <div className="mt-2 space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Occupancy</span>
              <span className="font-semibold text-white">
                {hovered.occupancy} / {hovered.capacity}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Utilization</span>
              <span className="font-semibold text-white">
                {hovered.utilization}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[hovered.status]
                  }`}
              >
                {hovered.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------- header with floor / zone selectors -------- */

interface HeaderProps {
  floor: string;
  zone: string;
  setFloor: (v: string) => void;
  setZone: (v: string) => void;
}

const selectClass =
  "rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500";

const HeatmapHeader = ({ floor, zone, setFloor, setZone }: HeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Flame className="h-4 w-4 text-rose-400" />
      <h3 className="text-sm font-semibold text-white">
        Zone Occupancy Heatmap
      </h3>
      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
        DATASET-DRIVEN
      </span>
    </div>
    <div className="flex items-center gap-2">
      <select
        className={selectClass}
        value={floor}
        onChange={(e) => {
          setFloor(e.target.value);
          setZone("ALL_ZONES");
        }}
      >
        <option value="ALL_FLOORS">All Floors</option>
        {OCCUPANCY_FLOORS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={zone}
        onChange={(e) => setZone(e.target.value)}
      >
        <option value="ALL_ZONES">All Zones</option>
        {OCCUPANCY_ZONES.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
          </option>
        ))}
      </select>
    </div>
  </div>
);
