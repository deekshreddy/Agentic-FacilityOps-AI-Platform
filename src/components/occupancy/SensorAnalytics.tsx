import { Thermometer, Wind, Sun, Volume2, Activity } from "lucide-react";
import { SensorAnalysis } from "../../services/occupancyService";

interface Props {
  sensors: SensorAnalysis;
}

export const SensorAnalytics = ({ sensors }: Props) => {
  const cards = [
    {
      title: "Average Temperature",
      value: `${sensors.averageTemperature.toFixed(1)} °C`,
      sub: "S1–S4 temperature sensors",
      icon: Thermometer,
      accent: "text-orange-400 bg-orange-500/10",
    },
    {
      title: "Average CO2",
      value: `${sensors.averageCO2.toLocaleString()} ppm`,
      sub: "S5 CO2 sensor",
      icon: Wind,
      accent: "text-cyan-400 bg-cyan-500/10",
    },
    {
      title: "Average Light",
      value: sensors.averageLight.toLocaleString(),
      sub: "S1–S4 light sensors",
      icon: Sun,
      accent: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Average Sound",
      value: sensors.averageSound.toFixed(2),
      sub: "S1–S4 sound sensors",
      icon: Volume2,
      accent: "text-violet-400 bg-violet-500/10",
    },
    {
      title: "PIR Activity",
      value: `${Math.round(sensors.pirActivity * 100)}%`,
      sub: "Share of readings with PIR triggered",
      icon: Activity,
      accent: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/15 p-2.5">
          <Thermometer className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Environmental Conditions</h2>
          <p className="text-xs text-slate-400">
            Real sensor averages across all loaded records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur transition-colors hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{card.sub}</p>
                </div>
                <div className={`shrink-0 rounded-xl p-2.5 ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
