import axios from 'axios';

const api = axios.create({
  baseURL: 'https://uat.gatewayabroadeducations.com/api/v1', // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authorization if needed
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

// Add response interceptor to handle errors
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
        window.location.reload();
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export const authApi = {

};

export default api;