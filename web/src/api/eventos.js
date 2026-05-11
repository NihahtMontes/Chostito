import client from './client'

export const eventosApi = {
  getAll: async (params = {}) => (await client.get('/eventos', { params })).data,
  getById: async (id) => (await client.get(`/eventos/${id}`)).data,
  getEntradas: async (id) => (await client.get(`/eventos/${id}/entradas`)).data,
  getAsientos: async (id) => (await client.get(`/eventos/${id}/asientos`)).data,
  misEventos: async () => (await client.get('/eventos/mis-eventos')).data,
  getTodos: async () => (await client.get('/eventos/todos')).data,
  create: async (data) => (await client.post('/eventos', data)).data,
  update: async (id, data) => (await client.put(`/eventos/${id}`, data)).data,
  delete: async (id) => (await client.delete(`/eventos/${id}`)).data,
  agregarEntradas: async (id, data) => (await client.post(`/eventos/${id}/entradas`, data)).data,
  reemplazarEntradas: async (id, data) => (await client.put(`/eventos/${id}/entradas`, data)).data,
  uploadImagen: async (id, formData) => (await client.post(`/eventos/${id}/imagen`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
}
