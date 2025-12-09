
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// La URL base global definida en tu entorno
const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

function OrderForm() {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [details, setDetails] = useState('');
  const [priceUSD, setPriceUSD] = useState(0); // Precio en USD (calculado)
  const [priceVES, setPriceVES] = useState(0); // Precio en VES (convertido)
  
  const [exchangeRate, setExchangeRate] = useState(0); // Tasa de cambio del BCV
  const [rateLoading, setRateLoading] = useState(true);

  // Estado para mensajes de la UI
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  // 1. FUNCIÓN PARA OBTENER LA TASA DE CAMBIO del Backend
  useEffect(() => {
    const fetchExchangeRate = async () => {
        setRateLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`);
            const fetchedRate = response.data.rate;
            setExchangeRate(fetchedRate);
            setMessage(`Tasa BCV del día: ${fetchedRate.toFixed(2)} VES/USD.`);
            setIsError(false);
        } catch (error) {
            console.error("Error al cargar la tasa de cambio:", error);
            // Usar una tasa de fallback si la llamada falla
            setExchangeRate(36.00); 
            setMessage('Advertencia: No se pudo obtener la tasa BCV. Usando tasa de fallback: 36.00 VES/USD.');
            setIsError(true);
        } finally {
            setRateLoading(false);
        }
    };
    fetchExchangeRate();
  }, []); 

  
  // 2. FUNCIÓN PARA CALCULAR EL PRECIO EN USD Y VES
  const calculatePrice = useCallback(() => {
    if (pickup && delivery) {
        // Lógica simulada para calcular precio BASE en USD
        const distanceFactor = (pickup.length + delivery.length) / 5;
        const newPriceUSD = 5 + distanceFactor * 1.5; 
        
        setPriceUSD(parseFloat(newPriceUSD.toFixed(2)));
        
        // Conversión a VES usando la tasa obtenida
        if (exchangeRate > 0) {
            const newPriceVES = newPriceUSD * exchangeRate;
            setPriceVES(parseFloat(newPriceVES.toFixed(2)));
        } else {
            setPriceVES(0);
        }
    } else {
        setPriceUSD(0);
        setPriceVES(0);
    }
  }, [pickup, delivery, exchangeRate]);

  // Recalcular cuando cambian los inputs o la tasa
  useEffect(() => {
    if (!rateLoading) {
      calculatePrice();
    }
  }, [calculatePrice, rateLoading]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    // Validación
    if (!pickup || !delivery || !details || priceUSD === 0) {
      setMessage('Por favor, completa correctamente todos los campos y espera el cálculo del precio.');
      setIsError(true);
      return;
    }
    
    setIsLoading(true);

    // 3. Enviamos ambos precios y la tasa al backend
    const orderData = { 
        pickup, 
        delivery, 
        details, 
        price_usd: priceUSD, 
        price_ves: priceVES,
        exchange_rate: exchangeRate
    };
    
    try {
        const response = await axios.post(
            `${API_BASE_URL}/client/new-order`, 
            orderData, 
            { withCredentials: true }
        );

        // Éxito
        setMessage(`¡Pedido #${response.data.orderId} creado! Costo: $${priceUSD.toFixed(2)} (${priceVES.toFixed(2)} VES). Esperando un repartidor.`);
        setIsError(false);
        
        // Limpiar
        setPickup('');
        setDelivery('');
        setDetails('');
        setPriceUSD(0);
        setPriceVES(0);

        // Redirigir
        setTimeout(() => {
            navigate('/client/dashboard');
        }, 3000);
        
    } catch (error) {
        console.error("Error al enviar el pedido:", error);
        setIsError(true);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            setMessage('Sesión expirada. Por favor, inicia sesión de nuevo.');
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setMessage('Error al procesar tu pedido. Inténtalo de nuevo más tarde.');
        }

    } finally {
        setIsLoading(false);
    }
  };

  // if (rateLoading) {
  //   return (
  //       <div className="order-wrapper">
  //           <div className="message-box">
  //               Cargando tasa de cambio del BCV...
  //           </div>
  //       </div>
  //   );
  // }

  return (
    <div className="order-wrapper">
      <form onSubmit={handleSubmit} className="order-form">
        <h2 className="title-heading">📍 Nuevo Pedido de Entrega</h2>

        {/* --- MENSAJE DE ESTADO --- */}
        {message && (
            <div className={`message-box ${isError ? 'message-error' : 'message-success'}`}>
                {message}
            </div>
        )}
        
        {/* --- CAMPO PUNTO DE RECOGIDA --- */}
        <div className="form-group">
          <label htmlFor="pickup">Punto de Recogida (Origen)</label>
          <input 
            id="pickup" 
            type="text" 
            value={pickup} 
            onChange={(e) => setPickup(e.target.value)} 
            onBlur={calculatePrice} 
            placeholder="Ej: Calle 5, Local 12"
            required 
          />
        </div>

        {/* --- CAMPO PUNTO DE ENTREGA --- */}
        <div className="form-group">
          <label htmlFor="delivery">Punto de Entrega (Destino)</label>
          <input 
            id="delivery" 
            type="text" 
            value={delivery} 
            onChange={(e) => setDelivery(e.target.value)} 
            onBlur={calculatePrice} 
            placeholder="Ej: Avenida Principal, Casa 4"
            required 
          />
        </div>

        {/* --- CAMPO DETALLES --- */}
        <div className="form-group">
          <label htmlFor="details">Detalles del Encargo</label>
          <textarea 
            id="details" 
            value={details} 
            onChange={(e) => setDetails(e.target.value)} 
            placeholder="Ej: Recoger un paquete pequeño. Pagar con efectivo."
            required
            rows="3"
          />
        </div>

        {/* --- RESUMEN DE PRECIO --- */}
        <div className="price-summary">
          <p>Costo (USD): <strong>${priceUSD.toFixed(2)}</strong></p>
          <p>Costo (VES): <strong>{priceVES.toFixed(2)} Bs.</strong></p>
          
          <button type="button" onClick={calculatePrice} className="btn-recalculate">
            Recalcular Precio
          </button>
        </div>

        <p className="exchange-rate-info" style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginBottom: '1rem' }}>
            Tasa BCV: 1 USD = {exchangeRate.toFixed(2)} Bs.
        </p>

        {/* --- BOTÓN DE ENVÍO --- */}
        <button 
            type="submit" 
            disabled={isLoading || priceUSD === 0}
            className="btn-success"
        >
            {isLoading ? 'Enviando...' : 'Confirmar y Solicitar Repartidor'}
        </button>
      </form>
    </div>
  );
}

export default OrderForm;




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








