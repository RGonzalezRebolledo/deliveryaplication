
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
import Carousel from '../../components/Carousel.jsx';
 import { Link } from "react-router-dom";
 import PWAInstallManager from '../../components/PWAInstallManager.jsx';

function Home() {
  const navigate = useNavigate(); // ✅ Agregado: Declaración del hook
 
  // const handleClientLogin = () => {
  //   console.log("Navegando a la página de login o dashboard del Cliente...");
  //   navigate('/client/dashboard'); // Ejemplo de navegación
  // };

  // const handleDeliveryLogin = () => {
  //   console.log("Navegando a la página de login del Repartidor...");
  //   navigate('/delivery/login'); // Ejemplo de navegación
  // };


  return (
    <div className="home-page">

      <div className="hero-section">
        <h1 className="hero-visual-container">🚀</h1> {/* Corregí la clase (eliminé el punto inicial) */}

        <Link to="/contact" className="mi-enlace" >Contacto</Link>
        {/* <Link to="/public/Login" className="mi-enlace" >Acceder</Link>  */}

        </div>
                  {/* Inserta el componente del botón aquí */}
        <div >
      <PWAInstallManager/>
      </div>
      {/* <div className="hero-section">
      <Link to="/public/Login" className="mi-enlace" >Cliente</Link>  
      </div>
      <div className="hero-section">
      <Link to="/public/Login" className="mi-enlace" >Deliver</Link>  
      </div> */}

       <div className="hero-section">
        {/* Pasamos el role 'cliente' en el state del Link */}
        <Link to="/public/Login" state={{ role: 'cliente' }} className="mi-enlace">Cliente</Link>
      </div>
      <div className="hero-section">
        {/* Pasamos el role 'delivery' en el state del Link */}
        <Link to="/public/Login" state={{ role: 'repartidor' }} className="mi-enlace">Conductor</Link>
      </div>

{/*       
     <div className="hero-section"> */}
        {/* Pasamos el role 'cliente' en el state del Link */}
       {/* <Link to="/Negocios" className="mi-enlace">Negocios Afiliados</Link> */}
     {/* </div> */}
      

        <Carousel />
    </div>
 
  );
}

export default Home;