import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [driverStatus, setDriverStatus] = useState('activo'); 

  const isSuspended = driverStatus === 'suspendido';

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

        // 🔥 PRIORIDAD: Si hay un pedido activo, lo mostramos sin importar el switch
        if (active && order) {
          setActiveOrder(order);
          setIsAvailable(false); // Se marca como no disponible para nuevos pedidos
        } else {
          setActiveOrder(null);
          setIsAvailable(status === 'suspendido' ? false : (isAvailableInDB || false));
        }
      } catch (err) {
        console.error("Error al obtener estado inicial:", err);
        if (err.response?.status === 404) {
            setActiveOrder(null);
            if (err.response.data?.status) setDriverStatus(err.response.data.status);
        }
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchInitialStatus();

    // Escuchar asignaciones en tiempo real
    socket.on('NUEVO_PEDIDO', (data) => {
      if (driverStatus !== 'suspendido') {
          setActiveOrder(data);
          setIsAvailable(false);
      }
    });

    return () => socket.off('NUEVO_PEDIDO');
  }, [isAuthenticated, loading, navigate, user?.id, driverStatus]);

  const toggleAvailability = async () => {
    if (isSuspended || activeOrder) return;

    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
        { available: !isAvailable },
        { withCredentials: true }
      );
      if (res.data.success) setIsAvailable(res.data.isAvailable);
    } catch (err) {
      alert("No se pudo cambiar el estado.");
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
                👋 Panel: <span style={{ color: 'var(--color-primary)' }}>{user?.nombre}</span>
            </h2>
            
            <div className={`status-pill ${
                isSuspended ? 'pill-cancelado' : 
                activeOrder ? 'pill-en-ruta' : 
                isAvailable ? 'pill-asignado' : 'pill-pendiente'
            }`} style={{ marginTop: '10px', display: 'inline-block' }}>
                {isSuspended ? "● CUENTA SUSPENDIDA" : 
                 activeOrder ? "● EN SERVICIO ACTIVO" : 
                 isAvailable ? "● EN LÍNEA" : "● DESCONECTADO"}
            </div>
        </header>

        <div className="search-container" style={{ border: 'none', background: 'transparent' }}>
            <button 
                onClick={toggleAvailability} 
                disabled={!!activeOrder || isSuspended}
                className={isSuspended ? 'btn-disabled' : (isAvailable ? 'btn-danger' : 'btn-primary')}
                style={{ 
                    width: '100%', padding: '15px', borderRadius: '12px',
                    opacity: (isSuspended || activeOrder) ? 0.6 : 1,
                    cursor: (isSuspended || activeOrder) ? 'not-allowed' : 'pointer'
                }}
            >
                {isSuspended ? 'Acceso Restringido' : 
                 activeOrder ? 'Finaliza el pedido para cambiar estado' :
                 isAvailable ? '🔴 Pausar Recepción' : '🟢 Ponerme Disponible'}
            </button>
        </div>

        <div className="recent-orders">
            {isSuspended ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff1f2', borderRadius: '12px', border: '2px solid #fecdd3' }}>
                    <div style={{ fontSize: '2.5rem' }}>🚫</div>
                    <h3 style={{ color: '#be123c' }}>Servicio Inhabilitado</h3>
                    <p style={{ color: '#9f1239' }}>Tu usuario se encuentra en estado <b>{driverStatus}</b>.</p>
                </div>
            ) : activeOrder ? (
                /* --- TARJETA DE PEDIDO ACTIVO --- */
                <div className="order-card-modern" style={{ border: '2px solid var(--color-primary)' }}>
                    <div className="order-card-header">
                        <span className="order-id-badge">PEDIDO #{activeOrder.pedido_id}</span>
                        <span className="status-pill pill-en-ruta">EN PROGRESO</span>
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
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '2px dashed #eee' }}>
                    <p style={{ color: '#999' }}>
                        {isAvailable ? '📡 Buscando solicitudes en tiempo real...' : 'Conéctate para empezar a recibir pedidos.'}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDashboard;



// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Agregado para consistencia
// import { io } from 'socket.io-client';
// import axios from 'axios';
// import { useAuth } from '../../hooks/AuthContext'; 

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // Socket fuera para evitar múltiples conexiones
// const socket = io(API_BASE_URL, {
//     withCredentials: true,
//     transports: ['polling', 'websocket']
// });

// function DeliveryDashboard() {
//   const navigate = useNavigate();
//   // 1. Extraemos igual que en ClientDashboard
//   const { user, isAuthenticated, loading } = useAuth();
  
//   const [isAvailable, setIsAvailable] = useState(false);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [isLoadingStatus, setIsLoadingStatus] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // 💡 IGUAL QUE EN CLIENTE: Si el context carga, no hagas nada
//     if (loading) return; 

//     // 💡 IGUAL QUE EN CLIENTE: Si no está autenticado, fuera
//     if (!isAuthenticated) { 
//         navigate('/'); 
//         return; 
//     }

//     // Unirse al socket una vez autenticado
//     socket.emit('join_driver_room', user.id);

//     const fetchInitialStatus = async () => {
//       setIsLoadingStatus(true);
//       try {
//         // 💡 USANDO AXIOS + withCredentials (Como en ClientDashboard)
//         const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { 
//             withCredentials: true 
//         });
        
//         const data = response.data;
//         if (data.active && data.order) {
//           setActiveOrder(data.order);
//           setIsAvailable(false);
//         } else {
//           setActiveOrder(null);
//           setIsAvailable(data.isAvailableInDB || false);
//         }
//       } catch (err) {
//         // 404 significa que no hay órdenes, no es un error fatal
//         if (err.response?.status === 404) {
//             setActiveOrder(null);
//         } else {
//             setError('Error al sincronizar con el servidor.');
//         }
//       } finally {
//         setIsLoadingStatus(false);
//       }
//     };

//     fetchInitialStatus();

//     socket.on('NUEVO_PEDIDO', (data) => {
//       setActiveOrder(data);
//       setIsAvailable(false);
//       // Opcional: Sonido o notificación aquí
//     });

//     return () => {
//       socket.off('NUEVO_PEDIDO');
//     };
//   }, [isAuthenticated, loading, navigate, user?.id]);

//   // Acciones (Usando axios para evitar el 401)
//   const toggleAvailability = async () => {
//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
//         { available: !isAvailable },
//         { withCredentials: true }
//       );
//       if (res.data.success) setIsAvailable(res.data.isAvailable);
//     } catch (err) {
//       alert("No se pudo cambiar el estado.");
//     }
//   };

//   // --- RENDER ---
//   if (loading || isLoadingStatus) {
//     return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando panel de control...</div>;
//   }

//   return (
//     <div className="app-container">
//       <div className="client-dashboard"> {/* Usando tus mismas clases de CSS */}
//         <header style={{ marginBottom: '20px', textAlign: 'center' }}>
//             <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
//                 🛵 Panel: <span style={{ color: 'var(--color-primary)' }}>{user?.nombre}</span>
//             </h2>
//             <div className={`status-pill ${isAvailable ? 'pill-asignado' : 'pill-pendiente'}`} style={{ marginTop: '10px', display: 'inline-block' }}>
//                 {isAvailable ? "● Disponible para Carreras" : activeOrder ? "● En Servicio" : "● Desconectado"}
//             </div>
//         </header>

//         <div className="search-container" style={{ border: 'none', background: 'transparent' }}>
//             <button 
//                 onClick={toggleAvailability} 
//                 disabled={!!activeOrder}
//                 className={isAvailable ? 'btn-danger' : 'btn-primary'}
//                 style={{ width: '100%', padding: '15px', borderRadius: '12px' }}
//             >
//                 {isAvailable ? '🔴 Pausar Recepción' : '🟢 Ponerme Disponible'}
//             </button>
//         </div>

//         <div className="recent-orders">
//             {!activeOrder ? (
//                 <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '2px dashed #eee' }}>
//                     <p style={{ color: '#999' }}>
//                         {isAvailable ? '📡 Buscando pedidos cercanos...' : 'Activa tu disponibilidad para empezar.'}
//                     </p>
//                 </div>
//             ) : (
//                 <div className="order-card-modern">
//                     <div className="order-card-header">
//                         <span className="order-id-badge">CARRERA ACTIVA</span>
//                         <span className="status-pill pill-en-ruta">ASIGNADO</span>
//                     </div>
//                     <div className="order-body">
//                         <div className="address-info">
//                             <span style={{ color: 'var(--color-primary)' }}>📍</span>
//                             <div className="address-text">
//                                 <strong>Recoger:</strong> {activeOrder.recogida || activeOrder.cliente?.recogida}
//                             </div>
//                         </div>
//                         <div className="address-info" style={{ marginTop: '10px' }}>
//                             <span style={{ color: 'var(--color-primary)' }}>🏁</span>
//                             <div className="address-text">
//                                 <strong>Entregar:</strong> {activeOrder.entrega || activeOrder.cliente?.entrega}
//                             </div>
//                         </div>
//                     </div>
//                     <div className="order-footer">
//                         <div className="price-tag">
//                             <span className="amount-usd" style={{ fontSize: '1.5rem' }}>${activeOrder.monto}</span>
//                         </div>
//                         <button className="btn-primary" style={{ padding: '8px 20px' }}>
//                             CONFIRMAR LLEGADA
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DeliveryDashboard;
