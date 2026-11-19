import { api } from "./api";
const paymentService = {
  async getAll() {
    const { data } = await api.get("/payments");
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/payments", payload);
    return data;
  },
  async verify(id, status, notes) {
    const { data } = await api.patch(`/payments/${id}/verify`, { status, notes });
    return data;
  }
};
export {
  paymentService
};
