import { apiClient } from './client';

export const lugaresApi = {
  getAll: async () => {
    const response = await apiClient.get('/lugares');
    return response.data;
  },
};
