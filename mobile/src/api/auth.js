import { apiClient } from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  solicitarReset: async (email) => {
    const response = await apiClient.post('/auth/solicitar-reset', { email });
    return response.data;
  },

  resetPassword: async (email, token, nuevaPassword) => {
    const response = await apiClient.post('/auth/reset-password', { email, token, nuevaPassword });
    return response.data;
  },

  uploadFoto: async (fotoBase64) => {
    const response = await apiClient.post('/auth/upload-foto', { fotoBase64 });
    return response.data;
  },
};
