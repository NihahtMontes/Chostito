import client from './client'

export const categoriasApi = {
  getAll: async () => (await client.get('/categorias')).data,
  create: async (data) => (await client.post('/categorias', data)).data,
  update: async (id, data) => (await client.put(`/categorias/${id}`, data)).data,
  delete: async (id) => (await client.delete(`/categorias/${id}`)).data,
}
