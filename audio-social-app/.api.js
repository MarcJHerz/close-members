import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Asegúrate de que coincida con tu backend
});

export default api;
