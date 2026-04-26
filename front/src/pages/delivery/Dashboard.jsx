import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../../hooks/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NOTIFICATION_SOUND_URL = "/sounds/new-order.mp3";

// Mantenemos el socket fuera para que no se re-instancie innecesariamente
const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5
});

function DeliveryDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [driverStatus, setDriverStatus] = useState("not_registered");
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
  }, []);

  // 1. CARGA Y PERSISTENCIA (Sincronización con la Realidad de la DB)
  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const fetchInitialData = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { withCredentials: true });
        const { active, order, isAvailableInDB, tiene_pedido, status } = response.data;
        
        setDriverStatus(status || "not_registered");

        // SI LA DB DICE QUE TIENE PEDIDO, NO IMPORTA NADA MÁS
        if (active && order) {
          const normalizedOrder = { 
            ...order, 
            pedido_id: order.pedido_id || order.id,
            estado: order.estado 
          };
          setActiveOrder(normalizedOrder);
          setIsAvailable(true); 
        } else if (tiene_pedido === true) {
          // Si tiene_pedido es true pero no hay objeto 'order', es un error de sincronización
          // Forzamos al front a no limpiar la pantalla y re-intentar en 2 segundos
          console.warn("⚠️ Repartidor con tiene_pedido=true pero sin objeto order. Reintentando...");
          setTimeout(fetchInitialData, 2000);
        } else {
          setActiveOrder(null);
          setIsAvailable(!!isAvailableInDB);
        }
      } catch (err) {
        console.error("❌ Error de persistencia:", err);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, loading]);

  // 2. SOCKETS: UNIÓN Y RE-CONEXIÓN
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;

    const onConnect = () => {
      // Al conectar o re-conectar después de un F5
      socket.emit("join_driver_room", user.id); 
      console.log("✅ Socket conectado a sala driver_" + user.id);
    };

    const handleNewOrder = (data) => {
      setActiveOrder((current) => {
        if (current) return current; // Si ya tenemos uno, ignoramos
        return {
          pedido_id: data.pedido_id,
          monto: data.monto,
          cliente_nombre: data.cliente_nombre,
          recogida: data.recogida,
          entrega: data.entrega,
          estado: "asignado",
        };
      });
      setIsAvailable(true);
      audioRef.current?.play().catch(() => {});
      document.title = "🔴 NUEVO PEDIDO";
    };

    socket.on("connect", onConnect);
    socket.on("NUEVO_PEDIDO", handleNewOrder);
    
    // Si ya estaba conectado al montar el componente
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("NUEVO_PEDIDO", handleNewOrder);
    };
  }, [loading, isAuthenticated, user?.id]);

  // 3. ACTUALIZACIÓN DE ESTADOS
  const handleUpdateStatus = async (newStatus) => {
    const pedidoId = activeOrder?.pedido_id;
    if (!pedidoId) return;

    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/order-status`, 
        { pedido_id: pedidoId, status: newStatus }, 
        { withCredentials: true }
      );

      if (res.data.success) {
        if (newStatus === "entregado") {
          setActiveOrder(null);
          setIsAvailable(true); 
          document.title = "Gazzella Express";
        } else {
          setActiveOrder(prev => ({ ...prev, estado: newStatus }));
        }
      }
    } catch (err) { 
      console.error("❌ Error al actualizar estado:", err);
      alert("Error al actualizar. Por favor revisa tu conexión.");
    }
  };

  // 4. TOGGLE DISPONIBILIDAD
  const toggleAvailability = async () => {
    if (activeOrder || driverStatus !== "activo") return;
    try {
      const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
        { available: !isAvailable }, 
        { withCredentials: true }
      );
      if (res.data.success) {
        setIsAvailable(res.data.isAvailable);
        if (res.data.isAvailable) socket.emit("join_driver_room", user.id);
      }
    } catch (err) { console.error("Error disponibilidad:", err); }
  };

  if (loading || isLoadingStatus) {
    return (
      <div className="loading-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="client-dashboard">
        <header style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
          <div className={`status-pill ${activeOrder ? "pill-en-ruta" : isAvailable ? "pill-asignado" : "pill-pendiente"}`}>
             {activeOrder ? (activeOrder.estado === "asignado" ? "PEDIDO ASIGNADO" : "EN RUTA") : isAvailable ? "ESPERANDO PEDIDO" : "FUERA DE LÍNEA"}
          </div>
        </header>

        <button 
          onClick={toggleAvailability} 
          disabled={!!activeOrder || driverStatus !== "activo"} 
          className={isAvailable ? "btn-danger" : "btn-primary"}
          style={{ width: "100%", padding: "18px", borderRadius: "15px", fontWeight: "bold", marginBottom: "20px" }}
        >
          {activeOrder ? "Orden en Proceso" : isAvailable ? "🔴 Desconectarse" : "🟢 Ponerse Disponible"}
        </button>

        <main className="recent-orders">
          {activeOrder ? (
            <div className="order-card-modern" style={{ border: "2px solid #e67e22", background: "#fff", padding: "15px", borderRadius: "15px" }}>
              <div className="order-card-header" style={{ marginBottom: "15px" }}>
                <span className="order-id-badge" style={{ background: "#eee", padding: "5px 10px", borderRadius: "5px" }}>
                  PEDIDO #{activeOrder.pedido_id}
                </span>
                <span style={{ float: "right", color: "#e67e22", fontWeight: "bold" }}>
                  {activeOrder.estado === "asignado" ? "Por recoger" : "En camino"}
                </span>
              </div>
              <div className="order-body" style={{ lineHeight: "1.6" }}>
                <p>📍 <b>Origen:</b> {activeOrder.recogida}</p>
                <p>🏁 <b>Destino:</b> {activeOrder.entrega}</p>
                <p>👤 <b>Cliente:</b> {activeOrder.cliente_nombre}</p>
              </div>
              <hr style={{ margin: "15px 0", opacity: "0.2" }} />
              <div className="order-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "1.8rem", color: "#2ecc71", margin: 0, fontWeight: "bold" }}>${activeOrder.monto}</p>
                </div>
                
                {activeOrder.estado === "asignado" ? (
                  <button 
                    onClick={() => handleUpdateStatus("en_camino")} 
                    className="btn-primary" 
                    style={{ background: "#28a745", padding: "15px", fontSize: "1.1rem" }}
                  >
                    Confirmar: Recogí el pedido
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUpdateStatus("entregado")} 
                    className="btn-primary" 
                    style={{ padding: "15px", background: "#007bff", fontSize: "1.1rem" }}
                  >
                    🏁 Marcar como Entregado
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state-card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ fontSize: "3rem", margin: 0 }}>{isAvailable ? "📡" : "💤"}</p>
              <h3>{isAvailable ? "Buscando pedidos..." : "Estás desconectado"}</h3>
              <p style={{ color: "#888" }}>{isAvailable ? "Mantén la pantalla encendida" : "Ponte disponible para recibir entregas"}</p>
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
