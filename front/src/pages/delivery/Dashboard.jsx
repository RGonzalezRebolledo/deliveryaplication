import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Configuración del socket (Ajusta la URL a tu backend en Railway)
const socket = io(API_BASE_URL, {
    withCredentials: true,
    autoConnect: true
});

function DeliveryDashboard({ user }) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    // Solicitar permiso para notificaciones al cargar
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (user?.id) {
      // 1. Unirse a la sala privada al conectar
      socket.emit('join_driver_room', user.id);
      console.log(`📡 Conectado al canal privado: user_${user.id}`);
    }

    // 2. Escuchar nuevos pedidos asignados por FIFO
    socket.on('NUEVO_PEDIDO', (data) => {
      console.log("🚀 ¡Pedido recibido por Socket!", data);
      
      playNotificationSound();
      setActiveOrder(data);
      
      if (Notification.permission === "granted") {
        new Notification("🚀 ¡Nuevo Pedido Gazzella!", {
          body: `Cliente: ${data.cliente.nombre} - Ganancia: $${data.monto}`,
          icon: '/logo.png' // Opcional: ruta a tu logo
        });
      }
    });

    return () => {
      socket.off('NUEVO_PEDIDO');
    };
  }, [user]);

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/alert.mp3'); 
    audio.play().catch(e => console.log("Esperando interacción del usuario para sonido..."));
  };

  const handleAcceptOrder = (orderId) => {
    console.log(`Repartidor aceptó el Pedido #${orderId}`);
    // Aquí podrías emitir al servidor para que el cliente sepa que vas en camino
    // socket.emit('driver_accepted', { orderId, driverId: user.id });
    
    alert(`¡Pedido #${orderId} aceptado! Generando ruta...`);
    // Aquí podrías usar navigate(`/ruta/${orderId}`)
  };
  
  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    // Opcional: Avisar al servidor para que te saque de la cola FIFO
    // socket.emit('change_availability', { userId: user.id, available: !isAvailable });
  };

  return (
    <div className="client-dashboard">
      {/* Header con Estado */}
      <div className="order-card-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>🛵 Panel Gazzella</h2>
        <span className={isAvailable ? "status-online" : "status-offline"}>
          {isAvailable ? "● En Línea" : "● Desconectado"}
        </span>
      </div>

      {/* Selector de disponibilidad */}
      <div className="availability-toggle" style={{ marginBottom: '25px' }}>
        <button 
          onClick={toggleAvailability} 
          className={isAvailable ? 'btn-success' : 'btn-primary'}
          style={{ width: '100%' }}
        >
          {isAvailable ? '🔴 Pausar Recepción' : '🟢 Ponerme Disponible'}
        </button>
      </div>

      {/* Lógica de Tarjetas */}
      {!activeOrder ? (
        <div className="no-orders-container">
          <div className="spinner-border text-primary" style={{ marginBottom: '15px' }}></div>
          <p className="no-orders-msg">Buscando pedidos disponibles...</p>
          <small style={{ color: '#718096' }}>Te avisaremos apenas caiga una carrera</small>
        </div>
      ) : (
        <div className="order-card-delivery highlight-order">
          <div className="badge-new">¡NUEVA CARRERA!</div>
          
          <div className="price-main-display">
            <span>Ganancia Total</span>
            <h2>${activeOrder.monto}</h2>
          </div>

          <div className="order-details-container">
            <div className="order-info-row">
              <div className="icon-circle">👤</div>
              <div>
                <small style={{ color: '#718096', display: 'block' }}>Cliente</small>
                <p className="address-text">{activeOrder.cliente.nombre}</p>
              </div>
            </div>

            <div className="order-info-row">
              <div className="icon-circle">🏬</div>
              <div>
                <small style={{ color: '#718096', display: 'block' }}>Recogida (Origen)</small>
                <p className="address-text">{activeOrder.cliente.recogida}</p>
              </div>
            </div>

            <div className="order-info-row">
              <div className="icon-circle">🏠</div>
              <div>
                <small style={{ color: '#718096', display: 'block' }}>Entrega (Destino)</small>
                <p className="address-text">{activeOrder.cliente.entrega}</p>
                <span className="status-pill pill-proceso" style={{ fontSize: '0.6rem' }}>
                  {activeOrder.cliente.municipio}
                </span>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={() => handleAcceptOrder(activeOrder.pedido_id)}
              className="btn-accept"
            >
              ACEPTAR Y EMPEZAR
            </button>
            <button 
              onClick={() => setActiveOrder(null)}
              className="btn-reject"
            >
              Rechazar esta vez
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default DeliveryDashboard;



// import React, { useState } from 'react';

// // Datos simulados de pedidos pendientes (estado C5: En Espera)
// const mockAvailableOrders = [
//   { id: 201, pickup: 'Panadería La Esquina', delivery: 'Calle Falsa 123', distance: '3.5 km', earnings: 5.50 },
//   { id: 202, pickup: 'Restaurante El Sabor', delivery: 'Av. Libertador 45', distance: '1.2 km', earnings: 3.20 },
//   { id: 203, pickup: 'Farmacia Central', delivery: 'Torre Empresarial', distance: '6.0 km', earnings: 8.00 },
// ];

// function DeliveryDashboard() {
//   const [isAvailable, setIsAvailable] = useState(true);
//   const [availableOrders, setAvailableOrders] = useState(mockAvailableOrders);

//   const handleAcceptOrder = (orderId) => {
//     // Lógica para simular la aceptación del pedido
//     console.log(`Repartidor aceptó el Pedido #${orderId}`);
    
//     // Aquí se llamaría a 'services/orderService.js' para notificar al servidor.
//     // En una aplicación real, se navegaría a OrderDetails (ej: navigate(`/delivery/order/${orderId}`))
    
//     // Filtramos el pedido aceptado de la lista
//     const updatedOrders = availableOrders.filter(order => order.id !== orderId);
//     setAvailableOrders(updatedOrders);
//     alert(`Pedido #${orderId} aceptado!`);
//   };
  
//   const toggleAvailability = () => {
//     setIsAvailable(!isAvailable);
//     console.log(`Estado de disponibilidad cambiado a: ${!isAvailable ? 'Disponible' : 'Desconectado'}`);
//   };

//   return (
//     // <div className="delivery-dashboard">
//     <div className="client-dashboard">
//       <h2>🛵 Dashboard de Repartidor</h2>
      
//       <div className={`availability-toggle status-${isAvailable ? 'online' : 'offline'}`}>
//         <p>Tu Estado Actual:</p>
//         <button onClick={toggleAvailability} className={isAvailable ? 'btn-success' : 'btn-primary'}>
//           {isAvailable ? '🟢 Disponible' : '🔴 Desconectado'}
//         </button>
//       </div>

//       <h3 className="list-header">Pedidos Cercanos ({availableOrders.length})</h3>
      
//       {availableOrders.length === 0 ? (
//         <p className="no-orders-msg">No hay pedidos disponibles cerca. Espera un momento.</p>
//       ) : (
//         availableOrders.map(order => (
//           <div key={order.id} className="order-card-delivery">
//             <h4>Pedido #{order.id}</h4>
//             <p>**Recogida:** {order.pickup}</p>
//             <p>**Entrega:** {order.delivery}</p>
//             <p>Distancia: {order.distance} | Ganancia: **${order.earnings.toFixed(2)}**</p>
            
//             <button 
//               onClick={() => handleAcceptOrder(order.id)}
//               className="btn-primary"
//             >
//               Aceptar y Empezar
//             </button>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// export default DeliveryDashboard;