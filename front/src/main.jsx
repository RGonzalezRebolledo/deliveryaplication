// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'; 

// Importar Layout y componentes de ruta
import Layout from './pages/public/Layout.jsx'; 
import Home from './pages/public/Home.jsx'; 
import ClientDashboard from './pages/client/Dashboard.jsx';
import OrderForm from './pages/client/OrderForm.jsx';
import OrderTracking from './pages/client/OrderTracking.jsx';
import Login from './pages/public/Login.jsx';
import DeliveryDashboard from './pages/delivery/Dashboard.jsx';
import Register from './pages/public/Register.jsx';

// 💡 IMPORTACIONES DE PROTECCIÓN
import ProtectedRoute from './components/ProtectedRoute.jsx'; 
import PublicRoute from './components/PublicRoute.jsx'; // 💡 Importar el nuevo componente

import './styles/main.css';
import { AuthProvider } from './hooks/AuthContext.jsx'; 

// Definición de las rutas con la estructura anidada
const router = createBrowserRouter([
  {
    // RUTA PADRE PRINCIPAL: Siempre renderiza el Navbar y el Outlet del router
    path: "/",
    element: <Layout />,
    errorElement: <h2>404 - Página no encontrada</h2>,
    children: [
      
      // ------------------------------------------------------------------
      // 💡 GRUPO DE RUTAS PÚBLICAS PROTEGIDAS CONTRA USUARIOS LOGUEADOS
      // ------------------------------------------------------------------
      {
        // PublicRoute actúa como guardia: si el usuario está logueado, lo saca de aquí.
        element: <PublicRoute />, 
        children: [
          // Home
          {
            index: true, 
            element: <Home />,
          },
          // Login
          {
            path: "public/login", 
            element: <Login />,
          },
          // Register
          {
            path: "Register", 
            element: <Register />,
          },
        ]
      },

      // Ruta para errores de permisos (403)
      {
        path: "unauthorized",
        element: <h2>403 - Acceso no autorizado</h2>,
      },
      
      // ------------------------------------------------------------------
      // GRUPO DE RUTAS PROTEGIDAS PARA CLIENTES (Rol: 'cliente')
      // ------------------------------------------------------------------
      {
        element: <ProtectedRoute allowedRoles={['cliente']} />,
        children: [
          {
            path: "client/dashboard",
            element: <ClientDashboard />,
          },
          {
            path: "client/new-order",
            element: <OrderForm />,
          },
          {
            path: "client/tracking/:orderId",
            element: <OrderTracking />,
          },
        ]
      },
      
      // ------------------------------------------------------------------
      // GRUPO DE RUTAS PROTEGIDAS PARA CONDUCTORES (Rol: 'conductor' o 'delivery')
      // ------------------------------------------------------------------
      {
        element: <ProtectedRoute allowedRoles={['repartidor']} />,
        children: [
          {
            path: "delivery/dashboard",
            element: <DeliveryDashboard />,
          },
          // Añade más rutas de conductor aquí
        ]
      },
      
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);

// // main.jsx
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// // Importar Layout y componentes de ruta
// import Layout from './pages/public/Layout.jsx'; // 💡 Tu componente Layout principal
// import Home from './pages/public/Home.jsx'; 
// import ClientDashboard from './pages/client/Dashboard.jsx';
// import OrderForm from './pages/client/OrderForm.jsx';
// import OrderTracking from './pages/client/OrderTracking.jsx';
// import Login from './pages/public/Login.jsx';
// import DeliveryDashboard from './pages/delivery/Dashboard.jsx';
// import Register from './pages/public/Register.jsx'

// import './styles/main.css';

// // Definición de las rutas con la estructura anidada
// const router = createBrowserRouter([
//   {
//     // RUTA PADRE: Siempre renderiza el Navbar
//     path: "/",
//     element: <Layout />,
//     errorElement: <h2>404 - Página no encontrada</h2>, // Elemento para manejar errores 404
//     children: [
//       // 💡 RUTA DE INICIO (Index): Se renderiza cuando la URL es exactamente "/"
//       {
//         index: true, 
//         element: <Home />,
//       },
      
//       // RUTAS PÚBLICAS
//       {
//         path: "/public/login", // La ruta completa es /login
//         element: <Login />,
//       },
//       {
//         path: "register", // La ruta completa es /register
//         element: <Register />,
//       },
      
//       // RUTAS DE CLIENTE
//       {
//         path: "client/dashboard",
//         element: <ClientDashboard />,
//       },
//       {
//         path: "client/new-order",
//         element: <OrderForm />,
//       },
//       {
//         path: "client/tracking/:orderId",
//         element: <OrderTracking />,
//       },
      
//       // RUTAS DE REPARTIDOR
//       {
//         path: "delivery/dashboard",
//         element: <DeliveryDashboard />,
//       },
//     ],
//   },
// ]);

// // Asegúrate de que AuthProvider envuelva el RouterProvider si usas Context
// import { AuthProvider } from './hooks/AuthContext.jsx'; // Asumo que tienes este Context

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <AuthProvider>
//       <RouterProvider router={router} />
//     </AuthProvider>
//   </React.StrictMode>,
// );

// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import App from './App.jsx';
// import './styles/main.css';
// import { AuthProvider } from './hooks/AuthContext.jsx';

// // El BrowserRouter DEBE envolver el componente raíz de la aplicación (<App />)
// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//     <AuthProvider>
//       <App />
//     </AuthProvider>
//     </BrowserRouter>
//   </React.StrictMode>,
// );