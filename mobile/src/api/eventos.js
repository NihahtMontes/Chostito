import { apiClient } from './client';

export const eventosApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/eventos', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/eventos/${id}`);
    return response.data;
  },

  getEntradas: async (id) => {
    const response = await apiClient.get(`/eventos/${id}/entradas`);
    return response.data;
  },

  misEventos: async () => {
    const response = await apiClient.get('/eventos/mis-eventos');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/eventos', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/eventos/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/eventos/${id}`);
    return response.data;
  },

  agregarEntradas: async (eventoId, data) => {
    const response = await apiClient.post(`/eventos/${eventoId}/entradas`, data);
    return response.data;
  },

  uploadImagen: async (eventoId, formData) => {
    const response = await apiClient.post(`/eventos/${eventoId}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  reemplazarEntradas: async (eventoId, entradas) => {
    const response = await apiClient.put(`/eventos/${eventoId}/entradas`, entradas);
    return response.data;
  },

  getAsientos: async (eventoId) => {
    const response = await apiClient.get(`/eventos/${eventoId}/asientos`);
    return response.data;
  },

  getTodos: async () => {
    const response = await apiClient.get('/eventos/todos');
    return response.data;
  },
};
