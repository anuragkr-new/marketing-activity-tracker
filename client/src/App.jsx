import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { isLoginHoldActive } from './utils/loginHold.js';
import RequireAuth from './components/RequireAuth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InitiativeDetailPage from './pages/InitiativeDetailPage.jsx';

function LoginRoute({ children }) {
  const { isAuthenticated } = useAuth();
  // #region agent log
  fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'd02cd3',
    },
    body: JSON.stringify({
      sessionId: 'd02cd3',
      location: 'App.jsx:LoginRoute',
      message: 'loginroute_render',
      data: { isAuthenticated, hold: isLoginHoldActive() },
      timestamp: Date.now(),
      hypothesisId: 'A',
    }),
  }).catch(() => {});
  // #endregion
  if (isAuthenticated && !isLoginHoldActive()) {
    // #region agent log
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd02cd3',
      },
      body: JSON.stringify({
        sessionId: 'd02cd3',
        location: 'App.jsx:LoginRoute',
        message: 'loginroute_navigate_spa',
        data: {},
        timestamp: Date.now(),
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRoute>
            <LoginPage />
          </LoginRoute>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/initiative/:id"
        element={
          <RequireAuth>
            <InitiativeDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
