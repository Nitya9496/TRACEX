import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import DashboardPage from "./pages/DashboardPage";
import InvestigationsPage from "./pages/InvestigationsPage";
import InvestigationWorkspace from "./pages/InvestigationWorkspace";
import ActorsPage from "./pages/ActorsPage";
import ActorProfilePage from "./pages/ActorProfilePage";
import InfrastructurePage from "./pages/InfrastructurePage";
import GraphPage from "./pages/GraphPage";
import StylometryPage from "./pages/StylometryPage";
import BehaviourPage from "./pages/BehaviourPage";
import EvidencePage from "./pages/EvidencePage";
import TimelinePage from "./pages/TimelinePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/investigations" element={<InvestigationsPage />} />
            <Route path="/investigations/:id" element={<InvestigationWorkspace />} />
            <Route path="/actors" element={<ActorsPage />} />
            <Route path="/actors/:id" element={<ActorProfilePage />} />
            <Route path="/infrastructure" element={<InfrastructurePage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/stylometry" element={<StylometryPage />} />
            <Route path="/behaviour" element={<BehaviourPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
}
