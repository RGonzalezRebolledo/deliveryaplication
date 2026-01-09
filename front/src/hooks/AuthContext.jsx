import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';
const API_BASE_URL = 'https://delivery-backend-production-c3cb.up.railway.app';

// 1. Inicializar el Contexto
const AuthContext = createContext(null);

// 2. Crear el Provider (El componente que maneja el estado)
export const AuthProvider = ({ children }) => {
    // 💡 NUEVO ESTADO: 'loading' se inicia en true y pasa a false cuando la verificación termina.
    const [user, setUser] = useState(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Inicia en true

    // Función para guardar los datos del usuario después del login/registro
    const login = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Función para cerrar la sesión
    const logout = async () => {
        // 1. Llama al backend para eliminar la cookie
        try {
            // Endpoint para que el backend elimine la cookie 'accessToken'
            await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true }); 
        } catch (error) {
            console.warn("No se pudo contactar al servidor para eliminar la cookie.", error);
        }
        
        // 2. Limpia el estado de React
        setUser(null);
        setIsAuthenticated(false);
    };

    // 💡 PASO CRUCIAL: Verificar la sesión al cargar la aplicación
    useEffect(() => {
        const checkSession = async () => {
            // Nota: Este endpoint debe existir en tu backend y debe ser protegido por verifyToken.
            // Si el token es válido, devuelve el usuario. Si no, devuelve un error 401/403.
            try {
                // Asumimos un endpoint que devuelve los datos del usuario si el token es válido
                const response = await axios.get(`${API_BASE_URL}/check-session`, {
                    withCredentials: true
                });
                
                // Si la respuesta es exitosa (código 200), el token es válido
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                console.log (userData)

            } catch (error) {
                // Si hay un error (401 o 403), significa que la sesión es inválida o no existe
                console.log("Sesión no válida o expirada. Usuario no autenticado.");
                setUser(null);
                setIsAuthenticated(false);
                // No necesitamos llamar a logout, porque el backend ya limpió la cookie (ver verifyToken)
            } finally {
                // 💡 IMPORTANTE: El loading siempre se pone en false al finalizar la verificación.
                setLoading(false); 
            }
        };

        checkSession();
    }, []); // El array vacío asegura que solo se ejecute al montar

    const value = {
        user,
        isAuthenticated,
        loading, // 💡 Exportar el estado de carga
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Crear el Hook personalizado para acceder al contexto
export const useAuth = () => {
    return useContext(AuthContext);
};
