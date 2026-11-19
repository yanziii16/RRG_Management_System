import { api } from "./api";
const accommodationService = {
  async getAll(category) {
    const { data } = await api.get("/accommodations", {
      params: category && category !== "All" ? { category } : void 0
    });
    return data;
  },
  async getById(id) {
    const { data } = await api.get(`/accommodations/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/accommodations", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/accommodations/${id}`, payload);
    return data;
  },
  async remove(id) {
    await api.delete(`/accommodations/${id}`);
  },
  async checkAvailability(payload) {
    const { data } = await api.post("/availability/check", payload);
    return data;
  },
  async getFacilities() {
    const { data } = await api.get("/facilities");
    return data;
  },
  async createFacility(payload) {
    const { data } = await api.post("/facilities", payload);
    return data;
  },
  async updateFacility(id, payload) {
    const { data } = await api.put(`/facilities/${id}`, payload);
    return data;
  },
  async deleteFacility(id) {
    await api.delete(`/facilities/${id}`);
  },
  async getGallery() {
    const { data } = await api.get("/gallery");
    return data;
  },
  async addGalleryItem(payload) {
    const { data } = await api.post("/gallery", payload);
    return data;
  },
  async deleteGalleryItem(id) {
    await api.delete(`/gallery/${id}`);
  }
};
export {
  accommodationService
};
