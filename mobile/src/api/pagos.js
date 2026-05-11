import { apiClient } from './client';

export const pagosApi = {
  getPago: async (reservaId) => {
    const response = await apiClient.get(`/pagos/reserva/${reservaId}`);
    return response.data;
  },

  simularPago: async (reservaId, metodoPago = 'QR') => {
    const response = await apiClient.post(`/pagos/${reservaId}/pagar`, { metodoPago });
    return response.data;
  },

  generarQR: async (reservaId) => {
    const response = await apiClient.post(`/pagos/${reservaId}/qr`);
    return response.data;
  },
};
