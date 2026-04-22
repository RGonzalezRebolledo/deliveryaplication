import { io } from 'socket.io-client';

// En desarrollo usa localhost, en producción usa tu URL de Railway
const URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const socket = io(URL, {
    autoConnect: false, // No se conecta solo, lo haremos manualmente al loguear
    withCredentials: true
});