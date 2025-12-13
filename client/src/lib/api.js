import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Auto-inject userId into query params for ALL requests
    const userId = localStorage.getItem('userId');
    if (userId) {
        config.params = { ...config.params, userId };
    }
    
    return config;
});

export default api;
