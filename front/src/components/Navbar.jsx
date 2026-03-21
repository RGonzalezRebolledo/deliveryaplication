// Archivo: Navbar.jsx
import React from 'react';
import { useAuth } from '../hooks/AuthContext'; // 💡 Importar el Hook de Auth
import { useNavigate } from 'react-router-dom'; // 💡 Importar useNavigate
import logogazella from '/logo.png';
import '../styles/navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout, loading, exchangeRate } = useAuth(); // Obtener el estado y la función
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
        <nav className="navbar" style={{ marginBottom: 15 }}>
            {/* SECCIÓN A: Izquierda (Logo) */}
            <div className="nav-section nav-left">
                <img src={logogazella} alt="gazella" className="navbar-logo" />
            </div>
    
            {/* SECCIÓN B: Centro (Nombre del Usuario) */}
            {isAuthenticated && user ? (
                <div className="nav-section nav-center">
                    <span className="user-name-centered">
                        {user.nombre} <span className="user-type-badge">({user.tipo})</span>
                    </span>
                </div>
            ) : <div className="nav-section nav-center"></div>} {/* Espaciador si no está logueado */}
    
            {/* SECCIÓN C: Derecha (BCV + Botón) */}
            {isAuthenticated && user ? (
                <div className="nav-section nav-right">
                    <div className="user-actions">
                        {exchangeRate && (
                            <div className="bcv-container-mini">
                                {/* <span className="bcv-tag">BCV:</span> */}
                                <span className="bcv-price">BCV:  {exchangeRate.toFixed(2)} Bs</span>
                            </div>
                        )}
                        
                        <button onClick={handleLogout} className="btn-logout">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            ) : null}
        </nav>
    );
};

export default Navbar;

