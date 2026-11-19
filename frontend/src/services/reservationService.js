import { api } from "./api";
const reservationService = {
  async getAll() {
    const { data } = await api.get("/reservations");
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/reservations/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/reservations", payload);
    return data;
  },
  async updateStatus(id, status) {
    const { data } = await api.patch(`/reservations/${id}/status`, { status });
    return data;
  },
  async updateRentals(id, rentals) {
    const { data } = await api.put(`/reservations/${id}/rentals`, { rentals });
    return data;
  }
};
export {
  reservationService
};
