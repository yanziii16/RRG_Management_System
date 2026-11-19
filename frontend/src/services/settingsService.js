import { api } from "./api";
const settingsService = {
  async get() {
    const { data } = await api.get("/settings");
    return data;
  },
  async update(payload) {
    const { data } = await api.put("/settings", payload);
    return data;
  }
};
export {
  settingsService
};
