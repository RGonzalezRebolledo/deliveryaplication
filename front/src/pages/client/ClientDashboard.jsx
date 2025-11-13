import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate

const mockOrders = [
  { id: 101, item: "Dinner from Pizza Hut", status: "En Ruta", deliveryTime: "15 min" },
  { id: 102, item: "Pharmacy prescription", status: "Entregado", deliveryTime: "Ayer" },
];

function ClientDashboard() {
  const navigate = useNavigate(); // ✅ Hook llamado DENTRO del componente
  const [user, setUser] = useState({ name: 'María' });
  const [orders, setOrders] = useState(mockOrders);
  // Nota: En una app real, usarías React Router (useNavigate) para ir a OrderForm

  const handleNewOrderClick = () => {
    console.log('Navegando a la pantalla de creación de pedido...');
    navigate('/client/new-order'); // Ejemplo de navegación
  };

  return (
    <div className="client-dashboard">
      <h2>👋 ¡Hola, {user.name}!</h2>
      <p>Bienvenido a tu portal de entregas.</p>
      
      <button 
        onClick={handleNewOrderClick}
        className="btn-primary"
      >
        ➕ **Solicitar Nueva Entrega**
      </button>

      <div className="recent-orders">
        <h3>Tus Pedidos Recientes</h3>
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <h4>Pedido #{order.id}: {order.item}</h4>
            <p>Estado: **{order.status}**</p>
            <p>Estimación: {order.deliveryTime}</p>
            {/* Si el estado es 'En Ruta', se podría navegar a OrderTracking */}
          </div>
        ))}
        
        {orders.length === 0 && <p>Aún no tienes pedidos. ¡Comienza uno!</p>}
      </div>
    </div>
  );
}

export default ClientDashboard;