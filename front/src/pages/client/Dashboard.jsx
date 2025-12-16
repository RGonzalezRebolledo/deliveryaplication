import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

function ClientDashboard() {
  const navigate = useNavigate();
  
  // 1. Desestructurar 'loading' y obtener la función 'logout' (si existe)
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  // 2. Cargar pedidos desde el Backend al iniciar
  useEffect(() => {
    // 💡 SOLUCIÓN 1: Verificar el estado de carga del contexto (loading)
    if (loading) return; 
    
    // Si no está autenticado, no hacemos la petición
    if (!isAuthenticated) {
      // navigate('/public/login'); 
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
        setOrders(response.data);

      } catch (err) {
        console.error("Error al obtener pedidos:", err);
        
        // 💡 SOLUCIÓN 2: Manejo explícito de errores de autenticación
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          
          // El servidor ha enviado un 401/403 (Sesión inválida/expirada)
          // Si tienes un método 'logout' en useAuth, úsalo aquí para limpiar el estado localmente.
          // if (logout) logout(); 
          
          setError('Tu sesión ha expirado o es inválida. Redirigiendo al inicio de sesión...');
          // setTimeout(() => {
          //   // navigate('/public/login'); // Redirige al login para reautenticar
          //   navigate('/');
          // }, 1500);

        } 
        if (response.length === 0) {
          setError(null);
        } else
        {
          // Otros errores (servidor caído, BD, etc.)
          setError('No se pudieron cargar tus pedidos recientes debido a un error de red o servidor.');
        }

      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  // Dependencias: isAuthenticated y loading son cruciales aquí.
  }, [isAuthenticated, loading, navigate]); 



  const handleNewOrderClick = () => {
    navigate('/client/new-order');
  };

  // Renderizado de carga inicial de sesión (AuthContext)
  if (loading) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <p className="text-xl text-indigo-600 font-semibold">Verificando sesión...</p>
        </div>
      );
  }
  
  // Usamos el nombre del usuario 
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

      {/* Mensaje de Error (incluye error de sesión) */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm">
            <p>{error}</p>
        </div>
      )}

      {/* --- SECCIÓN DE PEDIDOS --- */}
      <div className="recent-orders">
        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
            Tus Pedidos Recientes
        </h3>
        
        {/* Estado de Carga de Pedidos */}
        {isLoadingOrders ? (
            <p>Cargando pedidos...</p>
        ) : (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                            <h4>Pedido #{order.id}</h4>
                            <p>Estado: **{order.status}**</p>
                            <p>Total: ${order.total}</p>
                        </div>
                    ))
                ) : (
                    <p>Aún no tienes pedidos. ¡Comienza uno!</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default ClientDashboard;



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