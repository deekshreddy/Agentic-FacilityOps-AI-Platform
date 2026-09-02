import { Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import EnergyPage from "./pages/EnergyPage";
import MaintenancePage from "./pages/MaintenancePage";
import OccupancyPage from "./pages/OccupancyPage";
import SecurityPage from "./pages/SecurityPage";
import CostAnalysisPage from "./pages/CostAnalysisPage";
import ReportsPage from "./pages/ReportsPage";
import AlertsPage from "./pages/AlertsPage";
import DevicesPage from "./pages/DevicesPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        <Route
          path="dashboard"
          element={<Navigate to="/" replace />}
        />

        <Route path="energy" element={<EnergyPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="occupancy" element={<OccupancyPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="cost-analysis" element={<CostAnalysisPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Route>
    </Routes>
  );
}

export default App;