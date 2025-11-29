// App.jsx (Versión simple, actúa como Layout o envoltorio)
import React from 'react';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  // En este punto, App.jsx ya no contiene el Router
  // Su contenido debe ser lo que envuelve a toda la aplicación
  return (
    <div className="app-container">
      {/* El router ahora se maneja en main.jsx */}
      {/* Si usas createBrowserRouter, no pongas el Navbar ni el Outlet aquí */}
    </div>
  );
}

export default App;




// import React from 'react';
// import { Routes, Route } from 'react-router-dom';

// // Importamos todos los componentes, pero NO los usamos inicialmente
// import Home from './pages/public/Home.jsx'; 
// import ClientDashboard from './pages/client/Dashboard.jsx';
// import OrderForm from './pages/client/OrderForm.jsx';
// import OrderTracking from './pages/client/OrderTracking.jsx';

//  import Login from './pages/public/Login.jsx';
// import DeliveryDashboard from './pages/delivery/Dashboard.jsx';

// import  Register  from './pages/public/Register.jsx'

// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

// function App() {
//   return (
//     <div className="app-container">
//       <Routes>
        
//         {/* TEST: Si ves este texto, el BrowserRouter funciona.
//         <Route path="/" element={<h2>✅ Router Context OK. Por favor, borra el caché del navegador.</h2>} /> */}
        
//         {/*RUTA HOME: Mantenemos comentada para la prueba inicial */}
//         <Route path="/" element={<Home />} />
        
//         {/* RUTAS CLIENTE: Comentadas para la prueba */}
//         <Route path="/client/Dashboard" element={<ClientDashboard />} />
//         <Route path="/client/new-order" element={<OrderForm />} />
//          <Route path="/client/tracking/:orderId" element={<OrderTracking />} />
        
//         {/* RUTAS REPARTIDOR: Comentadas para la prueba */}
//         <Route path="/public/Login" element={<Login/>} />
//         <Route path="/delivery/dashboard" element={<DeliveryDashboard/>} />

//         {/*RUTAS GENERALES */}
//         <Route path="/Register" element={<Register/>} />

//         <Route path="*" element={<h2>404 - Página no encontrada</h2>} />

//       </Routes>
//     </div>
//   );
// }

// export default App;