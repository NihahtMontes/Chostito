import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../utils/storage';

// Limpiamos los espacios en blanco que Windows añade accidentalmente al .env
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').trim();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
