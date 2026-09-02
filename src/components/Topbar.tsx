import { Search, Bell, Settings, Maximize2, ChevronDown } from 'lucide-react';

export const Topbar = () => {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/5 bg-[#0B1120]/90 px-4 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            placeholder="Search facilities, alerts, devices..."
            className="w-full min-w-[220px] rounded-3xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/5 text-slate-200 transition hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </button>
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/5 text-slate-200 transition hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </button>
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/5 text-slate-200 transition hover:bg-white/10">
          <Maximize2 className="h-5 w-5" />
        </button>
        <button className="inline-flex items-center gap-2 rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10">
          <span>Admin User</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
