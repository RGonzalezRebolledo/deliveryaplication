// Archivo: Navbar.jsx
import React from 'react';
import { useAuth } from '../hooks/AuthContext'; // 💡 Importar el Hook de Auth

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth(); // Obtener el estado y la función

    return (
<nav>
    {isAuthenticated ? (
        <>
            <span>Bienvenido, {user.nombre} ({user.tipo})</span>
            <button onClick={logout}>Cerrar Sesión</button>
        </>
    ) : (
        // 💡 CAMBIO AQUÍ: Renderiza null si no está autenticado
        <p>GACELA</p>
    )}
</nav>
    //     <nav>
    //     {isAuthenticated ? (
    //         <>
    //             <span>Bienvenido, {user.nombre} ({user.tipo})</span>
    //             <button onClick={logout}>Cerrar Sesión</button>
    //         </>
    //     ) : (
    //         <a href="/login">Iniciar Sesión</a>
    //     )}
    // </nav>

    );
};

export default Navbar;

