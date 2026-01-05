import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

function ClientDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return; 
    
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/client/orders`, { 
            withCredentials: true 
        });

        // Verificamos que los datos lleguen como array
        if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }

      } catch (err) {
        console.error("Error al obtener pedidos:", err);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        } else {
          setError('No se pudieron cargar tus pedidos. Intenta más tarde.');
        }
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, loading, navigate]); 

  const handleNewOrderClick = () => {
    navigate('/client/new-order');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="ml-4 text-xl text-indigo-600 font-semibold">Verificando sesión...</p>
      </div>
    );
  }
  
  const userName = user?.nombre || 'Cliente'; 

  return (
    <div className="client-dashboard p-6 md:p-10 bg-gray-50 min-h-screen">
      
      {/* --- ENCABEZADO --- */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
                👋 ¡Hola, <span className="text-indigo-600">{userName}</span>!
            </h2>
            <p className="text-gray-600 mt-1">Bienvenido a tu portal de entregas.</p>
        </div>
        
        <button 
            onClick={handleNewOrderClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-transform transform hover:scale-105 flex items-center gap-2"
        >
            <span>📦</span> Solicitar Nueva Entrega
        </button>
      </header>

      {/* Mensaje de Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
            <p className="font-medium">{error}</p>
        </div>
      )}

      {/* --- SECCIÓN DE PEDIDOS --- */}
      <div className="recent-orders">
        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
            Tus Pedidos Recientes
        </h3>
        
        {isLoadingOrders ? (
            <div className="flex items-center text-gray-500">
                <div className="animate-spin h-5 w-5 border-b-2 border-gray-500 mr-3 rounded-full"></div>
                Cargando pedidos...
            </div>
        ) : (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-sm font-bold text-gray-400 uppercase">#{order.id}</span>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                    order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                                    order.status === 'entregado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-xs text-gray-400 uppercase font-semibold">Destino:</p>
                                <p className="text-gray-700 font-medium truncate">{order.address}</p>
                            </div>

                            <div className="flex justify-between items-end border-t pt-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Fecha:</p>
                                    <p className="text-sm text-gray-600">{order.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-indigo-600">Bs. {order.total}</p>
                                    <p className="text-xs text-gray-400">${order.total_usd} USD</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-lg">Aún no tienes pedidos registrados.</p>
                        <button 
                            onClick={handleNewOrderClick}
                            className="text-indigo-600 font-bold mt-2 hover:underline"
                        >
                            ¡Crea tu primer pedido ahora!
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default ClientDashboard;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../../hooks/AuthContext'; 

// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

// function ClientDashboard() {
//   const navigate = useNavigate();
  
//   // 1. Desestructurar 'loading' y obtener la función 'logout' (si existe)
//   const { user, isAuthenticated, loading, logout } = useAuth();
  
//   const [orders, setOrders] = useState([]);
//   const [isLoadingOrders, setIsLoadingOrders] = useState(true);
//   const [error, setError] = useState(null);

//   // 2. Cargar pedidos desde el Backend al iniciar
//   useEffect(() => {
//     // 💡 SOLUCIÓN 1: Verificar el estado de carga del contexto (loading)
//     if (loading) return; 
    
//     // Si no está autenticado, no hacemos la petición
//     if (!isAuthenticated) {
//       // navigate('/public/login'); 
//        navigate('/');
//       return;
//     }

//     const fetchOrders = async () => {
//       setIsLoadingOrders(true);
//       setError(null);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/client/orders`, { 
//             withCredentials: true 
//         });
//         // Validamos que sea un array antes de guardar
//     if (Array.isArray(response.data)) {
//       setOrders(response.data);
//     } else if (response.data.orders) { 
//       // Por si acaso el backend envía { orders: [] }
//       setOrders(response.data.orders);
//     }
//     console.log (orders)

//       } catch (err) {
//         console.error("Error al obtener pedidos:", err);
        
//         // 💡 SOLUCIÓN 2: Manejo explícito de errores de autenticación
//         if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          
//           // El servidor ha enviado un 401/403 (Sesión inválida/expirada)
//           // Si tienes un método 'logout' en useAuth, úsalo aquí para limpiar el estado localmente.
//           // if (logout) logout(); 
          
//           setError('Tu sesión ha expirado o es inválida. Redirigiendo al inicio de sesión...');
//           // setTimeout(() => {
//           //   // navigate('/public/login'); // Redirige al login para reautenticar
//           //   navigate('/');
//           // }, 1500);

//         } 
//         if (response.length === 0) {
//           setError(null);
//         } else
//         {
//           // Otros errores (servidor caído, BD, etc.)
//           setError('No se pudieron cargar tus pedidos recientes debido a un error de red o servidor.');
//         }

//       } finally {
//         setIsLoadingOrders(false);
//       }
//     };

//     fetchOrders();
//   // Dependencias: isAuthenticated y loading son cruciales aquí.
//   }, [isAuthenticated, loading, navigate]); 



//   const handleNewOrderClick = () => {
//     navigate('/client/new-order');
//   };

//   // Renderizado de carga inicial de sesión (AuthContext)
//   if (loading) {
//       return (
//         <div className="flex justify-center items-center h-screen bg-gray-50">
//             <p className="text-xl text-indigo-600 font-semibold">Verificando sesión...</p>
//         </div>
//       );
//   }
  
//   // Usamos el nombre del usuario 
//   const userName = user?.nombre || 'Cliente'; 

//   return (
//     <div className="client-dashboard p-6 md:p-10 bg-gray-50 min-h-screen">
      
//       {/* --- ENCABEZADO --- */}
//       <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
//         <div>
//             <h2 className="text-3xl font-extrabold text-gray-900">
//                 👋 ¡Hola, <span className="text-indigo-600">{userName}</span>!
//             </h2>
//             <p className="text-gray-600 mt-1">Bienvenido a tu portal de entregas.</p>
//         </div>
        
//         <button 
//             onClick={handleNewOrderClick}
//             className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-transform transform hover:scale-105 flex items-center gap-2"
//         >
//             <span>📦</span> Solicitar Nueva Entrega
//         </button>
//       </header>

//       {/* Mensaje de Error (incluye error de sesión) */}
//       {error && (
//         <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
//             <p>{error}</p>
//         </div>
//       )}

//       {/* --- SECCIÓN DE PEDIDOS --- */}
//       <div className="recent-orders">
//         <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
//             Tus Pedidos Recientes
//         </h3>
        
//         {/* Estado de Carga de Pedidos */}
//         {isLoadingOrders ? (
//             <p>Cargando pedidos...</p>
//         ) : (
//              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//                 {orders.length > 0 ? (
//                     orders.map(order => (
//                         <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
//                             <h4>Pedido #{order.id}</h4>
//                             <p>Estado: **{order.status}**</p>
//                             <p>Total: ${order.total}</p>
//                             <p>Direccion: ${order.address}</p>
//                         </div>
//                     ))
//                 ) : (
//                     <p>Aún no tienes pedidos. ¡Comienza uno!</p>
//                 )}
//             </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ClientDashboard;



// // import React, { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
// // import axios from 'axios';
// // import { useAuth } from '../../hooks/AuthContext'; // 💡 Importar el Hook de Auth

// // const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

// // // const mockOrders = [
// // //   { id: 101, item: "Dinner from Pizza Hut", status: "En Ruta", deliveryTime: "15 min" },
// // //   { id: 102, item: "Pharmacy prescription", status: "Entregado", deliveryTime: "Ayer" },
// // // ];

// // function ClientDashboard() {
// //   const navigate = useNavigate(); // ✅ Hook llamado DENTRO del componente
// //   //const [user, setUser] = useState({ name: 'María' });
// //   const [orders, setOrders] = useState([]);
// //   const [isLoadingOrders, setIsLoadingOrders] = useState(true);
// //   const [message, setMessage] = useState('');
// //   const [isError, setIsError] = useState(false);
// //   const { user, isAuthenticated } = useAuth();
// //   // Nota: En una app real, usarías React Router (useNavigate) para ir a OrderForm

// //  // 2. Cargar pedidos desde el Backend al iniciar
// //  useEffect(() => {
// //   // Si AuthContext aún está cargando la sesión, esperamos
// //   // if (loading) return;
// //   // Si no está autenticado, no hacemos la petición (la protección de rutas debería manejar esto)
// //   if (!isAuthenticated) return;

// //   const fetchOrders = async () => {
// //     setIsLoadingOrders(true);
// //     setIsError(null);
// //     try {
// //       // 💡 PETICIÓN AL ENDPOINT QUE CONECTA CON TU CONTROLADOR 'getClientOrders'
// //       // Es importante 'withCredentials: true' si usas cookies para la sesión
// //       const response = await axios.get(`${API_BASE_URL}/client/orders`, { 
// //           withCredentials: true 
// //       });

// //       // Tu controlador devuelve un array de objetos con las propiedades correctas
// //       setOrders(response.data);

// //     } catch (err) {
// //       console.error("Error al obtener pedidos:", err);
// //       setIsError('No se pudieron cargar tus pedidos recientes.');
// //     } finally {
// //       setIsLoadingOrders(false);
// //     }
// //   };

// //   fetchOrders();
// // }, [isAuthenticated]);



// //   const handleNewOrderClick = () => {
// //     console.log('Navegando a la pantalla de creación de pedido...');
// //     navigate('/client/new-order'); // Ejemplo de navegación
// //   };

// //   return (
// //     <div className="client-dashboard">
// //       <h2>👋 ¡Hola, {user.nombre}!</h2>
// //       <p>Bienvenid@ a tu portal de entregas.</p>
      
// //       <button 
// //         onClick={handleNewOrderClick}
// //         className="btn-primary"
// //       >
// //         ➕ **Solicitar Nueva Entrega**
// //       </button>

// //       <div className="recent-orders">
// //         <h3>Tus Pedidos Recientes</h3>
// //         {orders.map(order => (
// //           <div key={order.id} className="order-card">
// //             <h4>Pedido #{order.id}: {order.item}</h4>
// //             <p>Estado: **{order.status}**</p>
// //             <p>Estimación: {order.deliveryTime}</p>
// //             {/* Si el estado es 'En Ruta', se podría navegar a OrderTracking */}
// //           </div>
// //         ))}
        
// //         {orders.length === 0 && <p>Aún no tienes pedidos. ¡Comienza uno!</p>}
// //       </div>
// //     </div>
// //   );
// // }

// // export default ClientDashboard;