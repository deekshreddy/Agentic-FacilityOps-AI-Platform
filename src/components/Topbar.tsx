import { useState } from 'react';
import { Search, Bell, Settings, Maximize2, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Topbar = () => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

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
        <div className="relative">
          <button
            type="button"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
          >
            <UserCircle className="h-5 w-5 text-blue-300" />
            <span className="max-w-[140px] truncate">{user?.name ?? 'Account'}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-white/10 bg-[#111b31] p-2 shadow-2xl shadow-black/30">
              <div className="border-b border-white/10 px-3 py-2">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/5">
                <UserCircle className="h-4 w-4" />
                Profile
              </button>
              <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-300 hover:bg-red-500/10">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
