import axios from 'axios';

// Create an instance using Vite's environment variable system
const api = axios.create({
    // Access via import.meta.env and use the VITE_ prefix
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;