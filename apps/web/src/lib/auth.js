const TOKEN_KEY = "rescuebite_token";
const USER_KEY = "rescuebite_user";

export function getStoredUser() {
  migrateLegacySession();

  try {
    const value = sessionStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  migrateLegacySession();
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("rescuebite:auth-changed"));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("rescuebite:auth-changed"));
}

export function isAuthenticated() {
  return Boolean(getStoredToken());
}

function migrateLegacySession() {
  if (sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(USER_KEY)) {
    return;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);

  if (token && user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, user);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function dashboardForRole(role) {
  if (role === "donor") return "/donor/dashboard";
  if (role === "ngo") return "/ngo/dashboard";
  if (role === "volunteer") return "/volunteer/dashboard";
  if (role === "admin") return "/admin";

  return "/";
}