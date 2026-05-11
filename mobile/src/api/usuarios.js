import { apiClient } from './client';

export const usuariosApi = {
  getAll: async () => {
    const response = await apiClient.get('/usuarios');
    return response.data;
  },
};
