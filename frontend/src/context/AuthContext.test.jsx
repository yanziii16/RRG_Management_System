import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { api, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../services/api";

const guest = { id: 1, name: "Resort Guest", role: "GUEST" };
const session = { token: "fixture-session", user: guest };
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(api, "get").mockRejectedValue(new Error("Unexpected request"));
  vi.spyOn(api, "post").mockRejectedValue(new Error("Unexpected request"));
  vi.spyOn(api, "put").mockRejectedValue(new Error("Unexpected request"));
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

it("loads the application with the authentication provider exports", async () => {
  const { default: App } = await import("../App");
  expect(App).toBeTypeOf("function");
});

it("provides a signed-out session without requesting a profile", () => {
  const { result } = renderHook(useAuth, { wrapper });

  expect(result.current.user).toBeNull();
  expect(result.current.loading).toBe(false);
  expect(result.current.isAuthenticated).toBe(false);
  expect(api.get).not.toHaveBeenCalled();
});

it("refreshes a stored session before marking it ready", async () => {
  localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guest));
  api.get.mockResolvedValue({ data: { user: guest } });

  const { result } = renderHook(useAuth, { wrapper });
  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(api.get).toHaveBeenCalledWith("/auth/me");
  expect(result.current.user).toEqual(guest);
  expect(result.current.isGuest).toBe(true);
});

it("clears a stored session when profile verification fails", async () => {
  localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guest));
  api.get.mockRejectedValue(new Error("Session expired"));

  const { result } = renderHook(useAuth, { wrapper });

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.isAuthenticated).toBe(false);
  expect(result.current.user).toBeNull();
  expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
});

it("updates the shared session on login and logout", async () => {
  const admin = { ...guest, role: "ADMIN" };
  api.post.mockResolvedValue({ data: { ...session, user: admin } });
  const { result } = renderHook(useAuth, { wrapper });

  await act(async () => {
    await result.current.login("admin@example.test", "", "ADMIN");
  });

  expect(api.post).toHaveBeenCalledWith("/auth/login", {
    email: "admin@example.test",
    password: "",
    expectedRole: "ADMIN"
  });
  expect(result.current.user).toEqual(admin);
  expect(result.current.isAdmin).toBe(true);
  expect(result.current.isAuthenticated).toBe(true);

  act(() => result.current.logout());

  expect(result.current.user).toBeNull();
  expect(result.current.isAuthenticated).toBe(false);
  expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
});

it.each([
  { name: " Resort Guest ", phone: " 09123456789 " },
  { fullName: " Resort Guest ", contactNumber: " 09123456789 " },
  { full_name: " Resort Guest ", contact_number: " 09123456789 " }
])("registers through the provider with the backend field names: %j", async (fields) => {
  api.post.mockResolvedValue({ data: session });
  const { result } = renderHook(useAuth, { wrapper });

  await act(async () => {
    await result.current.register({
      ...fields,
      email: " guest@example.test ",
      address: " Resort Road ",
      password: ""
    });
  });

  expect(api.post).toHaveBeenCalledWith("/auth/register", {
    full_name: "Resort Guest",
    email: "guest@example.test",
    contact_number: "09123456789",
    address: "Resort Road",
    password: ""
  });
  expect(result.current.user).toEqual(guest);
  expect(result.current.isAuthenticated).toBe(true);
  expect(localStorage.getItem(USER_STORAGE_KEY)).toBe(JSON.stringify(guest));
});
