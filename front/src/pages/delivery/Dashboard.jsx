import React, { useState } from 'react';

// Datos simulados de pedidos pendientes (estado C5: En Espera)
const mockAvailableOrders = [
  { id: 201, pickup: 'Panadería La Esquina', delivery: 'Calle Falsa 123', distance: '3.5 km', earnings: 5.50 },
  { id: 202, pickup: 'Restaurante El Sabor', delivery: 'Av. Libertador 45', distance: '1.2 km', earnings: 3.20 },
  { id: 203, pickup: 'Farmacia Central', delivery: 'Torre Empresarial', distance: '6.0 km', earnings: 8.00 },
];

function DeliveryDashboard() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [availableOrders, setAvailableOrders] = useState(mockAvailableOrders);

  const handleAcceptOrder = (orderId) => {
    // Lógica para simular la aceptación del pedido
    console.log(`Repartidor aceptó el Pedido #${orderId}`);
    
    // Aquí se llamaría a 'services/orderService.js' para notificar al servidor.
    // En una aplicación real, se navegaría a OrderDetails (ej: navigate(`/delivery/order/${orderId}`))
    
    // Filtramos el pedido aceptado de la lista
    const updatedOrders = availableOrders.filter(order => order.id !== orderId);
    setAvailableOrders(updatedOrders);
    alert(`Pedido #${orderId} aceptado!`);
  };
  
  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    console.log(`Estado de disponibilidad cambiado a: ${!isAvailable ? 'Disponible' : 'Desconectado'}`);
  };

  return (
    // <div className="delivery-dashboard">
    <div className="client-dashboard">
      <h2>🛵 Dashboard de Repartidor</h2>
      
      <div className={`availability-toggle status-${isAvailable ? 'online' : 'offline'}`}>
        <p>Tu Estado Actual:</p>
        <button onClick={toggleAvailability} className={isAvailable ? 'btn-success' : 'btn-primary'}>
          {isAvailable ? '🟢 Disponible' : '🔴 Desconectado'}
        </button>
      </div>

      <h3 className="list-header">Pedidos Cercanos ({availableOrders.length})</h3>
      
      {availableOrders.length === 0 ? (
        <p className="no-orders-msg">No hay pedidos disponibles cerca. Espera un momento.</p>
      ) : (
        availableOrders.map(order => (
          <div key={order.id} className="order-card-delivery">
            <h4>Pedido #{order.id}</h4>
            <p>**Recogida:** {order.pickup}</p>
            <p>**Entrega:** {order.delivery}</p>
            <p>Distancia: {order.distance} | Ganancia: **${order.earnings.toFixed(2)}**</p>
            
            <button 
              onClick={() => handleAcceptOrder(order.id)}
              className="btn-primary"
            >
              Aceptar y Empezar
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default DeliveryDashboard;