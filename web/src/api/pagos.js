import client from './client'

export const pagosApi = {
  getPago: async (reservaId) => (await client.get(`/pagos/reserva/${reservaId}`)).data,
  simularPago: async (reservaId, metodo = 'QR') => (await client.post(`/pagos/${reservaId}/pagar`, { metodoPago: metodo })).data,
  generarQR: async (reservaId) => (await client.post(`/pagos/${reservaId}/qr`)).data,
}
