import React, { useState } from 'react';

// Simulación de un pedido que el repartidor ha aceptado
const mockActiveOrder = {
  id: 202,
  pickup: 'Restaurante El Sabor (Av. Libertador 45)',
  delivery: 'Apartamento 3A, Calle 10 Sur',
  details: 'Una bolsa de comida, pagar al recoger $20.',
  status: 'Aceptado' // Estado inicial al aceptar
};

function OrderDetails({ orderId = mockActiveOrder.id }) {
  const [order, setOrder] = useState(mockActiveOrder);
  
  const handleUpdateStatus = (newStatus) => {
    // Lógica para notificar el cambio de estado (D5, D7)
    console.log(`Cambiando estado del Pedido #${orderId} a: ${newStatus}`);
    
    // Llama a la API (services/orderService.js)
    setOrder({ ...order, status: newStatus });
    
    if (newStatus === 'Entregado') {
      alert(`¡Entrega de Pedido #${orderId} Finalizada!`);
      // Aquí se navegaría de vuelta al DeliveryDashboard
    }
  };

  return (
    <div className="order-details-view">
      <h2>📋 Gestión de Pedido #{order.id}</h2>
      
      <div className={`status-box delivery-status-${order.status.toLowerCase().replace(/\s/g, '-')}`}>
        <p>Estado Actual:</p>
        <h3>{order.status}</h3>
      </div>
      
      <section className="location-info">
        <h3>📍 Información de Ruta</h3>
        <p><strong>Recoger en:</strong> {order.pickup}</p>
        <p><strong>Entregar en:</strong> {order.delivery}</p>
        <p><strong>Notas:</strong> {order.details}</p>
      </section>
      
      {/* Aquí iría el componente de Mapa con la ruta GPS (D4, D6) */}
      <div className="map-integration-placeholder">
        
        <p>**(Placeholder de Navegación GPS)**</p>
      </div>
      
      <div className="action-buttons">
        {order.status === 'Aceptado' && (
          <button 
            onClick={() => handleUpdateStatus('Recogido')} 
            className="btn-secondary"
          >
            ✅ Marcar como Recogido
          </button>
        )}
        
        {order.status === 'Recogido' && (
          <button 
            onClick={() => handleUpdateStatus('En Ruta')} 
            className="btn-primary"
          >
            ▶️ Iniciar Ruta de Entrega
          </button>
        )}

        {order.status === 'En Ruta' && (
          <button 
            onClick={() => handleUpdateStatus('Entregado')} 
            className="btn-success"
          >
            ✔️ Confirmar Entrega
          </button>
        )}

        {order.status === 'Entregado' && (
          <p className="success-msg">Tarea completada. Regresa al Dashboard.</p>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;