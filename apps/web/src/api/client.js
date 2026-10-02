import { clearSession, getStoredToken } from "../lib/auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("Unable to reach the RescueBite API. Check that the Laravel server is running.");
  }

  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const firstValidationError = payload.errors
      ? Object.values(payload.errors).flat().find(Boolean)
      : null;

    if (response.status === 401 && token && getStoredToken() === token) {
      clearSession();

      if (window.location.pathname.startsWith("/admin")) {
        window.location.assign("/admin/login");
      }
    }

    const message = response.status === 403 && path.startsWith("/admin/")
      ? "Admin access required."
      : firstValidationError || payload.message || `Request failed with status ${response.status}.`;

    throw new ApiError(
      message,
      response.status,
      payload.errors || null,
    );
  }

  return payload;
}

export const api = {
  login: (credentials) => request("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),

  getAdminDashboard: () => request("/admin/dashboard"),

  getAdminNgos: () => request("/admin/ngos"),

  approveNgo: (id) => request(`/admin/ngos/${id}/approve`, {
    method: "PATCH",
  }),

  rejectNgo: (id) => request(`/admin/ngos/${id}/reject`, {
    method: "PATCH",
  }),

  getAdminVolunteers: () => request("/admin/volunteers"),

  approveVolunteer: (id) => request(`/admin/volunteers/${id}/approve`, {
    method: "PATCH",
  }),

  rejectVolunteer: (id) => request(`/admin/volunteers/${id}/reject`, {
    method: "PATCH",
  }),

  getAdminDonors: () => request("/admin/donors"),

  getAdminDonations: () => request("/admin/donations"),

  getAdminRequests: () => request("/admin/requests"),

  reviewAdminRequest: (id, decision, review_note = "") => request(`/admin/requests/${id}/${decision}`, {
    method: "PATCH",
    body: JSON.stringify({ review_note }),
  }),

  getAdminReports: () => request("/admin/reports"),

  getAdminActivity: () => request("/admin/activity"),

  getAdminReportedContent: () => request("/admin/reported-content"),

  resolveReport: (id, status, resolution_note = "") => request(`/admin/reported-content/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolution_note }),
  }),

  register: (user) => request("/register", {
    method: "POST",
    body: JSON.stringify(user),
  }),

  logout: () => request("/logout", { method: "POST" }),

  createDonation: (donation) => request("/donations", {
    method: "POST",
    body: JSON.stringify(donation),
  }),

  getDonations: () => request("/donations"),

  getHomepageAnalytics: () => request("/homepage/analytics"),

  getMyDonations: () => request("/my-donations"),

  getRequests: () => request("/requests"),

  getNgoRequests: () => request("/ngo/requests"),

  requestDonation: (donationId) => request(`/ngo/donations/${donationId}/request`, {
    method: "POST",
  }),

  getVolunteerTasks: () => request("/volunteer/tasks"),

  acceptPickup: (taskId) => request(`/volunteer/tasks/${taskId}/accept`, {
    method: "PATCH",
  }),

  updatePickup: (taskId, status, completion_note = "") => request(`/volunteer/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, completion_note }),
  }),

  getNotifications: () => request("/notifications"),

  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  }),

  markAllNotificationsRead: () => request("/notifications/read-all", {
    method: "PATCH",
  }),
};