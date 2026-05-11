import { apiClient } from './client';

export const favoritosApi = {
  getAll: async () => {
    const response = await apiClient.get('/favoritos');
    return response.data;
  },

  agregar: async (eventoId) => {
    const response = await apiClient.post(`/favoritos/${eventoId}`);
    return response.data;
  },

  eliminar: async (eventoId) => {
    const response = await apiClient.delete(`/favoritos/${eventoId}`);
    return response.data;
  },
};
