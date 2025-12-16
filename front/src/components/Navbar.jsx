// Archivo: Navbar.jsx
import React from 'react';
import { useAuth } from '../hooks/AuthContext'; // 💡 Importar el Hook de Auth
import { useNavigate } from 'react-router-dom'; // 💡 Importar useNavigate
import logogazella from '../assets/logo.png';
import '../styles/navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout, loading } = useAuth(); // Obtener el estado y la función
    // 2. Inicializar useNavigate
    const navigate = useNavigate();

    // 3. Crear el manejador que llama a logout Y luego navega
    const handleLogout = () => {
        // Llama a la función logout del Context (limpia el estado del usuario)
        logout(); 
        // 💡 REDIRECCIÓN: Navega a la ruta principal (Home)
        navigate('/'); 
    };

    // 💡 B: Renderizar un estado de carga mientras se verifica la sesión
    // Esto previene que se renderice contenido basado en user o isAuthenticated hasta que la verificación termine.
    if (loading) {
        return (
            <nav className="navbar" style={{ marginBottom: 15 }}>
                <img src={logogazella} alt="gazella" className="navbar-logo"/>
                {/* Opcional: <div className="loading-spinner">Cargando...</div> */}
            </nav>
        );
    }
    
   
    return (
        
        // <div className="hero-visual-container" >
<nav className="navbar" style={{ marginBottom: 15 }} > 
        
    <img src={logogazella} alt="gazella" className="navbar-logo"/>

    {/* C: Solo renderiza el bloque si está autenticado. 
               Gracias a la comprobación de 'loading', sabemos que user ya fue cargado aquí si isAuthenticated es true. */}
  
    {isAuthenticated && user ? (
        // <div className="hero-visual-container">
        <div className="user-info">
        
            <span>{user.nombre} ({user.tipo})</span>
            <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
    ) : (
        null
    )}
  
</nav>

    );
};

export default Navbar;

