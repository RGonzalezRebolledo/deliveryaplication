import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/orderForm.css";
import { useAuth } from "../../hooks/AuthContext";

// --- SUB-COMPONENTE MODAL CON BÚSQUEDA PREDICTIVA ---
const SelectionModal = ({ isOpen, onClose, title, options, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Limpiar el buscador al abrir/cerrar
  useEffect(() => {
    if (isOpen) setSearchTerm("");
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrado predictivo
  const filteredOptions = options.filter(opt => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.7)", display: "flex",
      justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "15px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "25px", width: "100%", maxWidth: "380px",
        padding: "25px", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        maxHeight: "80vh", display: "flex", flexDirection: "column"
      }}>
        {/* BOTÓN X CENTRADO */}
        <button onClick={onClose} style={{
          position: "absolute", top: "15px", right: "15px", border: "none",
          background: "#f1f5f9", width: "30px", height: "30px", borderRadius: "8px",
          cursor: "pointer", color: "#64748b", fontSize: "1.4rem",
          display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1"
        }}>&times;</button>
        
        <h3 style={{ marginBottom: "15px", textAlign: "center", color: "#0f172a", fontSize: "1.2rem" }}>{title}</h3>

        {/* BUSCADOR PREDICTIVO */}
        <input 
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0",
            marginBottom: "15px", outline: "none", fontSize: "0.9rem"
          }}
          autoFocus
        />
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", paddingRight: "5px" }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => {
              const isString = typeof opt === "string";
              const label = isString ? opt : opt.label;
              const disabled = !isString && opt.disabled;

              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => onSelect(opt)}
                  style={{
                    padding: "12px 15px", borderRadius: "12px", border: "1px solid #f1f5f9",
                    background: disabled ? "#f8fafc" : "#fff",
                    cursor: disabled ? "not-allowed" : "pointer",
                    textAlign: "left", display: "flex", justifyContent: "space-between",
                    alignItems: "center", opacity: disabled ? 0.6 : 1, transition: "0.2s"
                  }}
                >
                  <span style={{ fontWeight: "600", fontSize: "0.95rem", color: disabled ? "#94a3b8" : "#334155" }}>{label}</span>
                  {!disabled && !isString && opt.subLabel && (
                    <span style={{ color: "#0ea5e9", fontSize: "0.85rem", fontWeight: "700" }}>{opt.subLabel}</span>
                  )}
                </button>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>No se encontraron resultados</p>
          )}
        </div>
      </div>
    </div>
  );
};

function OrderForm() {
  const { exchangeRate } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [formData, setFormData] = useState({
    pickupMunicipality: "", deliveryMunicipality: "",
    pickup: "", delivery: "",
    typevehicle: "", typeservice: "",
  });

  const [userAddresses, setUserAddresses] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]); 
  const [serviceTypes, setServiceTypes] = useState([]); 
  const [activeVehicleTypes, setActiveVehicleTypes] = useState([]); 
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [price, setPrice] = useState({ priceUSD: 0, isCalculated: false });
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSumming, setIsSumming] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", options: [] });

  const municipiosApure = ["av caracas", "av carabobo"];

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      const load = async (endpoint, setter, label) => {
        try {
          const url = `${API_BASE_URL}${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
          const res = await axios.get(url, { withCredentials: true });
          setter(label === 'addresses' ? res.data.map((addr) => addr.calle) : res.data);
        } catch (err) { console.error(`Error en ${label}:`, err.message); }
      };

      await Promise.allSettled([
        load('/client/addresses', setUserAddresses, 'addresses'),
        load('/utils/vehicle', setVehicleTypes, 'vehículos'),
        load('/utils/service', setServiceTypes, 'servicios'),
        load('/client/active-vehicles', setActiveVehicleTypes, 'vehículos activos')
      ]);
      setIsLoadingData(false);
    };
    if (API_BASE_URL) fetchInitialData();
  }, [API_BASE_URL]);

  const totals = useMemo(() => {
    const v = vehicleTypes.find((v) => v.descript === formData.typevehicle);
    const s = serviceTypes.find((s) => s.descript === formData.typeservice);
    const totalUSD = parseFloat(price.priceUSD || 0) + (v ? parseFloat(v.amount_pay || 0) : 0) + (s ? parseFloat(s.amount_pay || 0) : 0);
    return { totalUSD, totalVES: totalUSD * parseFloat(exchangeRate || 0) };
  }, [formData.typevehicle, formData.typeservice, price, vehicleTypes, serviceTypes, exchangeRate]);

  const handleOpenModal = (type) => {
    let title = "";
    let options = [];

    if (type === "pickupMunicipality" || type === "deliveryMunicipality") {
      title = "Municipio";
      options = municipiosApure;
    } else if (type === "typevehicle") {
      title = "Vehículo";
      options = vehicleTypes.map(v => ({
        label: activeVehicleTypes.includes(v.descript) ? v.descript : `${v.descript} (No disponible)`,
        subLabel: `+$${v.amount_pay}`,
        value: v.descript,
        disabled: !activeVehicleTypes.includes(v.descript)
      }));
    } else if (type === "typeservice") {
      title = "Servicio";
      options = serviceTypes.map(s => ({
        label: s.descript,
        subLabel: `+$${s.amount_pay}`,
        value: s.descript
      }));
    }
    setModal({ isOpen: true, type, title, options });
  };

  const handleSelect = (opt) => {
    const value = typeof opt === "string" ? opt : opt.value;
    setFormData((prev) => ({ ...prev, [modal.type]: value }));
    if (modal.type === "typevehicle" || modal.type === "typeservice") {
      setIsSumming(true);
      setTimeout(() => setIsSumming(false), 300);
    }
    if (modal.type.includes("Municipality")) setPrice(p => ({ ...p, isCalculated: false }));
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const calculateCost = useCallback(async () => {
    if (!formData.pickupMunicipality || !formData.deliveryMunicipality) return;
    setIsCalculating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/calculate-cost`, { pickupAddress: formData.pickupMunicipality, deliveryAddress: formData.deliveryMunicipality }, { withCredentials: true });
      setPrice({ priceUSD: res.data.priceUSD, isCalculated: true });
    } catch (err) { setError("Error calculando distancia."); }
    finally { setIsCalculating(false); }
  }, [formData.pickupMunicipality, formData.deliveryMunicipality, API_BASE_URL]);

  useEffect(() => {
    if (formData.pickupMunicipality && formData.deliveryMunicipality && !price.isCalculated) calculateCost();
  }, [formData.pickupMunicipality, formData.deliveryMunicipality, price.isCalculated, calculateCost]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = vehicleTypes.find((v) => v.descript === formData.typevehicle);
    const s = serviceTypes.find((s) => s.descript === formData.typeservice);
    navigate("/client/checkout", { state: { orderData: { ...formData, typevehicle: v?.id, typeservice: s?.id, price: totals.totalVES, price_usd: totals.totalUSD, exchangeRate } } });
  };

  return (
    <div className="order-wrapper">
      <form onSubmit={handleSubmit} className="order-form" style={{ padding: "20px" }}>
        <h2 className="title-heading" style={{ marginBottom: "5px" }}>🚚 Nueva Entrega</h2>
        <p className="text-muted" style={{ marginBottom: "15px" }}>Completa los datos del envío.</p>

        {error && <div className="message-box message-error">{error}</div>}

        {/* REDUCCIÓN DE MÁRGENES: gap reducido a 8px */}
        <div className="form-content-area" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="form-group" style={{ marginBottom: "2px" }}>
            <label>Origen (Municipio)</label>
            <input type="text" value={formData.pickupMunicipality} onClick={() => handleOpenModal("pickupMunicipality")} readOnly placeholder="Toca para elegir" required />
          </div>

          <div className="form-group" style={{ marginBottom: "2px" }}>
            <label>Dirección Específica</label>
            <input type="text" value={formData.pickup} onChange={e => setFormData({...formData, pickup: e.target.value})} placeholder="Ej: Av. Caracas" required list="user-addresses" />
          </div>

          <div className="form-group" style={{ marginBottom: "2px" }}>
            <label>Destino (Municipio)</label>
            <input type="text" value={formData.deliveryMunicipality} onClick={() => handleOpenModal("deliveryMunicipality")} readOnly placeholder="Toca para elegir" required />
          </div>

          <div className="form-group" style={{ marginBottom: "2px" }}>
            <label>Dirección Específica</label>
            <input type="text" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} placeholder="Ej: Av. Carabobo" required list="user-addresses" />
          </div>

          <datalist id="user-addresses">
            {userAddresses.map((addr, i) => <option key={i} value={addr} />)}
          </datalist>

          <div className="form-group" style={{ marginBottom: "2px" }}>
            <label>Vehículo</label>
            <input type="text" value={formData.typevehicle} onClick={() => handleOpenModal("typevehicle")} readOnly placeholder="Seleccionar" required />
          </div>

          <div className="form-group" style={{ marginBottom: "10px" }}>
            <label>Servicio</label>
            <input type="text" value={formData.typeservice} onClick={() => handleOpenModal("typeservice")} readOnly placeholder="Seleccionar" required />
          </div>

          {/* CONTENEDOR DE PRECIO ORIGINAL */}
          <div className="price-summary">
            <h4 className="price-title">
                {(isCalculating || isSumming) && <span className="spinner-small"></span>}
                {isCalculating ? "Calculando..." : "Resumen de Costos"}
            </h4>
            <div className="price-details">
              <p>Total USD: <strong>${totals.totalUSD.toFixed(2)}</strong></p>
              <p>Total VES: <strong>{totals.totalVES.toFixed(2)} Bs.</strong></p>
            </div>
          </div>

          <button type="submit" disabled={isLoadingData || isCalculating || !price.isCalculated || !formData.typevehicle} className="btn-delivery">
            Confirmar y Pagar
          </button>
        </div>
      </form>

      <SelectionModal 
        isOpen={modal.isOpen}
        onClose={() => setModal(p => ({ ...p, isOpen: false }))}
        title={modal.title}
        options={modal.options}
        onSelect={handleSelect}
      />
    </div>
  );
}

export default OrderForm;



// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "../../styles/orderForm.css";
// import { useAuth } from "../../hooks/AuthContext";

// // --- SUB-COMPONENTE MODAL (Estilo Dashboard con X centrada) ---
// const SelectionModal = ({ isOpen, onClose, title, options, onSelect }) => {
//   if (!isOpen) return null;

//   return (
//     <div style={{
//       position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
//       backgroundColor: "rgba(0,0,0,0.7)", display: "flex",
//       justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "15px",
//     }}>
//       <div style={{
//         background: "#fff", borderRadius: "30px", width: "100%", maxWidth: "360px",
//         padding: "35px 25px 25px 25px", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
//         maxHeight: "85vh", overflowY: "auto"
//       }}>
//         {/* BOTÓN X CORREGIDO */}
//         <button onClick={onClose} style={{
//           position: "absolute", top: "15px", right: "15px", border: "none",
//           background: "#f1f5f9", width: "32px", height: "32px", borderRadius: "8px",
//           cursor: "pointer", color: "#64748b", fontSize: "1.5rem",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           padding: "0", lineHeight: "1"
//         }}>&times;</button>
        
//         <h3 style={{ marginBottom: "20px", textAlign: "center", color: "#0f172a", fontWeight: "800" }}>{title}</h3>
        
//         <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//           {options.map((opt, i) => {
//             const isString = typeof opt === "string";
//             const label = isString ? opt : opt.label;
//             const disabled = !isString && opt.disabled;

//             return (
//               <button
//                 key={i}
//                 disabled={disabled}
//                 onClick={() => onSelect(opt)}
//                 style={{
//                   padding: "16px", borderRadius: "15px", border: "1px solid #e2e8f0",
//                   background: disabled ? "#f8fafc" : "#fff",
//                   cursor: disabled ? "not-allowed" : "pointer",
//                   textAlign: "left", display: "flex", justifyContent: "space-between",
//                   alignItems: "center", opacity: disabled ? 0.6 : 1, transition: "0.2s"
//                 }}
//               >
//                 <span style={{ fontWeight: "700", color: disabled ? "#94a3b8" : "#334155" }}>{label}</span>
//                 {!disabled && !isString && opt.subLabel && (
//                   <span style={{ color: "#0ea5e9", fontSize: "0.9rem", fontWeight: "800" }}>{opt.subLabel}</span>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// function OrderForm() {
//   const { exchangeRate } = useAuth();
//   const navigate = useNavigate();
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//   const [formData, setFormData] = useState({
//     pickupMunicipality: "", deliveryMunicipality: "",
//     pickup: "", delivery: "",
//     typevehicle: "", typeservice: "",
//   });

//   const [userAddresses, setUserAddresses] = useState([]);
//   const [vehicleTypes, setVehicleTypes] = useState([]); 
//   const [serviceTypes, setServiceTypes] = useState([]); 
//   const [activeVehicleTypes, setActiveVehicleTypes] = useState([]); 
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [price, setPrice] = useState({ priceUSD: 0, isCalculated: false });
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [isSumming, setIsSumming] = useState(false);
//   const [error, setError] = useState(null);

//   // Estado para controlar el Modal
//   const [modal, setModal] = useState({ isOpen: false, type: "", title: "", options: [] });

//   const municipiosApure = ["av caracas", "av carabobo"];

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       setIsLoadingData(true);
//       const load = async (endpoint, setter, label) => {
//         try {
//           const url = `${API_BASE_URL}${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
//           const res = await axios.get(url, { withCredentials: true });
//           setter(label === 'addresses' ? res.data.map((addr) => addr.calle) : res.data);
//         } catch (err) { console.error(`Error en ${label}:`, err.message); }
//       };

//       await Promise.allSettled([
//         load('/client/addresses', setUserAddresses, 'addresses'),
//         load('/utils/vehicle', setVehicleTypes, 'vehículos'),
//         load('/utils/service', setServiceTypes, 'servicios'),
//         load('/client/active-vehicles', setActiveVehicleTypes, 'vehículos activos')
//       ]);
//       setIsLoadingData(false);
//     };
//     if (API_BASE_URL) fetchInitialData();
//   }, [API_BASE_URL]);

//   const totals = useMemo(() => {
//     const selectedVehicle = vehicleTypes.find((v) => v.descript === formData.typevehicle);
//     const vehicleExtra = selectedVehicle ? parseFloat(selectedVehicle.amount_pay || 0) : 0;
//     const selectedService = serviceTypes.find((s) => s.descript === formData.typeservice);
//     const serviceExtra = selectedService ? parseFloat(selectedService.amount_pay || 0) : 0;
//     const baseUSD = parseFloat(price.priceUSD || 0);
//     const totalUSD = baseUSD + vehicleExtra + serviceExtra;
//     const totalVES = totalUSD * parseFloat(exchangeRate || 0);
//     return { totalUSD, totalVES };
//   }, [formData.typevehicle, formData.typeservice, price, vehicleTypes, serviceTypes, exchangeRate]);

//   const handleOpenModal = (type) => {
//     let title = "";
//     let options = [];

//     if (type === "pickupMunicipality" || type === "deliveryMunicipality") {
//       title = "Seleccione Municipio";
//       options = municipiosApure;
//     } else if (type === "typevehicle") {
//       title = "Tipo de Vehículo";
//       options = vehicleTypes.map(v => {
//         const isAvailable = activeVehicleTypes.includes(v.descript);
//         return {
//           label: isAvailable ? v.descript : `${v.descript} (No disponible)`,
//           subLabel: `+$${v.amount_pay}`,
//           value: v.descript,
//           disabled: !isAvailable
//         };
//       });
//     } else if (type === "typeservice") {
//       title = "Tipo de Servicio";
//       options = serviceTypes.map(s => ({
//         label: s.descript,
//         subLabel: `+$${s.amount_pay}`,
//         value: s.descript
//       }));
//     }
//     setModal({ isOpen: true, type, title, options });
//   };

//   const handleSelect = (opt) => {
//     const value = typeof opt === "string" ? opt : opt.value;
//     setFormData((prev) => ({ ...prev, [modal.type]: value }));
    
//     if (modal.type === "typevehicle" || modal.type === "typeservice") {
//       setIsSumming(true);
//       setTimeout(() => setIsSumming(false), 300);
//     }
//     if (modal.type.includes("Municipality")) {
//       setError(null);
//       setPrice((prev) => ({ ...prev, isCalculated: false, priceUSD: 0 }));
//     }
//     setModal(prev => ({ ...prev, isOpen: false }));
//   };

//   const calculateCost = useCallback(async () => {
//     if (!formData.pickupMunicipality || !formData.deliveryMunicipality) return;
//     setIsCalculating(true);
//     setError(null);
//     try {
//       const response = await axios.post(`${API_BASE_URL}/calculate-cost`,
//         { pickupAddress: formData.pickupMunicipality, deliveryAddress: formData.deliveryMunicipality },
//         { withCredentials: true }
//       );
//       setPrice({ priceUSD: response.data.priceUSD, isCalculated: true });
//     } catch (err) { setError("No se pudo calcular el costo de distancia."); }
//     finally { setIsCalculating(false); }
//   }, [formData.pickupMunicipality, formData.deliveryMunicipality, API_BASE_URL]);

//   useEffect(() => {
//     if (formData.pickupMunicipality && formData.deliveryMunicipality && !price.isCalculated) {
//       calculateCost();
//     }
//   }, [formData.pickupMunicipality, formData.deliveryMunicipality, price.isCalculated, calculateCost]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const vehicleObj = vehicleTypes.find((v) => v.descript === formData.typevehicle);
//     const serviceObj = serviceTypes.find((s) => s.descript === formData.typeservice);
//     const orderPayload = {
//       ...formData,
//       typevehicle: vehicleObj?.id,
//       typeservice: serviceObj?.id,
//       price: totals.totalVES,
//       price_usd: totals.totalUSD,
//       exchangeRate: exchangeRate,
//     };
//     navigate("/client/checkout", { state: { orderData: orderPayload } });
//   };

//   return (
//     <div className="order-wrapper">
//       <form onSubmit={handleSubmit} className="order-form">
//         <h2 className="title-heading">🚚 Nueva Solicitud de Entrega</h2>
//         <p className="text-muted">Selecciona origen, destino y el tipo de vehículo disponible.</p>

//         {error && <div className="message-box message-error">{error}</div>}

//         <div className="form-content-area">
//           <div className="form-group">
//             <label>Municipio de Recogida</label>
//             <input type="text" value={formData.pickupMunicipality} onClick={() => handleOpenModal("pickupMunicipality")} readOnly placeholder="Toca para seleccionar" required />
//           </div>

//           <div className="form-group">
//             <label>Dirección de Recogida</label>
//             <input type="text" value={formData.pickup} onChange={e => setFormData({...formData, pickup: e.target.value})} placeholder="Ej: Av. Caracas" required list="user-addresses" disabled={isLoadingData} />
//           </div>

//           <div className="form-group">
//             <label>Municipio de Entrega</label>
//             <input type="text" value={formData.deliveryMunicipality} onClick={() => handleOpenModal("deliveryMunicipality")} readOnly placeholder="Toca para seleccionar" required />
//           </div>

//           <div className="form-group">
//             <label>Dirección de Entrega</label>
//             <input type="text" value={formData.delivery} onChange={e => setFormData({...formData, delivery: e.target.value})} placeholder="Ej: Av. Carabobo" required list="user-addresses" disabled={isLoadingData} />
//           </div>

//           <datalist id="user-addresses">
//             {userAddresses.map((addr, i) => <option key={i} value={addr} />)}
//           </datalist>

//           <div className="form-group">
//             <label>Tipo de Vehículo</label>
//             <input type="text" value={formData.typevehicle} onClick={() => handleOpenModal("typevehicle")} readOnly placeholder="Seleccionar vehículo" required disabled={isLoadingData} />
//           </div>

//           <div className="form-group">
//             <label>Tipo de Servicio</label>
//             <input type="text" value={formData.typeservice} onClick={() => handleOpenModal("typeservice")} readOnly placeholder="Seleccionar servicio" required disabled={isLoadingData} />
//           </div>

//           {/* ESTILO ORIGINAL RESTAURADO */}
//           <div className="price-summary">
//             <h4 className="price-title">
//                 {(isCalculating || isSumming) && <span className="spinner-small"></span>}
//                 {isCalculating ? "Calculando..." : isSumming ? "Actualizando..." : "Costo de Entrega"}
//             </h4>
//             <div className="price-details">
//               <p>Total USD: <strong>${totals.totalUSD.toFixed(2)}</strong></p>
//               <p>Total VES: <strong>{totals.totalVES.toFixed(2)} Bs.</strong></p>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoadingData || isCalculating || !price.isCalculated || !formData.typevehicle || !exchangeRate}
//             className="btn-delivery"
//           >
//             Realizar Pago
//           </button>
//         </div>
//       </form>

//       <SelectionModal 
//         isOpen={modal.isOpen}
//         onClose={() => setModal(p => ({ ...p, isOpen: false }))}
//         title={modal.title}
//         options={modal.options}
//         onSelect={handleSelect}
//       />
//     </div>
//   );
// }

// export default OrderForm;

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "../../styles/orderForm.css";
// import { useAuth } from "../../hooks/AuthContext";

// function OrderForm() {
//   const { exchangeRate } = useAuth();
//   const navigate = useNavigate();
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//   const [formData, setFormData] = useState({
//     pickupMunicipality: "",
//     deliveryMunicipality: "",
//     pickup: "",
//     delivery: "",
//     typevehicle: "",
//     typeservice: "",
//     receptpay: "",
//   });

//   const municipiosApure = ["av caracas", "av carabobo"];

//   const [userAddresses, setUserAddresses] = useState([]);
//   const [vehicleTypes, setVehicleTypes] = useState([]); 
//   const [serviceTypes, setServiceTypes] = useState([]); 
//   const [activeVehicleTypes, setActiveVehicleTypes] = useState([]); 
//   const [isLoadingData, setIsLoadingData] = useState(true);

//   const [price, setPrice] = useState({
//     priceUSD: 0,
//     isCalculated: false,
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [isSumming, setIsSumming] = useState(false);
//   const [error, setError] = useState(null);

//   // --- CARGA DE DATOS INICIALES RESILIENTE ---
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       setIsLoadingData(true);
//       setError(null);

//       // Función auxiliar para cargar cada endpoint de forma independiente
//       // const load = async (endpoint, setter, label) => {
//       //   try {
//       //     const res = await axios.get(`${API_BASE_URL}${endpoint}`, { withCredentials: true });
//       //     if (label === 'addresses') {
//       //       setter(res.data.map((addr) => addr.calle));
//       //     } else {
//       //       setter(res.data);
//       //     }
//       //   } catch (err) {
//       //     console.warn(`⚠️ Error al cargar ${label}:`, err.message);
//       //     // No lanzamos error global para que el formulario no se bloquee
//       //   }
//       // };
//       const load = async (endpoint, setter, label) => {
//         try {
//           // 💡 Esto elimina barras dobles accidentales (reemplaza // por / después del protocolo)
//           const url = `${API_BASE_URL}${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
          
//           console.log(`🚀 Gazzella Debug: Cargando ${label} desde ${url}`);
      
//           const res = await axios.get(url, { withCredentials: true });
          
//           if (label === 'addresses') {
//             setter(res.data.map((addr) => addr.calle));
//           } else {
//             setter(res.data);
//           }
//         } catch (err) {
//           // Si da 404, aquí verás exactamente qué URL falló en la consola del celular
//           console.error(`❌ Error 404 o conexión en ${label}:`, err.message);
//         }
//       };

//       // Ejecutamos las 4 peticiones. Si una falla, las otras continúan.
//       await Promise.allSettled([
//         load('/client/addresses', setUserAddresses, 'addresses'),
//         load('/utils/vehicle', setVehicleTypes, 'vehículos'),
//         load('/utils/service', setServiceTypes, 'servicios'),
//         load('/client/active-vehicles', setActiveVehicleTypes, 'vehículos activos')
//       ]);

//       setIsLoadingData(false);
//     };

//     if (API_BASE_URL) {
//       fetchInitialData();
//     }
//   }, [API_BASE_URL]);

//   // --- CÁLCULO DE TOTALES ---
//   const totals = useMemo(() => {
//     const selectedVehicle = vehicleTypes.find((v) => v.descript === formData.typevehicle);
//     const vehicleExtra = selectedVehicle ? parseFloat(selectedVehicle.amount_pay || 0) : 0;

//     const selectedService = serviceTypes.find((s) => s.descript === formData.typeservice);
//     const serviceExtra = selectedService ? parseFloat(selectedService.amount_pay || 0) : 0;

//     const baseUSD = parseFloat(price.priceUSD || 0);
//     const totalUSD = baseUSD + vehicleExtra + serviceExtra;
//     const rate = parseFloat(exchangeRate || 0);
//     const totalVES = totalUSD * rate;

//     return { totalUSD, totalVES };
//   }, [formData.typevehicle, formData.typeservice, price, vehicleTypes, serviceTypes, exchangeRate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     if (name === "typevehicle" || name === "typeservice") {
//       setIsSumming(true);
//       setTimeout(() => setIsSumming(false), 300);
//     }
//     if (name === "pickupMunicipality" || name === "deliveryMunicipality") {
//       setError(null);
//       setPrice((prev) => ({ ...prev, isCalculated: false, priceUSD: 0 }));
//     }
//   };

//   const calculateCost = useCallback(async () => {
//     if (!formData.pickupMunicipality || !formData.deliveryMunicipality) return;

//     setIsCalculating(true);
//     setError(null);
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/calculate-cost`,
//         { pickupAddress: formData.pickupMunicipality, deliveryAddress: formData.deliveryMunicipality },
//         { withCredentials: true }
//       );
//       setPrice({ priceUSD: response.data.priceUSD, isCalculated: true });
//     } catch (err) {
//       setError("No se pudo calcular el costo de distancia.");
//     } finally {
//       setIsCalculating(false);
//     }
//   }, [formData.pickupMunicipality, formData.deliveryMunicipality, API_BASE_URL]);

//   const handleBlur = (e) => {
//     const { name } = e.target;
//     if (name === "pickupMunicipality" || name === "deliveryMunicipality") {
//       if (formData.pickupMunicipality && formData.deliveryMunicipality && !price.isCalculated) {
//         calculateCost();
//       }
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const vehicleObj = vehicleTypes.find((v) => v.descript === formData.typevehicle);
//     const serviceObj = serviceTypes.find((s) => s.descript === formData.typeservice);

//     const orderPayload = {
//       pickupMunicipality: formData.pickupMunicipality,
//       deliveryMunicipality: formData.deliveryMunicipality,
//       pickup: formData.pickup,
//       delivery: formData.delivery,
//       typevehicle: vehicleObj?.id,
//       typeservice: serviceObj?.id,
//       price: totals.totalVES,
//       price_usd: totals.totalUSD,
//       exchangeRate: exchangeRate,
//     };
//     navigate("/client/checkout", { state: { orderData: orderPayload } });
//   };

//   return (
//     <div className="order-wrapper">
//       <form onSubmit={handleSubmit} className="order-form">
//         <h2 className="title-heading">🚚 Nueva Solicitud de Entrega</h2>
//         <p className="text-muted">Selecciona origen, destino y el tipo de vehículo disponible.</p>

//         {error && <div className="message-box message-error">{error}</div>}

//         <div className="form-content-area">
//           <div className="form-group">
//             <label>Municipio de Recogida</label>
//             <select name="pickupMunicipality" value={formData.pickupMunicipality} onChange={handleChange} onBlur={handleBlur} required>
//               <option value="">Seleccione Municipio</option>
//               {municipiosApure.map((m) => <option key={m} value={m}>{m}</option>)}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>Dirección de Recogida</label>
//             <input type="text" name="pickup" value={formData.pickup} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Av. Caracas" required list="user-addresses" disabled={isLoadingData} />
//           </div>

//           <div className="form-group">
//             <label>Municipio de Entrega</label>
//             <select name="deliveryMunicipality" value={formData.deliveryMunicipality} onChange={handleChange} onBlur={handleBlur} required>
//               <option value="">Seleccione Municipio</option>
//               {municipiosApure.map((m) => <option key={m} value={m}>{m}</option>)}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>Dirección de Entrega</label>
//             <input type="text" name="delivery" value={formData.delivery} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Av. Carabobo" required list="user-addresses" disabled={isLoadingData} />
//           </div>

//           <datalist id="user-addresses">
//             {userAddresses.map((addr, i) => <option key={i} value={addr} />)}
//           </datalist>

//           <div className="form-group">
//             <label htmlFor="typevehicle">Tipo de Vehículo</label>
//             <select name="typevehicle" id="typevehicle" value={formData.typevehicle} onChange={handleChange} onBlur={handleBlur} required disabled={isLoadingData}>
//               <option value="" disabled hidden>{isLoadingData ? "Cargando..." : "Seleccione vehículo"}</option>
//               {vehicleTypes.map((v) => {
//                 const isAvailable = activeVehicleTypes.includes(v.descript);
//                 return (
//                   <option key={v.id} value={v.descript} disabled={!isAvailable}>
//                     {v.descript} (+${v.amount_pay}) {!isAvailable ? " (No disponible)" : ""}
//                   </option>
//                 );
//               })}
//             </select>
//           </div>

//           <div className="form-group">
//             <label htmlFor="typeservice">Tipo de Servicio</label>
//             <select name="typeservice" id="typeservice" value={formData.typeservice} onChange={handleChange} onBlur={handleBlur} required disabled={isLoadingData}>
//               <option value="" disabled hidden>{isLoadingData ? "Cargando..." : "Seleccione servicio"}</option>
//               {serviceTypes.map((s) => (
//                 <option key={s.id} value={s.descript}>{s.descript} (+${s.amount_pay})</option>
//               ))}
//             </select>
//           </div>

//           <div className="price-summary">
//             <h4 className="price-title">
//                 {(isCalculating || isSumming) && <span className="spinner-small"></span>}
//                 {isCalculating ? "Calculando..." : isSumming ? "Actualizando..." : "Costo de Entrega"}
//             </h4>
//             <div className="price-details">
//               <p>Total USD: <strong>${totals.totalUSD.toFixed(2)}</strong></p>
//               <p>Total VES: <strong>{totals.totalVES.toFixed(2)} Bs.</strong></p>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isSubmitting || isCalculating || !price.isCalculated || !formData.typevehicle || !exchangeRate}
//             className="btn-delivery"
//           >
//             {isSubmitting ? "Procesando..." : "Realizar Pago"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default OrderForm;
