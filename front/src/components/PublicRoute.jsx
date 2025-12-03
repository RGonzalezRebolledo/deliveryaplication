import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext'; 

const PublicRoute = () => {
    const { user, isAuthenticated, loading } = useAuth();
    
    // 1. Manejo del estado de carga (vital para evitar redirecciones prematuras)
    if (loading) {
        return <div>Cargando...</div>; 
    }

    // 2. LÓGICA DE REDIRECCIÓN: Si el usuario está autenticado, no debe ver rutas públicas.
    if (isAuthenticated && user) {
        if (user.tipo === 'cliente') {
            // Redirige el cliente a su dashboard
            return <Navigate to="/client/dashboard" replace />;
        } else if (user.tipo === 'repartidor' || user.tipo === 'delivery') {
            // Redirige el conductor a su dashboard
            return <Navigate to="/delivery/dashboard" replace />;
        }
        // Fallback si está autenticado pero el tipo es desconocido
        return <Navigate to="/unauthorized" replace />;
    }

    // 3. ACCESO CONCEDIDO: Si NO está autenticado, permite ver la ruta pública.
    return <Outlet />;
};

export default PublicRoute;