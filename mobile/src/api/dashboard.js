import { apiClient } from './client';

export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  misVentas: async () => {
    const response = await apiClient.get('/dashboard/mis-ventas');
    return response.data;
  },

  escanearQR: async (codigoQR) => {
    const response = await apiClient.post('/dashboard/entradas/escanear', { codigoQR });
    return response.data;
  },

  todasGanancias: async () => {
    const response = await apiClient.get('/dashboard/todas-ganancias');
    return response.data;
  },
};
