

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: true
});

function ClientDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Sincronización en tiempo real
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;

    socket.emit('join_client_room', user.id);

    const handleStatusUpdate = (data) => {
      // Actualizamos el pedido específico en el estado local
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === parseInt(data.pedido_id) 
            ? { ...order, status: data.nuevo_estado } 
            : order
        )
      );
    };

    socket.on('ORDEN_ACTUALIZADA', handleStatusUpdate);
    return () => { socket.off('ORDEN_ACTUALIZADA'); };
  }, [loading, isAuthenticated, user?.id]);

  // Carga inicial
  useEffect(() => {
    if (loading) return; 
    if (!isAuthenticated) { navigate('/'); return; }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/client/orders`, { withCredentials: true });
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (err) { console.error(err); } 
      finally { setIsLoadingOrders(false); }
    };
    fetchOrders();
  }, [isAuthenticated, loading, navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const search = searchTerm.toLowerCase();
      return order.id.toString().includes(search) || order.status?.toLowerCase().includes(search);
    });
  }, [orders, searchTerm]);

  const getStepLevel = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('pendiente')) return 1;
    if (s.includes('asignado')) return 2;
    if (s.includes('camino')) return 3;
    if (s.includes('entregado')) return 4;
    return 0;
  };

  return (
    <div className="app-container">
      <div className="client-dashboard">
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontWeight: '800' }}>👋 ¡Hola, {user?.nombre}!</h2>
            <button onClick={() => navigate('/client/new-order')} className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>🚀 Nuevo Servicio</button>
        </header>

        <div className="search-container">
            <input type="text" className="search-input" placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card-modern">
                <div className="order-card-header">
                    <span className="order-id-badge">PEDIDO #{order.id}</span>
                    <span className={`status-pill pill-${order.status}`}>{order.status.toUpperCase()}</span>
                </div>

                <div style={{ padding: '15px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {[1, 2, 3, 4].map(step => (
                      <div key={step} style={{ 
                        width: '12px', height: '12px', borderRadius: '50%', 
                        background: getStepLevel(order.status) >= step ? 'var(--color-primary)' : '#cbd5e1',
                        zIndex: 2 
                      }} />
                    ))}
                    <div style={{ position: 'absolute', top: '5px', left: 0, width: '100%', height: '2px', background: '#e2e8f0', zIndex: 1 }} />
                  </div>
                </div>

                <div className="order-body" style={{ padding: '0 15px' }}>
                    <p style={{ fontSize: '0.85rem' }}>📍 <b>Origen:</b> {order.address_origin}</p>
                    <p style={{ fontSize: '0.85rem' }}>🏁 <b>Destino:</b> {order.address_dest}</p>
                </div>

                <div className="order-footer">
                    <button onClick={() => navigate(`/client/order/${order.id}`)} className="btn-outline">Detalles</button>
                    <div className="price-tag">
                        <span className="amount-usd">${order.total_usd}</span>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;

// import React, { useState, useEffect, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client'; // 1. Importar socket
// import axios from 'axios';
// import { useAuth } from '../../hooks/AuthContext'; 

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // Configuración del Socket (fuera del componente para evitar múltiples instancias)
// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ['websocket'],
//   autoConnect: true
// });

// function ClientDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
  
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isLoadingOrders, setIsLoadingOrders] = useState(true);

//   // 2. LÓGICA DE SOCKETS PARA ACTUALIZACIÓN EN TIEMPO REAL
//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;

//     // Unirse a la sala privada del cliente
//     socket.emit('join_client_room', user.id);

//     const handleStatusUpdate = (data) => {
//       console.log("Actualización de pedido recibida:", data);
//       // data debe traer { pedido_id, nuevo_estado }
//       setOrders(prevOrders => 
//         prevOrders.map(order => 
//           order.id === data.pedido_id 
//             ? { ...order, status: data.nuevo_estado } 
//             : order
//         )
//       );
//     };

//     // Escuchar el evento que envíe el servidor
//     socket.on('ORDEN_ACTUALIZADA', handleStatusUpdate);

//     return () => {
//       socket.off('ORDEN_ACTUALIZADA', handleStatusUpdate);
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   // 3. CARGA INICIAL DE DATOS
//   useEffect(() => {
//     if (loading) return; 
//     if (!isAuthenticated) { navigate('/'); return; }

//     const fetchOrders = async () => {
//       setIsLoadingOrders(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/client/orders`, { withCredentials: true });
//         setOrders(Array.isArray(response.data) ? response.data : []);
//       } catch (err) { 
//         console.error("Error al obtener pedidos:", err); 
//       } finally { 
//         setIsLoadingOrders(false); 
//       }
//     };
//     fetchOrders();
//   }, [isAuthenticated, loading, navigate]);

//   const filteredOrders = useMemo(() => {
//     return orders.filter(order => {
//       const search = searchTerm.toLowerCase();
//       return order.id.toString().includes(search) || order.status?.toLowerCase().includes(search);
//     });
//   }, [orders, searchTerm]);

//   const getStepLevel = (status) => {
//     const s = status?.toLowerCase() || '';
//     if (s.includes('pendiente')) return 1;
//     if (s.includes('asignado')) return 2;
//     if (s.includes('camino') || s.includes('ruta')) return 3;
//     if (s.includes('entrega') || s.includes('entregado')) return 4;
//     return 0;
//   };

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
//         <header style={{ textAlign: 'center', marginBottom: '20px' }}>
//             <h2 style={{ fontWeight: '800' }}>👋 ¡Hola, {user?.nombre}!</h2>
//             <button onClick={() => navigate('/client/new-order')} className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>🚀 Nuevo Servicio</button>
//         </header>

//         <div className="search-container">
//             <input type="text" className="search-input" placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
//         </div>

//         <div className="orders-grid">
//           {filteredOrders.map(order => (
//             <div key={order.id} className="order-card-modern">
//                 <div className="order-card-header">
//                     <span className="order-id-badge">PEDIDO #{order.id}</span>
//                     <span className={`status-pill pill-${order.status}`}>{order.status}</span>
//                 </div>

//                 <div style={{ padding: '5px 15px', fontSize: '0.75rem', color: '#64748b' }}>
//                   📅 {new Date(order.fecha_pedido).toLocaleDateString('es-VE')} - {new Date(order.fecha_pedido).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
//                 </div>

//                 <div style={{ padding: '15px 10px' }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
//                     {[1, 2, 3, 4].map(step => (
//                       <div key={step} style={{ 
//                         width: '12px', height: '12px', borderRadius: '50%', 
//                         background: getStepLevel(order.status) >= step ? 'var(--color-primary)' : '#cbd5e1',
//                         zIndex: 2 
//                       }} />
//                     ))}
//                     <div style={{ position: 'absolute', top: '5px', left: 0, width: '100%', height: '2px', background: '#e2e8f0', zIndex: 1 }} />
//                   </div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', marginTop: '8px', color: '#64748b' }}>
//                     <span>Recibido</span><span>Asignado</span><span>En Ruta</span><span>Entregado</span>
//                   </div>
//                 </div>

//                 <div className="order-body" style={{ gap: '8px', display: 'flex', flexDirection: 'column', padding: '0 15px' }}>
//                     <p style={{ fontSize: '0.85rem', margin: 0 }}>
//                       <span style={{ color: '#2ecc71' }}>●</span> <b>Origen:</b> {order.address_origin}
//                     </p>
//                     <p style={{ fontSize: '0.85rem', margin: 0 }}>
//                       <span style={{ color: '#e74c3c' }}>●</span> <b>Destino:</b> {order.address_dest}
//                     </p>
//                 </div>

//                 <div className="order-footer" style={{ marginTop: '15px', padding: '15px', borderTop: '1px solid #f1f5f9' }}>
//                     <button onClick={() => navigate(`/client/order/${order.id}`)} className="btn-outline" style={{ fontSize: '0.8rem' }}>Detalles</button>
                    
//                     <div className="price-tag" style={{ textAlign: 'right' }}>
//                         <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
//                           Bs. {Number(order.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
//                         </div>
//                         <span className="amount-usd" style={{ fontSize: '1.1rem', fontWeight: '800' }}>
//                           ${order.total_usd}
//                         </span>
//                     </div>
//                 </div>
//             </div>
//           ))}

//           {!isLoadingOrders && filteredOrders.length === 0 && (
//             <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
//               <p>No se encontraron pedidos recientes.</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ClientDashboard;
