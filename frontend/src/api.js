import axios from 'axios';

const authApi = axios.create({
  baseURL: 'http://localhost:5001',
});

const patientApi = axios.create({
  baseURL: 'http://localhost:5002',
});

// Add interceptor to attach JWT token to patient API requests
patientApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { authApi, patientApi };
