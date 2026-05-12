import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/orderForm.css";
import { useAuth } from "../../hooks/AuthContext";

function OrderForm() {
  const { exchangeRate } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [formData, setFormData] = useState({
    pickupMunicipality: "",
    deliveryMunicipality: "",
    pickup: "",
    delivery: "",
    typevehicle: "",
    typeservice: "",
    receptpay: "",
  });

  const municipiosApure = ["av caracas", "av carabobo"];

  const [userAddresses, setUserAddresses] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]); 
  const [serviceTypes, setServiceTypes] = useState([]); 
  const [activeVehicleTypes, setActiveVehicleTypes] = useState([]); 
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [price, setPrice] = useState({
    priceUSD: 0,
    isCalculated: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSumming, setIsSumming] = useState(false);
  const [error, setError] = useState(null);

  // --- CARGA DE DATOS INICIALES RESILIENTE ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      setError(null);

      // Función auxiliar para cargar cada endpoint de forma independiente
      const load = async (endpoint, setter, label) => {
        try {
          const res = await axios.get(`${API_BASE_URL}${endpoint}`, { withCredentials: true });
          if (label === 'addresses') {
            setter(res.data.map((addr) => addr.calle));
          } else {
            setter(res.data);
          }
        } catch (err) {
          console.warn(`⚠️ Error al cargar ${label}:`, err.message);
          // No lanzamos error global para que el formulario no se bloquee
        }
      };

      // Ejecutamos las 4 peticiones. Si una falla, las otras continúan.
      await Promise.allSettled([
        load('/client/addresses', setUserAddresses, 'addresses'),
        load('/utils/vehicle', setVehicleTypes, 'vehículos'),
        load('/utils/service', setServiceTypes, 'servicios'),
        load('/client/active-vehicles', setActiveVehicleTypes, 'vehículos activos')
      ]);

      setIsLoadingData(false);
    };

    if (API_BASE_URL) {
      fetchInitialData();
    }
  }, [API_BASE_URL]);

  // --- CÁLCULO DE TOTALES ---
  const totals = useMemo(() => {
    const selectedVehicle = vehicleTypes.find((v) => v.descript === formData.typevehicle);
    const vehicleExtra = selectedVehicle ? parseFloat(selectedVehicle.amount_pay || 0) : 0;

    const selectedService = serviceTypes.find((s) => s.descript === formData.typeservice);
    const serviceExtra = selectedService ? parseFloat(selectedService.amount_pay || 0) : 0;

    const baseUSD = parseFloat(price.priceUSD || 0);
    const totalUSD = baseUSD + vehicleExtra + serviceExtra;
    const rate = parseFloat(exchangeRate || 0);
    const totalVES = totalUSD * rate;

    return { totalUSD, totalVES };
  }, [formData.typevehicle, formData.typeservice, price, vehicleTypes, serviceTypes, exchangeRate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "typevehicle" || name === "typeservice") {
      setIsSumming(true);
      setTimeout(() => setIsSumming(false), 300);
    }
    if (name === "pickupMunicipality" || name === "deliveryMunicipality") {
      setError(null);
      setPrice((prev) => ({ ...prev, isCalculated: false, priceUSD: 0 }));
    }
  };

  const calculateCost = useCallback(async () => {
    if (!formData.pickupMunicipality || !formData.deliveryMunicipality) return;

    setIsCalculating(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/calculate-cost`,
        { pickupAddress: formData.pickupMunicipality, deliveryAddress: formData.deliveryMunicipality },
        { withCredentials: true }
      );
      setPrice({ priceUSD: response.data.priceUSD, isCalculated: true });
    } catch (err) {
      setError("No se pudo calcular el costo de distancia.");
    } finally {
      setIsCalculating(false);
    }
  }, [formData.pickupMunicipality, formData.deliveryMunicipality, API_BASE_URL]);

  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === "pickupMunicipality" || name === "deliveryMunicipality") {
      if (formData.pickupMunicipality && formData.deliveryMunicipality && !price.isCalculated) {
        calculateCost();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const vehicleObj = vehicleTypes.find((v) => v.descript === formData.typevehicle);
    const serviceObj = serviceTypes.find((s) => s.descript === formData.typeservice);

    const orderPayload = {
      pickupMunicipality: formData.pickupMunicipality,
      deliveryMunicipality: formData.deliveryMunicipality,
      pickup: formData.pickup,
      delivery: formData.delivery,
      typevehicle: vehicleObj?.id,
      typeservice: serviceObj?.id,
      price: totals.totalVES,
      price_usd: totals.totalUSD,
      exchangeRate: exchangeRate,
    };
    navigate("/client/checkout", { state: { orderData: orderPayload } });
  };

  return (
    <div className="order-wrapper">
      <form onSubmit={handleSubmit} className="order-form">
        <h2 className="title-heading">🚚 Nueva Solicitud de Entrega</h2>
        <p className="text-muted">Selecciona origen, destino y el tipo de vehículo disponible.</p>

        {error && <div className="message-box message-error">{error}</div>}

        <div className="form-content-area">
          <div className="form-group">
            <label>Municipio de Recogida</label>
            <select name="pickupMunicipality" value={formData.pickupMunicipality} onChange={handleChange} onBlur={handleBlur} required>
              <option value="">Seleccione Municipio</option>
              {municipiosApure.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Dirección de Recogida</label>
            <input type="text" name="pickup" value={formData.pickup} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Av. Caracas" required list="user-addresses" disabled={isLoadingData} />
          </div>

          <div className="form-group">
            <label>Municipio de Entrega</label>
            <select name="deliveryMunicipality" value={formData.deliveryMunicipality} onChange={handleChange} onBlur={handleBlur} required>
              <option value="">Seleccione Municipio</option>
              {municipiosApure.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Dirección de Entrega</label>
            <input type="text" name="delivery" value={formData.delivery} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Av. Carabobo" required list="user-addresses" disabled={isLoadingData} />
          </div>

          <datalist id="user-addresses">
            {userAddresses.map((addr, i) => <option key={i} value={addr} />)}
          </datalist>

          <div className="form-group">
            <label htmlFor="typevehicle">Tipo de Vehículo</label>
            <select name="typevehicle" id="typevehicle" value={formData.typevehicle} onChange={handleChange} onBlur={handleBlur} required disabled={isLoadingData}>
              <option value="" disabled hidden>{isLoadingData ? "Cargando..." : "Seleccione vehículo"}</option>
              {vehicleTypes.map((v) => {
                const isAvailable = activeVehicleTypes.includes(v.descript);
                return (
                  <option key={v.id} value={v.descript} disabled={!isAvailable}>
                    {v.descript} (+${v.amount_pay}) {!isAvailable ? " (No disponible)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="typeservice">Tipo de Servicio</label>
            <select name="typeservice" id="typeservice" value={formData.typeservice} onChange={handleChange} onBlur={handleBlur} required disabled={isLoadingData}>
              <option value="" disabled hidden>{isLoadingData ? "Cargando..." : "Seleccione servicio"}</option>
              {serviceTypes.map((s) => (
                <option key={s.id} value={s.descript}>{s.descript} (+${s.amount_pay})</option>
              ))}
            </select>
          </div>

          <div className="price-summary">
            <h4 className="price-title">
                {(isCalculating || isSumming) && <span className="spinner-small"></span>}
                {isCalculating ? "Calculando..." : isSumming ? "Actualizando..." : "Costo de Entrega"}
            </h4>
            <div className="price-details">
              <p>Total USD: <strong>${totals.totalUSD.toFixed(2)}</strong></p>
              <p>Total VES: <strong>{totals.totalVES.toFixed(2)} Bs.</strong></p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCalculating || !price.isCalculated || !formData.typevehicle || !exchangeRate}
            className="btn-delivery"
          >
            {isSubmitting ? "Procesando..." : "Realizar Pago"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;
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
//   const [activeVehicleTypes, setActiveVehicleTypes] = useState([]); // 💡 Estado para los vehículos con conductores
//   const [isLoadingData, setIsLoadingData] = useState(true);

//   const [price, setPrice] = useState({
//     priceUSD: 0,
//     isCalculated: false,
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [isSumming, setIsSumming] = useState(false);
//   const [error, setError] = useState(null);

//   // --- CARGA DE DATOS INICIALES CORREGIDA ---
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         setIsLoadingData(true);
//         // 💡 Ahora incluimos las 4 peticiones necesarias
//         const [addrRes, vehicleRes, serviceRes, activeRes] = await Promise.all([
//           axios.get(`${API_BASE_URL}/client/addresses`, { withCredentials: true }),
//           axios.get(`${API_BASE_URL}/utils/vehicle`, { withCredentials: true }),
//           axios.get(`${API_BASE_URL}/utils/service`, { withCredentials: true }),
//           axios.get(`${API_BASE_URL}/client/active-vehicles`, { withCredentials: true }), // 💡 El nuevo endpoint
//         ]);

//         setUserAddresses(addrRes.data.map((addr) => addr.calle));
//         setVehicleTypes(vehicleRes.data);
//         setServiceTypes(serviceRes.data);
//         setActiveVehicleTypes(activeRes.data); // Espera array de strings: ["Moto", "Carro"]

//         setError(null);
//       } catch (err) {
//         console.error("Error al cargar datos iniciales:", err);
//         setError("Error al cargar disponibilidad de conductores o servicios.");
//       } finally {
//         setIsLoadingData(false);
//       }
//     };

//     fetchInitialData();
//   }, [API_BASE_URL]);

//   // --- CÁLCULO DE TOTALES ---
//   const totals = useMemo(() => {
//     const selectedVehicle = vehicleTypes.find((v) => v.descript === formData.typevehicle);
//     const vehicleExtra = selectedVehicle ? parseFloat(selectedVehicle.amount_pay) : 0;

//     const selectedService = serviceTypes.find((s) => s.descript === formData.typeservice);
//     const serviceExtra = selectedService ? parseFloat(selectedService.amount_pay) : 0;

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
//           {/* MUNICIPIOS Y DIRECCIONES */}
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

//           {/* VEHÍCULO CON VALIDACIÓN DE DISPONIBILIDAD */}
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

//           {/* SERVICIO */}
//           <div className="form-group">
//             <label htmlFor="typeservice">Tipo de Servicio</label>
//             <select name="typeservice" id="typeservice" value={formData.typeservice} onChange={handleChange} onBlur={handleBlur} required disabled={isLoadingData}>
//               <option value="" disabled hidden>{isLoadingData ? "Cargando..." : "Seleccione servicio"}</option>
//               {serviceTypes.map((s) => (
//                 <option key={s.id} value={s.descript}>{s.descript} (+${s.amount_pay})</option>
//               ))}
//             </select>
//           </div>

//           {/* COSTOS */}
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


