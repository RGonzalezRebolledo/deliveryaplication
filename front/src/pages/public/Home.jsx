import React from 'react';
import { Link } from "react-router-dom";
import Carousel from '../../components/Carousel.jsx';
import PWAInstallManager from '../../components/PWAInstallManager.jsx';

// YA NO NECESITAS ESTOS IMPORTS SI LAS IMÁGENES ESTÁN EN PUBLIC
// import clienteImg from '../../assets/boton-cliente.png'; 
// import conductorImg from '../../assets/boton-conductor.png';

function Home() {
  return (
    <div className="home-page">
      <PWAInstallManager />

      <div className="hero-section">
        {/* Contenedor principal de los botones (Grid Simétrico) */}
        <div className='grid-botones-home'>
          
          {/* BOTÓN CLIENTE */}
          <Link to="/public/Login" state={{ role: 'cliente' }} className="card-boton-home">
            <div className="card-image-container-home">
              {/* RUTA DIRECTA DESDE LA RAÍZ PÚBLICA */}
              <img src="/assets/boton-cliente.png" alt="Cliente" className="card-image-home" />
            </div>
            <span className="card-text-home">Cliente</span>
          </Link>

          {/* BOTÓN CONDUCTOR */}
          <Link to="/public/Login" state={{ role: 'repartidor' }} className="card-boton-home">
            <div className="card-image-container-home">
              {/* RUTA DIRECTA DESDE LA RAÍZ PÚBLICA */}
              <img src="/assets/boton-conductor.png" alt="Conductor" className="card-image-home" />
            </div>
            <span className="card-text-home">Conductor</span>
          </Link>

        </div>
      </div>

      <Carousel />
    </div>
  );
}

export default Home;


// import React from 'react';
// import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
// import Carousel from '../../components/Carousel.jsx';
//  import { Link } from "react-router-dom";
//  import PWAInstallManager from '../../components/PWAInstallManager.jsx';

// function Home() {
//   const navigate = useNavigate(); // ✅ Agregado: Declaración del hook
 
//   // const handleClientLogin = () => {
//   //   console.log("Navegando a la página de login o dashboard del Cliente...");
//   //   navigate('/client/dashboard'); // Ejemplo de navegación
//   // };

//   // const handleDeliveryLogin = () => {
//   //   console.log("Navegando a la página de login del Repartidor...");
//   //   navigate('/delivery/login'); // Ejemplo de navegación
//   // };


//   return (
//     <div className="home-page">

//       {/* <div className="hero-section"> */}
//         {/* <h1 className="hero-visual-container">🚀</h1> Corregí la clase (eliminé el punto inicial) */}

//         {/* <Link to="/contact" className="mi-enlace" >Contacto</Link> */}
//         {/* <Link to="/public/Login" className="mi-enlace" >Acceder</Link>  */}

//         {/* </div> */}
//                   {/* Inserta el componente del botón aquí */}
//       <div >
//       <PWAInstallManager/>
//       </div>
//        <div className="hero-section">
//         {/* Pasamos el role 'cliente' en el state del Link */}
//         <div className='contenedor-botones'>
//         <Link to="/public/Login" state={{ role: 'cliente' }} className="mi-enlace">Cliente</Link>
//         {/* Pasamos el role 'delivery' en el state del Link */}
//         <Link to="/public/Login" state={{ role: 'repartidor' }} className="mi-enlace">Conductor</Link>
//         </div>
//       </div>

// {/*       
//      <div className="hero-section"> */}
//         {/* Pasamos el role 'cliente' en el state del Link */}
//        {/* <Link to="/Negocios" className="mi-enlace">Negocios Afiliados</Link> */}
//      {/* </div> */}
      

//         <Carousel />
//     </div>
 
//   );
// }

// export default Home;