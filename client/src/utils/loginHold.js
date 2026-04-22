let active = false;

/** While true, LoginRoute must not client-navigate away from /login (full reload follows). */
export function setLoginHold(on) {
  active = Boolean(on);
}

export function clearLoginHold() {
  active = false;
}

export function isLoginHoldActive() {
  return active;
}
