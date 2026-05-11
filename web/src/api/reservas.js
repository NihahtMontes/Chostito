import client from './client'

export const reservasApi = {
  crearReserva: async (payload) => (await client.post('/reservas', payload)).data,
  misReservas: async () => (await client.get('/reservas/mis-reservas')).data,
  getById: async (id) => (await client.get(`/reservas/${id}`)).data,
  cancelar: async (id) => (await client.put(`/reservas/${id}/cancelar`)).data,
}
