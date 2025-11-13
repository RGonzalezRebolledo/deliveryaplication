// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// // import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>

//       <h1>Delivery</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>

//       </div>
//       <p className="read-the-docs">
//        aplicacion para Delivery
//       </p>
//     </>
//   )
// }

// export default App


// import React from 'react';
// import { Routes, Route } from 'react-router-dom';

// // Importamos los componentes de página. Se asume el casing correcto (Home.jsx)
// import Home from './pages/public/Home.jsx'; 
// import ClientDashboard from './pages/client/ClientDashboard.jsx';
// import OrderForm from './pages/client/OrderForm.jsx';
// import OrderTracking from './pages/client/OrderTracking.jsx';

// function App() {
//   return (
//     <div className="app-container">
//       {/* Las RUTAS deben estar definidas dentro de <Routes> */}
//       <Routes>
        
//         {/* RUTA INICIAL: Carga Home.jsx en la URL base (/) */}
//         <Route path="/" element={<Home />} />
        
//         {/* RUTAS DEL CLIENTE */}
//         <Route path="/client/dashboard" element={<ClientDashboard />} />
//         <Route path="/client/new-order" element={<OrderForm />} />
//         <Route path="/client/tracking/:orderId" element={<OrderTracking />} />
        
//         {/* RUTAS DEL REPARTIDOR */}
//         <Route path="/delivery/login" element={<div>Delivery Login Page</div>} />

//         {/* RUTA 404 */}
//         <Route path="*" element={<h2>404 - Página no encontrada</h2>} />

//       </Routes>
//     </div>
//   );
// }

// export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importamos todos los componentes, pero NO los usamos inicialmente
import Home from './pages/public/Home.jsx'; 
import ClientDashboard from './pages/client/ClientDashboard.jsx';
import OrderForm from './pages/client/OrderForm.jsx';
import OrderTracking from './pages/client/OrderTracking.jsx';

import DeliveryLogin from './pages/delivery/DeliveryLogin.jsx';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard.jsx';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  return (
    <div className="app-container">
      <Routes>
        
        {/* TEST: Si ves este texto, el BrowserRouter funciona.
        <Route path="/" element={<h2>✅ Router Context OK. Por favor, borra el caché del navegador.</h2>} /> */}
        
        {/*RUTA HOME: Mantenemos comentada para la prueba inicial */}
        <Route path="/" element={<Home />} />
        
        {/* RUTAS CLIENTE: Comentadas para la prueba */}
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/new-order" element={<OrderForm />} />
         <Route path="/client/tracking/:orderId" element={<OrderTracking />} />
        
        {/* RUTAS REPARTIDOR: Comentadas para la prueba */}
        <Route path="/delivery/login" element={<DeliveryLogin/>} />
        <Route path="/delivery/dashboard" element={<DeliveryDashboard/>} />

        <Route path="*" element={<h2>404 - Página no encontrada</h2>} />

      </Routes>
    </div>
  );
}

export default App;