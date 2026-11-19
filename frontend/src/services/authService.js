import { api, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "./api";
const authService = {
  async login(email, password, expectedRole) {
    const { data } = await api.post("/auth/login", {
      email,
      password,
      expectedRole
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data;
  },
  async register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data;
  },
  async getMe() {
    const { data } = await api.get("/auth/me");
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  },
  async updateProfile(payload) {
    const { data } = await api.put("/auth/profile", payload);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  },
  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },
  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
};
export {
  authService
};
