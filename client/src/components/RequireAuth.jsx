import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // #region agent log
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd02cd3',
      },
      body: JSON.stringify({
        sessionId: 'd02cd3',
        location: 'RequireAuth.jsx',
        message: 'requireauth_redirect_login',
        data: { pathname: location.pathname },
        timestamp: Date.now(),
        hypothesisId: 'D',
      }),
    }).catch(() => {});
    // #endregion
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
