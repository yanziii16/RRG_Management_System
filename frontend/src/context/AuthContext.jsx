import { api, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../api";

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
    const body = {
      full_name: (payload.full_name ?? payload.fullName ?? payload.name ?? "").trim(),
      email: (payload.email ?? "").trim(),
      contact_number: (payload.contact_number ?? payload.contactNumber ?? payload.phone ?? "").trim(),
      address: (payload.address ?? "").trim(),
      password: payload.password ?? ""
    };
    const { data } = await api.post("/auth/register", body);
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
import { createContext, useCallback, useEffect, useState } from "react";
import { extractErrorMessage, TOKEN_STORAGE_KEY } from "../services/api";
import { authService } from "../services/authService";
const AuthContext = createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);
  const login = async (email, password, expectedRole) => {
    try {
      const res = await authService.login(email, password, expectedRole);
      setUser(res.user);
      return res.user;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Invalid credentials."));
    }
  };
  const register = async (payload) => {
    try {
      const res = await authService.register(payload);
      setUser(res.user);
      return res.user;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Unable to create account."));
    }
  };
  const updateProfile = async (payload) => {
    try {
      const updated = await authService.updateProfile(payload);
      setUser(updated);
      return updated;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to update profile."));
    }
  };
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  return <AuthContext.Provider
    value={{
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      isGuest: user?.role === "GUEST",
      login,
      register,
      logout,
      refreshProfile,
      updateProfile
    }}
  >
      {children}
    </AuthContext.Provider>;
};
export {
  AuthContext,
  AuthProvider
};
