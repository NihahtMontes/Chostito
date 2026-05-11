import client from './client'

export const authApi = {
  login: async (email, password) => (await client.post('/auth/login', { email, password })).data,
  register: async (data) => (await client.post('/auth/register', data)).data,
  solicitarReset: async (email) => (await client.post('/auth/solicitar-reset', { email })).data,
  resetPassword: async (email, token, nuevaPassword) => (await client.post('/auth/reset-password', { email, token, nuevaPassword })).data,
  uploadFoto: async (fotoBase64) => (await client.post('/auth/upload-foto', { fotoBase64 })).data,
}
