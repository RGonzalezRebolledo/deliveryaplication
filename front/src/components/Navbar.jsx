import React from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';
import logogazella from '/logo.png';
import '../styles/navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout, loading, exchangeRate } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); 
        navigate('/'); 
    };

    if (loading) {
        return (
            <nav className="navbar">
                <div className="nav-left">
                    <img src={logogazella} alt="gazella" className="navbar-logo"/>
                </div>
            </nav>
        );
    }
    
    return (
        <nav className="navbar">
            {/* IZQUIERDA: Logo */}
            <div className="nav-left">
                <img src={logogazella} alt="gazella" className="navbar-logo" />
            </div>

            {/* CENTRO ABSOLUTO: Nombre del Usuario */}
            {isAuthenticated && user && (
                <div className="nav-center-absolute">
                    <span className="user-name-stacked">
                        {user.nombre} <small className="user-type-badge">({user.tipo})</small>
                    </span>
                </div>
            )}
    
            {/* DERECHA: Solo Referencia y Botón */}
            {isAuthenticated && user ? (
                <div className="nav-right">
                    <div className="user-actions">
                        <div className="action-item top">
                            {exchangeRate && (
                                <div className="bcv-container-mini">
                                    <span className="bcv-price">BCV: {exchangeRate.toFixed(2)} Bs</span>
                                </div>
                            )}
                        </div>

                        {/* Espaciador central para mantener el hueco vertical */}
                        <div className="action-item center-spacer"></div>

                        <div className="action-item bottom">
                            <button onClick={handleLogout} className="btn-logout">
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </nav>
    );
};

export default Navbar;