import client from './client'

export const dashboardApi = {
  getStats: async () => (await client.get('/dashboard/stats')).data,
  misVentas: async () => (await client.get('/dashboard/mis-ventas')).data,
  todasGanancias: async () => (await client.get('/dashboard/todas-ganancias')).data,
  escanearQR: async (codigoQR) => (await client.post('/dashboard/entradas/escanear', { codigoQR })).data,
}
