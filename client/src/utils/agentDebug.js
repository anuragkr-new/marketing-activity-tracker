const K_LOG = 'spyne_at_debug_log';
const K_ERR = 'spyne_at_last_login_error';
const K_HOLD = 'spyne_at_login_hold';

/** Prevents LoginRoute from redirecting away until user opens the dashboard. */
export function setLoginHold() {
  try {
    sessionStorage.setItem(K_HOLD, '1');
  } catch {
    /* ignore */
  }
}

export function clearLoginHold() {
  try {
    sessionStorage.removeItem(K_HOLD);
  } catch {
    /* ignore */
  }
}

export function hasLoginHold() {
  try {
    return sessionStorage.getItem(K_HOLD) === '1';
  } catch {
    return false;
  }
}

/** Append NDJSON line + console; survives navigation for copy/paste. */
export function agentDebugLog(location, message, data, hypothesisId) {
  const payload = {
    sessionId: 'd02cd3',
    timestamp: Date.now(),
    location,
    message,
    data,
    hypothesisId,
  };
  const line = JSON.stringify(payload);
  console.error('__AGENT_DEBUG__', line);
  try {
    const prev = JSON.parse(sessionStorage.getItem(K_LOG) || '[]');
    prev.push(line);
    sessionStorage.setItem(K_LOG, JSON.stringify(prev.slice(-50)));
  } catch {
    /* private mode / quota */
  }
  fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'd02cd3',
    },
    body: line,
  }).catch(() => {});
}

export function persistLoginError(msg) {
  try {
    sessionStorage.setItem(K_ERR, String(msg || ''));
  } catch {
    /* ignore */
  }
}

export function clearLoginDebug() {
  try {
    sessionStorage.removeItem(K_LOG);
    sessionStorage.removeItem(K_ERR);
  } catch {
    /* ignore */
  }
}

export function readDebugLogLines() {
  try {
    return JSON.parse(sessionStorage.getItem(K_LOG) || '[]');
  } catch {
    return [];
  }
}

export function readLastLoginError() {
  try {
    return sessionStorage.getItem(K_ERR) || '';
  } catch {
    return '';
  }
}
