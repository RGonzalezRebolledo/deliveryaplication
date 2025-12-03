import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext'; // Asegúrate de importar tu contexto

// allowedRoles: Es un array con los roles permitidos, ej: ['cliente'] o ['conductor'] o ambos.
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // 1. ESTADO DE CARGA:
    // Si estamos verificando la sesión (ej: esperando respuesta de la API al recargar página),
    // mostramos un spinner o nada. Si no, te expulsará al login por error.
    if (loading) {
        return <div>Cargando...</div>; 
    }

    // 2. NO AUTENTICADO:
    // Si no hay usuario, mandarlo al Login, pero guardamos la ubicación intentada
    // para regresarlo ahí después de loguearse (opcional).
    if (!isAuthenticated || !user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 3. ROL NO AUTORIZADO:
    // Si el usuario existe pero su rol no está en la lista permitida.
    if (allowedRoles && !allowedRoles.includes(user.tipo)) {
        // Redirigir al dashboard que LE CORRESPONDE
        if (user.tipo === 'cliente') {
            return <Navigate to="/client/dashboard" replace />;
        } else if (user.tipo === 'repartidor') { // o 'delivery'
            return <Navigate to="/delivery/dashboard" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    // 4. ACCESO CONCEDIDO:
    // Renderiza las rutas hijas (children)
    return <Outlet />;
};

export default ProtectedRoute;