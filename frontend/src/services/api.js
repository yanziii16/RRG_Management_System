import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_STORAGE_KEY = "luckystar_auth_token";
const USER_STORAGE_KEY = "luckystar_auth_user";
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
function extractErrorMessage(err, fallback = "Something went wrong.") {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
export {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  api,
  extractErrorMessage
};
