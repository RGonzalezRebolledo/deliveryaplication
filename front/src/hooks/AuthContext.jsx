import React, { createContext, useContext, useState } from 'react';

// 1. Inicializar el Contexto
const AuthContext = createContext(null);

// 2. Crear el Provider (El componente que maneja el estado)
export const AuthProvider = ({ children }) => {
    // Estado inicial: null si no está autenticado, o un objeto de usuario
    const [user, setUser] = useState(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Función para guardar los datos del usuario después del login/registro
    const login = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
        // Opcional: Podrías guardar datos no sensibles en localStorage aquí si fuera necesario
    };

    // Función para cerrar la sesión
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        // Opcional: Eliminar cualquier cookie o item de localStorage
    };

    const value = {
        user,
        isAuthenticated,
        login,
        logout,
        // Otras funciones, como la de cargar el perfil inicial (ver Paso 4)
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Crear el Hook personalizado para acceder al contexto
export const useAuth = () => {
    return useContext(AuthContext);
};