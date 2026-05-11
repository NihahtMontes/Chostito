import { apiClient } from './client';

export const categoriasApi = {
  getAll: async () => {
    const response = await apiClient.get('/categorias');
    return response.data;
  },
};
