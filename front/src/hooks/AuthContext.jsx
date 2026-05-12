import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://delivery-backend-production-c3cb.up.railway.app';

// 💡 INTERCEPTOR GLOBAL: Inyecta el token en los Headers para todas las peticiones de la app
axios.interceptors.request.use(
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

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(null);

    // Guardar datos tras Login exitoso
    const login = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Logout híbrido: Limpia servidor y almacenamiento local
    const logout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
        } catch (error) {
            console.warn("Logout en servidor fallido, procediendo con limpieza local.");
        } finally {
            // Limpieza absoluta de rastros
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = "/login";
        }
    };

    // Cargar tasa de cambio (ahora usa el interceptor automáticamente)
    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`, {
                    withCredentials: true
                });
                setExchangeRate(response.data.rate);
            } catch (error) {
                console.error("Error al obtener la tasa BCV:", error);
            }
        };
        fetchExchangeRate();
    }, []);

    // Verificar sesión al cargar o refrescar la PWA
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/check-session`, {
                    withCredentials: true
                });

                if (response.status === 200) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                    
                    // Si el backend refrescó el token, lo actualizamos localmente
                    if (response.data.token) {
                        localStorage.setItem('accessToken', response.data.token);
                    }
                }
            } catch (error) {
                console.log("Sesión no válida en este dispositivo.");
                localStorage.removeItem('accessToken');
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const value = {
        user,
        isAuthenticated,
        loading,
        exchangeRate,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};



// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // 1. Inicializar el Contexto
// const AuthContext = createContext(null);

// // 2. Crear el Provider
// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [loading, setLoading] = useState(true);
//     const [exchangeRate, setExchangeRate] = useState(null);

//     // Función para guardar los datos del usuario después del login/registro
//     const login = (userData) => {
//         setUser(userData);
//         setIsAuthenticated(true);
//     };

//     /**
//      * Función para cerrar la sesión
//      * Se usa 'finally' para asegurar que el estado de React se limpie 
//      * incluso si el token ya expiró en el servidor (evita el error 401 trabado).
//      */
//     const logout = async () => {
//         try {
//             await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
//             console.log("Sesión cerrada exitosamente en el servidor.");
//         } catch (error) {
//             console.warn("El servidor no pudo procesar el logout o la sesión ya era inválida.");
//         } finally {
//             // LIMPIEZA ABSOLUTA: Independientemente del resultado del servidor
//             setUser(null);
//             setIsAuthenticated(false);
            
//             // Redirección forzada para limpiar cualquier estado de rutas
//             // window.location.href = "/login";
//         }
//     };

//     // Efecto para cargar la tasa de cambio
//     useEffect(() => {
//         const fetchExchangeRate = async () => {
//             try {
//                 const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`, {
//                     withCredentials: true
//                 });
//                 setExchangeRate(response.data.rate);
//             } catch (error) {
//                 console.error("Error al obtener la tasa BCV:", error);
//             }
//         };
//         fetchExchangeRate();
//     }, []);

//     // Verificar la sesión al cargar la aplicación o refrescar
//     useEffect(() => {
//         const checkSession = async () => {
//             try {
//                 const response = await axios.get(`${API_BASE_URL}/check-session`, {
//                     withCredentials: true
//                 });

//                 if (response.status === 200) {
//                     setUser(response.data.user);
//                     setIsAuthenticated(true);
//                 }
//             } catch (error) {
//                 console.log("Sesión no activa o expirada.");
//                 setUser(null);
//                 setIsAuthenticated(false);
//             } finally {
//                 setLoading(false); // Detiene el spinner/pantalla de carga
//             }
//         };

//         checkSession();
//     }, []);

//     const value = {
//         user,
//         isAuthenticated,
//         loading,
//         exchangeRate,
//         login,
//         logout,
//     };

//     return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// // 3. Hook personalizado
// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error("useAuth debe usarse dentro de un AuthProvider");
//     }
//     return context;
// };

