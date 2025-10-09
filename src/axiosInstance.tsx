import axios from 'axios';

const api = axios.create({
  baseURL: 'https://uat.gatewayabroadeducations.com/api/v1',
  // baseURL: 'https://6dtmqkkr-5000.inc1.devtunnels.ms/api/v1',
  // baseURL:'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle different status codes
      if (error.response.status === 401) {
        // localStorage.removeItem('accessToken');
        // localStorage.removeItem('refreshToken');
        // sessionStorage.removeItem('accessToken');
        // sessionStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = "https://www.gatewayabroadeducations.com";
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export const ImageBaseUrl = "http://localhost:5000/uploads"

export default api;