import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../../hooks/AuthContext";
import DriverRatingModal from "../../components/RatingModalDelivery";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

function DeliveryDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isDriverApproved, setIsDriverApproved] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [clientRatingData, setClientRatingData] = useState(null);

  // --- INTEGRACIÓN DE AUDIO (Referencia persistente) ---
  const audioRef = useRef(new Audio("/sounds/new-order.mp3"));

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const fetchInitialData = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/driver/current-order`,
          { withCredentials: true }
        );

        const { active, order, isAvailableInDB, driverStatus } = response.data;

        if (driverStatus !== "activo") {
          setIsDriverApproved(false);
          setIsLoadingStatus(false);
          return;
        }

        setIsDriverApproved(true);

        if (active && order) {
          setActiveOrder({
            pedido_id: order.pedido_id,
            monto_usd: order.monto_usd,
            monto_bs: order.monto_bs,
            estado: order.estado,
            cliente_nombre: order.cliente_nombre,
            cliente_telefono: order.cliente_telefono,
            tipo_servicio: order.tipo_servicio,
            recogida: order.recogida,
            entrega: order.entrega,
          });
          setIsAvailable(true);
        } else {
          setActiveOrder(null);
          setIsAvailable(!!isAvailableInDB);
        }
      } catch (err) {
        console.error("❌ Error en carga inicial:", err);
        setIsDriverApproved(false);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!user?.id || !isDriverApproved) return;
    socket.emit("join_driver_room", user.id);

    socket.on("NUEVO_PEDIDO", (data) => {
      // --- REPRODUCCIÓN DE AUDIO ---
      audioRef.current.play().catch(e => console.log("Audio waiting for user interaction", e));
      
      // Vibración móvil
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      setActiveOrder({
        pedido_id: data.pedido_id || data.id,
        monto_usd: data.monto_usd || data.total_dolar,
        monto_bs: data.monto_bs || data.total,
        cliente_nombre: data.cliente_nombre || "Cliente Nuevo",
        cliente_telefono: data.cliente_telefono || "S/N",
        tipo_servicio: data.tipo_servicio || "SERVICIO",
        recogida: data.recogida || "Consultar",
        entrega: data.entrega || "Consultar",
        estado: "asignado",
      });
      setIsAvailable(true);
    });

    return () => socket.off("NUEVO_PEDIDO");
  }, [user?.id, isDriverApproved]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/driver/order-status`,
        { pedido_id: activeOrder.pedido_id, status: newStatus },
        { withCredentials: true }
      );

      if (res.data.success) {
        if (newStatus === "entregado") {
          try {
            const clientInfo = await axios.get(
              `${API_BASE_URL}/driver/client-info/${activeOrder.pedido_id}`,
              { withCredentials: true }
            );

            setClientRatingData({
              pedidoId: activeOrder.pedido_id,
              nombreCliente: clientInfo.data.cliente_nombre,
              clienteTelefono: clientInfo.data.cliente_telefono,
            });
            setShowRatingModal(true);
          } catch (error) {
            console.error("Error obteniendo info cliente:", error);
            setActiveOrder(null);
          }
        } else {
          setActiveOrder((prev) => ({ ...prev, estado: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async () => {
    // --- DESBLOQUEO DE AUDIO (Indispensable para navegadores) ---
    // Al hacer clic, el navegador ya permite que este objeto de audio suene después
    audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }).catch(e => console.log("Audio activation failed", e));

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/driver/availability`,
        { available: !isAvailable },
        { withCredentials: true }
      );
      if (res.data.success) setIsAvailable(res.data.isAvailable);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoadingStatus)
    return (
      <div style={{ padding: "50px", textAlign: "center", fontWeight: "700" }}>
        Validando credenciales...
      </div>
    );

  if (!isDriverApproved) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          maxWidth: "400px",
          margin: "auto",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⏳</div>
        <h2 style={{ color: "#1e293b", fontWeight: "800" }}>
          Cuenta en Revisión
        </h2>
        <p style={{ color: "#64748b", lineHeight: "1.6", marginTop: "15px" }}>
          Hola <b>{user?.nombre}</b>, tu perfil de conductor aún no ha sido
          activado por nuestro equipo.
        </p>
        <div
          style={{
            background: "#f1f5f9",
            padding: "15px",
            borderRadius: "12px",
            marginTop: "20px",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0 }}>
            Por favor, espera ser contactado por <b>Soporte Técnico</b> para
            completar tu activación en la aplicación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{ maxWidth: "480px", margin: "0 auto", padding: "15px" }}
    >
      <header style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontWeight: "800", color: "#1e293b" }}>
          🛵 {user?.nombre}
        </h2>
        <div
          style={{
            background: isAvailable ? "#dcfce7" : "#fee2e2",
            color: isAvailable ? "#166534" : "#991b1b",
            padding: "8px",
            borderRadius: "50px",
            fontSize: "0.75rem",
            fontWeight: "800",
          }}
        >
          {activeOrder
            ? "EN SERVICIO"
            : isAvailable
            ? "EN LÍNEA / DISPONIBLE"
            : "FUERA DE LÍNEA"}
        </div>
      </header>

      <button
        onClick={toggleAvailability}
        disabled={!!activeOrder}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "16px",
          fontWeight: "800",
          marginBottom: "20px",
          border: "none",
          background: isAvailable ? "#ef4444" : "#2563eb",
          color: "white",
          cursor: "pointer",
        }}
      >
        {isAvailable ? "🔴 Desconectarse" : "🟢 Ponerse Disponible"}
      </button>

      {activeOrder ? (
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            border: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                background: "#f1f5f9",
                padding: "5px 12px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "800",
              }}
            >
              #{activeOrder.pedido_id}
            </span>
            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "5px 12px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {activeOrder.tipo_servicio}
            </span>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ marginBottom: "12px" }}>
              <small
                style={{
                  color: "#64748b",
                  fontWeight: "700",
                  fontSize: "0.65rem",
                  display: "block",
                }}
              >
                RECOGER EN:
              </small>
              <b style={{ fontSize: "0.95rem" }}>{activeOrder.recogida}</b>
            </div>
            <div>
              <small
                style={{
                  color: "#64748b",
                  fontWeight: "700",
                  fontSize: "0.65rem",
                  display: "block",
                }}
              >
                ENTREGAR EN:
              </small>
              <b style={{ fontSize: "0.95rem" }}>{activeOrder.entrega}</b>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              background: "#f8fafc",
              padding: "12px",
              borderRadius: "16px",
              marginBottom: "20px",
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ flex: 1 }}>
              <small
                style={{
                  color: "#64748b",
                  fontSize: "0.6rem",
                  fontWeight: "700",
                }}
              >
                CLIENTE
              </small>
              <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                {activeOrder.cliente_nombre}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <small
                style={{
                  color: "#64748b",
                  fontSize: "0.6rem",
                  fontWeight: "700",
                }}
              >
                TELÉFONO
              </small>
              <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                {activeOrder.cliente_telefono}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "25px",
              padding: "0 10px",
            }}
          >
            <div>
              <small
                style={{
                  color: "#64748b",
                  fontWeight: "700",
                  fontSize: "0.65rem",
                  display: "block",
                }}
              >
                PAGO USD
              </small>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "#1e293b",
                }}
              >
                ${Number(activeOrder.monto_usd).toFixed(2)}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <small
                style={{
                  color: "#64748b",
                  fontWeight: "700",
                  fontSize: "0.65rem",
                  display: "block",
                }}
              >
                PAGO BS
              </small>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "900",
                  color: "#10b981",
                }}
              >
                Bs. {Number(activeOrder.monto_bs).toFixed(2)}
              </span>
            </div>
          </div>

          {activeOrder.estado === "asignado" ? (
            <button
              onClick={() => handleUpdateStatus("en_camino")}
              style={{
                width: "100%",
                background: "#0f172a",
                color: "white",
                padding: "18px",
                borderRadius: "18px",
                fontWeight: "800",
                border: "none",
                cursor: "pointer",
              }}
            >
              Confirmar Recogida
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus("entregado")}
              style={{
                width: "100%",
                background: "#10b981",
                color: "white",
                padding: "18px",
                borderRadius: "18px",
                fontWeight: "800",
                border: "none",
                cursor: "pointer",
              }}
            >
              🏁 Finalizar Entrega
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "white",
            borderRadius: "24px",
            color: "#94a3b8",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "10px" }}>
            {isAvailable ? "📡" : "😴"}
          </div>
          <p style={{ fontWeight: "700" }}>
            {isAvailable ? "Buscando pedidos..." : "Estás fuera de línea"}
          </p>
        </div>
      )}

      {showRatingModal && clientRatingData && (
        <DriverRatingModal
          pedidoId={clientRatingData.pedidoId}
          nombreCliente={clientRatingData.nombreCliente}
          clienteTelefono={clientRatingData.clienteTelefono}
          onCalificado={() => {
            setShowRatingModal(false);
            setClientRatingData(null);
            setActiveOrder(null);
          }}
        />
      )}
    </div>
  );
}

export default DeliveryDashboard;

// import React, { useState, useEffect } from "react";
// import { io } from "socket.io-client";
// import axios from "axios";
// import { useAuth } from "../../hooks/AuthContext";
// import DriverRatingModal from "../../components/RatingModalDelivery"; // 👈 IMPORTAR EL MODAL

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ["websocket", "polling"],
// });

// function DeliveryDashboard() {
//   const { user, isAuthenticated, loading } = useAuth();
//   const [isAvailable, setIsAvailable] = useState(false);
//   const [activeOrder, setActiveOrder] = useState(null);
//   const [isLoadingStatus, setIsLoadingStatus] = useState(true);
//   const [isDriverApproved, setIsDriverApproved] = useState(false);

//   // 👈 NUEVOS ESTADOS PARA EL MODAL
//   const [showRatingModal, setShowRatingModal] = useState(false);
//   const [clientRatingData, setClientRatingData] = useState(null);

//   useEffect(() => {
//     if (loading || !isAuthenticated) return;

//     const fetchInitialData = async () => {
//       setIsLoadingStatus(true);
//       try {
//         const response = await axios.get(
//           `${API_BASE_URL}/driver/current-order`,
//           { withCredentials: true }
//         );

//         const { active, order, isAvailableInDB, driverStatus } = response.data;

//         if (driverStatus !== "activo") {
//           setIsDriverApproved(false);
//           setIsLoadingStatus(false);
//           return;
//         }

//         setIsDriverApproved(true);

//         if (active && order) {
//           setActiveOrder({
//             pedido_id: order.pedido_id,
//             monto_usd: order.monto_usd,
//             monto_bs: order.monto_bs,
//             estado: order.estado,
//             cliente_nombre: order.cliente_nombre,
//             cliente_telefono: order.cliente_telefono,
//             tipo_servicio: order.tipo_servicio,
//             recogida: order.recogida,
//             entrega: order.entrega,
//           });
//           setIsAvailable(true);
//         } else {
//           setActiveOrder(null);
//           setIsAvailable(!!isAvailableInDB);
//         }
//       } catch (err) {
//         console.error("❌ Error en carga inicial:", err);
//         setIsDriverApproved(false);
//       } finally {
//         setIsLoadingStatus(false);
//       }
//     };

//     fetchInitialData();
//   }, [isAuthenticated, loading]);

//   useEffect(() => {
//     if (!user?.id || !isDriverApproved) return;
//     socket.emit("join_driver_room", user.id);

//     socket.on("NUEVO_PEDIDO", (data) => {
//       setActiveOrder({
//         pedido_id: data.pedido_id || data.id,
//         monto_usd: data.monto_usd || data.total_dolar,
//         monto_bs: data.monto_bs || data.total,
//         cliente_nombre: data.cliente_nombre || "Cliente Nuevo",
//         cliente_telefono: data.cliente_telefono || "S/N",
//         tipo_servicio: data.tipo_servicio || "SERVICIO",
//         recogida: data.recogida || "Consultar",
//         entrega: data.entrega || "Consultar",
//         estado: "asignado",
//       });
//       setIsAvailable(true);
//     });

//     return () => socket.off("NUEVO_PEDIDO");
//   }, [user?.id, isDriverApproved]);

//   // 👈 FUNCIÓN MODIFICADA PARA MOSTRAR MODAL AL FINALIZAR
//   const handleUpdateStatus = async (newStatus) => {
//     try {
//       const res = await axios.patch(
//         `${API_BASE_URL}/driver/order-status`,
//         { pedido_id: activeOrder.pedido_id, status: newStatus },
//         { withCredentials: true }
//       );

//       if (res.data.success) {
//         if (newStatus === "entregado") {
//           // 👈 OBTENER INFO DEL CLIENTE Y MOSTRAR MODAL
//           try {
//             const clientInfo = await axios.get(
//               `${API_BASE_URL}/driver/client-info/${activeOrder.pedido_id}`,
//               { withCredentials: true }
//             );

//             setClientRatingData({
//               pedidoId: activeOrder.pedido_id,
//               nombreCliente: clientInfo.data.cliente_nombre,
//               clienteTelefono: clientInfo.data.cliente_telefono,
//             });
//             setShowRatingModal(true);
//           } catch (error) {
//             console.error("Error obteniendo info cliente:", error);
//             setActiveOrder(null);
//           }
//         } else {
//           setActiveOrder((prev) => ({ ...prev, estado: newStatus }));
//         }
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const toggleAvailability = async () => {
//     try {
//       const res = await axios.patch(
//         `${API_BASE_URL}/driver/availability`,
//         { available: !isAvailable },
//         { withCredentials: true }
//       );
//       if (res.data.success) setIsAvailable(res.data.isAvailable);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   if (isLoadingStatus)
//     return (
//       <div style={{ padding: "50px", textAlign: "center", fontWeight: "700" }}>
//         Validando credenciales...
//       </div>
//     );

//   if (!isDriverApproved) {
//     return (
//       <div
//         style={{
//           padding: "40px 20px",
//           textAlign: "center",
//           maxWidth: "400px",
//           margin: "auto",
//         }}
//       >
//         <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⏳</div>
//         <h2 style={{ color: "#1e293b", fontWeight: "800" }}>
//           Cuenta en Revisión
//         </h2>
//         <p style={{ color: "#64748b", lineHeight: "1.6", marginTop: "15px" }}>
//           Hola <b>{user?.nombre}</b>, tu perfil de conductor aún no ha sido
//           activado por nuestro equipo.
//         </p>
//         <div
//           style={{
//             background: "#f1f5f9",
//             padding: "15px",
//             borderRadius: "12px",
//             marginTop: "20px",
//           }}
//         >
//           <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0 }}>
//             Por favor, espera ser contactado por <b>Soporte Técnico</b> para
//             completar tu activación en la aplicación.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="app-container"
//       style={{ maxWidth: "480px", margin: "0 auto", padding: "15px" }}
//     >
//       <header style={{ textAlign: "center", marginBottom: "20px" }}>
//         <h2 style={{ fontWeight: "800", color: "#1e293b" }}>
//           🛵 {user?.nombre}
//         </h2>
//         <div
//           style={{
//             background: isAvailable ? "#dcfce7" : "#fee2e2",
//             color: isAvailable ? "#166534" : "#991b1b",
//             padding: "8px",
//             borderRadius: "50px",
//             fontSize: "0.75rem",
//             fontWeight: "800",
//           }}
//         >
//           {activeOrder
//             ? "EN SERVICIO"
//             : isAvailable
//             ? "EN LÍNEA / DISPONIBLE"
//             : "FUERA DE LÍNEA"}
//         </div>
//       </header>

//       <button
//         onClick={toggleAvailability}
//         disabled={!!activeOrder}
//         style={{
//           width: "100%",
//           padding: "16px",
//           borderRadius: "16px",
//           fontWeight: "800",
//           marginBottom: "20px",
//           border: "none",
//           background: isAvailable ? "#ef4444" : "#2563eb",
//           color: "white",
//           cursor: "pointer",
//         }}
//       >
//         {isAvailable ? "🔴 Desconectarse" : "🟢 Ponerse Disponible"}
//       </button>

//       {activeOrder ? (
//         <div
//           style={{
//             background: "white",
//             padding: "25px",
//             borderRadius: "24px",
//             boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
//             border: "1px solid #f1f5f9",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "20px",
//             }}
//           >
//             <span
//               style={{
//                 background: "#f1f5f9",
//                 padding: "5px 12px",
//                 borderRadius: "8px",
//                 fontSize: "0.75rem",
//                 fontWeight: "800",
//               }}
//             >
//               #{activeOrder.pedido_id}
//             </span>
//             <span
//               style={{
//                 background: "#eff6ff",
//                 color: "#2563eb",
//                 padding: "5px 12px",
//                 borderRadius: "8px",
//                 fontSize: "0.75rem",
//                 fontWeight: "800",
//                 textTransform: "uppercase",
//               }}
//             >
//               {activeOrder.tipo_servicio}
//             </span>
//           </div>

//           <div style={{ marginBottom: "20px" }}>
//             <div style={{ marginBottom: "12px" }}>
//               <small
//                 style={{
//                   color: "#64748b",
//                   fontWeight: "700",
//                   fontSize: "0.65rem",
//                   display: "block",
//                 }}
//               >
//                 RECOGER EN:
//               </small>
//               <b style={{ fontSize: "0.95rem" }}>{activeOrder.recogida}</b>
//             </div>
//             <div>
//               <small
//                 style={{
//                   color: "#64748b",
//                   fontWeight: "700",
//                   fontSize: "0.65rem",
//                   display: "block",
//                 }}
//               >
//                 ENTREGAR EN:
//               </small>
//               <b style={{ fontSize: "0.95rem" }}>{activeOrder.entrega}</b>
//             </div>
//           </div>

//           <div
//             style={{
//               display: "flex",
//               background: "#f8fafc",
//               padding: "12px",
//               borderRadius: "16px",
//               marginBottom: "20px",
//               border: "1px solid #f1f5f9",
//             }}
//           >
//             <div style={{ flex: 1 }}>
//               <small
//                 style={{
//                   color: "#64748b",
//                   fontSize: "0.6rem",
//                   fontWeight: "700",
//                 }}
//               >
//                 CLIENTE
//               </small>
//               <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>
//                 {activeOrder.cliente_nombre}
//               </div>
//             </div>
//             <div style={{ flex: 1, textAlign: "right" }}>
//               <small
//                 style={{
//                   color: "#64748b",
//                   fontSize: "0.6rem",
//                   fontWeight: "700",
//                 }}
//               >
//                 TELÉFONO
//               </small>
//               <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>
//                 {activeOrder.cliente_telefono}
//               </div>
//             </div>
//           </div>

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "25px",
//               padding: "0 10px",
//             }}
//           >
//             <div>
//               <small
//                 style={{
//                   color: "#64748b",
//                   fontWeight: "700",
//                   fontSize: "0.65rem",
//                   display: "block",
//                 }}
//               >
//                 PAGO USD
//               </small>
//               <span
//                 style={{
//                   fontSize: "1.5rem",
//                   fontWeight: "900",
//                   color: "#1e293b",
//                 }}
//               >
//                 ${Number(activeOrder.monto_usd).toFixed(2)}
//               </span>
//             </div>
//             <div style={{ textAlign: "right" }}>
//               <small
//                 style={{
//                   color: "#64748b",
//                   fontWeight: "700",
//                   fontSize: "0.65rem",
//                   display: "block",
//                 }}
//               >
//                 PAGO BS
//               </small>
//               <span
//                 style={{
//                   fontSize: "1.5rem",
//                   fontWeight: "900",
//                   color: "#10b981",
//                 }}
//               >
//                 Bs. {Number(activeOrder.monto_bs).toFixed(2)}
//               </span>
//             </div>
//           </div>

//           {activeOrder.estado === "asignado" ? (
//             <button
//               onClick={() => handleUpdateStatus("en_camino")}
//               style={{
//                 width: "100%",
//                 background: "#0f172a",
//                 color: "white",
//                 padding: "18px",
//                 borderRadius: "18px",
//                 fontWeight: "800",
//                 border: "none",
//                 cursor: "pointer",
//               }}
//             >
//               Confirmar Recogida
//             </button>
//           ) : (
//             <button
//               onClick={() => handleUpdateStatus("entregado")}
//               style={{
//                 width: "100%",
//                 background: "#10b981",
//                 color: "white",
//                 padding: "18px",
//                 borderRadius: "18px",
//                 fontWeight: "800",
//                 border: "none",
//                 cursor: "pointer",
//               }}
//             >
//               🏁 Finalizar Entrega
//             </button>
//           )}
//         </div>
//       ) : (
//         <div
//           style={{
//             textAlign: "center",
//             padding: "50px 20px",
//             background: "white",
//             borderRadius: "24px",
//             color: "#94a3b8",
//           }}
//         >
//           <div style={{ fontSize: "3rem", marginBottom: "10px" }}>
//             {isAvailable ? "📡" : "😴"}
//           </div>
//           <p style={{ fontWeight: "700" }}>
//             {isAvailable ? "Buscando pedidos..." : "Estás fuera de línea"}
//           </p>
//         </div>
//       )}

//       {/* 👈 MODAL DE CALIFICACIÓN DEL CONDUCTOR → CLIENTE */}
//       {showRatingModal && clientRatingData && (
//         <DriverRatingModal
//           pedidoId={clientRatingData.pedidoId}
//           nombreCliente={clientRatingData.nombreCliente}
//           clienteTelefono={clientRatingData.clienteTelefono}
//           onCalificado={() => {
//             setShowRatingModal(false);
//             setClientRatingData(null);
//             setActiveOrder(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// export default DeliveryDashboard;

//           setActiveOrder(normalizedOrder);
//           setIsAvailable(true);
//         } else if (tiene_pedido === true) {
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

//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;

//     const onConnect = () => {
//       socket.emit("join_driver_room", user.id);
//     };

//     const handleNewOrder = (data) => {
//       // Bloquear nuevos pedidos si el estatus no es activo
//       if (driverStatus !== "activo") return;

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
//   }, [loading, isAuthenticated, user?.id, driverStatus]);

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
//           setIsAvailable(driverStatus === "activo"); // Si está suspendido, ya no queda disponible
//           document.title = "Gazzella Express";
//         } else {
//           setActiveOrder(prev => ({ ...prev, estado: newStatus }));
//         }
//       }
//     } catch (err) {
//       console.error("❌ Error al actualizar estado:", err);
//     }
//   };

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

//   // VISTA PARA CONDUCTOR NO REGISTRADO O PENDIENTE
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

//   // --- LÓGICA DE SUSPENSIÓN (is_active = false) ---
//   if (driverStatus === "suspendido" && !activeOrder) {
//     return (
//       <div className="app-container">
//         <div className="client-dashboard" style={{ textAlign: "center", padding: "50px 20px" }}>
//           <header style={{ marginBottom: "30px" }}>
//             <h2 style={{ fontWeight: "800" }}>🛵 Panel: {user?.nombre}</h2>
//             <div className="status-pill pill-pendiente" style={{backgroundColor: "#ff4d4d", color: "white"}}>ESTADO: SUSPENDIDO</div>
//           </header>
//           <div className="order-card-modern" style={{ padding: "30px", borderRadius: "20px", border: "2px solid #ff4d4d" }}>
//             <p style={{ fontSize: "4rem", margin: "0" }}>🚫</p>
//             <h3 style={{ color: "#333", marginTop: "10px" }}>Cuenta Suspendida</h3>
//             <p style={{ color: "#666", lineHeight: "1.5" }}>
//               Lo sentimos, tu cuenta de repartidor ha sido suspendida.
//               <br /><br />
//               <b>No estás habilitado</b> en la plataforma para realizar nuevos servicios en este momento. Por favor, contacta a soporte para más información.
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

//           {/* Alerta si está culminando pedido pero ya está suspendido */}
//           {driverStatus === "suspendido" && activeOrder && (
//             <div style={{ backgroundColor: "#fff3cd", color: "#856404", padding: "10px", borderRadius: "10px", marginBottom: "15px", fontSize: "0.85rem", border: "1px solid #ffeeba" }}>
//               ⚠️ Tu cuenta ha sido suspendida. Debes <b>culminar este servicio</b> antes de que el acceso sea restringido.
//             </div>
//           )}

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
//           {driverStatus === "suspendido" ? "Cuenta Suspendida" : activeOrder ? "Orden en Proceso" : isAvailable ? "🔴 Desconectarse" : "🟢 Ponerse Disponible"}
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
