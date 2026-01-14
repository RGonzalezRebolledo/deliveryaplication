import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer'; // 1. Importar el Footer
import '../../App.css';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Layout = () => {
  return (
    <div className="app-container">
      <Navbar /> 
      
      {/* 2. Main content con min-height para que el footer no flote en páginas cortas */}
      <main style={{ minHeight: '80vh' }}> 
        <Outlet /> 
      </main>
      
      {/* 3. Footer integrado */}
      <Footer /> 
    </div>
  );
};

export default Layout;




// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import Navbar from '../../components/Navbar'; // Ajusta la ruta si es necesario
// import '../../App.css';

// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// const Layout = () => {
//   return (
//     <div className="app-container">
//       {/* 💡 1. Navbar se renderiza siempre en la parte superior */}
//       <Navbar /> 
      
//       {/* 💡 2. Outlet renderiza el componente de la ruta actual */}
//       <div> 
//         <Outlet /> 
//       </div>
      
//       {/* Opcional: Footer aquí */}
//     </div>
//   );
// };

// export default Layout;