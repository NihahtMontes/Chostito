import { apiClient } from './client';

export const reservasApi = {
  crearReserva: async (payload) => {
    const response = await apiClient.post('/reservas', payload);
    return response.data;
  },

  misReservas: async () => {
    const response = await apiClient.get('/reservas/mis-reservas');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/reservas/${id}`);
    return response.data;
  },

  cancelar: async (id) => {
    const response = await apiClient.put(`/reservas/${id}/cancelar`);
    return response.data;
  },
};
