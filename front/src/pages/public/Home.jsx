// import React from 'react';
// import { useNavigate } from 'react-router-dom'; // Importamos useNavigate

// function Home() {
//   const navigate = useNavigate(); // ✅ Hook llamado DENTRO del componente
  
//   const handleClientLogin = () => {
//     console.log("Navegando a la página de login o dashboard del Cliente...");
//     navigate('/client/dashboard'); // Ejemplo de navegación
//   };



//   const handleDeliveryLogin = () => {
//     console.log("Navegando a la página de login del Repartidor...");
//     navigate('/delivery/login'); // Ejemplo de navegación
//   };

//   return (
//     <div className="home-page">
//       <header className="hero-section">
 
//         <h1 className='.hero-visual-container'> 🚀</h1>
//         <p className="t.hero-tagline-container">Contacto</p>
//         <p> registrarse </p>
//         <p> acceder </p>
//         <div>

//         </div>
  
//       </header>
      
//       {/* <section className="portal-selection">
//         <h2>¿Cómo deseas usar la aplicación hoy?</h2>
        
//         <div className="portal-card client-portal">
//           <h3>📦 Soy un Cliente</h3>
//           <p>Solicita una entrega, rastrea tu pedido en vivo y califica a tu repartidor.</p>
          
//           <button 
//             onClick={handleClientLogin} 
//             className="btn-client"
//           >
//             Hacer un Pedido Ahora
//           </button>
//         </div>
        
//         <hr />

//         <div className="portal-card delivery-portal">
//           <h3>🛵 Soy un Repartidor</h3>
//           <p>Acepta pedidos cercanos, gestiona tus entregas y gana dinero extra.</p>
//           <button 
//             onClick={handleDeliveryLogin} 
//             className="btn-delivery"
//           >
//             Iniciar Sesión como Repartidor
//           </button>
//         </div>
//       </section> */}

//       <footer className="footer-info">
//         <p>¿Tienes preguntas? Visita nuestra sección de ayuda.</p>
//       </footer>
//     </div>
//   );
// }

// export default Home;

import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
import Carousel from '../../components/Carousel.jsx';

function Home() {
  const navigate = useNavigate(); // ✅ Hook llamado DENTRO del componente
  
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
        
        <p className="hero-tagline-container">Contacto</p> {/* Corregí la clase (eliminé el punto inicial) */}
        <p>Registrarse</p>
        <p>Acceder</p>
      </div>
                  
        {/* Aquí integro el carrusel justo después del h1 */}
     
        <Carousel />
      {/* La sección comentada de portales queda igual */}
      {/* <section className="portal-selection">
        <h2>¿Cómo deseas usar la aplicación hoy?</h2>
        
        <div className="portal-card client-portal">
          <h3>📦 Soy un Cliente</h3>
          <p>Solicita una entrega, rastrea tu pedido en vivo y califica a tu repartidor.</p>
          
          <button 
            onClick={handleClientLogin} 
            className="btn-client"
          >
            Hacer un Pedido Ahora
          </button>
        </div>
        
        <hr />

        <div className="portal-card delivery-portal">
          <h3>🛵 Soy un Repartidor</h3>
          <p>Acepta pedidos cercanos, gestiona tus entregas y gana dinero extra.</p>
          <button 
            onClick={handleDeliveryLogin} 
            className="btn-delivery"
          >
            Iniciar Sesión como Repartidor
          </button>
        </div>
      </section> */}
 
 {/* <footer className="footer-info">
<p>¿Tienes preguntas? Visita nuestra sección de ayuda.</p>
</footer> */}
    </div>


 
  );
}

export default Home;