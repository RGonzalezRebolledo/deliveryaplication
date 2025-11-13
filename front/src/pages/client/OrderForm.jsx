import React, { useState } from 'react';

function OrderForm() {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [details, setDetails] = useState('');
  const [price, setPrice] = useState(0);

  const calculatePrice = (e) => {
    // Lógica simulada para calcular precio (basado en la longitud de las direcciones)
    const newPrice = (pickup.length + delivery.length) * 0.5; 
    setPrice(newPrice.toFixed(2));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !delivery || !details) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    
    // Aquí se llamaría a 'services/orderService.js' para enviar los datos al backend
    console.log('Pedido Enviado:', { pickup, delivery, details, price });
    alert(`Pedido enviado. Precio estimado: $${price}. Esperando un repartidor.`);
    // Aquí se navegaría a la pantalla de OrderTracking
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <h2>📍 Nuevo Pedido de Entrega</h2>
      
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

      <div className="form-group">
        <label htmlFor="details">Detalles del Encargo</label>
        <textarea 
          id="details" 
          value={details} 
          onChange={(e) => setDetails(e.target.value)} 
          placeholder="Ej: Recoger un paquete pequeño. Pagar con efectivo."
          required
        />
      </div>

      <div className="price-summary">
        <p>Costo de la entrega: **${price}**</p>
      </div>

      <button type="submit" className="btn-success">
        Confirmar y Solicitar Repartidor
      </button>
    </form>
  );
}

export default OrderForm;