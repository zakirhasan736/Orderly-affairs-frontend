import axios from 'axios';
import { resolveApiBaseUrl } from '@/libs/apiBase';

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use(config => {
  config.baseURL = resolveApiBaseUrl();
  return config;
});

export default api;
