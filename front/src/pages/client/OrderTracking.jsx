import React, { useState, useEffect } from 'react';

function OrderTracking({ orderId = 103 }) { // Simulamos que recibimos el ID de un pedido
  const [status, setStatus] = useState("Esperando Repartidor");
  const [driverName, setDriverName] = useState('N/A');

  // Simulación de la conexión al backend para obtener el estado
  useEffect(() => {
    // En una app real, usarías 'services/orderService.js'
    const intervalId = setInterval(() => {
      // Simular cambios de estado
      if (status === "Esperando Repartidor") {
        setStatus("Repartidor Aceptó el Servicio");
        setDriverName("Carlos");
      } else if (status === "Repartidor Aceptó el Servicio") {
        setStatus("En Camino a Recoger");
      } else if (status === "En Camino a Recoger") {
        setStatus("En Ruta a tu Destino");
      } else if (status === "En Ruta a tu Destino") {
        setStatus("Entregado - ¡Disfruta!");
        clearInterval(intervalId); // Detener el tracking
      }
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(intervalId); // Limpiar al desmontar el componente
  }, [status]);

  const handleRating = (e) => {
    alert(`Gracias por calificar con ${e.target.value} estrellas.`);
    // Aquí se enviaría la calificación al backend
  };

  return (
    <div className="order-tracking">
      <h2>🚚 Seguimiento del Pedido #{orderId}</h2>
      
      <div className={`status-display status-${status.replace(/\s/g, '')}`}>
        <p>Estado Actual:</p>
        <h3>{status}</h3>
        <p>Repartidor Asignado: **{driverName}**</p>
      </div>

      {/* Aquí se integraría un componente de mapa (ej. Google Maps o Leaflet) */}
      <div className="map-placeholder">
        
        <p>**(Placeholder de Mapa en Vivo)**</p>
      </div>

      {status === "Entregado - ¡Disfruta!" && (
        <div className="rating-section">
          <h3>¿Cómo fue tu servicio?</h3>
          <p>
            <button value={5} onClick={handleRating}>⭐ 5</button>
            <button value={4} onClick={handleRating}>⭐ 4</button>
            <button value={3} onClick={handleRating}>⭐ 3</button>
            {/* ... más estrellas */}
          </p>
        </div>
      )}
      
      <p className="note">Recuerda: Si tienes algún problema, puedes contactarnos.</p>
    </div>
  );
}

export default OrderTracking;