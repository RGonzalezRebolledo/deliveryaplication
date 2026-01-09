
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/orderForm.css';

// Componente principal para crear una nueva orden de entrega
function OrderForm() {
  const navigate = useNavigate();
  
  // URL base, asumimos que está configurada globalmente
  // const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';
  const API_BASE_URL = 'https://delivery-backend-production-c3cb.up.railway.app';

  // --- 1. ESTADO DEL FORMULARIO Y DATOS DE ENTRADA ---
  const [formData, setFormData] = useState({
    pickup: '', // Dirección de recogida
    delivery: '', // Dirección de entrega
    typevehicle: "",
    typeservice: '',
    receptpay: ''
  });

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
if (name === 'pickup' || name === 'delivery') {
  setError(null);
  setPrice(prev => ({ ...prev, isCalculated: false, priceUSD: 0 }));
}
  //   // **CORRECCIÓN APLICADA AQUÍ:** // Solo limpiar mensajes y resetear cálculo si el cambio afecta la lógica de precios
  //   if (name === 'pickup' || name === 'delivery') {
  //     setError(null);
  //     setPrice(prev => ({ ...prev, isCalculated: false }));
  //     // setPrice({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });
  //   // }
  //   // Si cambia 'details', solo se actualiza formData, el cálculo previo permanece.
  
  // }
  };


  // --- 4. FUNCIÓN ASÍNCRONA PARA LLAMAR AL BACKEND Y CALCULAR EL COSTO ---
  const calculateCost = useCallback(async () => {
    // Solo calcular si ambas direcciones tienen texto
    // if (!formData.pickup || !formData.delivery) {
      if (!formData.pickup.trim() || !formData.delivery.trim()) {
        setPrice({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });
        return;
    }

    setIsCalculating(true);
    setError(null);

    const calculationData = {
        pickupAddress: formData.pickup,
        deliveryAddress: formData.delivery,
        // weightKg: parseFloat(formData.weightKg) || 0, // Se envía el peso (manteniendo esta opción)
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
  }, [formData.pickup, formData.delivery, API_BASE_URL]);

  
  // // // --- 5. EFECTO PARA DISPARAR EL CÁLCULO AL salir de los input de LAS DIRECCIONES ---
const handleBlur = (e) => {
  const { name } = e.target;
  const triggerFields = ['pickup', 'delivery', 'typevehicle', 'typeservice'];

  if (triggerFields.includes(name)) {
    // Si tenemos ambas direcciones y aún no se ha calculado (isCalculated: false)
    if (formData.pickup.trim() && formData.delivery.trim() && !price.isCalculated) {
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
      setTimeout(() => {
        navigate('/client/dashboard'); 
      }, 2000);

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
              placeholder={isLoadingData? "Cargando direcciones..." : "Ej: Avenida Central 50, Petare"}
              required
              list="user-addresses" // ⬅️ Agregado: Vincula el input al datalist
              disabled={isLoadingData}
            />
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
