

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/orderForm.css';

// Componente principal para crear una nueva orden de entrega
function OrderForm() {
  const navigate = useNavigate();
  
  // URL base, asumimos que está configurada globalmente
  const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

  // --- 1. ESTADO DEL FORMULARIO Y DATOS DE ENTRADA ---
  const [formData, setFormData] = useState({
    pickup: '', // Dirección de recogida
    delivery: '', // Dirección de entrega
    details: '', // Descripción del paquete
    typevehicle: "",
    typeservice: ''
    // weightKg: '', // Peso en kilogramos
  });

// --- 2. NUEVO ESTADO: ALMACENAR DIRECCIONES REGISTRADAS ---
const [userAddresses, setUserAddresses] = useState([]);
const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

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
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // -------------------------------------------------------------
    // 🛑 ARREGLO DEL ERROR: useEffect debe estar aquí, en el nivel superior
    // -------------------------------------------------------------
    useEffect(() => {
      const fetchAddresses = async () => {
          try {
              // Suponemos un endpoint GET /client/addresses
              const response = await axios.get(`${API_BASE_URL}/client/addresses`, { 
                  withCredentials: true 
              });
              
              const addressStrings = response.data.map(addr => addr.calle);
              setUserAddresses(addressStrings);

          } catch (err) {
              console.error('Error al cargar direcciones:', err);
              // Aquí podrías manejar el error de carga de direcciones si fuera crítico
          } finally {
              setIsLoadingAddresses(false); // ⬅️ Esto habilita los inputs
          }
      };

      fetchAddresses();
  }, [API_BASE_URL]);
  // -------------------------------------------------------------

  // Manejador genérico para la entrada de datos

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    
    // **CORRECCIÓN APLICADA AQUÍ:** // Solo limpiar mensajes y resetear cálculo si el cambio afecta la lógica de precios
    if (name === 'pickup' || name === 'delivery') {
      setError(null);
      setPrice({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });
    }
    // Si cambia 'details', solo se actualiza formData, el cálculo previo permanece.
  };


  // --- 4. FUNCIÓN ASÍNCRONA PARA LLAMAR AL BACKEND Y CALCULAR EL COSTO ---
  const calculateCost = useCallback(async () => {
    // Solo calcular si ambas direcciones tienen texto
    if (!formData.pickup || !formData.delivery) {
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

  
  // // --- 5. EFECTO PARA DISPARAR EL CÁLCULO AL salir de los input de LAS DIRECCIONES ---
    const handleBlur = (e) => {
        const { name } = e.target;
        // Solo proceder si el campo que perdió el foco es 'pickup' o 'delivery'
        // y si AMBOS campos tienen contenido.
        if ((name === 'pickup' || name === 'delivery') && formData.pickup && formData.delivery) {
            // Se espera un pequeño retraso para asegurar que React actualice el estado
            // antes de llamar a calculateCost, aunque en la práctica el estado ya está actualizado.
            calculateCost();
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
      // Datos completos a enviar al endpoint de creación de orden
      const orderPayload = { 
        ...formData, 
        price: price.priceVES,
         price_usd: price.priceUSD,
        // price_ves: price.priceVES,
        // exchange_rate: price.exchangeRate
      };

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
              placeholder={isLoadingAddresses ? "Cargando direcciones..." : "Ej: Avenida Central 50, Petare"}
              required
              list="user-addresses" // ⬅️ Agregado: Vincula el input al datalist
              disabled={isLoadingAddresses}
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
              placeholder={isLoadingAddresses ? "Cargando direcciones..." : "Ej: Avenida Central 50, Petare"}
              required
              list="user-addresses" // ⬅️ Agregado: Vincula el input al datalist
              disabled={isLoadingAddresses}
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
    required
  >
{/* Esta opción aparece por defecto y no es seleccionable después */}
<option value="" disabled hidden>Seleccione un vehículo</option>
    <option value="moto">Moto</option>
    <option value="carro">Carro</option>
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
    required
  >
{/* Esta opción aparece por defecto y no es seleccionable después */}
<option value="" disabled hidden>Seleccione un Servicio</option>
    <option value="entrega">entrega</option>
    <option value="taxi">taxi</option>
    <option value="compra">compras</option>
  </select>
          </div>

          {/* Campo de Descripción*/}
          <div className="form-group-flex">
            
            {/* Descripción del Paquete */}
            <div className="form-group">
              <label htmlFor="itemDescription">Descripción del Paquete</label>
              <textarea
                name="details"
                id="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Ej: Documentos importantes, laptop, caja con ropa"
                rows="3"
                required
              ></textarea>
            </div>
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
              id="preceptpay"
              value={formData.pay}
              onChange={handleChange}
              placeholder='Indique nro de comprobante de pago'
              required
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting || isCalculating || !price.isCalculated || price.priceUSD <= 0}
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
