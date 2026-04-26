
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NOTIFICATION_SOUND_URL = '/sounds/new-order.mp3';

const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket'], 
  autoConnect: true
});

function DeliveryDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [driverStatus, setDriverStatus] = useState('not_registered'); 
  const [timeLeft, setTimeLeft] = useState(null);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const isSuspended = driverStatus === 'suspendido';
  const isNotRegistered = driverStatus === 'not_registered';
  const isRestricted = isSuspended || isNotRegistered;

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const playNotification = () => {
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  // Carga inicial y persistencia al refrescar
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const fetchInitialData = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { withCredentials: true });
        const { active, order, isAvailableInDB, status } = response.data;
        
        setDriverStatus(status || 'not_registered');
        if (active && order) {
          setActiveOrder(order);
          setIsAvailable(false);
          if (order.estado === 'asignado') setTimeLeft(120);
        } else {
          setActiveOrder(null);
          setIsAvailable(isAvailableInDB || false);
        }
      } catch (err) {
        if (err.response?.status === 404) setDriverStatus('not_registered');
      } finally {
        setIsLoadingStatus(false);
      }
    };
    fetchInitialData();
  }, [isAuthenticated, loading]);

  // Sockets
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;
    
    socket.emit('join_driver_room', user.id);

    const handleNewOrder = (data) => {
      const pedido = {
          pedido_id: data.pedido_id || data.id,
          monto: data.monto || data.total || 0,
          cliente_nombre: data.cliente_nombre || 'Cliente',
          recogida: data.recogida || 'Ver mapa',
          entrega: data.entrega || 'Ver mapa',
          estado: 'asignado'
      };
      setActiveOrder(pedido);
      setIsAvailable(false);
      setTimeLeft(120);
      playNotification();
      document.title = "🔴 NUEVO PEDIDO RECIBIDO";
    };

    socket.on('NUEVO_PEDIDO', handleNewOrder);
    return () => { socket.off('NUEVO_PEDIDO'); document.title = "Gazzella Express"; };
  }, [loading, isAuthenticated, user?.id]);

  // Timer del pedido asignado
  useEffect(() => {
    if (activeOrder?.estado === 'asignado' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleUpdateStatus('pendiente'); // Rechazo automático por tiempo
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, activeOrder]);

  const handleUpdateStatus = async (newStatus) => {
    if (!activeOrder?.pedido_id) return;
    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/order-status`, 
        { pedido_id: activeOrder.pedido_id, status: newStatus },
        { withCredentials: true }
      );
      if (res.data.success) {
        if (newStatus === 'entregado' || newStatus === 'pendiente') {
          setActiveOrder(null);
          setIsAvailable(true);
          document.title = "Gazzella Express";
        } else {
          setActiveOrder(prev => ({ ...prev, estado: newStatus }));
          if (newStatus === 'en_camino') setTimeLeft(null);
        }
      }
    } catch (err) { console.error(err); }
  };

  const toggleAvailability = async () => {
    if (activeOrder || isRestricted) return;
    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
        { available: !isAvailable }, { withCredentials: true }
      );
      if (res.data.success) setIsAvailable(res.data.isAvailable);
    } catch (err) { console.error(err); }
  };

  if (loading || isLoadingStatus) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="app-container">
      <div className="client-dashboard">
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontWeight: '800' }}>🛵 Panel: {user?.nombre}</h2>
            <div className={`status-pill ${isRestricted ? 'pill-pendiente' : activeOrder ? 'pill-en-ruta' : isAvailable ? 'pill-asignado' : 'pill-pendiente'}`}>
                {isNotRegistered ? "NO REGISTRADO" : isSuspended ? "CUENTA SUSPENDIDA" : activeOrder ? `EN SERVICIO (${activeOrder.estado.toUpperCase()})` : isAvailable ? "ESPERANDO PEDIDO" : "FUERA DE LÍNEA"}
            </div>
        </header>

        {isRestricted && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ffeeba', textAlign: 'center' }}>
             {isNotRegistered ? "⚠️ Perfil incompleto." : "🚫 Cuenta suspendida."}
          </div>
        )}

        <button 
          onClick={toggleAvailability} 
          disabled={!!activeOrder || isRestricted} 
          className={isAvailable ? 'btn-danger' : 'btn-primary'} 
          style={{ width: '100%', padding: '18px', borderRadius: '15px', fontWeight: 'bold', marginBottom: '20px' }}
        >
            {isRestricted ? 'Bloqueado' : activeOrder ? 'En Servicio' : isAvailable ? '🔴 Desconectarse' : '🟢 Ponerse Disponible'}
        </button>

        <main className="recent-orders">
            {activeOrder ? (
                <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)', background: '#fff' }}>
                    <div className="order-card-header">
                        <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
                        {activeOrder.estado === 'asignado' && timeLeft !== null && (
                          <span style={{ color: timeLeft < 30 ? 'red' : '#ff9800', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            ⏳ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                          </span>
                        )}
                    </div>
                    <div className="order-body">
                        <p>📍 <b>Origen:</b> {activeOrder.recogida}</p>
                        <p>🏁 <b>Destino:</b> {activeOrder.entrega}</p>
                        <p>👤 <b>Cliente:</b> {activeOrder.cliente_nombre}</p>
                    </div>
                    <div className="order-footer" style={{ flexDirection: 'column' }}>
                        <div className="price-tag" style={{ width: '100%', textAlign: 'center', marginBottom: '10px' }}>
                          <p style={{ fontSize: '1.8rem', color: '#2ecc71' }}>${activeOrder.monto}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                          {activeOrder.estado === 'asignado' ? (
                            <>
                              <button onClick={() => handleUpdateStatus('en_camino')} className="btn-primary" style={{ flex: 2, background: '#28a745' }}>Aceptar</button>
                              <button onClick={() => handleUpdateStatus('pendiente')} className="btn-danger" style={{ flex: 1 }}>Rechazar</button>
                            </>
                          ) : (
                            <button onClick={() => handleUpdateStatus('entregado')} className="btn-primary" style={{ width: '100%' }}>🏁 Marcar Entregado</button>
                          )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state-card">
                  <p style={{ fontSize: '3rem' }}>{isAvailable ? '📡' : '💤'}</p>
                  <h3>{isAvailable ? 'Buscando pedidos...' : 'Desconectado'}</h3>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default DeliveryDashboard;
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import axios from 'axios';
// import { useAuth } from '../../hooks/AuthContext'; 

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const NOTIFICATION_SOUND_URL = '/sounds/new-order.mp3';

// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ['websocket'], 
//   autoConnect: true,
//   reconnection: true,
//   reconnectionAttempts: 10,
//   reconnectionDelay: 2000
// });

// function DeliveryDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
  
//   const [isAvailable, setIsAvailable] = useState(false);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [isLoadingStatus, setIsLoadingStatus] = useState(true);
//   const [driverStatus, setDriverStatus] = useState('not_registered'); 
//   const [timeLeft, setTimeLeft] = useState(null);

//   const audioRef = useRef(null);
//   const timerRef = useRef(null);

//   // --- LÓGICA DE BLOQUEO ---
//   const isSuspended = driverStatus === 'suspendido';
//   const isNotRegistered = driverStatus === 'not_registered';
//   const isRestricted = isSuspended || isNotRegistered;

//   useEffect(() => {
//     audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
//     audioRef.current.load();
//     return () => { if (timerRef.current) clearInterval(timerRef.current); };
//   }, []);

//   const playNotification = () => {
//     if (audioRef.current) {
//       audioRef.current.currentTime = 0;
//       audioRef.current.play().catch(() => {});
//     }
//   };

//   useEffect(() => {
//     if (loading || !isAuthenticated) return;
//     const fetchInitialData = async () => {
//       setIsLoadingStatus(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { withCredentials: true });
//         const { active, order, isAvailableInDB, status } = response.data;
//         setDriverStatus(status || 'not_registered');
//         if (active && order) {
//           setActiveOrder(order);
//           setIsAvailable(false);
//           if (order.estado === 'asignado') setTimeLeft(120);
//         } else {
//           setActiveOrder(null);
//           setIsAvailable(isAvailableInDB || false);
//         }
//       } catch (err) {
//         if (err.response?.status === 404) setDriverStatus('not_registered');
//       } finally {
//         setIsLoadingStatus(false);
//       }
//     };
//     fetchInitialData();
//   }, [isAuthenticated, loading]);

//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;
//     const joinRoom = () => socket.emit('join_driver_room', user.id);
//     if (socket.connected) joinRoom();

//     const handleNewOrder = (data) => {
//       const pedidoNormalizado = {
//           pedido_id: data.pedido_id || data.id,
//           monto: data.monto || data.total || 0,
//           cliente_nombre: data.cliente_nombre || 'Cliente',
//           recogida: data.recogida || 'Ver en mapa',
//           entrega: data.entrega || 'Ver en mapa',
//           estado: 'asignado'
//       };
//       setActiveOrder(pedidoNormalizado);
//       setIsAvailable(false);
//       setTimeLeft(120);
//       playNotification();
//       document.title = `🔴 NUEVO PEDIDO #${pedidoNormalizado.pedido_id}`;
//     };

//     socket.on('connect', joinRoom);
//     socket.on('NUEVO_PEDIDO', handleNewOrder);
//     return () => {
//       socket.off('connect');
//       socket.off('NUEVO_PEDIDO');
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   useEffect(() => {
//     if (activeOrder && activeOrder.estado === 'asignado' && timeLeft > 0) {
//       timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
//     } else if (timeLeft === 0) {
//       handleUpdateStatus('pendiente', activeOrder?.pedido_id);
//     }
//     return () => clearInterval(timerRef.current);
//   }, [timeLeft, activeOrder]);

//   const handleUpdateStatus = async (newStatus, manualId = null) => {
//     const pedidoId = manualId || activeOrder?.pedido_id;
//     if (!pedidoId) return;
//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/order-status`, 
//         { pedido_id: pedidoId, status: newStatus },
//         { withCredentials: true }
//       );
//       if (res.data.success) {
//         if (newStatus === 'entregado' || newStatus === 'pendiente') {
//           setActiveOrder(null);
//           setTimeLeft(null);
//           setIsAvailable(true);
//         } else {
//           setActiveOrder(prev => ({ ...prev, estado: newStatus }));
//           if (newStatus === 'en_camino') setTimeLeft(null);
//         }
//       }
//     } catch (err) { console.error(err); }
//   };

//   const toggleAvailability = async () => {
//     if (activeOrder || isRestricted) return; // Bloqueo si está restringido
//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
//         { available: !isAvailable }, { withCredentials: true }
//       );
//       if (res.data.success) setIsAvailable(res.data.isAvailable);
//     } catch (err) { console.error(err); }
//   };

//   if (loading || isLoadingStatus) return <div className="loading-screen"><div className="spinner"></div></div>;

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
//         <header style={{ textAlign: 'center', marginBottom: '20px' }}>
//             <h2 style={{ fontWeight: '800' }}>🛵 Panel: {user?.nombre}</h2>
//             {/* Pill de estado mejorada con lógica de restricción */}
//             <div className={`status-pill ${isRestricted ? 'pill-pendiente' : activeOrder ? 'pill-en-ruta' : isAvailable ? 'pill-asignado' : 'pill-pendiente'}`}>
//                 {isNotRegistered ? "NO REGISTRADO" : isSuspended ? "CUENTA SUSPENDIDA" : activeOrder ? `EN SERVICIO (${activeOrder.estado.toUpperCase()})` : isAvailable ? "ESPERANDO PEDIDO" : "FUERA DE LÍNEA"}
//             </div>
//         </header>

//         {/* Mensaje de aviso para usuarios no registrados o suspendidos */}
//         {isRestricted && (
//           <div style={{ background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ffeeba', textAlign: 'center' }}>
//              {isNotRegistered 
//                 ? "⚠️ Tu perfil de repartidor no está completado. Contacta a administración para activarte." 
//                 : "🚫 Tu cuenta se encuentra suspendida. Contacta a soporte para más información."}
//           </div>
//         )}

//         <button 
//           onClick={toggleAvailability} 
//           disabled={!!activeOrder || isRestricted} 
//           className={isAvailable ? 'btn-danger' : 'btn-primary'} 
//           style={{ width: '100%', padding: '18px', borderRadius: '15px', fontWeight: 'bold', marginBottom: '20px', opacity: isRestricted ? 0.6 : 1 }}
//         >
//             {isRestricted ? 'Acceso Restringido' : activeOrder ? 'Pedido en curso...' : isAvailable ? '🔴 Desconectarse' : '🟢 Ponerse Disponible'}
//         </button>

//         <main className="recent-orders">
//             {activeOrder ? (
//                 <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)', background: '#fff' }}>
//                     <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
//                         {activeOrder.estado === 'asignado' && timeLeft !== null && (
//                           <span style={{ color: timeLeft < 30 ? 'red' : '#ff9800', fontWeight: 'bold', fontSize: '1.2rem' }}>
//                             ⏳ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
//                           </span>
//                         )}
//                     </div>
//                     <div className="order-body" style={{ padding: '15px 0' }}>
//                         <p>📍 <b>Origen:</b> {activeOrder.recogida}</p>
//                         <p>🏁 <b>Destino:</b> {activeOrder.entrega}</p>
//                         <p>👤 <b>Cliente:</b> {activeOrder.cliente_nombre}</p>
//                     </div>
//                     <div className="order-footer" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//                         <div className="price-tag" style={{ textAlign: 'center' }}>
//                           <p style={{ fontSize: '1.8rem', fontWeight: '900', color: '#2ecc71', margin: 0 }}>${activeOrder.monto}</p>
//                         </div>
//                         <div style={{ display: 'flex', gap: '10px' }}>
//                           {activeOrder.estado === 'asignado' ? (
//                             <>
//                               <button onClick={() => handleUpdateStatus('en_camino')} className="btn-primary" style={{ flex: 2, background: '#28a745' }}>Aceptar</button>
//                               <button onClick={() => handleUpdateStatus('pendiente')} className="btn-danger" style={{ flex: 1 }}>Rechazar</button>
//                             </>
//                           ) : (
//                             <button onClick={() => handleUpdateStatus(activeOrder.estado === 'en_camino' ? 'entregado' : 'finalizado')} className="btn-primary" style={{ width: '100%', background: '#007bff' }}>
//                               {activeOrder.estado === 'en_camino' ? '🏁 Marcar Entregado' : 'Finalizar Gestión'}
//                             </button>
//                           )}
//                         </div>
//                     </div>
//                 </div>
//             ) : (
//                 <div className="empty-state-card" style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '15px' }}>
//                   <p style={{ fontSize: '3rem', margin: 0 }}>{isRestricted ? '🔒' : isAvailable ? '📡' : '💤'}</p>
//                   <h3 style={{ color: '#666' }}>
//                     {isNotRegistered ? 'Perfil no registrado' : isSuspended ? 'Cuenta suspendida' : isAvailable ? 'Buscando pedidos cercanos...' : 'Estás desconectado'}
//                   </h3>
//                 </div>
//             )}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default DeliveryDashboard;

