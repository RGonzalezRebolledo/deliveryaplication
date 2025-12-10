

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Componente principal para crear una nueva orden de entrega
function OrderForm() {
  const navigate = useNavigate();
  
  // URL base, asumimos que está configurada globalmente
  const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

  // --- 1. ESTADO DEL FORMULARIO Y DATOS DE ENTRADA ---
  const [formData, setFormData] = useState({
    pickupAddress: '', // Dirección de recogida
    deliveryAddress: '', // Dirección de entrega
    itemDescription: '', // Descripción del paquete
    weightKg: '', // Peso en kilogramos
  });

  // --- 2. ESTADO DEL PRECIO Y TASA (Calculados por el Backend) ---
  const [price, setPrice] = useState({
    priceUSD: 0,
    priceVES: 0,
    exchangeRate: 0, // Tasa cargada inicialmente o devuelta por el cálculo
    isCalculated: false, // Indica si el cálculo fue exitoso
  });

  // --- 3. ESTADO DE LA UI Y ERRORES ---
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el envío final del pedido
  const [isCalculating, setIsCalculating] = useState(false); // Para el cálculo de costo
  const [isRateLoading, setIsRateLoading] = useState(true); // Nuevo: Carga de la tasa inicial
  const [error, setError] = useState(null);
  const [rateError, setRateError] = useState(null); // Nuevo: Error en la carga de la tasa inicial
  const [successMessage, setSuccessMessage] = useState(null);

  // Manejador genérico para la entrada de datos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    // Limpiar mensajes y resetear cálculo al cambiar la dirección
    setError(null);
    // Preservamos la tasa inicial si está cargada, pero limpiamos los precios y el estado de cálculo
    setPrice(prevPrice => ({ 
      priceUSD: 0, 
      priceVES: 0, 
      exchangeRate: prevPrice.exchangeRate, // Mantenemos la tasa previamente cargada/calculada
      isCalculated: false 
    }));
  };

  // --- 4. FUNCIÓN Y EFECTO PARA CARGAR LA TASA DEL DÍA AL MONTAR ---
  useEffect(() => {
    const fetchInitialRate = async () => {
      setIsRateLoading(true);
      setRateError(null);
      try {
        // 💡 Endpoint asumido para cargar solo la tasa. Ajusta si es diferente.
        const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`, { withCredentials: true });
        
        // Asumimos que la respuesta tiene una propiedad 'exchangeRate'
        const rate = response.data.exchangeRate;

        // Actualizar el estado de la tasa, pero no el precio o el estado de cálculo
        setPrice(prevPrice => ({
          ...prevPrice,
          exchangeRate: rate,
        }));
        
      } catch (err) {
        console.error('Error al cargar la tasa inicial:', err.response?.data || err.message);
        setRateError('No se pudo cargar la tasa de cambio actual. El cálculo podría fallar.');
      } finally {
        setIsRateLoading(false);
      }
    };

    fetchInitialRate();
  }, [API_BASE_URL]); // Se ejecuta solo al montar el componente

  // --- 5. FUNCIÓN ASÍNCRONA PARA LLAMAR AL BACKEND Y CALCULAR EL COSTO ---
  const calculateCost = useCallback(async () => {
    // Solo calcular si ambas direcciones tienen texto
    if (!formData.pickupAddress || !formData.deliveryAddress) {
        // Mantenemos la tasa precargada
        setPrice(prevPrice => ({ 
          ...prevPrice,
          priceUSD: 0, 
          priceVES: 0, 
          isCalculated: false 
        }));
        return;
    }

    setIsCalculating(true);
    setError(null);

    const calculationData = {
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        weightKg: parseFloat(formData.weightKg) || 0,
        // Nota: Aquí podrías enviar la tasa ya cargada (price.exchangeRate)
        // para que el backend la use, si no re-calcula la tasa internamente.
    };

    try {
        const response = await axios.post(
            `${API_BASE_URL}/calculate-cost`, 
            calculationData, 
            { withCredentials: true }
        );

        // La tasa devuelta por el backend es la tasa final utilizada para el cálculo.
        setPrice({
            priceUSD: response.data.priceUSD,
            priceVES: response.data.priceVES,
            exchangeRate: response.data.exchangeRate, // Se actualiza la tasa con la utilizada en el cálculo
            isCalculated: true,
        });
        setRateError(null); // Limpiar error de tasa inicial si el cálculo fue exitoso

    } catch (err) {
        console.error('Error al calcular el costo:', err.response?.data || err.message);
        
        const errorMessage = err.response?.data?.error 
            || 'No se pudo calcular el costo. Verifica las direcciones.';
            
        setError(errorMessage);
        setPrice(prevPrice => ({ 
          ...prevPrice,
          priceUSD: 0, 
          priceVES: 0, 
          isCalculated: false 
        }));
    } finally {
        setIsCalculating(false);
    }
  }, [formData.pickupAddress, formData.deliveryAddress, formData.weightKg, API_BASE_URL]);

  // --- 6. EFECTO PARA DISPARAR EL CÁLCULO AL CAMBIAR LAS DIRECCIONES ---
  useEffect(() => {
    // El cálculo solo se dispara si no estamos cargando la tasa inicial
    if (isRateLoading) return;
    
    const handler = setTimeout(() => {
        calculateCost();
    }, 500); // Debounce de 500ms

    return () => {
        clearTimeout(handler);
    };
  }, [formData.pickupAddress, formData.deliveryAddress, formData.weightKg, calculateCost, isRateLoading]);


  // --- 7. MANEJADOR DEL ENVÍO FINAL DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // Validación final: El precio debe haber sido calculado exitosamente
    if (!price.isCalculated || price.priceUSD <= 0) {
      setError('Por favor, espera a que el costo del delivery sea calculado y validado.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Datos completos a enviar al endpoint de creación de orden
      const orderPayload = { 
        ...formData, 
        price_usd: price.priceUSD,
        price_ves: price.priceVES,
        exchange_rate: price.exchangeRate
      };

      // 💡 Conexión al controlador de creación de orden (POST /api/client/orders)
      const response = await axios.post(`${API_BASE_URL}/client/orders`, orderPayload, { 
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
            Ingresa los detalles para que un repartidor pueda tomar tu pedido.
        </p>

        {/* Mensajes de estado (Usando message-box) */}
        {error && (
            <div className="message-box message-error" role="alert">
                {error}
            </div>
        )}
        {rateError && ( // Muestra error de la tasa inicial
            <div className="message-box message-warning" role="alert">
                {rateError}
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
              name="pickupAddress"
              id="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleChange}
              placeholder="Ej: Calle Principal 101, Altamira"
              required
            />
          </div>

          {/* Campo de Dirección de Entrega */}
          <div className="form-group">
            <label htmlFor="deliveryAddress">Dirección de Entrega (Destino)</label>
            <input
              type="text"
              name="deliveryAddress"
              id="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="Ej: Avenida Central 50, Petare"
              required
            />
          </div>

          {/* Campo de Descripción y Peso */}
          <div className="form-group-flex">
            
            {/* Descripción del Paquete */}
            <div className="form-group">
              <label htmlFor="itemDescription">Descripción del Paquete</label>
              <textarea
                name="itemDescription"
                id="itemDescription"
                value={formData.itemDescription}
                onChange={handleChange}
                placeholder="Ej: Documentos importantes, laptop, caja con ropa"
                rows="3"
                required
              ></textarea>
            </div>

            {/* Peso - Mantenido comentado como en el original
            <div className="form-group">
              <label htmlFor="weightKg">Peso Estimado (kg)</label>
              <input
                type="number"
                name="weightKg"
                id="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="Ej: 0.5"
                min="0.1"
                step="0.1"
                required
              />
            </div> */}
          </div>
          
          {/* --- RESUMEN DE COSTO CALCULADO --- */}
          <div className="price-summary">
            <h4 className="price-title">
                {isCalculating && (
                     // Usamos spinner SVG con estilo básico, asumiendo CSS externo para la animación
                     <svg className="spinner" style={{ marginRight: '8px', height: '1.25em', width: '1.25em' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {isCalculating ? 'Calculando Costo...' : 'Costo Estimado de Entrega'}
            </h4>
            
            <div className="price-details">
                <p>Costo (USD):</p>
                <p className="price-usd">
                    ${price.priceUSD.toFixed(2)}
                </p>

                <p>Costo (VES):</p>
                <p className="price-ves">
                    {price.priceVES.toFixed(2)} Bs.
                </p>
            </div>
            
            {/* Muestra el estado de la tasa: cargando, el valor inicial o el valor calculado */}
            {isRateLoading && (
                <p className="exchange-rate-info loading-text">
                    <svg className="spinner" style={{ marginRight: '4px', height: '1em', width: '1em' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando tasa de cambio...
                </p>
            )}
            
            {!isRateLoading && price.exchangeRate > 0 && (
                 <p className="exchange-rate-info">
                    Tasa {price.isCalculated ? 'utilizada en el cálculo' : 'actual del día'}: 
                    1 USD = {price.exchangeRate.toFixed(2)} Bs. (BCV)
                </p>
            )}
          </div>
          

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting || isCalculating || !price.isCalculated || price.priceUSD <= 0}
            className={`btn-success ${
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

      {/* Estilos CSS Plaos (Añadidos aquí ya que no hay archivo .css separado) */}
      <style jsx="true">{`
        .order-wrapper {
          padding: 20px;
          background-color: #f3f4f6; /* gray-50 */
          min-height: 100vh;
          font-family: sans-serif;
          display: flex;
          justify-content: center;
        }
        .order-form {
          width: 100%;
          max-width: 640px;
          background-color: #fff;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          box-sizing: border-box;
          margin: 20px 0;
        }
        .title-heading {
          font-size: 1.875rem; /* 3xl */
          font-weight: 800;
          color: #111827; /* gray-900 */
          margin-bottom: 8px;
        }
        .text-muted {
            color: #4b5563; /* gray-600 */
            margin-bottom: 32px;
        }
        .form-content-area {
          display: flex;
          flex-direction: column;
          gap: 24px; /* space-y-6 */
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px; /* mb-1 for label */
        }
        .form-group label {
          display: block;
          font-size: 0.875rem; /* sm */
          font-weight: 500;
          color: #374151; /* gray-700 */
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 8px 16px;
          border: 1px solid #d1d5db; /* gray-300 */
          border-radius: 8px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5; /* indigo-500 */
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5); /* ring-indigo-500 */
        }
        .form-group-flex {
            display: flex;
            gap: 24px; /* gap-6 */
        }
        .form-group-flex > div {
            flex: 1;
        }
        @media (max-width: 768px) {
            .form-group-flex {
                flex-direction: column;
            }
        }
        
        .message-box {
          padding: 16px;
          margin-bottom: 16px;
          font-size: 0.875rem; /* sm */
          border-radius: 8px;
        }
        .message-error {
          color: #b91c1c; /* red-700 */
          background-color: #fee2e2; /* red-100 */
          border: 1px solid #f87171; /* red-400 */
        }
        .message-success {
          color: #047857; /* green-700 */
          background-color: #d1fae5; /* green-100 */
          border: 1px solid #34d399; /* green-400 */
        }
        .message-warning { /* Nuevo estilo para advertencias como el error de la tasa */
          color: #b45309; /* amber-700 */
          background-color: #fef3c7; /* amber-100 */
          border: 1px solid #fcd34d; /* amber-400 */
        }

        /* Price Summary Styles */
        .price-summary {
          background-color: #eef2ff; /* indigo-50 */
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #c7d2fe; /* indigo-200 */
        }
        .price-title {
          font-size: 1.125rem; /* lg */
          font-weight: 700;
          color: #3730a3; /* indigo-800 */
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }
        .price-details {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          margin-bottom: 8px;
        }
        .price-details p {
            color: #374151; /* gray-700 */
        }
        .price-usd, .price-ves {
          text-align: right;
          font-size: 1.25rem; /* xl */
          font-weight: 800;
          color: #4f46e5; /* indigo-700 */
        }
        .exchange-rate-info {
            font-size: 0.75rem; /* xs */
            text-align: center;
            color: #6b7280; /* gray-500 */
            margin-top: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .loading-text {
          color: #4f46e5; /* indigo-600 */
        }

        /* Button Styles */
        .btn-success {
          width: 100%;
          padding: 12px 16px;
          font-weight: 600;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: background-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #4f46e5; /* indigo-600 */
          color: white;
          border: none;
          cursor: pointer;
        }
        .btn-success:hover {
            background-color: #4338ca; /* indigo-700 */
        }
        .btn-disabled, .btn-success[disabled] {
          background-color: #818cf8; /* indigo-400 */
          cursor: not-allowed;
          opacity: 0.8;
        }
        
        .status-message {
            text-align: center;
            font-size: 0.875rem; /* sm */
            color: #ef4444; /* red-500 */
        }

        /* Spinner Animation (Minimal CSS) */
        .spinner {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default OrderForm;





// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// // La URL base global definida en tu entorno
// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

// function OrderForm() {
//   const navigate = useNavigate();

//   const [pickup, setPickup] = useState('');
//   const [delivery, setDelivery] = useState('');
//   const [details, setDetails] = useState('');
//   const [priceUSD, setPriceUSD] = useState(0); // Precio en USD (calculado)
//   const [priceVES, setPriceVES] = useState(0); // Precio en VES (convertido)
  
//   const [exchangeRate, setExchangeRate] = useState(0); // Tasa de cambio del BCV
//   const [rateLoading, setRateLoading] = useState(true);

//   // Estado para mensajes de la UI
//   const [message, setMessage] = useState(null);
//   const [isError, setIsError] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);


//   // 1. FUNCIÓN PARA OBTENER LA TASA DE CAMBIO del Backend
//   useEffect(() => {
//     const fetchExchangeRate = async () => {
//         setRateLoading(true);
//         try {
//             const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`);
//             const fetchedRate = response.data.rate;
//             setExchangeRate(fetchedRate);
//             setMessage(`Tasa BCV del día: ${fetchedRate.toFixed(2)} VES/USD.`);
//             setIsError(false);
//         } catch (error) {
//             console.error("Error al cargar la tasa de cambio:", error);
//             // Usar una tasa de fallback si la llamada falla
//             setExchangeRate(36.00); 
//             setMessage('Advertencia: No se pudo obtener la tasa BCV. Usando tasa de fallback: 36.00 VES/USD.');
//             setIsError(true);
//         } finally {
//             setRateLoading(false);
//         }
//     };
//     fetchExchangeRate();
//   }, []); 

  
//   // 2. FUNCIÓN PARA CALCULAR EL PRECIO EN USD Y VES
//   const calculatePrice = useCallback(() => {
//     if (pickup && delivery) {
//         // Lógica simulada para calcular precio BASE en USD
//         const distanceFactor = (pickup.length + delivery.length) / 5;
//         const newPriceUSD = 5 + distanceFactor * 1.5; 
        
//         setPriceUSD(parseFloat(newPriceUSD.toFixed(2)));
        
//         // Conversión a VES usando la tasa obtenida
//         if (exchangeRate > 0) {
//             const newPriceVES = newPriceUSD * exchangeRate;
//             setPriceVES(parseFloat(newPriceVES.toFixed(2)));
//         } else {
//             setPriceVES(0);
//         }
//     } else {
//         setPriceUSD(0);
//         setPriceVES(0);
//     }
//   }, [pickup, delivery, exchangeRate]);

//   // Recalcular cuando cambian los inputs o la tasa
//   useEffect(() => {
//     if (!rateLoading) {
//       calculatePrice();
//     }
//   }, [calculatePrice, rateLoading]);


//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage(null);
//     setIsError(false);

//     // Validación
//     if (!pickup || !delivery || !details || priceUSD === 0) {
//       setMessage('Por favor, completa correctamente todos los campos y espera el cálculo del precio.');
//       setIsError(true);
//       return;
//     }
    
//     setIsLoading(true);

//     // 3. Enviamos ambos precios y la tasa al backend
//     const orderData = { 
//         pickup, 
//         delivery, 
//         details, 
//         price: priceUSD, 
//         // price_usd: priceUSD, 
//         // price_ves: priceVES,
//         // exchange_rate: exchangeRate
//     };
    
//     try {
//         const response = await axios.post(
//             `${API_BASE_URL}/client/new-order`, 
//             orderData, 
//             { withCredentials: true }
//         );

//         // Éxito
//         setMessage(`¡Pedido #${response.data.orderId} creado! Costo: $${priceUSD.toFixed(2)} (${priceVES.toFixed(2)} VES). Esperando un repartidor.`);
//         setIsError(false);
        
//         // Limpiar
//         setPickup('');
//         setDelivery('');
//         setDetails('');
//         setPriceUSD(0);
//         setPriceVES(0);

//         // Redirigir
//         setTimeout(() => {
//             navigate('/client/dashboard');
//         }, 3000);
        
//     } catch (error) {
//         console.error("Error al enviar el pedido:", error);
//         setIsError(true);
        
//         if (error.response?.status === 401 || error.response?.status === 403) {
//             setMessage('Sesión expirada. Por favor, inicia sesión de nuevo.');
//             setTimeout(() => navigate('/login'), 2000);
//         } else {
//             setMessage('Error al procesar tu pedido. Inténtalo de nuevo más tarde.');
//         }

//     } finally {
//         setIsLoading(false);
//     }
//   };

//   if (rateLoading) {
//     return (
//         <div className="order-wrapper">
//             <div className="message-box">
//                 Cargando
//             </div>
//         </div>
//     );
//   }

//   return (
//     <div className="order-wrapper">
//       <form onSubmit={handleSubmit} className="order-form">
//         <h2 className="title-heading">📍 Nuevo Pedido de Entrega</h2>

//         {/* --- MENSAJE DE ESTADO --- */}
//         {message && (
//             <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
//                 {message}
//             </div>
//         )}
        
//         {/* --- CAMPO PUNTO DE RECOGIDA --- */}
//         <div className="form-group">
//           <label htmlFor="pickup">Punto de Recogida (Origen)</label>
//           <input 
//             id="pickup" 
//             type="text" 
//             value={pickup} 
//             onChange={(e) => setPickup(e.target.value)} 
//             onBlur={calculatePrice} 
//             placeholder="Ej: Calle 5, Local 12"
//             required 
//           />
//         </div>

//         {/* --- CAMPO PUNTO DE ENTREGA --- */}
//         <div className="form-group">
//           <label htmlFor="delivery">Punto de Entrega (Destino)</label>
//           <input 
//             id="delivery" 
//             type="text" 
//             value={delivery} 
//             onChange={(e) => setDelivery(e.target.value)} 
//             onBlur={calculatePrice} 
//             placeholder="Ej: Avenida Principal, Casa 4"
//             required 
//           />
//         </div>

//         {/* --- CAMPO DETALLES --- */}
//         <div className="form-group">
//           <label htmlFor="details">Detalles del Encargo</label>
//           <textarea 
//             id="details" 
//             value={details} 
//             onChange={(e) => setDetails(e.target.value)} 
//             placeholder="Ej: Recoger un paquete pequeño. Pagar con efectivo."
//             required
//             rows="3"
//           />
//         </div>

//         {/* --- RESUMEN DE PRECIO --- */}
//         <div className="price-summary">
//           <p>Costo (USD): <strong>${priceUSD.toFixed(2)}</strong></p>
//           <p>Costo (VES): <strong>{priceVES.toFixed(2)} Bs.</strong></p>
          
//           <button type="button" onClick={calculatePrice} className="btn-recalculate">
//             Recalcular Precio
//           </button>
//         </div>

//         <p className="exchange-rate-info" style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginBottom: '1rem' }}>
//             Tasa BCV: 1 USD = {exchangeRate.toFixed(2)} Bs.
//         </p>

//         {/* --- BOTÓN DE ENVÍO --- */}
//         <button 
//             type="submit" 
//             disabled={isLoading || priceUSD === 0}
//             className="btn-success"
//         >
//             {isLoading ? 'Enviando...' : 'Confirmar y Solicitar Repartidor'}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default OrderForm;




// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// // La URL base global definida en tu entorno
// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

// function OrderForm() {
//   const navigate = useNavigate();

//   const [pickup, setPickup] = useState('');
//   const [delivery, setDelivery] = useState('');
//   const [details, setDetails] = useState('');
//   const [price, setPrice] = useState(0);
  
//   // Nuevo estado para mensajes de la UI (reemplaza alert)
//   const [message, setMessage] = useState(null);
//   const [isError, setIsError] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);


//   const calculatePrice = () => {
//     // Lógica simulada para calcular precio (basado en la longitud de las direcciones)
//     if (pickup && delivery) {
//         const distanceFactor = (pickup.length + delivery.length) / 5;
//         const newPrice = 5 + distanceFactor * 1.5; // Base + Factor de distancia
//         setPrice(parseFloat(newPrice.toFixed(2)));
//     } else {
//         setPrice(0);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage(null);
//     setIsError(false);

//     if (!pickup || !delivery || !details || price === 0) {
//       setMessage('Por favor, completa correctamente todos los campos y calcula el precio.');
//       setIsError(true);
//       return;
//     }
    
//     setIsLoading(true);

//     const orderData = { pickup, delivery, details, price };
    
//     try {
//         // Llama al endpoint POST /client/new-order
//         const response = await axios.post(
//             `${API_BASE_URL}/client/new-order`, 
//             orderData, 
//             { withCredentials: true }
//         );

//         // Éxito:
//         setMessage(`¡Pedido #${response.data.orderId} creado! Precio: $${price}. Esperando un repartidor.`);
//         setIsError(false);

//         // Redirigir al dashboard o seguimiento después de 3 segundos
//         setTimeout(() => {
//             navigate('/client/dashboard');
//         }, 3000);
        
//     } catch (error) {
//         console.error("Error al enviar el pedido:", error);
//         setIsError(true);
        
//         // Manejo de errores específicos
//         if (error.response?.status === 401 || error.response?.status === 403) {
//             setMessage('Sesión expirada. Por favor, inicia sesión de nuevo.');
//             setTimeout(() => navigate('/login'), 2000);
//         } else {
//             setMessage('Error al procesar tu pedido. Inténtalo de nuevo más tarde.');
//         }

//     } finally {
//         setIsLoading(false);
//     }
//   };

//   return (
//     <div className="order-wrapper"> {/* Contenedor general si lo necesitas */}
//       <form onSubmit={handleSubmit} className="order-form">
//         <h2 className="title-heading">📍 Nuevo Pedido de Entrega</h2>

//         {/* --- MENSAJE DE ESTADO (Reemplazo de alert) --- */}
//         {message && (
//             // Uso de clases condicionales simples para el mensaje
//             <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
//                 {message}
//             </div>
//         )}
        
//         {/* --- CAMPO PUNTO DE RECOGIDA --- */}
//         <div className="form-group">
//           <label htmlFor="pickup">Punto de Recogida (Origen)</label>
//           <input 
//             id="pickup" 
//             type="text" 
//             value={pickup} 
//             onChange={(e) => setPickup(e.target.value)} 
//             onBlur={calculatePrice} 
//             placeholder="Ej: Calle 5, Local 12"
//             required 
//           />
//         </div>

//         {/* --- CAMPO PUNTO DE ENTREGA --- */}
//         <div className="form-group">
//           <label htmlFor="delivery">Punto de Entrega (Destino)</label>
//           <input 
//             id="delivery" 
//             type="text" 
//             value={delivery} 
//             onChange={(e) => setDelivery(e.target.value)} 
//             onBlur={calculatePrice} 
//             placeholder="Ej: Avenida Principal, Casa 4"
//             required 
//           />
//         </div>

//         {/* --- CAMPO DETALLES --- */}
//         <div className="form-group">
//           <label htmlFor="details">Detalles del Encargo</label>
//           <textarea 
//             id="details" 
//             value={details} 
//             onChange={(e) => setDetails(e.target.value)} 
//             placeholder="Ej: Recoger un paquete pequeño. Pagar con efectivo."
//             required
//             rows="3"
//           />
//         </div>

//         {/* --- RESUMEN DE PRECIO --- */}
//         <div className="price-summary">
//           <p>Costo de la entrega: **${price}**</p>
//           <button type="button" onClick={calculatePrice} className="btn-recalculate">
//             Recalcular Precio
//           </button>
//         </div>

//         {/* --- BOTÓN DE ENVÍO --- */}
//         <button 
//             type="submit" 
//             disabled={isLoading}
//             className="btn-success btn-submit"
//         >
//             {isLoading ? 'Enviando...' : 'Confirmar y Solicitar Repartidor'}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default OrderForm;


// import React, { useState } from 'react';

// function OrderForm() {
//   const [pickup, setPickup] = useState('');
//   const [delivery, setDelivery] = useState('');
//   const [details, setDetails] = useState('');
//   const [price, setPrice] = useState(0);

//   const calculatePrice = (e) => {
//     // Lógica simulada para calcular precio (basado en la longitud de las direcciones)
//     const newPrice = (pickup.length + delivery.length) * 0.5; 
//     setPrice(newPrice.toFixed(2));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!pickup || !delivery || !details) {
//       alert('Por favor, completa todos los campos.');
//       return;
//     }
    
//     // Aquí se llamaría a 'services/orderService.js' para enviar los datos al backend
//     console.log('Pedido Enviado:', { pickup, delivery, details, price });
//     alert(`Pedido enviado. Precio estimado: $${price}. Esperando un repartidor.`);
//     // Aquí se navegaría a la pantalla de OrderTracking
//   };

//   return (
//     <form onSubmit={handleSubmit} className="order-form">
//       <h2>📍 Nuevo Pedido de Entrega</h2>
      
//       <div className="form-group">
//         <label htmlFor="pickup">Punto de Recogida (Origen)</label>
//         <input 
//           id="pickup" 
//           type="text" 
//           value={pickup} 
//           onChange={(e) => setPickup(e.target.value)} 
//           onBlur={calculatePrice} 
//           placeholder="Ej: Calle 5, Local 12"
//           required 
//         />
//       </div>

//       <div className="form-group">
//         <label htmlFor="delivery">Punto de Entrega (Destino)</label>
//         <input 
//           id="delivery" 
//           type="text" 
//           value={delivery} 
//           onChange={(e) => setDelivery(e.target.value)} 
//           onBlur={calculatePrice} 
//           placeholder="Ej: Avenida Principal, Casa 4"
//           required 
//         />
//       </div>

//       <div className="form-group">
//         <label htmlFor="details">Detalles del Encargo</label>
//         <textarea 
//           id="details" 
//           value={details} 
//           onChange={(e) => setDetails(e.target.value)} 
//           placeholder="Ej: Recoger un paquete pequeño. Pagar con efectivo."
//           required
//         />
//       </div>

//       <div className="price-summary">
//         <p>Costo de la entrega: **${price}**</p>
//       </div>

//       <button type="submit" className="btn-success">
//         Confirmar y Solicitar Repartidor
//       </button>
//     </form>
//   );
// }

// export default OrderForm;




// componente con la integracion del google map

// import React, { useState, useRef, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// // La URL base global definida en tu entorno
// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

// function OrderForm() {
//   const navigate = useNavigate();

//   // 1. Referencias para adjuntar Google Maps Autocomplete a los inputs
//   const pickupInputRef = useRef(null);
//   const deliveryInputRef = useRef(null);

//   const [pickup, setPickup] = useState('');
//   const [delivery, setDelivery] = useState('');
//   const [details, setDetails] = useState('');
//   const [price, setPrice] = useState(0);
  
//   // Nuevo estado para mensajes de la UI
//   const [message, setMessage] = useState(null);
//   const [isError, setIsError] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);


//   const calculatePrice = () => {
//     // Lógica simulada para calcular precio (basado en la longitud de las direcciones)
//     if (pickup && delivery) {
//         const distanceFactor = (pickup.length + delivery.length) / 5;
//         const newPrice = 5 + distanceFactor * 1.5; // Base + Factor de distancia
//         setPrice(parseFloat(newPrice.toFixed(2)));
//     } else {
//         setPrice(0);
//     }
//   };

//   /**
//    * 2. useEffect para inicializar Google Maps Autocomplete
//    */
//   useEffect(() => {
//     // Verificar si la biblioteca de Google Maps está disponible globalmente
//     if (window.google && window.google.maps && window.google.maps.places) {
      
//       const initializeAutocomplete = (inputRef, setterFunction) => {
//         // Opciones de configuración (opcional: limitar a un país o tipo)
//         const options = {
//           componentRestrictions: { country: 'cr' }, // Ejemplo: Limitar a Costa Rica
//           fields: ["formatted_address", "geometry", "name"], // Campos que necesitamos
//           types: ["address"],
//         };
        
//         // Crear la instancia de Autocomplete y adjuntarla al input del DOM
//         const autocomplete = new window.google.maps.places.Autocomplete(
//           inputRef.current,
//           options
//         );

//         // Listener: Cuando el usuario selecciona una dirección de la lista
//         autocomplete.addListener('place_changed', () => {
//           const place = autocomplete.getPlace();
//           if (place.formatted_address) {
//             // Actualiza el estado de React con la dirección completa
//             setterFunction(place.formatted_address);
//             // Ejecuta el cálculo de precio inmediatamente después de la selección
//             calculatePrice();
//           }
//         });
//       };
      
//       // Inicializar Autocomplete para ambos campos
//       initializeAutocomplete(pickupInputRef, setPickup);
//       initializeAutocomplete(deliveryInputRef, setDelivery);

//     } else {
//       console.warn("Google Maps Places API no se cargó correctamente.");
//     }

//   // Dependencias: Solo necesitamos que se ejecute una vez al montar el componente
//   // y que calculatePrice esté disponible.
//   }, [calculatePrice]); 

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage(null);
//     setIsError(false);

//     if (!pickup || !delivery || !details || price === 0) {
//       setMessage('Por favor, completa correctamente todos los campos y calcula el precio.');
//       setIsError(true);
//       return;
//     }
    
//     setIsLoading(true);

//     const orderData = { pickup, delivery, details, price };
    
//     try {
//         // Llama al endpoint POST /client/new-order
//         const response = await axios.post(
//             `${API_BASE_URL}/client/new-order`, 
//             orderData, 
//             { withCredentials: true }
//         );

//         // Éxito:
//         setMessage(`¡Pedido #${response.data.orderId} creado! Precio: $${price}. Esperando un repartidor.`);
//         setIsError(false);

//         // Redirigir al dashboard o seguimiento después de 3 segundos
//         setTimeout(() => {
//             navigate('/client/dashboard');
//         }, 3000);
        
//     } catch (error) {
//         console.error("Error al enviar el pedido:", error);
//         setIsError(true);
        
//         // Manejo de errores específicos
//         if (error.response?.status === 401 || error.response?.status === 403) {
//             setMessage('Sesión expirada. Por favor, inicia sesión de nuevo.');
//             setTimeout(() => navigate('/login'), 2000);
//         } else {
//             setMessage('Error al procesar tu pedido. Inténtalo de nuevo más tarde.');
//         }

//     } finally {
//         setIsLoading(false);
//     }
//   };

//   return (
//     <div className="order-wrapper"> {/* Contenedor general si lo necesitas */}
//       <form onSubmit={handleSubmit} className="order-form">
//         <h2 className="title-heading">📍 Nuevo Pedido de Entrega</h2>

//         {/* --- MENSAJE DE ESTADO --- */}
//         {message && (
//             <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
//                 {message}
//             </div>
//         )}
        
//         {/* --- CAMPO PUNTO DE RECOGIDA (Origen) --- */}
//         <div className="form-group">
//           <label htmlFor="pickup">Punto de Recogida (Origen)</label>
//           <input 
//             id="pickup" 
//             type="text" 
//             // 3. Adjuntamos la referencia al input
//             ref={pickupInputRef}
//             value={pickup} 
//             // 4. Mantenemos el onChange para actualizar el estado mientras se escribe
//             onChange={(e) => setPickup(e.target.value)} 
//             onBlur={calculatePrice} 
//             placeholder="Ej: Calle 5, Local 12"
//             required 
//           />
//         </div>

//         {/* --- CAMPO PUNTO DE ENTREGA (Destino) --- */}
//         <div className="form-group">
//           <label htmlFor="delivery">Punto de Entrega (Destino)</label>
//           <input 
//             id="delivery" 
//             type="text" 
//             // 3. Adjuntamos la referencia al input
//             ref={deliveryInputRef}
//             value={delivery} 
//             // 4. Mantenemos el onChange para actualizar el estado mientras se escribe
//             onChange={(e) => setDelivery(e.target.value)} 
//             onBlur={calculatePrice} 
//             placeholder="Ej: Avenida Principal, Casa 4"
//             required 
//           />
//         </div>

//         {/* --- CAMPO DETALLES --- */}
//         <div className="form-group">
//           <label htmlFor="details">Detalles del Encargo</label>
//           <textarea 
//             id="details" 
//             value={details} 
//             onChange={(e) => setDetails(e.target.value)} 
//             placeholder="Ej: Recoger un paquete pequeño. Pagar con efectivo."
//             required
//             rows="3"
//           />
//         </div>

//         {/* --- RESUMEN DE PRECIO --- */}
//         <div className="price-summary">
//           <p>Costo de la entrega: **${price}**</p>
//           <button type="button" onClick={calculatePrice} className="btn-recalculate">
//             Recalcular Precio
//           </button>
//         </div>

//         {/* --- BOTÓN DE ENVÍO --- */}
//         <button 
//             type="submit" 
//             disabled={isLoading}
//             className="btn-success btn-submit"
//         >
//             {isLoading ? 'Enviando...' : 'Confirmar y Solicitar Repartidor'}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default OrderForm;








