

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
    pickup: '', // Dirección de recogida
    delivery: '', // Dirección de entrega
    details: '', // Descripción del paquete
    // weightKg: '', // Peso en kilogramos
  });

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

  // Manejador genérico para la entrada de datos
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData(prevData => ({
  //     ...prevData,
  //     [name]: value
  //   }));
  //   // Limpiar mensajes y resetear cálculo al cambiar la dirección
  //   setError(null);
  //   setPrice({ priceUSD: 0, priceVES: 0, exchangeRate: 0, isCalculated: false });
  // };

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

  // --- 5. EFECTO PARA DISPARAR EL CÁLCULO AL CAMBIAR LAS DIRECCIONES ---
  useEffect(() => {
    // Se ejecuta al cambiar direcciones o peso
    const handler = setTimeout(() => {
        calculateCost();
    }, 500); // Debounce de 500ms

    return () => {
        clearTimeout(handler);
    };
  }, [formData.pickup, formData.delivery, calculateCost]);


  // --- 6. MANEJADOR DEL ENVÍO FINAL DEL FORMULARIO ---
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
        price: price.priceVES
        // price_usd: price.priceUSD,
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
            Ingresa los detalles para que un repartidor pueda tomar tu pedido.
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
              placeholder="Ej: Calle Principal 101, Altamira"
              required
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