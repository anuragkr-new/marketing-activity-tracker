import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.jsx';
import InitiativeDetailPage from './pages/InitiativeDetailPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/initiative/:id" element={<InitiativeDetailPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
