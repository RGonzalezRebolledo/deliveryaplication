
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/orderForm.css';
// import { AddressAutofill } from '@mapbox/search-js-react';

// Componente principal para crear una nueva orden de entrega
function OrderForm() {
  const navigate = useNavigate();
  
  // URL base, asumimos que está configurada globalmente
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // const API_BASE_URL = 'https://delivery-backend-production-c3cb.up.railway.app';

  // --- 1. ESTADO DEL FORMULARIO Y DATOS DE ENTRADA ---
  const [formData, setFormData] = useState({
    pickupMunicipality: '', // Para el cálculo (Zona)
    deliveryMunicipality: '', // Para el cálculo (Zona)
    pickup: '', // Dirección de recogida
    delivery: '', // Dirección de entrega
    typevehicle: "",
    typeservice: '',  
    receptpay: ''
  });

  const municipiosApure = [
"San Fernando", "Biruaca", "Achaguas", "Pedro Camejo", "Muñoz", "Páez", "Rómulo Gallegos", 'av caracas', 'av carabobo'
  ];

// --- 2. NUEVO ESTADO: ALMACENAR DIRECCIONES REGISTRADAS ---
const [userAddresses, setUserAddresses] = useState([]);
// const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
const [vehicleTypes, setVehicleTypes] = useState([]); // Lista de vehículos de DB
  const [serviceTypes, setServiceTypes] = useState([]); // Lista de servicios de DB
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- 2. ESTADO DEL PRECIO Y TASA (Calculados por el Backend) ---
  const [price, setPrice] = useState({
    priceUSD: 0,
    priceVES: 0,
    exchangeRate: 0,
    isCalculated: false, // Indica si el cálculo fue exitoso
  });

  // --- 3. ESTADO DE LA UI Y ERRORES ---
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el envío final del pedido
  const [isCalculating, setIsCalculating] = useState(false); // Para el cálculo de costo
  const [isSumming, setIsSumming] = useState(false); // para el calculo cuando seleccione un vehiculo o un servicio
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // -------------------------------------------------------------
    // 🛑 INICIALIZO LOS DATOS INICIALES DE LOS ENDPOINTS
    // -------------------------------------------------------------
    useEffect(() => {
        const fetchInitialData = async () => {
          try {
   
              // Ejecutamos todas las peticiones en paralelo para mayor velocidad
        const [addrRes, vehicleRes, serviceRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/client/addresses`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/utils/vehicle`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/utils/service`, { withCredentials: true })
        ]);

        setUserAddresses(addrRes.data.map(addr => addr.calle));
        setVehicleTypes(vehicleRes.data); // Espera un array de objetos [{id, nombre}, ...]
        setServiceTypes(serviceRes.data); // Espera un array de objetos [{id, nombre}, ...]

          } catch (err) {
              console.error('Error al cargar datos iniciales:', err);
              setError('Error al cargar opciones del formulario.');
              // Aquí podrías manejar el error de carga de direcciones si fuera crítico
          } finally {
              setIsLoadingData(false); // ⬅️ Esto habilita los inputs
          }
      };

      fetchInitialData();
  }, [API_BASE_URL]);
  // -------------------------------------------------------------

// --- NUEVA LÓGICA: CÁLCULO DE TOTALES ---
const totals = useMemo(() => {
  // 1. Buscar el monto del vehículo seleccionado
  const selectedVehicle = vehicleTypes.find(v => v.descript === formData.typevehicle);
  const vehicleExtra = selectedVehicle ? parseFloat(selectedVehicle.amount_pay) : 0;

  // 2. Buscar el monto del servicio seleccionado
  const selectedService = serviceTypes.find(s => s.descript === formData.typeservice);
  const serviceExtra = selectedService ? parseFloat(selectedService.amount_pay) : 0;

  // 3. Sumar el precio base que viene del backend (price.priceUSD) + extras
  const baseUSD = parseFloat(price.priceUSD || 0);
  const totalUSD = baseUSD + vehicleExtra + serviceExtra;
  
  // 4. Calcular en VES usando la tasa del backend
  const rate = parseFloat(price.exchangeRate || 0);
  const totalVES = totalUSD * rate;
 
  return {totalUSD, totalVES};
}, [formData.typevehicle, formData.typeservice, price, vehicleTypes, serviceTypes]);

  // Manejador genérico para la entrada de datos

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    if (name === 'typevehicle' || name === 'typeservice') { 
      setIsSumming(true);
      setTimeout(() => setIsSumming(false), 300); // Spinner corto de 300ms para la seleccion de servicio y vehiculo
    }
// Si cambia una dirección, invalidamos el cálculo para que handleBlur actúe
// if (name === 'pickup' || name === 'delivery') {
  if (name === 'pickupMunicipality' || name === 'deliveryMunicipality') {
  setError(null);
  setPrice(prev => ({ ...prev, isCalculated: false, priceUSD: 0 }));
}
  };


  // --- 4. FUNCIÓN ASÍNCRONA PARA LLAMAR AL BACKEND Y CALCULAR EL COSTO ---
  const calculateCost = useCallback(async () => {
    // Solo calcular si ambas direcciones tienen texto
      // if (!formData.pickup.trim() || !formData.delivery.trim()) {
        // El cálculo ahora depende de los municipios seleccionados
    if (!formData.pickupMunicipality || !formData.deliveryMunicipality) {
        setPrice({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });
        return;
    }

    setIsCalculating(true);
    setError(null);

    const calculationData = {
        // pickupAddress: formData.pickup,
        // deliveryAddress: formData.delivery,
        pickupAddress: formData.pickupMunicipality, // Enviamos el municipio para determinar zona
        deliveryAddress: formData.deliveryMunicipality

    };

    try {
        const response = await axios.post(
            `${API_BASE_URL}/calculate-cost`, 
            calculationData, 
            { withCredentials: true }
        );

        // Actualizar el estado con los precios y la tasa devueltos
        setPrice({
            priceUSD: response.data.priceUSD,
            priceVES: response.data.priceVES,
            exchangeRate: response.data.exchangeRate,
            isCalculated: true,
        });

    } catch (err) {
        console.error('Error al calcular el costo:', err.response?.data || err.message);
        
        const errorMessage = err.response?.data?.error 
            || 'No se pudo calcular el costo. Verifica las direcciones.';
            
        setError(errorMessage);
        setPrice({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });

    } finally {
        setIsCalculating(false);
    }
  // }, [formData.pickup, formData.delivery, API_BASE_URL]);
}, [formData.pickupMunicipality, formData.deliveryMunicipality, API_BASE_URL]);

  
  // // // --- 5. EFECTO PARA DISPARAR EL CÁLCULO AL salir de los input de LAS DIRECCIONES ---
const handleBlur = (e) => {
  const { name } = e.target;
  const triggerFields = ['pickupMunicipality', 'deliveryMunicipality', 'typevehicle', 'typeservice'];

  if (triggerFields.includes(name)) {
    // Si tenemos ambas direcciones y aún no se ha calculado (isCalculated: false)
    // if (formData.pickup.trim() && formData.delivery.trim() && !price.isCalculated) {
      if (formData.pickupMunicipality.trim() && formData.deliveryMunicipality.trim() && !price.isCalculated) {
      calculateCost();
    }
  }
};

  // --- 6. MANEJADOR DEL ENVÍO FINAL DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // Validación final: El precio debe haber sido calculado exitosamente
    if (!price.isCalculated || price.priceUSD <= 0) {
      setError('Por favor, espera a que el costo del servicio sea calculado y validado.');
      setIsSubmitting(false);
      return;
    }

    try {

      // Buscar los objetos originales para obtener sus IDs
  const vehicleObj = vehicleTypes.find(v => v.descript === formData.typevehicle);
  const serviceObj = serviceTypes.find(s => s.descript === formData.typeservice);
      // Datos completos a enviar al endpoint de creación de orden
      const orderPayload = { 
        pickupMunicipality: formData.pickupMunicipality,
        deliveryMunicipality: formData.deliveryMunicipality,
        pickup: formData.pickup,
      delivery: formData.delivery,
      receptpay: formData.receptpay,
      typevehicle: vehicleObj?.id, // ID numérico
      typeservice: serviceObj?.id, // ID numérico
      price: totals.totalVES,
      price_usd: totals.totalUSD,
        // ...formData,
        // typevehicle: vehicleObj?.id, // Enviamos el ID
        // typeservice: serviceObj?.id, // Enviamos el ID
        // price: totals.totalVES,
        //  price_usd: totals.totalUSD,
      };
      console.log("Enviando este payload:", orderPayload); // Revisa esto en la consola del navegador
      // 💡 Conexión al controlador de creación de orden (POST /api/client/orders)
      const response = await axios.post(`${API_BASE_URL}/client/new-order`, orderPayload, { 
        withCredentials: true 
      });

      setSuccessMessage(`¡Tu pedido #${response.data.orderId} ha sido creado! Redirigiendo...`);
      console.log('Pedido creado:', response.data);

      // Redirigir al dashboard
      // setTimeout(() => {
        navigate('/client/dashboard'); 
      // }, 500);

    } catch (err) {
      console.error('Error al crear el pedido:', err.response ? err.response.data : err.message);
      setError('Error al procesar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Reemplazado Tailwind: order-wrapper
    <div className="order-wrapper">
      {/* Reemplazado Tailwind: order-form */}
      <form onSubmit={handleSubmit} className="order-form">
        
        {/* Reemplazado Tailwind: title-heading */}
        <h2 className="title-heading">🚚 Nueva Solicitud de Entrega</h2>
        <p className="text-muted">
            Ingresa los detalles para que un Conductor pueda tomar tu pedido.
        </p>

        {/* Mensajes de estado (Usando message-box) */}
        {error && (
            <div className="message-box message-error" role="alert">
                {error}
            </div>
        )}
        {successMessage && (
            <div className="message-box message-success" role="alert">
                {successMessage}
            </div>
        )}

        <div className="form-content-area">
          
          {/* SECCIÓN ORIGEN */}
          <div className="form-group">
            <label>Municipio de Recogida (Para el costo)</label>
            <select 
              name="pickupMunicipality" 
              value={formData.pickupMunicipality} 
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">Seleccione Municipio</option>
              {municipiosApure.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Campo de Dirección de Recogida */}
          <div className="form-group">
            <label htmlFor="pickupAddress">Dirección de Recogida (Origen)</label>
              <input
              type="text"
              name="pickup"
              id="pickup"
              value={formData.pickup}
              onChange={handleChange}
              onBlur={handleBlur} // dispara la funcion al dejar el focus
              placeholder={isLoadingData? "Cargando direcciones..." : "Ej: Avenida Caracas 50, San Fernando"}
              required
              list="user-addresses" // ⬅️ Agregado: Vincula el input al datalist   
              disabled={isLoadingData}
            />
          </div>

          {/* SECCIÓN DESTINO */}
          <div className="form-group">
            <label>Municipio de Entrega</label>
            <select 
              name="deliveryMunicipality" 
              value={formData.deliveryMunicipality} 
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">Seleccione Municipio</option>
              {municipiosApure.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Campo de Dirección de Entrega */}
          <div className="form-group">
            <label htmlFor="deliveryAddress">Dirección de Entrega (Destino)</label>
            <input
              type="text"
              name="delivery"
              id="delivery"
              value={formData.delivery}
              onChange={handleChange}
              onBlur={handleBlur} // dispara la funcion al dejar el focus
              placeholder={isLoadingData ? "Cargando direcciones..." : "Ej: Avenida Central 50, Petare"}
              required
              list="user-addresses" // ⬅️ Agregado: Vincula el input al datalist
              disabled={isLoadingData}
            />
          </div>

          {/* ------------------------------------------- */}
                    {/* ⬇️ NUEVO: ELEMENTO DATALIST PARA SUGERENCIAS ⬇️ */}
                    {/* ------------------------------------------- */}
                    <datalist id="user-addresses">
                        {userAddresses.map((address, index) => (
                            <option key={index} value={address} />
                        ))}
                    </datalist>
                    {/* ------------------------------------------- */}

{/* tipo de Vehiculo */}
<div className="form-group">
  <label htmlFor="typevehicle">Tipo de Vehiculo</label>
  <select
    name="typevehicle"
    id="typevehicle"
    value={formData.typevehicle} // Nota: Cambié .pay por .typedelivery para que coincida con el name
    onChange={handleChange}
    onBlur={handleBlur} // dispara la funcion al dejar el focus
    required
    disabled={isLoadingData}
  >
<option value="" disabled hidden>
                {isLoadingData ? "Cargando..." : "Seleccione un vehículo"}
              </option>
              {vehicleTypes.map((v) => (
                // <option key={v.id} value={v.descript}>
                //   {v.descript}
                <option key={v.id} value={v.descript}>{v.descript} (+${v.amount_pay})</option>
                // </option>
              ))}
  </select>
</div>
          
          {/* tipo de servicio */}
          <div className="form-group">
          <label htmlFor="typeservice">Tipo de Servicio</label>
  <select
    name="typeservice"
    id="typeservice"
    value={formData.typeservice}
    onChange={handleChange}
    onBlur={handleBlur} // dispara la funcion al dejar el focus
    required
    disabled={isLoadingData}
  >
<option value="" disabled hidden>
                {isLoadingData ? "Cargando..." : "Seleccione un servicio"}
              </option>
              {serviceTypes.map((s) => (
                // <option key={s.id} value={s.descript}>
                //   {s.descript}
                <option key={s.id} value={s.descript}>{s.descript} (+${s.amount_pay})</option>
                // </option>
              ))}
  </select>
          </div>

          
          {/* --- RESUMEN DE COSTO CALCULADO --- */}
          <div className="price-summary">
            <h4 className="price-title">
                {(isCalculating || isSumming) && (
                     // Usamos spinner SVG con estilo básico, asumiendo CSS externo para la animación
                     <svg className="spinner" style={{ marginRight: '8px', height: '1.25em', width: '1.25em' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {/* {isCalculating ? 'Calculando Costo...' : 'Costo de Entrega'} */}
                {isCalculating ? 'Calculando Distancia...' : isSumming ? 'Actualizando Totales...' : 'Costo de Entrega'}
            </h4>
            
            <div className="price-details">
                <p>Costo (USD):</p>
                <p className="price-usd">
                    {/* ${price.priceUSD.toFixed(2)} */}
                    ${totals.totalUSD.toFixed(2)}
                </p>

                <p>Costo (VES):</p>
                <p className="price-ves">
                    {/* {price.priceVES.toFixed(2)} Bs. */}
                    {totals.totalVES.toFixed(2)} Bs.
                </p>
            </div>
            
            {price.exchangeRate > 0 && (
                 <p className="exchange-rate-info">
                    Tasa utilizada: 1 USD = {price.exchangeRate.toFixed(2)} Bs. (BCV)
                </p>
            )}
          </div>
          
          {/* Comprobante de pago */}
          <div className="form-group">
            <label htmlFor="receptpay"> Nro Comprobante de pago</label>
            <input
              type="text"
              name="receptpay"
              id="receptpay"
              value={formData.receptpay}
              onChange={handleChange}
              placeholder='Indique nro de comprobante de pago'
              required
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting || isCalculating || !price.isCalculated || !formData.typevehicle || !formData.typeservice || price.priceUSD <= 0}
            className={`btn-delivery ${
              (isSubmitting || !price.isCalculated || price.priceUSD <= 0) 
                ? 'btn-disabled' 
                : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="spinner" style={{ marginRight: '8px', height: '1.25em', width: '1.25em' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Solicitando...
              </>
            ) : (
              'Confirmar Pedido'
            )}
          </button>
          
          {!price.isCalculated && !isCalculating && (
              <p className="status-message">
                  Ingresa las direcciones para calcular el costo.
              </p>
          )}

        </div>
      </form>
      
    </div>
  );
}

export default OrderForm;


// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import '../../styles/orderForm.css';
// import { SearchBox } from '@mapbox/search-js-react';
// import { Map, Source, Layer } from 'react-map-gl'; 
// import 'mapbox-gl/dist/mapbox-gl.css';

// // Límites geográficos para el Estado Apure
// const APURE_BOUNDS = [
//   [-72.0, 6.0], 
//   [-66.0, 8.5]  
// ];

// const apureMask = {
//   type: 'Feature',
//   geometry: {
//     type: 'Polygon',
//     coordinates: [
//       [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
//       [[-72.0, 6.0], [-66.0, 6.0], [-66.0, 8.5], [-72.0, 8.5], [-72.0, 6.0]]
//     ]
//   }
// };

// function OrderForm() {
//   const navigate = useNavigate();
//   // const API_BASE_URL = window.API_BASE_URL;
//   // const MAPBOX_TOKEN = window.MAPBOX_TOKEN;
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

//   const [formData, setFormData] = useState({ pickup: '', delivery: '', typevehicle: "", typeservice: '', receptpay: '' });
//   const [coords, setCoords] = useState({ pickup: null, delivery: null });
//   const [viewState, setViewState] = useState({ longitude: -67.4723, latitude: 7.8878, zoom: 14 });
//   const [mapTarget, setMapTarget] = useState('pickup'); 
//   const [vehicleTypes, setVehicleTypes] = useState([]);
//   const [serviceTypes, setServiceTypes] = useState([]);
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [price, setPrice] = useState({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });
  
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [isSumming, setIsSumming] = useState(false);
//   const [isReverseGeocoding, setIsReverseGeocoding] = useState(false); 
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         const [vehicleRes, serviceRes] = await Promise.all([
//           axios.get(`${API_BASE_URL}/utils/vehicle`, { withCredentials: true }),
//           axios.get(`${API_BASE_URL}/utils/service`, { withCredentials: true })
//         ]);
//         setVehicleTypes(vehicleRes.data);
//         setServiceTypes(serviceRes.data);
//       } catch (err) {
//         setError('Error al cargar opciones del formulario.');
//       } finally {
//         setIsLoadingData(false);
//       }
//     };
//     fetchInitialData();
//   }, [API_BASE_URL]);

//   const totals = useMemo(() => {
//     const v = vehicleTypes.find(v => v.descript === formData.typevehicle);
//     const s = serviceTypes.find(s => s.descript === formData.typeservice);
//     const totalUSD = (price.priceUSD || 0) + (v ? parseFloat(v.amount_pay) : 0) + (s ? parseFloat(s.amount_pay) : 0);
//     return { totalUSD, totalVES: totalUSD * (price.exchangeRate || 0) };
//   }, [formData, price, vehicleTypes, serviceTypes]);

//   // FUNCIÓN ACTUALIZADA: Formato compatible con el nuevo controlador
//   const calculateCost = useCallback(async (currentCoords) => {
//     if (!currentCoords.pickup || !currentCoords.delivery) return;
//     setIsCalculating(true);
//     setError(null);
//     try {
//       const res = await axios.post(`${API_BASE_URL}/calculate-cost`, {
//         pickupAddress: "Mapa", 
//         deliveryAddress: "Mapa",
//         // Enviamos como objeto para mayor claridad, el controlador nuevo acepta ambos
//         pickupCoords: {
//           lng: currentCoords.pickup[0],
//           lat: currentCoords.pickup[1]
//         },
//         deliveryCoords: {
//           lng: currentCoords.delivery[0],
//           lat: currentCoords.delivery[1]
//         }
//       }, { withCredentials: true });
      
//       setPrice({ ...res.data, isCalculated: true });
//     } catch (err) {
//       console.error("Error al calcular costo:", err.response?.data);
//       setError(err.response?.data?.error || 'Error al procesar la ruta. Verifica el destino.');
//     } finally { 
//       setIsCalculating(false); 
//     }
//   }, [API_BASE_URL]);

//   const handleRetrieve = (type, res) => {
//     const point = res.features[0].geometry.coordinates;
//     const address = res.features[0].properties.full_address || res.features[0].properties.name;
//     const newCoords = { ...coords, [type]: point };
//     setCoords(newCoords);
//     setFormData(p => ({ ...p, [type]: address }));
//     if (newCoords.pickup && newCoords.delivery) calculateCost(newCoords);
//     setViewState(v => ({ ...v, longitude: point[0], latitude: point[1] }));
//   };

//   const confirmMapPoint = async () => {
//     const { longitude, latitude } = viewState;
//     setIsReverseGeocoding(true);
//     setError(null);

//     try {
//       const response = await axios.get(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=es&types=address,poi,neighborhood,locality&limit=1`
//       );

//       const feature = response.data.features[0];
//       let referenceText = "";

//       if (feature && feature.place_name) {
//         const cleanName = feature.place_name.replace(/, \d{4}, Venezuela$/, "").replace(", Venezuela", "");
//         referenceText = `${cleanName} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
//       } else {
//         referenceText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
//       }
      
//       const newCoords = { ...coords, [mapTarget]: [longitude, latitude] };
//       setCoords(newCoords);
//       setFormData(prev => ({ ...prev, [mapTarget]: referenceText })); 

//       if (newCoords.pickup && newCoords.delivery) {
//         calculateCost(newCoords);
//       }
//     } catch (err) {
//       setError("No se pudo obtener la ubicación del mapa.");
//     } finally {
//       setIsReverseGeocoding(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(p => ({ ...p, [name]: value }));
//     if (name === 'typevehicle' || name === 'typeservice') {
//       setIsSumming(true);
//       setTimeout(() => setIsSumming(false), 300);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!price.isCalculated) return;
//     setIsSubmitting(true);
//     try {
//       const v = vehicleTypes.find(v => v.descript === formData.typevehicle);
//       const s = serviceTypes.find(s => s.descript === formData.typeservice);
//       await axios.post(`${API_BASE_URL}/client/new-order`, {
//         ...formData, 
//         typevehicle: v?.id, 
//         typeservice: s?.id,
//         price: totals.totalVES, 
//         price_usd: totals.totalUSD,
//         pickup_lat: coords.pickup[1], 
//         pickup_lng: coords.pickup[0],
//         delivery_lat: coords.delivery[1], 
//         delivery_lng: coords.delivery[0]
//       }, { withCredentials: true });
//       navigate('/client/dashboard');
//     } catch (err) { 
//       setError('Error al procesar el pedido. Intenta nuevamente.');
//     } finally { 
//       setIsSubmitting(false); 
//     }
//   };

//   return (
//     <div className="order-wrapper">
//       <style>{`.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-group { display: none !important; }`}</style>
//       <form onSubmit={handleSubmit} className="order-form">
//         <h2 className="title-heading">🚚 Nueva Solicitud de Entrega</h2>

//         <div className="map-container" style={{ height: '280px', marginBottom: '20px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ccc' }}>
//           <Map
//             {...viewState}
//             onMove={evt => setViewState(evt.viewState)}
//             mapStyle="mapbox://styles/mapbox/streets-v11"
//             mapboxAccessToken={MAPBOX_TOKEN}
//             maxBounds={APURE_BOUNDS}
//             minZoom={7}
//           >
//             <Source id="apure-mask" type="geojson" data={apureMask}>
//               <Layer id="mask-layer" type="fill" paint={{ 'fill-color': '#000', 'fill-opacity': 0.2 }} />
//               <Layer id="line-layer" type="line" paint={{ 'line-color': '#007bff', 'line-width': 2, 'line-dasharray': [2, 1] }} />
//             </Source>
//           </Map>
          
//           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', pointerEvents: 'none', fontSize: '28px', zIndex: 10 }}>📍</div>
          
//           <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 20 }}>
//             <div style={{ display: 'flex', gap: '6px' }}>
//               <button type="button" onClick={() => setMapTarget('pickup')} style={{ flex: 1, backgroundColor: mapTarget === 'pickup' ? '#007bff' : '#fff', color: mapTarget === 'pickup' ? '#fff' : '#555', fontSize: '11px', padding: '6px', borderRadius: '20px', border: 'none', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Origen</button>
//               <button type="button" onClick={() => setMapTarget('delivery')} style={{ flex: 1, backgroundColor: mapTarget === 'delivery' ? '#007bff' : '#fff', color: mapTarget === 'delivery' ? '#fff' : '#555', fontSize: '11px', padding: '6px', borderRadius: '20px', border: 'none', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Destino</button>
//             </div>
            
//             <button 
//               type="button" 
//               onClick={confirmMapPoint} 
//               disabled={isReverseGeocoding}
//               style={{ 
//                 width: '100%', 
//                 backgroundColor: isReverseGeocoding ? '#ccc' : '#28a745', 
//                 color: '#fff', 
//                 fontWeight: 'bold', 
//                 padding: '10px', 
//                 borderRadius: '8px', 
//                 border: 'none', 
//                 fontSize: '13px', 
//                 boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
//                 cursor: isReverseGeocoding ? 'not-allowed' : 'pointer'
//               }}>
//               {isReverseGeocoding ? 'Buscando...' : `Confirmar ${mapTarget === 'pickup' ? 'Recogida' : 'Entrega'}`}
//             </button>
//           </div>
//         </div>

//         {error && <div className="message-box message-error">{error}</div>}

//         <div className="form-content-area">
//         <div className="form-group" style={{ position: 'relative', overflow: 'visible' }}>
//   <label>Dirección de Recogida {coords.pickup && "✅"}</label>
//   <SearchBox 
//     accessToken={MAPBOX_TOKEN} 
//     options={{ 
//       country: 'VE', 
//       language: 'es', 
//       proximity: [-67.4723, 7.8878], 
//       // Agregamos 'place' al final pero priorizamos 'poi' y 'neighborhood'
//       types: 'poi,neighborhood,street,address,place',
//       // Esto es clave: aumenta la sensibilidad de búsqueda
//       limit: 10 
//     }} 
//     onRetrieve={(res) => handleRetrieve('pickup', res)} 
//     value={formData.pickup}
//     onChange={(val) => setFormData(prev => ({ ...prev, pickup: val }))}
//     placeholder="Escribe un local, calle o urbanización..."
//   />
// </div>

// <div className="form-group" style={{ position: 'relative', overflow: 'visible' }}>
//   <label>Dirección de Entrega {coords.delivery && "✅"}</label>
//   <SearchBox 
//     accessToken={MAPBOX_TOKEN} 
//     options={{ 
//       country: 'VE', 
//       language: 'es', 
//       proximity: [-67.4723, 7.8878],
//       types: 'poi,neighborhood,street,address,place',
//       limit: 10
//     }} 
//     onRetrieve={(res) => handleRetrieve('delivery', res)} 
//     value={formData.delivery}
//     onChange={(val) => setFormData(prev => ({ ...prev, delivery: val }))}
//     placeholder="Escribe un local, calle o urbanización..."
//   />
// </div>
//           {/* <div className="form-group">
//             <label>Dirección de Recogida {coords.pickup && "✅"}</label>
//             <SearchBox 
//               accessToken={MAPBOX_TOKEN} 
//               options={{ country: 'VE', language: 'es', proximity: [-67.47, 7.88], bbox: [-72.0, 6.0, -66.0, 8.5] }} 
//               onRetrieve={(res) => handleRetrieve('pickup', res)} 
//               placeholder="Busca o usa el mapa arriba" 
//               value={formData.pickup} 
//             />
//           </div>

//           <div className="form-group">
//             <label>Dirección de Entrega {coords.delivery && "✅"}</label>
//             <SearchBox 
//               accessToken={MAPBOX_TOKEN} 
//               options={{ country: 'VE', language: 'es', proximity: [-67.47, 7.88], bbox: [-72.0, 6.0, -66.0, 8.5] }} 
//               onRetrieve={(res) => handleRetrieve('delivery', res)} 
//               placeholder="Busca o usa el mapa arriba" 
//               value={formData.delivery} 
//             />
//           </div> */}

//           <div className="form-group">
//             <label>Vehículo</label>
//             <select name="typevehicle" value={formData.typevehicle} onChange={handleChange} required disabled={isLoadingData}>
//               <option value="" disabled hidden>Seleccione vehículo</option>
//               {vehicleTypes.map(v => <option key={v.id} value={v.descript}>{v.descript} (+${v.amount_pay})</option>)}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>Servicio</label>
//             <select name="typeservice" value={formData.typeservice} onChange={handleChange} required disabled={isLoadingData}>
//               <option value="" disabled hidden>Seleccione servicio</option>
//               {serviceTypes.map(s => <option key={s.id} value={s.descript}>{s.descript} (+${s.amount_pay})</option>)}
//             </select>
//           </div>

//           <div className="price-summary">
//             <h4 className="price-title">
//               {(isCalculating || isSumming) && <svg className="spinner" viewBox="0 0 24 24" style={{width:'1.25em', marginRight:'8px'}}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle></svg>}
//               Costo de Entrega
//             </h4>
//             <div className="price-details">
//               <p>Total USD: <strong>${totals.totalUSD.toFixed(2)}</strong></p>
//               <p>Total VES: <strong>{totals.totalVES.toFixed(2)} Bs.</strong></p>
//             </div>
//           </div>

//           <div className="form-group">
//             <label>Comprobante</label>
//             <input type="text" name="receptpay" value={formData.receptpay} onChange={handleChange} placeholder='Referencia' required />
//           </div>

//           <button 
//             type="submit" 
//             disabled={isSubmitting || isCalculating || isReverseGeocoding || !price.isCalculated || !formData.typevehicle || !formData.typeservice} 
//             className={`btn-delivery ${ (isSubmitting || !price.isCalculated) ? 'btn-disabled' : '' }`}
//           >
//             {isSubmitting ? 'Solicitando...' : 'Confirmar Pedido'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default OrderForm;