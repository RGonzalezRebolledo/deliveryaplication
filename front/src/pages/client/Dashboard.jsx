import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../../hooks/AuthContext";
import RatingModal from "../../components/RatingModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: true,
});

function ClientDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [pedidoPorCalificar, setPedidoPorCalificar] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [loadingDriver, setLoadingDriver] = useState(false);

  const handleOpenRating = async (order) => {
    try {
      const driverRes = await axios.get(
        `${API_BASE_URL}/client/order-driver/${order.id}`,
        { withCredentials: true }
      );
      setPedidoPorCalificar({
        id: order.id,
        nombre_conductor: driverRes.data.nombre || "tu repartidor",
      });
    } catch (err) {
      console.error("Error al obtener datos para calificar:", err);
      setPedidoPorCalificar({
        id: order.id,
        nombre_conductor: "tu repartidor",
      });
    }
  };

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.id) return;
    socket.emit("join_client_room", user.id);
    const handleStatusUpdate = (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === parseInt(data.pedido_id)
            ? { ...order, status: data.nuevo_estado }
            : order
        )
      );
    };
    socket.on("ORDEN_ACTUALIZADA", handleStatusUpdate);
    return () => socket.off("ORDEN_ACTUALIZADA");
  }, [loading, isAuthenticated, user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/client/orders`, {
          withCredentials: true,
        });
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, loading, navigate]);

  const handleOpenDetails = async (pedidoId, status) => {
    if (status === "pendiente") {
      alert("Aún estamos buscando un repartidor para tu pedido.");
      return;
    }
    setLoadingDriver(true);
    setShowModal(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/client/order-driver/${pedidoId}`,
        { withCredentials: true }
      );
      const driverData = res.data;
      const ratingRes = await axios.get(
        `${API_BASE_URL}/driver/rating/${driverData.usuario_id}`,
        { withCredentials: true }
      );
      setDriverInfo({
        ...driverData,
        reputacion: ratingRes.data.promedio,
        totalReseñas: ratingRes.data.total,
      });
    } catch (err) {
      console.error("Error al obtener conductor:", err);
      setDriverInfo(null);
    } finally {
      setLoadingDriver(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search = searchTerm.toLowerCase();
      return (
        order.id.toString().includes(search) ||
        order.status?.toLowerCase().includes(search)
      );
    });
  }, [orders, searchTerm]);

  const getStepLevel = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("pendiente")) return 1;
    if (s.includes("asignado")) return 2;
    if (s.includes("camino")) return 3;
    if (s.includes("entregado")) return 4;
    return 0;
  };

  return (
    <div className="app-container">
      {/* MODAL DE CALIFICACIÓN: Se eliminó el botón duplicado de aquí ya que RatingModal ya lo incluye internamente */}
      {pedidoPorCalificar && (
        <RatingModal
          pedidoId={pedidoPorCalificar.id}
          nombreConductor={pedidoPorCalificar.nombre_conductor}
          onCalificado={() => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === pedidoPorCalificar.id
                  ? { ...o, status: "finalizado" }
                  : o
              )
            );
            setPedidoPorCalificar(null);
          }}
          onClose={() => setPedidoPorCalificar(null)}
        />
      )}

      <div className="client-dashboard">
        <header style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontWeight: "800" }}>👋 ¡Hola, {user?.nombre}!</h2>
          <button
            onClick={() => navigate("/client/new-order")}
            className="btn-primary"
            style={{ width: "100%", marginTop: "15px" }}
          >
            🚀 Nuevo Servicio
          </button>
        </header>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="orders-grid">
          {filteredOrders.length === 0 && !isLoadingOrders ? (
            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                marginTop: "20px",
              }}
            >
              No tienes pedidos registrados.
            </p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="order-card-modern">
                <div
                  className="order-card-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="order-id-badge">PEDIDO #{order.id}</span>
                  <span
                    className={`status-pill pill-${order.status?.replace(
                      "_",
                      "-"
                    )}`}
                  >
                    {order.status?.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div style={{ padding: "20px 10px 10px 10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      position: "relative",
                      marginBottom: "8px",
                    }}
                  >
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          background:
                            getStepLevel(order.status) >= step
                              ? "#007bff"
                              : "#cbd5e1",
                          zIndex: 2,
                        }}
                      />
                    ))}
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: 0,
                        width: "100%",
                        height: "2px",
                        background: "#e2e8f0",
                        zIndex: 1,
                      }}
                    />
                  </div>
                </div>

                <div className="order-body" style={{ padding: "10px 15px" }}>
                  <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>
                    📍 <b>Origen:</b> {order.address_origin}
                  </p>
                  <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>
                    🏁 <b>Destino:</b> {order.address_dest}
                  </p>
                </div>

                <div
                  className="order-footer"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      marginBottom: "1px",
                      padding: "1px",
                    }}
                  >
                    <button
                      onClick={() => handleOpenDetails(order.id, order.status)}
                      className="btn-primary"
                      style={{
                        flex: "0 0 auto",
                        width: "fit-content",
                        fontSize: "0.85rem",
                        padding: "8px 14px",
                        borderRadius: "5px",
                      }}
                    >
                      Ver Conductor
                    </button>
                    <div
                      className="price-tag"
                      style={{ minWidth: "70px", textAlign: "right" }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#000",
                          fontWeight: "bold",
                        }}
                      >
                        ${order.total_usd}
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#000",
                          fontWeight: "500",
                          display: "block",
                        }}
                      >
                        Bs {order.total}
                      </span>
                    </div>
                  </div>
                  {order.status === "entregado" && (
                    <button
                      onClick={() => handleOpenRating(order)}
                      className="btn-success"
                      style={{
                        flex: "1 1 100%",
                        borderColor: "#f59e0b",
                        color: "#b45309",
                        padding: " 4px 2px ",
                        borderRadius: "5px",
                      }}
                    >
                      ⭐ Calificar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "15px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "30px",
                width: "100%",
                maxWidth: "360px",
                padding: "45px 25px 30px 25px",
                position: "relative",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  border: "none",
                  background: "#f1f5f9",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &times;
              </button>
              <div style={{ textAlign: "center" }}>
                {!loadingDriver && driverInfo && (
                  <div
                    style={{
                      display: "inline-block",
                      background:
                        "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                      color: "#fff",
                      padding: "6px 20px",
                      borderRadius: "50px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      marginBottom: "20px",
                      textTransform: "uppercase",
                    }}
                  >
                    conductor nro: #{driverInfo.usuario_id}
                  </div>
                )}
                {loadingDriver ? (
                  <div style={{ padding: "40px 0" }}>
                    <div className="spinner" style={{ margin: "0 auto" }}></div>
                    <p style={{ marginTop: "15px" }}>Cargando información...</p>
                  </div>
                ) : driverInfo ? (
                  <>
                    <div style={{ marginBottom: "15px" }}>
                      <img
                        src={
                          driverInfo.foto || "https://via.placeholder.com/120"
                        }
                        alt="Conductor"
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "5px solid #f8fafc",
                          boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
                        }}
                      />
                    </div>
                    <h4
                      style={{
                        margin: "0",
                        fontSize: "1.5rem",
                        color: "#0f172a",
                        fontWeight: "800",
                      }}
                    >
                      {driverInfo.nombre}
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        margin: "5px 0",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem", color: "#f59e0b" }}>
                        {"★".repeat(Math.floor(driverInfo.reputacion || 0))}
                        {"☆".repeat(5 - Math.floor(driverInfo.reputacion || 0))}
                      </span>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          color: "#64748b",
                        }}
                      >
                        ({driverInfo.reputacion || "0.0"})
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "#94a3b8",
                        marginTop: "-5px",
                        marginBottom: "10px",
                      }}
                    >
                      {driverInfo.totalReseñas || 0} viajes calificados
                    </p>
                    <p
                      style={{
                        color: "#0ea5e9",
                        fontWeight: "700",
                        fontSize: "1.1rem",
                        margin: "0 0 25px 0",
                      }}
                    >
                      📞 {driverInfo.telefono}
                    </p>
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: "20px",
                        padding: "15px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "20px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.65rem",
                          color: "#94a3b8",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                        }}
                      >
                        Vehículo Autorizado
                      </p>
                      <img
                        src={
                          driverInfo.foto_vehiculo ||
                          "https://via.placeholder.com/300x150"
                        }
                        alt="Vehículo"
                        style={{
                          width: "100%",
                          borderRadius: "15px",
                          height: "160px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      padding: "20px",
                      color: "#ef4444",
                      fontWeight: "600",
                    }}
                  >
                    No se pudo cargar la información.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientDashboard;

// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
// import axios from "axios";
// import { useAuth } from "../../hooks/AuthContext";
// import RatingModal from "../../components/RatingModal";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ["websocket"],
//   autoConnect: true,
// });

// function ClientDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoadingOrders, setIsLoadingOrders] = useState(true);

//   // --- ESTADO PARA CALIFICACIÓN ---
//   const [pedidoPorCalificar, setPedidoPorCalificar] = useState(null);

//   // Estados para el Modal del Conductor
//   const [showModal, setShowModal] = useState(false);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [loadingDriver, setLoadingDriver] = useState(false);

//   // --- FUNCIÓN PARA ABRIR CALIFICACIÓN MANUALMENTE ---
//   const handleOpenRating = async (order) => {
//     try {
//       // Obtenemos el nombre del conductor antes de abrir el modal
//       const driverRes = await axios.get(
//         `${API_BASE_URL}/client/order-driver/${order.id}`,
//         {
//           withCredentials: true,
//         }
//       );

//       setPedidoPorCalificar({
//         id: order.id,
//         nombre_conductor: driverRes.data.nombre || "tu repartidor",
//       });
//     } catch (err) {
//       console.error("Error al obtener datos para calificar:", err);
//       // Abrimos con nombre genérico si falla la carga del nombre
//       setPedidoPorCalificar({
//         id: order.id,
//         nombre_conductor: "tu repartidor",
//       });
//     }
//   };

//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;

//     // NOTA: Se eliminó verificarCalificacionesPendientes() de aquí para que no sea automático
//     socket.emit("join_client_room", user.id);

//     const handleStatusUpdate = (data) => {
//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === parseInt(data.pedido_id)
//             ? { ...order, status: data.nuevo_estado }
//             : order
//         )
//       );
//     };

//     socket.on("ORDEN_ACTUALIZADA", handleStatusUpdate);
//     return () => {
//       socket.off("ORDEN_ACTUALIZADA");
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   useEffect(() => {
//     if (loading) return;
//     if (!isAuthenticated) {
//       navigate("/");
//       return;
//     }

//     const fetchOrders = async () => {
//       setIsLoadingOrders(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/client/orders`, {
//           withCredentials: true,
//         });
//         setOrders(Array.isArray(response.data) ? response.data : []);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setIsLoadingOrders(false);
//       }
//     };
//     fetchOrders();
//   }, [isAuthenticated, loading, navigate]);

//   const handleOpenDetails = async (pedidoId, status) => {
//     if (status === "pendiente") {
//       alert("Aún estamos buscando un repartidor para tu pedido.");
//       return;
//     }

//     setLoadingDriver(true);
//     setShowModal(true);
//     try {
//       const res = await axios.get(
//         `${API_BASE_URL}/client/order-driver/${pedidoId}`,
//         {
//           withCredentials: true,
//         }
//       );
//       const driverData = res.data;

//       const ratingRes = await axios.get(
//         `${API_BASE_URL}/driver/rating/${driverData.usuario_id}`,
//         {
//           withCredentials: true,
//         }
//       );

//       setDriverInfo({
//         ...driverData,
//         reputacion: ratingRes.data.promedio,
//         totalReseñas: ratingRes.data.total,
//       });
//     } catch (err) {
//       console.error("Error al obtener conductor:", err);
//       setDriverInfo(null);
//     } finally {
//       setLoadingDriver(false);
//     }
//   };

//   const filteredOrders = useMemo(() => {
//     return orders.filter((order) => {
//       const search = searchTerm.toLowerCase();
//       return (
//         order.id.toString().includes(search) ||
//         order.status?.toLowerCase().includes(search)
//       );
//     });
//   }, [orders, searchTerm]);

//   const getStepLevel = (status) => {
//     const s = status?.toLowerCase() || "";
//     if (s.includes("pendiente")) return 1;
//     if (s.includes("asignado")) return 2;
//     if (s.includes("camino")) return 3;
//     if (s.includes("entregado")) return 4;
//     return 0;
//   };

//   const stepsLabels = ["Pendiente", "Asignado", "En Camino", "Entregado"];

//   return (
//     <div className="app-container">
//       {/* El modal solo aparece cuando pedidoPorCalificar no es null */}
//       {pedidoPorCalificar && (
//         <RatingModal
//           pedidoId={pedidoPorCalificar.id}
//           nombreConductor={pedidoPorCalificar.nombre_conductor}
//           onCalificado={() => {
//             setPedidoPorCalificar(null);
//             // Opcional: refrescar órdenes para actualizar UI si el backend marca que ya se calificó
//           }}
//           onClose={() => setPedidoPorCalificar(null)} // Asegúrate que tu RatingModal acepte esta prop para cerrar
//         />
//       )}

//       <div className="client-dashboard">
//         <header style={{ textAlign: "center", marginBottom: "20px" }}>
//           <h2 style={{ fontWeight: "800" }}>👋 ¡Hola, {user?.nombre}!</h2>
//           <button
//             onClick={() => navigate("/client/new-order")}
//             className="btn-primary"
//             style={{ width: "100%", marginTop: "15px" }}
//           >
//             🚀 Nuevo Servicio
//           </button>
//         </header>

//         <div className="search-container">
//           <input
//             type="text"
//             className="search-input"
//             placeholder="Buscar pedido..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="orders-grid">
//           {filteredOrders.length === 0 && !isLoadingOrders ? (
//             <p
//               style={{
//                 textAlign: "center",
//                 color: "#64748b",
//                 marginTop: "20px",
//               }}
//             >
//               No tienes pedidos registrados.
//             </p>
//           ) : (
//             filteredOrders.map((order) => (
//               <div key={order.id} className="order-card-modern">
//                 <div
//                   className="order-card-header"
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                   }}
//                 >
//                   <span className="order-id-badge">PEDIDO #{order.id}</span>
//                   <span
//                     className={`status-pill pill-${order.status?.replace(
//                       "_",
//                       "-"
//                     )}`}
//                   >
//                     {order.status?.replace("_", " ").toUpperCase()}
//                   </span>
//                 </div>

//                 {/* ... (Sección de Stepper igual) ... */}
//                 <div style={{ padding: "20px 10px 10px 10px" }}>
//                   {/* ... (Contenido del stepper simplificado por espacio) ... */}
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       position: "relative",
//                       marginBottom: "8px",
//                     }}
//                   >
//                     {[1, 2, 3, 4].map((step) => (
//                       <div
//                         key={step}
//                         style={{
//                           width: "14px",
//                           height: "14px",
//                           borderRadius: "50%",
//                           background:
//                             getStepLevel(order.status) >= step
//                               ? "#007bff"
//                               : "#cbd5e1",
//                           zIndex: 2,
//                         }}
//                       />
//                     ))}
//                     <div
//                       style={{
//                         position: "absolute",
//                         top: "6px",
//                         left: 0,
//                         width: "100%",
//                         height: "2px",
//                         background: "#e2e8f0",
//                         zIndex: 1,
//                       }}
//                     />
//                   </div>
//                 </div>

//                 <div className="order-body" style={{ padding: "10px 15px" }}>
//                   <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>
//                     📍 <b>Origen:</b> {order.address_origin}
//                   </p>
//                   <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>
//                     🏁 <b>Destino:</b> {order.address_dest}
//                   </p>
//                 </div>

//                 <div
//                   className="order-footer"
//                   style={{ display: "flex", gap: "10px", alignItems: "center" }}
//                 >
//                   <button
//                     onClick={() => handleOpenDetails(order.id, order.status)}
//                     className="btn-primary"
//                     style={{
//                       flex: "0 0 auto" /* CLAVE: No crece, no se encoge, tamaño basado en contenido */,
//                       width: "fit-content" /* Se ajusta al ancho del texto */,
//                       fontSize: "0.70rem",
//                       padding: "8px 8px" /* Padding mínimo controlado */,
//                       display: "inline-flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       lineHeight: "1",
//                       minWidth:
//                         "0px" /* Por si btn-primary tiene un ancho mínimo */,
//                     }}
//                   >
//                     Ver Conductor
//                   </button>

//                   <div
//                     className="price-tag"
//                     style={{ minWidth: "70px", textAlign: "right" }}
//                   >
//                     <span
//                       className="amount-usd"
//                       style={{
//                         display: "block",
//                         color: "#000",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       ${order.total_usd}
//                     </span>
//                     <span
//                       className="amount-bs"
//                       style={{
//                         fontSize: "0.85rem",
//                         color: "#000",
//                         fontWeight: "500",
//                         display: "block",
//                       }}
//                     >
//                       Bs {order.total}
//                     </span>
//                   </div>
//                                     {/* NUEVO BOTÓN: Solo aparece si el pedido está entregado */}
//                                     {order.status === "entregado" && (
//                     <button
//                       onClick={() => handleOpenRating(order)}
//                       className="btn-success"
//                       style={{
//                         flex: 1,
//                         borderColor: "#f59e0b",
//                         color: "#b45309",
//                       }}
//                     >
//                       ⭐ Calificar
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* ... (Modal de información del conductor igual) ... */}
//         {showModal && (
//           <div
//             style={{
//               position: "fixed",
//               top: 0,
//               left: 0,
//               width: "100%",
//               height: "100%",
//               backgroundColor: "rgba(0,0,0,0.7)",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               zIndex: 1000,
//               padding: "15px",
//             }}
//           >
//             <div
//               style={{
//                 background: "#fff",
//                 borderRadius: "30px",
//                 width: "100%",
//                 maxWidth: "360px",
//                 padding: "45px 25px 30px 25px",
//                 position: "relative",
//                 boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
//               }}
//             >
//               <button
//                 onClick={() => setShowModal(false)}
//                 style={{
//                   position: "absolute",
//                   top: "15px",
//                   right: "15px",
//                   border: "none",
//                   background: "#f1f5f9",
//                   width: "32px",
//                   height: "32px",
//                   borderRadius: "8px",
//                   cursor: "pointer",
//                   color: "#64748b",
//                   fontSize: "1.2rem",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 &times;
//               </button>

//               <div style={{ textAlign: "center" }}>
//                 {!loadingDriver && driverInfo && (
//                   <div
//                     style={{
//                       display: "inline-block",
//                       background:
//                         "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
//                       color: "#fff",
//                       padding: "6px 20px",
//                       borderRadius: "50px",
//                       fontSize: "0.8rem",
//                       fontWeight: "700",
//                       marginBottom: "20px",
//                       textTransform: "uppercase",
//                     }}
//                   >
//                     conductor nro: #{driverInfo.usuario_id}
//                   </div>
//                 )}

//                 {loadingDriver ? (
//                   <div style={{ padding: "40px 0" }}>
//                     <div className="spinner" style={{ margin: "0 auto" }}></div>
//                     <p style={{ marginTop: "15px" }}>Cargando información...</p>
//                   </div>
//                 ) : driverInfo ? (
//                   <>
//                     <div style={{ marginBottom: "15px" }}>
//                       <img
//                         src={
//                           driverInfo.foto || "https://via.placeholder.com/120"
//                         }
//                         alt="Conductor"
//                         style={{
//                           width: "120px",
//                           height: "120px",
//                           borderRadius: "50%",
//                           objectFit: "cover",
//                           border: "5px solid #f8fafc",
//                           boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
//                         }}
//                       />
//                     </div>
//                     <h4
//                       style={{
//                         margin: "0",
//                         fontSize: "1.5rem",
//                         color: "#0f172a",
//                         fontWeight: "800",
//                       }}
//                     >
//                       {driverInfo.nombre}
//                     </h4>

//                     {/* --- MOSTRAR REPUTACIÓN --- */}
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         gap: "5px",
//                         margin: "5px 0",
//                       }}
//                     >
//                       <span style={{ fontSize: "1.2rem", color: "#f59e0b" }}>
//                         {"★".repeat(Math.floor(driverInfo.reputacion || 0))}
//                         {"☆".repeat(5 - Math.floor(driverInfo.reputacion || 0))}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: "0.9rem",
//                           fontWeight: "bold",
//                           color: "#64748b",
//                         }}
//                       >
//                         ({driverInfo.reputacion || "0.0"})
//                       </span>
//                     </div>
//                     <p
//                       style={{
//                         fontSize: "0.7rem",
//                         color: "#94a3b8",
//                         marginTop: "-5px",
//                         marginBottom: "10px",
//                       }}
//                     >
//                       {driverInfo.totalReseñas || 0} viajes calificados
//                     </p>

//                     <p
//                       style={{
//                         color: "#0ea5e9",
//                         fontWeight: "700",
//                         fontSize: "1.1rem",
//                         margin: "0 0 25px 0",
//                       }}
//                     >
//                       📞 {driverInfo.telefono}
//                     </p>

//                     <div
//                       style={{
//                         background: "#f8fafc",
//                         borderRadius: "20px",
//                         padding: "15px",
//                         border: "1px solid #e2e8f0",
//                         marginBottom: "20px",
//                       }}
//                     >
//                       <p
//                         style={{
//                           fontSize: "0.65rem",
//                           color: "#94a3b8",
//                           fontWeight: "800",
//                           textTransform: "uppercase",
//                           marginBottom: "10px",
//                         }}
//                       >
//                         Vehículo Autorizado
//                       </p>
//                       <img
//                         src={
//                           driverInfo.foto_vehiculo ||
//                           "https://via.placeholder.com/300x150"
//                         }
//                         alt="Vehículo"
//                         style={{
//                           width: "100%",
//                           borderRadius: "15px",
//                           height: "160px",
//                           objectFit: "cover",
//                         }}
//                       />
//                     </div>

//                     {/* <a href={`tel:${driverInfo.telefono}`} style={{ display: 'block', backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '1rem', boxShadow: '0 10px 20px rgba(0, 123, 255, 0.2)' }}>
//                       Llamar ahora
//                     </a> */}
//                   </>
//                 ) : (
//                   <p
//                     style={{
//                       padding: "20px",
//                       color: "#ef4444",
//                       fontWeight: "600",
//                     }}
//                   >
//                     No se pudo cargar la información.
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ClientDashboard;

// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
// import axios from "axios";
// import { useAuth } from "../../hooks/AuthContext";
// import RatingModal from "../../components/RatingModal";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ["websocket"],
//   autoConnect: true,
// });

// function ClientDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoadingOrders, setIsLoadingOrders] = useState(true);

//   // --- ESTADO PARA CALIFICACIÓN ---
//   const [pedidoPorCalificar, setPedidoPorCalificar] = useState(null);

//   // Estados para el Modal del Conductor (Detalles manuales)
//   const [showModal, setShowModal] = useState(false);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [loadingDriver, setLoadingDriver] = useState(false);

//   // --- FUNCIÓN DE VERIFICACIÓN DE CALIFICACIONES ---
//   const verificarCalificacionesPendientes = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/pendiente-calificar`, {
//         withCredentials: true,
//       });

//       if (res.data.tienePendientes) {
//         const pedido = res.data.pedido;

//         try {
//           const driverRes = await axios.get(`${API_BASE_URL}/client/order-driver/${pedido.id}`, {
//             withCredentials: true,
//           });
//           pedido.nombre_conductor = driverRes.data.nombre;
//         } catch (driverErr) {
//           console.error("Error al obtener nombre del conductor para el modal:", driverErr);
//           pedido.nombre_conductor = "tu repartidor";
//         }

//         setPedidoPorCalificar(pedido);
//       } else {
//         setPedidoPorCalificar(null);
//       }
//     } catch (err) {
//       console.error("Error al verificar calificaciones:", err);
//     }
//   };

//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;

//     verificarCalificacionesPendientes();

//     socket.emit("join_client_room", user.id);

//     const handleStatusUpdate = (data) => {
//       if (data.nuevo_estado === "entregado") {
//         verificarCalificacionesPendientes();
//       }

//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === parseInt(data.pedido_id)
//             ? { ...order, status: data.nuevo_estado }
//             : order
//         )
//       );
//     };

//     socket.on("ORDEN_ACTUALIZADA", handleStatusUpdate);
//     return () => {
//       socket.off("ORDEN_ACTUALIZADA");
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   useEffect(() => {
//     if (loading) return;
//     if (!isAuthenticated) {
//       navigate("/");
//       return;
//     }

//     const fetchOrders = async () => {
//       setIsLoadingOrders(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/client/orders`, {
//           withCredentials: true,
//         });
//         setOrders(Array.isArray(response.data) ? response.data : []);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setIsLoadingOrders(false);
//       }
//     };
//     fetchOrders();
//   }, [isAuthenticated, loading, navigate]);

//   // Función para ver detalles del conductor manualmente con PROMEDIO
//   const handleOpenDetails = async (pedidoId, status) => {
//     if (status === 'pendiente') {
//       alert("Aún estamos buscando un repartidor para tu pedido.");
//       return;
//     }

//     setLoadingDriver(true);
//     setShowModal(true);
//     try {
//       // 1. Datos básicos del conductor
//       const res = await axios.get(`${API_BASE_URL}/client/order-driver/${pedidoId}`, {
//         withCredentials: true,
//       });
//       const driverData = res.data;

//       // 2. Promedio de estrellas (Usando el usuario_id del repartidor)
//       const ratingRes = await axios.get(`${API_BASE_URL}/driver/rating/${driverData.usuario_id}`, {
//         withCredentials: true,
//       });

//       setDriverInfo({
//         ...driverData,
//         reputacion: ratingRes.data.promedio,
//         totalReseñas: ratingRes.data.total
//       });

//     } catch (err) {
//       console.error("Error al obtener conductor:", err);
//       setDriverInfo(null);
//     } finally {
//       setLoadingDriver(false);
//     }
//   };

//   const filteredOrders = useMemo(() => {
//     return orders.filter((order) => {
//       const search = searchTerm.toLowerCase();
//       return (
//         order.id.toString().includes(search) ||
//         order.status?.toLowerCase().includes(search)
//       );
//     });
//   }, [orders, searchTerm]);

//   const getStepLevel = (status) => {
//     const s = status?.toLowerCase() || "";
//     if (s.includes("pendiente")) return 1;
//     if (s.includes("asignado")) return 2;
//     if (s.includes("camino")) return 3;
//     if (s.includes("entregado")) return 4;
//     return 0;
//   };

//   const stepsLabels = ["Pendiente", "Asignado", "En Camino", "Entregado"];

//   return (
//     <div className="app-container">
//       {pedidoPorCalificar && (
//         <RatingModal
//           pedidoId={pedidoPorCalificar.id}
//           nombreConductor={pedidoPorCalificar.nombre_conductor}
//           onCalificado={() => {
//             setPedidoPorCalificar(null);
//             verificarCalificacionesPendientes();
//             const fetchOrders = async () => {
//               const response = await axios.get(`${API_BASE_URL}/client/orders`, { withCredentials: true });
//               setOrders(Array.isArray(response.data) ? response.data : []);
//             };
//             fetchOrders();
//           }}
//         />
//       )}

//       <div className="client-dashboard">
//         <header style={{ textAlign: "center", marginBottom: "20px" }}>
//           <h2 style={{ fontWeight: "800" }}>👋 ¡Hola, {user?.nombre}!</h2>
//           <button
//             onClick={() => navigate("/client/new-order")}
//             className="btn-primary"
//             style={{ width: "100%", marginTop: "15px" }}
//           >
//             🚀 Nuevo Servicio
//           </button>
//         </header>

//         <div className="search-container">
//           <input
//             type="text"
//             className="search-input"
//             placeholder="Buscar pedido..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="orders-grid">
//           {filteredOrders.length === 0 && !isLoadingOrders ? (
//              <p style={{textAlign:'center', color: '#64748b', marginTop: '20px'}}>No tienes pedidos registrados.</p>
//           ) : (
//             filteredOrders.map((order) => (
//               <div key={order.id} className="order-card-modern">
//                 <div className="order-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                   <span className="order-id-badge">PEDIDO #{order.id}</span>
//                   <span className={`status-pill pill-${order.status?.replace("_", "-")}`}>
//                     {order.status?.replace("_", " ").toUpperCase()}
//                   </span>
//                 </div>

//                 <div style={{ padding: "20px 10px 10px 10px" }}>
//                   <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: "8px" }}>
//                     {[1, 2, 3, 4].map((step) => (
//                       <div
//                         key={step}
//                         style={{
//                           width: "14px", height: "14px", borderRadius: "50%",
//                           background: getStepLevel(order.status) >= step ? "#007bff" : "#cbd5e1",
//                           zIndex: 2, transition: "background 0.3s ease",
//                         }}
//                       />
//                     ))}
//                     <div style={{ position: "absolute", top: "6px", left: 0, width: "100%", height: "2px", background: "#e2e8f0", zIndex: 1 }} />
//                   </div>

//                   <div style={{ display: "flex", justifyContent: "space-between" }}>
//                     {stepsLabels.map((label, index) => (
//                       <span
//                         key={index}
//                         style={{
//                           fontSize: "0.65rem",
//                           fontWeight: getStepLevel(order.status) === index + 1 ? "bold" : "normal",
//                           color: getStepLevel(order.status) >= index + 1 ? "#333" : "#94a3b8",
//                           width: "25%",
//                           textAlign: index === 0 ? "left" : index === 3 ? "right" : "center",
//                         }}
//                       >
//                         {label}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="order-body" style={{ padding: "10px 15px" }}>
//                   <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>📍 <b>Origen:</b> {order.address_origin}</p>
//                   <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>🏁 <b>Destino:</b> {order.address_dest}</p>
//                 </div>

//                 <div className="order-footer">
//                   <button onClick={() => handleOpenDetails(order.id, order.status)} className="btn-outline">
//                     Ver Conductor
//                   </button>
//                   <div className="price-tag" style={{ textAlign: 'right' }}>
//                     <span className="amount-usd" style={{ display: 'block', color: '#000', fontWeight: 'bold' }}>${order.total_usd}</span>
//                     <span className="amount-bs" style={{ fontSize: '0.85rem', color: '#000', fontWeight: '500', display: 'block' }}>Bs {order.total}</span>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* --- MODAL DE INFORMACIÓN DEL CONDUCTOR (DETALLES) ACTUALIZADO --- */}
//         {showModal && (
//           <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
//             <div style={{ background: '#fff', borderRadius: '30px', width: '100%', maxWidth: '360px', padding: '45px 25px 30px 25px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>

//               <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 &times;
//               </button>

//               <div style={{ textAlign: 'center' }}>
//                 {!loadingDriver && driverInfo && (
//                   <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#fff', padding: '6px 20px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase' }}>
//                     conductor nro: #{driverInfo.usuario_id}
//                   </div>
//                 )}

//                 {loadingDriver ? (
//                   <div style={{ padding: '40px 0' }}>
//                     <div className="spinner" style={{ margin: '0 auto' }}></div>
//                     <p style={{ marginTop: '15px' }}>Cargando información...</p>
//                   </div>
//                 ) : driverInfo ? (
//                   <>
//                     <div style={{ marginBottom: '15px' }}>
//                       <img src={driverInfo.foto || 'https://via.placeholder.com/120'} alt="Conductor" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '5px solid #f8fafc', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }} />
//                     </div>
//                     <h4 style={{ margin: '0', fontSize: '1.5rem', color: '#0f172a', fontWeight: '800' }}>{driverInfo.nombre}</h4>

//                     {/* --- MOSTRAR REPUTACIÓN --- */}
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', margin: '5px 0' }}>
//                         <span style={{ fontSize: '1.2rem', color: '#f59e0b' }}>
//                             {'★'.repeat(Math.floor(driverInfo.reputacion || 0))}
//                             {'☆'.repeat(5 - Math.floor(driverInfo.reputacion || 0))}
//                         </span>
//                         <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#64748b' }}>
//                             ({driverInfo.reputacion || "0.0"})
//                         </span>
//                     </div>
//                     <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '-5px', marginBottom: '10px' }}>
//                         {driverInfo.totalReseñas || 0} viajes calificados
//                     </p>

//                     <p style={{ color: '#0ea5e9', fontWeight: '700', fontSize: '1.1rem', margin: '0 0 25px 0' }}>📞 {driverInfo.telefono}</p>

//                     <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
//                       <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px' }}>Vehículo Autorizado</p>
//                       <img src={driverInfo.foto_vehiculo || 'https://via.placeholder.com/300x150'} alt="Vehículo" style={{ width: '100%', borderRadius: '15px', height: '160px', objectFit: 'cover' }} />
//                     </div>

//                     <a href={`tel:${driverInfo.telefono}`} style={{ display: 'block', backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', padding: '16px', borderRadius: '18px', fontWeight: '800', fontSize: '1rem', boxShadow: '0 10px 20px rgba(0, 123, 255, 0.2)' }}>
//                       Llamar ahora
//                     </a>
//                   </>
//                 ) : (
//                   <p style={{ padding: '20px', color: '#ef4444', fontWeight: '600' }}>No se pudo cargar la información.</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ClientDashboard;

// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { io } from "socket.io-client";
// import axios from "axios";
// import { useAuth } from "../../hooks/AuthContext";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const socket = io(API_BASE_URL, {
//   withCredentials: true,
//   transports: ["websocket"],
//   autoConnect: true,
// });

// function ClientDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoadingOrders, setIsLoadingOrders] = useState(true);

//   // Estados para el Modal del Conductor
//   const [showModal, setShowModal] = useState(false);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [loadingDriver, setLoadingDriver] = useState(false);

//   useEffect(() => {
//     if (loading || !isAuthenticated || !user?.id) return;
//     socket.emit("join_client_room", user.id);
//     const handleStatusUpdate = (data) => {
//       setOrders((prevOrders) =>
//         prevOrders.map((order) =>
//           order.id === parseInt(data.pedido_id)
//             ? { ...order, status: data.nuevo_estado }
//             : order
//         )
//       );
//     };
//     socket.on("ORDEN_ACTUALIZADA", handleStatusUpdate);
//     return () => {
//       socket.off("ORDEN_ACTUALIZADA");
//     };
//   }, [loading, isAuthenticated, user?.id]);

//   useEffect(() => {
//     if (loading) return;
//     if (!isAuthenticated) {
//       navigate("/");
//       return;
//     }
//     const fetchOrders = async () => {
//       setIsLoadingOrders(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/client/orders`, {
//           withCredentials: true,
//         });
//         setOrders(Array.isArray(response.data) ? response.data : []);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setIsLoadingOrders(false);
//       }
//     };
//     fetchOrders();
//   }, [isAuthenticated, loading, navigate]);

//   // Función para abrir modal y cargar datos del conductor
//   const handleOpenDetails = async (pedidoId, status) => {
//     if (status === 'pendiente') {
//       alert("Aún estamos buscando un repartidor para tu pedido.");
//       return;
//     }

//     setLoadingDriver(true);
//     setShowModal(true);
//     try {
//       const res = await axios.get(`${API_BASE_URL}/client/order-driver/${pedidoId}`, {
//         withCredentials: true,
//       });
//       setDriverInfo(res.data);
//     } catch (err) {
//       console.error("Error al obtener conductor:", err);
//       setDriverInfo(null);
//     } finally {
//       setLoadingDriver(false);
//     }
//   };

//   const filteredOrders = useMemo(() => {
//     return orders.filter((order) => {
//       const search = searchTerm.toLowerCase();
//       return (
//         order.id.toString().includes(search) ||
//         order.status?.toLowerCase().includes(search)
//       );
//     });
//   }, [orders, searchTerm]);

//   const getStepLevel = (status) => {
//     const s = status?.toLowerCase() || "";
//     if (s.includes("pendiente")) return 1;
//     if (s.includes("asignado")) return 2;
//     if (s.includes("camino")) return 3;
//     if (s.includes("entregado")) return 4;
//     return 0;
//   };

//   const stepsLabels = ["Pendiente", "Asignado", "En Camino", "Entregado"];

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
//         <header style={{ textAlign: "center", marginBottom: "20px" }}>
//           <h2 style={{ fontWeight: "800" }}>👋 ¡Hola, {user?.nombre}!</h2>
//           <button
//             onClick={() => navigate("/client/new-order")}
//             className="btn-primary"
//             style={{ width: "100%", marginTop: "15px" }}
//           >
//             🚀 Nuevo Servicio
//           </button>
//         </header>

//         <div className="search-container">
//           <input
//             type="text"
//             className="search-input"
//             placeholder="Buscar pedido..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="orders-grid">
//           {filteredOrders.map((order) => (
//             <div key={order.id} className="order-card-modern">
//               <div
//                 className="order-card-header"
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <span className="order-id-badge">PEDIDO #{order.id}</span>

//                 <span
//                   className={`status-pill pill-${order.status?.replace(
//                     "_",
//                     "-"
//                   )}`}
//                   style={
//                     order.status?.includes("camino")
//                       ? {
//                           backgroundColor: "#e0f7fa",
//                           color: "#00acc1",
//                           border: "1px solid #b2ebf2",
//                           padding: "4px 12px",
//                           borderRadius: "20px",
//                           fontSize: "0.75rem",
//                           fontWeight: "bold",
//                         }
//                       : {}
//                   }
//                 >
//                   {order.status?.replace("_", " ").toUpperCase()}
//                 </span>
//               </div>

//               <div style={{ padding: "20px 10px 10px 10px" }}>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     position: "relative",
//                     marginBottom: "8px",
//                   }}
//                 >
//                   {[1, 2, 3, 4].map((step) => (
//                     <div
//                       key={step}
//                       style={{
//                         width: "14px",
//                         height: "14px",
//                         borderRadius: "50%",
//                         background:
//                           getStepLevel(order.status) >= step
//                             ? "#007bff"
//                             : "#cbd5e1",
//                         zIndex: 2,
//                         transition: "background 0.3s ease",
//                       }}
//                     />
//                   ))}
//                   <div
//                     style={{
//                       position: "absolute",
//                       top: "6px",
//                       left: 0,
//                       width: "100%",
//                       height: "2px",
//                       background: "#e2e8f0",
//                       zIndex: 1,
//                     }}
//                   />
//                 </div>

//                 <div
//                   style={{ display: "flex", justifyContent: "space-between" }}
//                 >
//                   {stepsLabels.map((label, index) => (
//                     <span
//                       key={index}
//                       style={{
//                         fontSize: "0.65rem",
//                         fontWeight:
//                           getStepLevel(order.status) === index + 1
//                             ? "bold"
//                             : "normal",
//                         color:
//                           getStepLevel(order.status) >= index + 1
//                             ? "#333"
//                             : "#94a3b8",
//                         width: "25%",
//                         textAlign:
//                           index === 0
//                             ? "left"
//                             : index === 3
//                             ? "right"
//                             : "center",
//                       }}
//                     >
//                       {label}
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div className="order-body" style={{ padding: "10px 15px" }}>
//                 <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>
//                   📍 <b>Origen:</b> {order.address_origin}
//                 </p>
//                 <p style={{ fontSize: "0.85rem", margin: "5px 0" }}>
//                   🏁 <b>Destino:</b> {order.address_dest}
//                 </p>
//               </div>

//               <div className="order-footer">
//                 <button
//                   onClick={() => handleOpenDetails(order.id, order.status)}
//                   className="btn-outline"
//                 >
//                   Ver Conductor
//                 </button>
//                 <div className="price-tag" style={{ textAlign: 'right' }}>
//                   <span className="amount-usd" style={{ display: 'block', color: '#000000', fontWeight: 'bold' }}>
//                     ${order.total_usd}
//                   </span>
//                   <span className="amount-bs" style={{ fontSize: '0.85rem', color: '#000000', fontWeight: '500', display: 'block' }}>
//                     Bs {order.total}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* --- MODAL DE INFORMACIÓN DEL CONDUCTOR (ESTILO RECTANGULAR) --- */}
//         {showModal && (
//           <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
//             <div style={{
//               background: '#fff',
//               borderRadius: '30px',
//               width: '100%',
//               maxWidth: '360px',
//               padding: '45px 25px 30px 25px',
//               position: 'relative',
//               boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
//             }}>

//               <button
//                 onClick={() => setShowModal(false)}
//                 style={{
//                   position: 'absolute',
//                   top: '15px',
//                   right: '15px',
//                   border: 'none',
//                   background: '#f1f5f9',
//                   width: '32px',
//                   height: '32px',
//                   borderRadius: '8px',
//                   cursor: 'pointer',
//                   color: '#64748b',
//                   fontSize: '1.2rem',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   lineHeight: 0,
//                   padding: 0,
//                   zIndex: 10
//                 }}
//               >
//                 &times;
//               </button>

//               <div style={{ textAlign: 'center' }}>
//                 {/* ID del Repartidor arriba de la foto */}
//                 {!loadingDriver && driverInfo && (
//                   <div style={{
//                     display: 'inline-block',
//                     background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
//                     color: '#fff',
//                     padding: '6px 20px',
//                     borderRadius: '50px',
//                     fontSize: '0.8rem',
//                     fontWeight: '700',
//                     boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
//                     marginBottom: '20px',
//                     textTransform: 'uppercase',
//                     letterSpacing: '1px'
//                   }}>
//                     conductor nro: #{driverInfo.usuario_id}
//                   </div>
//                 )}

//                 {loadingDriver ? (
//                   <div style={{ padding: '40px 0' }}>
//                     <div className="spinner" style={{ margin: '0 auto' }}></div>
//                     <p style={{ marginTop: '15px' }}>Cargando información...</p>
//                   </div>
//                 ) : driverInfo ? (
//                   <>
//                     <div style={{ marginBottom: '15px' }}>
//                       <img
//                         src={driverInfo.foto || 'https://via.placeholder.com/120'}
//                         alt="Conductor"
//                         style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '5px solid #f8fafc', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}
//                       />
//                     </div>

//                     <h4 style={{ margin: '0', fontSize: '1.5rem', color: '#0f172a', fontWeight: '800' }}>{driverInfo.nombre}</h4>
//                     <p style={{ color: '#0ea5e9', fontWeight: '700', fontSize: '1.1rem', margin: '8px 0 25px 0' }}>
//                       📞 {driverInfo.telefono}
//                     </p>

//                     <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
//                       <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>
//                         Vehículo Autorizado
//                       </p>
//                       <img
//                         src={driverInfo.foto_vehiculo || 'https://via.placeholder.com/300x150'}
//                         alt="Vehículo"
//                         style={{ width: '100%', borderRadius: '15px', height: '160px', objectFit: 'cover' }}
//                       />
//                     </div>

//                     <a
//                       href={`tel:${driverInfo.telefono}`}
//                       style={{
//                         display: 'block',
//                         backgroundColor: '#007bff',
//                         color: '#fff',
//                         textDecoration: 'none',
//                         padding: '16px',
//                         borderRadius: '18px',
//                         fontWeight: '800',
//                         fontSize: '1rem',
//                         boxShadow: '0 10px 20px rgba(0, 123, 255, 0.2)'
//                       }}
//                     >
//                       Llamar ahora
//                     </a>
//                   </>
//                 ) : (
//                   <p style={{ padding: '20px', color: '#ef4444', fontWeight: '600' }}>No se pudo cargar la información.</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ClientDashboard;
