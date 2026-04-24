import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NOTIFICATION_SOUND_URL = '/sounds/new-order.mp3';

// Socket único: Se mantiene fuera para persistir entre re-renders
const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket'], 
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});

function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [driverStatus, setDriverStatus] = useState('not_registered'); 

  const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  // Flags de estado
  const isSuspended = driverStatus === 'suspendido';
  const isNotRegistered = driverStatus === 'not_registered';
  const isRestricted = isSuspended || isNotRegistered;

  // --- EFECTO 1: SINCRONIZACIÓN DE SOCKET ---
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;

    const joinRoom = () => {
      console.log(`📡 [SOCKET] Intentando unir a sala: driver_${user.id}`);
      socket.emit('join_driver_room', user.id);
    };

    // Si ya está conectado al montar, nos unimos
    if (socket.connected) joinRoom();

    const onConnect = () => {
      console.log("✅ [SOCKET] Conectado. ID:", socket.id);
      joinRoom();
    };

    const handleNewOrder = (data) => {
      console.log("🔥 LLEGÓ SOCKET:", data);

      // NORMALIZACIÓN: No importa cómo lo envíe el back, 
      // nosotros nos aseguramos de que el Front tenga lo que necesita.
      const pedidoNormalizado = {
          pedido_id: data.pedido_id || data.id, // Acepta ambos
          monto: data.monto || data.total || 0,
          cliente_nombre: data.cliente_nombre || 'Cliente Genérico',
          recogida: data.recogida || 'Ver detalles',
          entrega: data.entrega || 'Ver detalles'
      };
  
      console.log("✅ PEDIDO NORMALIZADO PARA LA CARD:", pedidoNormalizado);
  
      setActiveOrder(pedidoNormalizado);
      setIsAvailable(false);
    };

    socket.on('connect', onConnect);
    socket.on('NUEVO_PEDIDO', handleNewOrder);
    socket.on('reconnect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('NUEVO_PEDIDO', handleNewOrder);
      socket.off('reconnect', onConnect);
      document.title = "Gazzella Express";
    };
  }, [loading, isAuthenticated, user?.id]);

  // --- EFECTO 2: CARGA DE DATOS DESDE API ---
  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const fetchInitialData = async () => {
      setIsLoadingStatus(true);
      try {
        // Obtenemos el estado actual del repartidor y si tiene pedidos activos
        const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { 
            withCredentials: true 
        });
        
        const { active, order, isAvailableInDB, status } = response.data;
        setDriverStatus(status || 'not_registered');

        if (active && order) {
          setActiveOrder(order);
          setIsAvailable(false);
        } else {
          setActiveOrder(null);
          setIsAvailable(isAvailableInDB || false);
        }
      } catch (err) {
        console.error("❌ Error al sincronizar dashboard:", err);
        if (err.response?.status === 404) setDriverStatus('not_registered');
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, loading]);

  // --- ACCIÓN: TOGGLE DISPONIBILIDAD ---
  const toggleAvailability = async () => {
    if (isRestricted || activeOrder) return;

    // Aseguramos sala antes del cambio
    if (socket.connected) {
      socket.emit('join_driver_room', user.id);
    }

    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
        { available: !isAvailable },
        { withCredentials: true }
      );
      
      if (res.data.success) {
          setIsAvailable(res.data.isAvailable);
          
          // "Cebamos" el audio para que el navegador permita el sonido más tarde
          if (res.data.isAvailable && audioRef.current) {
            audioRef.current.muted = true;
            audioRef.current.play().then(() => {
              audioRef.current.pause();
              audioRef.current.muted = false;
            }).catch(() => {});
          }
      }
    } catch (err) {
      console.error("Error al cambiar disponibilidad:", err);
      alert("Error de conexión con el servidor.");
    }
  };

  if (loading || isLoadingStatus) {
    return (
      <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '10px' }}>Sincronizando Gazzella...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="client-dashboard">
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontWeight: '800', color: 'var(--color-text)' }}>🛵 Panel: {user?.nombre}</h2>
            <div className={`status-pill ${activeOrder ? 'pill-en-ruta' : isAvailable ? 'pill-asignado' : 'pill-pendiente'}`}>
                {isSuspended ? "CUENTA SUSPENDIDA" : 
                 isNotRegistered ? "SIN REGISTRO" :
                 activeOrder ? "EN SERVICIO" : 
                 isAvailable ? "EN LÍNEA (ESPERANDO)" : "FUERA DE LÍNEA"}
            </div>
        </header>

        <section className="search-container" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <button 
                onClick={toggleAvailability} 
                disabled={!!activeOrder || isRestricted}
                className={isRestricted ? 'btn-disabled' : (isAvailable ? 'btn-danger' : 'btn-primary')}
                style={{ width: '100%', padding: '18px', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', transition: 'all 0.3s' }}
            >
                {isSuspended ? 'Acceso Restringido' : 
                 isNotRegistered ? 'Perfil incompleto' :
                 activeOrder ? 'Tienes un pedido activo' :
                 isAvailable ? '🔴 Desconectarse' : '🟢 Ponerse Disponible'}
            </button>
        </section>

        <main className="recent-orders" style={{ marginTop: '30px' }}>
            {activeOrder ? (
                <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <div className="order-card-header">
                        <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
                        <span className="status-pill pill-en-ruta">ASIGNADO</span>
                    </div>

                    <div className="order-body">
                        <div className="address-info">
                            <span style={{ fontSize: '1.2rem' }}>📍</span>
                            <div className="address-text">
                                <small>PUNTO DE RECOGIDA</small>
                                <p>{activeOrder.recogida || 'Dirección de origen'}</p>
                            </div>
                        </div>
                        <div className="address-info" style={{ marginTop: '15px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏁</span>
                            <div className="address-text">
                                <small>DESTINO FINAL</small>
                                <p>{activeOrder.entrega || 'Dirección de destino'}</p>
                            </div>
                        </div>
                        <div className="client-tag" style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '10px' }}>👤</span>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}><b>Cliente:</b> {activeOrder.cliente_nombre}</p>
                        </div>
                    </div>

                    <div className="order-footer" style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="price-tag">
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>GANANCIA</span>
                            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: 'var(--color-primary)' }}>${activeOrder.monto}</p>
                        </div>
                        <button 
                            className="btn-primary" 
                            style={{ padding: '12px 25px' }}
                            onClick={() => navigate(`/driver/order/${activeOrder.pedido_id}`)}
                        >
                            Gestionar Pedido
                        </button>
                    </div>
                </div>
            ) : (
                <div className="empty-state-card" style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #e2e8f0', borderRadius: '20px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '15px' }}>{isAvailable ? '📡' : '💤'}</div>
                    <h3 style={{ margin: 0, color: '#475569' }}>
                        {isAvailable ? 'Buscando pedidos...' : 'Estás desconectado'}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        {isAvailable 
                          ? 'Mantén esta ventana abierta para recibir notificaciones.' 
                          : 'Activa tu disponibilidad para empezar a recibir pedidos.'}
                    </p>
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

// // Socket único para toda la sesión del componente
// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ['websocket'], 
//   autoConnect: true,
//   reconnection: true,
//   reconnectionAttempts: 10
// });

// function DeliveryDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
  
//   const [isAvailable, setIsAvailable] = useState(false);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [isLoadingStatus, setIsLoadingStatus] = useState(true);
//   const [driverStatus, setDriverStatus] = useState('not_registered'); 

//   const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

//   const isSuspended = driverStatus === 'suspendido';
//   const isNotRegistered = driverStatus === 'not_registered';
//   const isRestricted = isSuspended || isNotRegistered;

//   // --- EFECTO 1: GESTIÓN DE SOCKETS (RECEPCIÓN) ---
//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;

//     const emitJoin = () => {
//       console.log(`📡 [SOCKET] Sincronizando sala: driver_${user.id}`);
//       socket.emit('join_driver_room', user.id);
//     };

//     // Unirse al conectar o si ya está conectado
//     if (socket.connected) emitJoin();
//     socket.on('connect', onConnect);
//     socket.on('reconnect', onReconnect);
//     socket.on('NUEVO_PEDIDO', handleNewOrder);

//     function onConnect() {
//       console.log("✅ [SOCKET] Conexión establecida con el servidor");
//       emitJoin();
//     }

//     function onReconnect() {
//       console.log("🔄 [SOCKET] Reconexión exitosa");
//       emitJoin();
//     }

//     function handleNewOrder(data) {
//       console.log("🔥 [EVENTO] ¡NUEVO PEDIDO RECIBIDO!", data);
//       setActiveOrder(data);
//       setIsAvailable(false);
      
//       // Feedback al usuario
//       document.title = "🔴 (1) Nuevo Pedido";
//       if (audioRef.current) {
//         audioRef.current.currentTime = 0;
//         audioRef.current.play().catch(() => console.warn("🔊 Audio bloqueado"));
//       }
//     }

//     return () => {
//       socket.off('connect', onConnect);
//       socket.off('reconnect', onReconnect);
//       socket.off('NUEVO_PEDIDO', handleNewOrder);
//       document.title = "Gazzella Express";
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   // --- EFECTO 2: CARGA INICIAL DE ESTADO ---
//   useEffect(() => {
//     if (loading || !isAuthenticated) return;

//     const fetchInitialData = async () => {
//       setIsLoadingStatus(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { 
//             withCredentials: true 
//         });
        
//         const { active, order, isAvailableInDB, status } = response.data;
//         setDriverStatus(status || 'not_registered');

//         if (active && order) {
//           setActiveOrder(order);
//           setIsAvailable(false);
//         } else {
//           setActiveOrder(null);
//           setIsAvailable(isAvailableInDB || false);
//         }
//       } catch (err) {
//         console.error("Error al cargar estado:", err);
//         if (err.response?.status === 404) setDriverStatus('not_registered');
//       } finally {
//         setIsLoadingStatus(false);
//       }
//     };

//     fetchInitialData();
//   }, [isAuthenticated, loading]);

//   // --- ACCIÓN: CAMBIAR DISPONIBILIDAD ---
//   const toggleAvailability = async () => {
//     if (isRestricted || activeOrder) return;

//     // REFUERZO: Asegurar que el socket esté en la sala antes de pedir pedidos
//     if (socket.connected) {
//       socket.emit('join_driver_room', user.id);
//     }

//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
//         { available: !isAvailable },
//         { withCredentials: true }
//       );
      
//       if (res.data.success) {
//           setIsAvailable(res.data.isAvailable);
//           // Desbloquear audio para la notificación futura
//           if (res.data.isAvailable) {
//             audioRef.current.play().then(() => {
//               audioRef.current.pause();
//               audioRef.current.currentTime = 0;
//             }).catch(() => {});
//           }
//       }
//     } catch (err) {
//       alert("No se pudo cambiar el estado. Revisa tu conexión.");
//     }
//   };

//   if (loading || isLoadingStatus) {
//     return <div className="loading-screen">Sincronizando con Gazzella...</div>;
//   }

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
//         <header style={{ textAlign: 'center', marginBottom: '20px' }}>
//             <h2 style={{ fontWeight: '800' }}>🛵 Panel: {user?.nombre}</h2>
//             <div className={`status-pill ${activeOrder ? 'pill-en-ruta' : isAvailable ? 'pill-asignado' : 'pill-pendiente'}`}>
//                 {isSuspended ? "CUENTA SUSPENDIDA" : 
//                  isNotRegistered ? "REGISTRO INCOMPLETO" :
//                  activeOrder ? "EN SERVICIO" : 
//                  isAvailable ? "EN LÍNEA" : "DESCONECTADO"}
//             </div>
//         </header>

//         <div className="search-container" style={{ background: 'transparent', border: 'none' }}>
//             <button 
//                 onClick={toggleAvailability} 
//                 disabled={!!activeOrder || isRestricted}
//                 className={isRestricted ? 'btn-disabled' : (isAvailable ? 'btn-danger' : 'btn-primary')}
//                 style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem' }}
//             >
//                 {isSuspended ? 'Acceso Restringido' : 
//                  isNotRegistered ? 'No registrado' :
//                  activeOrder ? 'Pedido en curso' :
//                  isAvailable ? '🔴 Salir de servicio' : '🟢 Entrar de servicio'}
//             </button>
//         </div>

//         <div className="recent-orders" style={{ marginTop: '25px' }}>
//             {activeOrder ? (
//                 <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)' }}>
//                     <div className="order-card-header">
//                         <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
//                         <span className="status-pill pill-en-ruta">ACTIVO</span>
//                     </div>

//                     <div className="order-body">
//                         <div className="address-info">
//                             <span>📍</span>
//                             <div className="address-text">
//                                 <strong>Recogida:</strong>
//                                 <p>{activeOrder.recogida}</p>
//                             </div>
//                         </div>
//                         <div className="address-info" style={{ marginTop: '12px' }}>
//                             <span>🏁</span>
//                             <div className="address-text">
//                                 <strong>Entrega:</strong>
//                                 <p>{activeOrder.entrega}</p>
//                             </div>
//                         </div>
//                         <div style={{ marginTop: '15px', padding: '10px', background: '#f0f4f8', borderRadius: '8px' }}>
//                             <p style={{ margin: 0 }}>👤 <b>Cliente:</b> {activeOrder.cliente_nombre}</p>
//                         </div>
//                     </div>

//                     <div className="order-footer" style={{ marginTop: '20px' }}>
//                         <span className="amount-usd" style={{ fontSize: '1.5rem' }}>${activeOrder.monto}</span>
//                         <button 
//                             className="btn-primary" 
//                             onClick={() => navigate(`/driver/order/${activeOrder.pedido_id}`)}
//                         >
//                             Ver Detalles
//                         </button>
//                     </div>
//                 </div>
//             ) : (
//                 <div className="empty-state-card" style={{ textAlign: 'center', padding: '40px', border: '2px dashed #ccc', borderRadius: '15px' }}>
//                     <div style={{ fontSize: '3rem' }}>{isAvailable ? '📡' : '😴'}</div>
//                     <p style={{ color: '#666', marginTop: '10px' }}>
//                         {isAvailable ? 'Esperando pedidos en tu zona...' : 'Ponte disponible para recibir trabajo.'}
//                     </p>
//                 </div>
//             )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DeliveryDashboard;

