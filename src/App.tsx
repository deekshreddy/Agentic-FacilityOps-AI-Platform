import { Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EnergyPage from "./pages/EnergyPage";
import MaintenancePage from "./pages/MaintenancePage";
import OccupancyPage from "./pages/OccupancyPage";
import SecurityPage from "./pages/SecurityPage";
import CostAnalysisPage from "./pages/CostAnalysisPage";
import CostOptimizationPage from "./pages/CostOptimizationPage";
import ReportsPage from "./pages/ReportsPage";
import AlertsPage from "./pages/AlertsPage";
import DevicesPage from "./pages/DevicesPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />

        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="energy" element={<EnergyPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="occupancy" element={<OccupancyPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="cost-analysis" element={<CostAnalysisPage />} />
        <Route path="cost-optimization" element={<CostOptimizationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;