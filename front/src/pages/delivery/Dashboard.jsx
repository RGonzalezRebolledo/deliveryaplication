import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../../hooks/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NOTIFICATION_SOUND_URL = "/sounds/new-order.mp3";

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

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const fetchInitialData = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { withCredentials: true });
        const { active, order, isAvailableInDB, tiene_pedido, status } = response.data;
        
        setDriverStatus(status || "not_registered");

        if (active && order) {
          const normalizedOrder = { 
            ...order, 
            pedido_id: order.pedido_id || order.id,
            estado: order.estado 
          };
          setActiveOrder(normalizedOrder);
          setIsAvailable(true); 
        } else if (tiene_pedido === true) {
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

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;

    const onConnect = () => {
      socket.emit("join_driver_room", user.id); 
    };

    const handleNewOrder = (data) => {
      // Bloquear nuevos pedidos si el estatus no es activo
      if (driverStatus !== "activo") return;

      setActiveOrder((current) => {
        if (current) return current;
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
    
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("NUEVO_PEDIDO", handleNewOrder);
    };
  }, [loading, isAuthenticated, user?.id, driverStatus]);

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
          setIsAvailable(driverStatus === "activo"); // Si está suspendido, ya no queda disponible
          document.title = "Gazzella Express";
        } else {
          setActiveOrder(prev => ({ ...prev, estado: newStatus }));
        }
      }
    } catch (err) { 
      console.error("❌ Error al actualizar estado:", err);
    }
  };

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

  // VISTA PARA CONDUCTOR NO REGISTRADO O PENDIENTE
  if (driverStatus === "not_registered") {
    return (
      <div className="app-container">
        <div className="client-dashboard" style={{ textAlign: "center", padding: "50px 20px" }}>
          <header style={{ marginBottom: "30px" }}>
            <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
            <div className="status-pill pill-pendiente">ESTADO: PENDIENTE</div>
          </header>
          <div className="order-card-modern" style={{ padding: "30px", borderRadius: "20px" }}>
            <p style={{ fontSize: "4rem", margin: "0" }}>🕒</p>
            <h3 style={{ color: "#333", marginTop: "10px" }}>Perfil en Revisión</h3>
            <p style={{ color: "#666", lineHeight: "1.5" }}>
              Tu registro como repartidor aún no ha sido aprobado por el administrador de <b>Gazzella Express</b>.
              <br /><br />
              Te avisaremos una vez que puedas empezar a recibir pedidos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- LÓGICA DE SUSPENSIÓN (is_active = false) ---
  if (driverStatus === "suspendido" && !activeOrder) {
    return (
      <div className="app-container">
        <div className="client-dashboard" style={{ textAlign: "center", padding: "50px 20px" }}>
          <header style={{ marginBottom: "30px" }}>
            <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
            <div className="status-pill pill-pendiente" style={{backgroundColor: "#ff4d4d", color: "white"}}>ESTADO: SUSPENDIDO</div>
          </header>
          <div className="order-card-modern" style={{ padding: "30px", borderRadius: "20px", border: "2px solid #ff4d4d" }}>
            <p style={{ fontSize: "4rem", margin: "0" }}>🚫</p>
            <h3 style={{ color: "#333", marginTop: "10px" }}>Cuenta Suspendida</h3>
            <p style={{ color: "#666", lineHeight: "1.5" }}>
              Lo sentimos, tu cuenta de repartidor ha sido suspendida. 
              <br /><br />
              <b>No estás habilitado</b> en la plataforma para realizar nuevos servicios en este momento. Por favor, contacta a soporte para más información.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="client-dashboard">
        <header style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
          
          {/* Alerta si está culminando pedido pero ya está suspendido */}
          {driverStatus === "suspendido" && activeOrder && (
            <div style={{ backgroundColor: "#fff3cd", color: "#856404", padding: "10px", borderRadius: "10px", marginBottom: "15px", fontSize: "0.85rem", border: "1px solid #ffeeba" }}>
              ⚠️ Tu cuenta ha sido suspendida. Debes <b>culminar este servicio</b> antes de que el acceso sea restringido.
            </div>
          )}

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
          {driverStatus === "suspendido" ? "Cuenta Suspendida" : activeOrder ? "Orden en Proceso" : isAvailable ? "🔴 Desconectarse" : "🟢 Ponerse Disponible"}
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

// import React, { useState, useEffect, useRef } from "react";
// import { io } from "socket.io-client";
// import axios from "axios";
// import { useAuth } from "../../hooks/AuthContext";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const NOTIFICATION_SOUND_URL = "/sounds/new-order.mp3";

// // Mantenemos el socket fuera para que no se re-instancie innecesariamente
// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ["websocket", "polling"],
//   reconnection: true,
//   reconnectionAttempts: 5
// });

// function DeliveryDashboard() {
//   const { user, isAuthenticated, loading } = useAuth();
//   const [isAvailable, setIsAvailable] = useState(false);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [isLoadingStatus, setIsLoadingStatus] = useState(true);
//   const [driverStatus, setDriverStatus] = useState("not_registered");
//   const audioRef = useRef(null);

//   useEffect(() => {
//     audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
//   }, []);

//   // 1. CARGA Y PERSISTENCIA (Sincronización con la Realidad de la DB)
//   useEffect(() => {
//     if (loading || !isAuthenticated) return;

//     const fetchInitialData = async () => {
//       setIsLoadingStatus(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/driver/current-order`, { withCredentials: true });
//         const { active, order, isAvailableInDB, tiene_pedido, status } = response.data;
        
//         setDriverStatus(status || "not_registered");

//         // SI LA DB DICE QUE TIENE PEDIDO, NO IMPORTA NADA MÁS
//         if (active && order) {
//           const normalizedOrder = { 
//             ...order, 
//             pedido_id: order.pedido_id || order.id,
//             estado: order.estado 
//           };
//           setActiveOrder(normalizedOrder);
//           setIsAvailable(true); 
//         } else if (tiene_pedido === true) {
//           console.warn("⚠️ Repartidor con tiene_pedido=true pero sin objeto order. Reintentando...");
//           setTimeout(fetchInitialData, 2000);
//         } else {
//           setActiveOrder(null);
//           setIsAvailable(!!isAvailableInDB);
//         }
//       } catch (err) {
//         console.error("❌ Error de persistencia:", err);
//       } finally {
//         setIsLoadingStatus(false);
//       }
//     };

//     fetchInitialData();
//   }, [isAuthenticated, loading]);

//   // 2. SOCKETS: UNIÓN Y RE-CONEXIÓN
//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;

//     const onConnect = () => {
//       socket.emit("join_driver_room", user.id); 
//       console.log("✅ Socket conectado a sala driver_" + user.id);
//     };

//     const handleNewOrder = (data) => {
//       setActiveOrder((current) => {
//         if (current) return current;
//         return {
//           pedido_id: data.pedido_id,
//           monto: data.monto,
//           cliente_nombre: data.cliente_nombre,
//           recogida: data.recogida,
//           entrega: data.entrega,
//           estado: "asignado",
//         };
//       });
//       setIsAvailable(true);
//       audioRef.current?.play().catch(() => {});
//       document.title = "🔴 NUEVO PEDIDO";
//     };

//     socket.on("connect", onConnect);
//     socket.on("NUEVO_PEDIDO", handleNewOrder);
    
//     if (socket.connected) onConnect();

//     return () => {
//       socket.off("connect", onConnect);
//       socket.off("NUEVO_PEDIDO", handleNewOrder);
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   // 3. ACTUALIZACIÓN DE ESTADOS
//   const handleUpdateStatus = async (newStatus) => {
//     const pedidoId = activeOrder?.pedido_id;
//     if (!pedidoId) return;

//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/order-status`, 
//         { pedido_id: pedidoId, status: newStatus }, 
//         { withCredentials: true }
//       );

//       if (res.data.success) {
//         if (newStatus === "entregado") {
//           setActiveOrder(null);
//           setIsAvailable(true); 
//           document.title = "Gazzella Express";
//         } else {
//           setActiveOrder(prev => ({ ...prev, estado: newStatus }));
//         }
//       }
//     } catch (err) { 
//       console.error("❌ Error al actualizar estado:", err);
//       alert("Error al actualizar. Por favor revisa tu conexión.");
//     }
//   };

//   // 4. TOGGLE DISPONIBILIDAD
//   const toggleAvailability = async () => {
//     if (activeOrder || driverStatus !== "activo") return;
//     try {
//       const res = await axios.patch(`${API_BASE_URL}/driver/availability`, 
//         { available: !isAvailable }, 
//         { withCredentials: true }
//       );
//       if (res.data.success) {
//         setIsAvailable(res.data.isAvailable);
//         if (res.data.isAvailable) socket.emit("join_driver_room", user.id);
//       }
//     } catch (err) { console.error("Error disponibilidad:", err); }
//   };

//   if (loading || isLoadingStatus) {
//     return (
//       <div className="loading-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
//         <div className="spinner"></div>
//       </div>
//     );
//   }

//   // --- VISTA PARA CONDUCTOR NO REGISTRADO O PENDIENTE ---
//   if (driverStatus === "not_registered") {
//     return (
//       <div className="app-container">
//         <div className="client-dashboard" style={{ textAlign: "center", padding: "50px 20px" }}>
//           <header style={{ marginBottom: "30px" }}>
//             <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
//             <div className="status-pill pill-pendiente">ESTADO: PENDIENTE</div>
//           </header>
//           <div className="order-card-modern" style={{ padding: "30px", borderRadius: "20px" }}>
//             <p style={{ fontSize: "4rem", margin: "0" }}>🕒</p>
//             <h3 style={{ color: "#333", marginTop: "10px" }}>Perfil en Revisión</h3>
//             <p style={{ color: "#666", lineHeight: "1.5" }}>
//               Tu registro como repartidor aún no ha sido aprobado por el administrador de <b>Gazzella Express</b>.
//               <br /><br />
//               Te avisaremos una vez que puedas empezar a recibir pedidos.
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
//         <header style={{ textAlign: "center", marginBottom: "20px" }}>
//           <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
//           <div className={`status-pill ${activeOrder ? "pill-en-ruta" : isAvailable ? "pill-asignado" : "pill-pendiente"}`}>
//              {activeOrder ? (activeOrder.estado === "asignado" ? "PEDIDO ASIGNADO" : "EN RUTA") : isAvailable ? "ESPERANDO PEDIDO" : "FUERA DE LÍNEA"}
//           </div>
//         </header>

//         <button 
//           onClick={toggleAvailability} 
//           disabled={!!activeOrder || driverStatus !== "activo"} 
//           className={isAvailable ? "btn-danger" : "btn-primary"}
//           style={{ width: "100%", padding: "18px", borderRadius: "15px", fontWeight: "bold", marginBottom: "20px" }}
//         >
//           {activeOrder ? "Orden en Proceso" : isAvailable ? "🔴 Desconectarse" : "🟢 Ponerse Disponible"}
//         </button>

//         <main className="recent-orders">
//           {activeOrder ? (
//             <div className="order-card-modern" style={{ border: "2px solid #e67e22", background: "#fff", padding: "15px", borderRadius: "15px" }}>
//               <div className="order-card-header" style={{ marginBottom: "15px" }}>
//                 <span className="order-id-badge" style={{ background: "#eee", padding: "5px 10px", borderRadius: "5px" }}>
//                   PEDIDO #{activeOrder.pedido_id}
//                 </span>
//                 <span style={{ float: "right", color: "#e67e22", fontWeight: "bold" }}>
//                   {activeOrder.estado === "asignado" ? "Por recoger" : "En camino"}
//                 </span>
//               </div>
//               <div className="order-body" style={{ lineHeight: "1.6" }}>
//                 <p>📍 <b>Origen:</b> {activeOrder.recogida}</p>
//                 <p>🏁 <b>Destino:</b> {activeOrder.entrega}</p>
//                 <p>👤 <b>Cliente:</b> {activeOrder.cliente_nombre}</p>
//               </div>
//               <hr style={{ margin: "15px 0", opacity: "0.2" }} />
//               <div className="order-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//                 <div style={{ textAlign: "center" }}>
//                   <p style={{ fontSize: "1.8rem", color: "#2ecc71", margin: 0, fontWeight: "bold" }}>${activeOrder.monto}</p>
//                 </div>
                
//                 {activeOrder.estado === "asignado" ? (
//                   <button 
//                     onClick={() => handleUpdateStatus("en_camino")} 
//                     className="btn-primary" 
//                     style={{ background: "#28a745", padding: "15px", fontSize: "1.1rem" }}
//                   >
//                     Confirmar: Recogí el pedido
//                   </button>
//                 ) : (
//                   <button 
//                     onClick={() => handleUpdateStatus("entregado")} 
//                     className="btn-primary" 
//                     style={{ padding: "15px", background: "#007bff", fontSize: "1.1rem" }}
//                   >
//                     🏁 Marcar como Entregado
//                   </button>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className="empty-state-card" style={{ textAlign: "center", padding: "40px" }}>
//               <p style={{ fontSize: "3rem", margin: 0 }}>{isAvailable ? "📡" : "💤"}</p>
//               <h3>{isAvailable ? "Buscando pedidos..." : "Estás desconectado"}</h3>
//               <p style={{ color: "#888" }}>{isAvailable ? "Mantén la pantalla encendida" : "Ponte disponible para recibir entregas"}</p>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default DeliveryDashboard;


