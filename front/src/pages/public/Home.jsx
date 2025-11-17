
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
import Carousel from '../../components/Carousel.jsx';
 import { Link } from "react-router-dom";
 import PWAInstallManager from '../../components/PWAInstallManager.jsx';

function Home() {
  const navigate = useNavigate(); // ✅ Agregado: Declaración del hook
 
  const handleClientLogin = () => {
    console.log("Navegando a la página de login o dashboard del Cliente...");
    navigate('/client/dashboard'); // Ejemplo de navegación
  };

  const handleDeliveryLogin = () => {
    console.log("Navegando a la página de login del Repartidor...");
    navigate('/delivery/login'); // Ejemplo de navegación
  };


  return (
    <div className="home-page">

      <div className="hero-section">
        <h1 className="hero-visual-container">🚀</h1> {/* Corregí la clase (eliminé el punto inicial) */}

        <Link to="/contact" className="mi-enlace" >Contacto</Link>
        <Link to="/public/Login" className="mi-enlace" >Acceder</Link> 

        </div>
                  {/* Inserta el componente del botón aquí */}
        <div >
      <PWAInstallManager/>
      </div>
      <div className="hero-section">
      <Link to="/client/Dashboard" className="mi-enlace" >Cliente</Link>  
      </div>
      <div className="hero-section">
      <Link to="/delivery/Dashboard" className="mi-enlace" >Deliver</Link>  
      </div>

        <Carousel />
    </div>
 
  );
}

export default Home;