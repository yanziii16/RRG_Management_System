import { api } from "./api";
const rentalService = {
  async getAll() {
    const { data } = await api.get("/rentals");
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/rentals", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/rentals/${id}`, payload);
    return data;
  },
  async remove(id) {
    await api.delete(`/rentals/${id}`);
  }
};
export {
  rentalService
};
