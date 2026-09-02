import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Wrench,
  Users,
  Shield,
  Settings,
  Building2,
} from 'lucide-react';

export const Sidebar = () => {
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Energy',
      path: '/energy',
      icon: Zap,
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
    },
    {
      name: 'Occupancy',
      path: '/occupancy',
      icon: Users,
    },
    {
      name: 'Security',
      path: '/security',
      icon: Shield,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="flex h-screen w-full flex-col border-r border-slate-800 bg-[#0B1120]">

      {/* LOGO */}
      <div className="flex h-[120px] items-center border-b border-slate-800 px-5">
        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
            <Building2 className="h-6 w-6 text-blue-400" />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-500">
              FacilityOps
            </p>

            <p className="text-lg font-bold text-white">
              AI Platform
            </p>
          </div>

        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-4 py-7">

        <p className="mb-5 px-2 text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
          Menu
        </p>

        <nav className="space-y-2">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex w-full items-center gap-4 rounded-full px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="whitespace-nowrap">
                  {item.name}
                </span>
              </NavLink>
            );
          })}

        </nav>
      </div>

      {/* ACCOUNT */}
      <div className="border-t border-slate-800 p-4">

        <div className="rounded-2xl bg-slate-900 px-5 py-5">

          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
            Account
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            Admin User
          </p>

          <p className="text-xs text-slate-500">
            Facility Manager
          </p>

        </div>

      </div>

    </aside>
  );
};