import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Archivo de sonido (puedes poner un .mp3 en tu carpeta public/sounds)
const NOTIFICATION_SOUND_URL = '/sounds/new-order.mp3';

const socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ['polling', 'websocket']
});

function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [driverStatus, setDriverStatus] = useState('not_registered'); 

  // Referencia para el audio para que no se recargue en cada render
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  const isSuspended = driverStatus === 'suspendido';
  const isNotRegistered = driverStatus === 'not_registered';
  const isRestricted = isSuspended || isNotRegistered;

  useEffect(() => {
    if (loading) return; 
    if (!isAuthenticated) { navigate('/'); return; }

    socket.emit('join_driver_room', user.id);

    const fetchInitialStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { 
            withCredentials: true 
        });
        
        const { active, order, isAvailableInDB, status } = response.data;
        if (status) setDriverStatus(status);

        if (active && order) {
          setActiveOrder(order);
          setIsAvailable(false);
        } else {
          setActiveOrder(null);
          setIsAvailable(status === 'suspendido' || status === 'not_registered' ? false : (isAvailableInDB || false));
        }
      } catch (err) {
        if (err.response?.status === 404) {
            setDriverStatus('not_registered');
            setActiveOrder(null);
        }
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchInitialStatus();

    // 🔔 ESCUCHAR NUEVO PEDIDO Y SONAR ALERTA
    socket.on('NUEVO_PEDIDO', (data) => {
      if (!isRestricted) {
          // 1. Actualizar el estado (esto renderiza la card automáticamente)
          setActiveOrder(data);
          setIsAvailable(false);

          // 2. Reproducir sonido de notificación
          audioRef.current.play().catch(e => console.log("El navegador bloqueó el audio inicial:", e));
          
          // 3. Opcional: Vibración en móviles
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
      }
    });

    return () => socket.off('NUEVO_PEDIDO');
  }, [isAuthenticated, loading, navigate, user?.id, isRestricted]);

  const toggleAvailability = async () => {
    if ((isRestricted && !activeOrder) || activeOrder) return;

    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
        { available: !isAvailable },
        { withCredentials: true }
      );
      if (res.data.success) {
          setIsAvailable(res.data.isAvailable);
          // Intentamos un play silencioso para "desbloquear" el audio en el navegador
          audioRef.current.play().then(() => {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
          }).catch(() => {});
      }
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo cambiar el estado.");
    }
  };

  if (loading || isLoadingStatus) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Sincronizando con Gazzella...</div>;
  }

  return (
    <div className="app-container">
      <div className="client-dashboard">
        <header style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                🛵 Panel: <span style={{ color: 'var(--color-primary)' }}>{user?.nombre}</span>
            </h2>
            
            <div className={`status-pill ${
                isSuspended ? 'pill-cancelado' : 
                isNotRegistered ? 'pill-pendiente' :
                activeOrder ? 'pill-en-ruta' : 
                isAvailable ? 'pill-asignado' : 'pill-pendiente'
            }`} style={{ marginTop: '10px', display: 'inline-block' }}>
                {isSuspended ? "● CUENTA SUSPENDIDA" : 
                 isNotRegistered ? "● REGISTRO INCOMPLETO" :
                 activeOrder ? "● EN SERVICIO ACTIVO" : 
                 isAvailable ? "● EN LÍNEA" : "● DESCONECTADO"}
            </div>
        </header>

        <div className="search-container" style={{ border: 'none', background: 'transparent' }}>
            <button 
                onClick={toggleAvailability} 
                disabled={!!activeOrder || isRestricted}
                className={isRestricted ? 'btn-disabled' : (isAvailable ? 'btn-danger' : 'btn-primary')}
                style={{ 
                    width: '100%', padding: '15px', borderRadius: '12px',
                    opacity: (isRestricted || activeOrder) ? 0.6 : 1,
                    cursor: (isRestricted || activeOrder) ? 'not-allowed' : 'pointer'
                }}
            >
                {isSuspended ? 'Acceso Restringido' : 
                 isNotRegistered ? 'No registrado como repartidor' :
                 activeOrder ? 'Finaliza el pedido para cambiar estado' :
                 isAvailable ? '🔴 Pausar Recepción' : '🟢 Ponerme Disponible'}
            </button>
        </div>

        <div className="recent-orders">
            {activeOrder ? (
                <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)', animation: 'pulse-border 2s infinite' }}>
                    <div className="order-card-header">
                        <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
                        <span className="status-pill pill-en-ruta">¡NUEVA ASIGNACIÓN!</span>
                    </div>

                    <div className="order-body">
                        <div className="address-info">
                            <span style={{ color: 'var(--color-primary)' }}>📍</span>
                            <div className="address-text">
                                <strong>Punto de Recogida:</strong>
                                <p style={{ margin: 0 }}>{activeOrder.recogida}</p>
                            </div>
                        </div>
                        <div className="address-info" style={{ marginTop: '15px' }}>
                            <span style={{ color: 'var(--color-primary)' }}>🏁</span>
                            <div className="address-text">
                                <strong>Punto de Entrega:</strong>
                                <p style={{ margin: 0 }}>{activeOrder.entrega}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}><b>Cliente:</b> {activeOrder.cliente_nombre}</p>
                        </div>
                    </div>

                    <div className="order-footer" style={{ marginTop: '20px' }}>
                        <div className="price-tag">
                            <span className="amount-usd" style={{ fontSize: '1.4rem' }}>${activeOrder.monto}</span>
                        </div>
                        <button 
                            className="btn-primary" 
                            style={{ padding: '10px 20px' }}
                            onClick={() => navigate(`/driver/order/${activeOrder.pedido_id}`)}
                        >
                            Ver Detalles
                        </button>
                    </div>

                    {isSuspended && (
                        <p style={{ color: '#be123c', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                            ⚠️ Podrás finalizar este servicio, pero tu cuenta está suspendida.
                        </p>
                    )}
                </div>
            ) 
            : isNotRegistered ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #bae6fd' }}>
                    <div style={{ fontSize: '2.5rem' }}>📋</div>
                    <h3 style={{ color: '#0369a1' }}>Registro Pendiente</h3>
                    <p style={{ color: '#075985' }}>Debes <b>contactar al administrador</b> para ser registrado.</p>
                </div>
            ) 
            : isSuspended ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff1f2', borderRadius: '12px', border: '2px solid #fecdd3' }}>
                    <div style={{ fontSize: '2.5rem' }}>🚫</div>
                    <h3 style={{ color: '#be123c' }}>Cuenta Suspendida</h3>
                    <p style={{ color: '#9f1239' }}>No puedes recibir más pedidos por decisión administrativa.</p>
                </div>
            )
            : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '2px dashed #eee' }}>
                    <p style={{ color: '#999' }}>{isAvailable ? '📡 Esperando solicitudes...' : 'Activa tu disponibilidad.'}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDashboard;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import axios from 'axios';
// import { useAuth } from '../../hooks/AuthContext';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const socket = io(API_BASE_URL, {
//     withCredentials: true,
//     transports: ['polling', 'websocket']
// });

// function DeliveryDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();

//   const [isAvailable, setIsAvailable] = useState(false);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [isLoadingStatus, setIsLoadingStatus] = useState(true);
//   const [driverStatus, setDriverStatus] = useState('not_registered');

//   const isSuspended = driverStatus === 'suspendido';
//   const isNotRegistered = driverStatus === 'not_registered';
//   const isRestricted = isSuspended || isNotRegistered;

//   useEffect(() => {
//     if (loading) return;
//     if (!isAuthenticated) { navigate('/'); return; }

//     socket.emit('join_driver_room', user.id);

//     const fetchInitialStatus = async () => {
//       setIsLoadingStatus(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/driver/current-order`, {
//             withCredentials: true
//         });

//         const { active, order, isAvailableInDB, status } = response.data;
//         if (status) setDriverStatus(status);

//         if (active && order) {
//           setActiveOrder(order);
//           setIsAvailable(false);
//         } else {
//           setActiveOrder(null);
//           setIsAvailable(status === 'suspendido' || status === 'not_registered' ? false : (isAvailableInDB || false));
//         }
//       } catch (err) {
//         if (err.response?.status === 404) {
//             setDriverStatus('not_registered');
//             setActiveOrder(null);
//         }
//       } finally {
//         setIsLoadingStatus(false);
//       }
//     };

//     fetchInitialStatus();

//     socket.on('NUEVO_PEDIDO', (data) => {
//       if (!isRestricted) {
//           setActiveOrder(data);
//           setIsAvailable(false);
//       }
//     });

//     return () => socket.off('NUEVO_PEDIDO');
//   }, [isAuthenticated, loading, navigate, user?.id, isRestricted]);

//   const toggleAvailability = async () => {
//     if ((isRestricted && !activeOrder) || activeOrder) return;

//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/availability`,
//         { available: !isAvailable },
//         { withCredentials: true }
//       );
//       if (res.data.success) setIsAvailable(res.data.isAvailable);
//     } catch (err) {
//       alert(err.response?.data?.message || "No se pudo cambiar el estado.");
//     }
//   };

//   if (loading || isLoadingStatus) {
//     return <div style={{ textAlign: 'center', padding: '50px' }}>Sincronizando con Gazzella...</div>;
//   }

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
//         <header style={{ marginBottom: '20px', textAlign: 'center' }}>
//             <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
//                 🛵 Panel: <span style={{ color: 'var(--color-primary)' }}>{user?.nombre}</span>
//             </h2>

//             <div className={`status-pill ${
//                 isSuspended ? 'pill-cancelado' :
//                 isNotRegistered ? 'pill-pendiente' :
//                 activeOrder ? 'pill-en-ruta' :
//                 isAvailable ? 'pill-asignado' : 'pill-pendiente'
//             }`} style={{ marginTop: '10px', display: 'inline-block' }}>
//                 {isSuspended ? "● CUENTA SUSPENDIDA" :
//                  isNotRegistered ? "● REGISTRO INCOMPLETO" :
//                  activeOrder ? "● EN SERVICIO ACTIVO" :
//                  isAvailable ? "● EN LÍNEA" : "● DESCONECTADO"}
//             </div>
//         </header>

//         <div className="search-container" style={{ border: 'none', background: 'transparent' }}>
//             <button
//                 onClick={toggleAvailability}
//                 disabled={!!activeOrder || isRestricted}
//                 className={isRestricted ? 'btn-disabled' : (isAvailable ? 'btn-danger' : 'btn-primary')}
//                 style={{
//                     width: '100%', padding: '15px', borderRadius: '12px',
//                     opacity: (isRestricted || activeOrder) ? 0.6 : 1,
//                     cursor: (isRestricted || activeOrder) ? 'not-allowed' : 'pointer'
//                 }}
//             >
//                 {isSuspended ? 'Acceso Restringido' :
//                  isNotRegistered ? 'No registrado como repartidor' :
//                  activeOrder ? 'Finaliza el pedido para cambiar estado' :
//                  isAvailable ? '🔴 Pausar Recepción' : '🟢 Ponerme Disponible'}
//             </button>
//         </div>

//         <div className="recent-orders">
//             {/* 1. PRIORIDAD ABSOLUTA: PEDIDO ACTIVO (Incluso si está suspendido) */}
//             {activeOrder ? (
//                 <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)' }}>
//                     <div className="order-card-header">
//                         <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
//                         <span className="status-pill pill-en-ruta">EN PROGRESO</span>
//                     </div>

//                     <div className="order-body">
//                         <div className="address-info">
//                             <span style={{ color: 'var(--color-primary)' }}>📍</span>
//                             <div className="address-text">
//                                 <strong>Punto de Recogida:</strong>
//                                 <p style={{ margin: 0 }}>{activeOrder.recogida}</p>
//                             </div>
//                         </div>
//                         <div className="address-info" style={{ marginTop: '15px' }}>
//                             <span style={{ color: 'var(--color-primary)' }}>🏁</span>
//                             <div className="address-text">
//                                 <strong>Punto de Entrega:</strong>
//                                 <p style={{ margin: 0 }}>{activeOrder.entrega}</p>
//                             </div>
//                         </div>
//                         <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
//                             <p style={{ margin: 0, fontSize: '0.9rem' }}><b>Cliente:</b> {activeOrder.cliente_nombre}</p>
//                         </div>
//                     </div>

//                     <div className="order-footer" style={{ marginTop: '20px' }}>
//                         <div className="price-tag">
//                             <span className="amount-usd" style={{ fontSize: '1.4rem' }}>${activeOrder.monto}</span>
//                         </div>
//                         <button
//                             className="btn-primary"
//                             style={{ padding: '10px 20px' }}
//                             onClick={() => navigate(`/driver/order/${activeOrder.pedido_id}`)}
//                         >
//                             Ver Detalles
//                         </button>
//                     </div>

//                     {isSuspended && (
//                         <p style={{ color: '#be123c', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center', fontWeight: 'bold' }}>
//                             ⚠️ Podrás finalizar este servicio, pero tu cuenta está suspendida.
//                         </p>
//                     )}
//                 </div>
//             )
//             /* 2. SI NO HAY PEDIDO: REGISTRO INCOMPLETO */
//             : isNotRegistered ? (
//                 <div style={{ textAlign: 'center', padding: '40px', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #bae6fd' }}>
//                     <div style={{ fontSize: '2.5rem' }}>📋</div>
//                     <h3 style={{ color: '#0369a1' }}>Registro Pendiente</h3>
//                     <p style={{ color: '#075985' }}>Debes <b>contactar al administrador</b> para ser registrado y empezar a trabajar.</p>
//                 </div>
//             )
//             /* 3. SI NO HAY PEDIDO: SUSPENDIDO */
//             : isSuspended ? (
//                 <div style={{ textAlign: 'center', padding: '40px', background: '#fff1f2', borderRadius: '12px', border: '2px solid #fecdd3' }}>
//                     <div style={{ fontSize: '2.5rem' }}>🚫</div>
//                     <h3 style={{ color: '#be123c' }}>Cuenta Suspendida</h3>
//                     <p style={{ color: '#9f1239' }}>Has terminado tu último servicio. No puedes recibir más pedidos por decisión administrativa.</p>
//                 </div>
//             )
//             : (
//                 <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '2px dashed #eee' }}>
//                     <p style={{ color: '#999' }}>{isAvailable ? '📡 Esperando solicitudes...' : 'Activa tu disponibilidad.'}</p>
//                 </div>
//             )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DeliveryDashboard;
