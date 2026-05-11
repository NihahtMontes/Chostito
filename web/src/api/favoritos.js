import client from './client'

export const favoritosApi = {
  getAll: async () => (await client.get('/favoritos')).data,
  agregar: async (eventoId) => (await client.post(`/favoritos/${eventoId}`)).data,
  eliminar: async (eventoId) => (await client.delete(`/favoritos/${eventoId}`)).data,
}
