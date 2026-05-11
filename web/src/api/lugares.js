import client from './client'

export const lugaresApi = {
  getAll: async () => (await client.get('/lugares')).data,
  create: async (data) => (await client.post('/lugares', data)).data,
  update: async (id, data) => (await client.put(`/lugares/${id}`, data)).data,
  delete: async (id) => (await client.delete(`/lugares/${id}`)).data,
}
