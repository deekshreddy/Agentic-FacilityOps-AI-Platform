import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="w-[240px] min-w-[240px] shrink-0">
          <Sidebar />
        </aside>

        {/* MAIN APPLICATION AREA */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          <Topbar />

          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <Outlet />
          </main>

        </div>

      </div>
    </div>
  );
};