import { api } from "./api";
const guestService = {
  async getUsers(role) {
    const { data } = await api.get("/users", {
      params: role ? { role } : void 0
    });
    return data;
  },
  async createUser(payload) {
    const { data } = await api.post("/users", payload);
    return data;
  },
  async updateUser(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },
  async deleteUser(id) {
    await api.delete(`/users/${id}`);
  },
  async getGuestCounts() {
    const { data } = await api.get("/guest-counts");
    return data;
  },
  async addGuestCount(payload) {
    const { data } = await api.post("/guest-counts", payload);
    return data;
  },
  async deleteGuestCount(id) {
    await api.delete(`/guest-counts/${id}`);
  }
};
export {
  guestService
};
