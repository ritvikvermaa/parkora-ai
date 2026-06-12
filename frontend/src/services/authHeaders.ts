export const getAuthToken = () =>
  (globalThis as any).__PARKORA_AUTH_TOKEN__ ||
  sessionStorage.getItem("token") || localStorage.getItem("token") || "";

export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAuthToken()}`,
});
