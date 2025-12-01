// Archivo: Navbar.jsx
import React from 'react';
import { useAuth } from '../hooks/AuthContext'; // 💡 Importar el Hook de Auth
import { useNavigate } from 'react-router-dom'; // 💡 Importar useNavigate

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth(); // Obtener el estado y la función
    // 2. Inicializar useNavigate
    const navigate = useNavigate();

    // 3. Crear el manejador que llama a logout Y luego navega
    const handleLogout = () => {
        // Llama a la función logout del Context (limpia el estado del usuario)
        logout(); 
        // 💡 REDIRECCIÓN: Navega a la ruta principal (Home)
        navigate('/'); 
    };

    return (
        
        // <div className="hero-visual-container" >
<nav style={{ marginBottom: 15 }} > 
    {isAuthenticated ? (
        <div className="hero-visual-container">
            <span>{user.nombre} ({user.tipo})</span>
            <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
    ) : (
        // 💡 CAMBIO AQUÍ: Renderiza null si no está autenticado
        <p>GACELA</p>
    )}
</nav>
// </div>
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

