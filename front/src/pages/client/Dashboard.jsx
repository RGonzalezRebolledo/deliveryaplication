
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/AuthContext'; 

// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';
const API_BASE_URL = 'https://delivery-backend-production-c3cb.up.railway.app';

function ClientDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // 🔍 Estado para la búsqueda
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return; 
    if (!isAuthenticated) { navigate('/'); return; }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/client/orders`, { withCredentials: true });
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError('No se pudieron cargar tus pedidos.');
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, loading, navigate]);

  // 🧪 Lógica de Filtrado: Filtra por #pedido, Dirección o Estado
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const search = searchTerm.toLowerCase();
      return (
        order.id.toString().includes(search) ||
        order.address?.toLowerCase().includes(search) ||
        order.status?.toLowerCase().includes(search) ||
        order.typevehicle?.toLowerCase().includes(search)
      );
    });
  }, [orders, searchTerm]);

  const getStatusClass = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('pendien')) return 'pill-pendiente';
    if (s.includes('asigna')) return 'pill-asignado';
    if (s.includes('ruta') || s.includes('camino')) return 'pill-en-ruta';
    if (s.includes('entrega')) return 'pill-entregado';
    return 'pill-cancelado';
  };

  const userName = user?.nombre || 'Cliente'; 

  return (
    <div className="app-container">
      <div className="client-dashboard">
        
        <header style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                👋 ¡Hola, <span style={{ color: 'var(--color-primary)' }}>{userName}</span>!
            </h2>
            
            <button 
                onClick={() => navigate('/client/new-order')}
                className="btn-primary"
                style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            >
                <span>🚀</span> Solicitar Nueva Entrega
            </button>
        </header>

        {/* --- BARRA DE BÚSQUEDA --- */}
        <div className="search-container">
            <span className="search-icon">🔍</span>
            <input 
                type="text" 
                className="search-input"
                placeholder="Buscar por #Pedido, Dirección o Estatus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="recent-orders">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Tus Entregas</h3>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>
                {filteredOrders.length} resultados
            </span>
          </div>
          
          {isLoadingOrders ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Cargando tus entregas...</p>
              </div>
          ) : (
            <div className="orders-grid">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <div key={order.id} className="order-card-modern">
                    <div className="order-card-header">
                        <span className="order-id-badge">PEDIDO #{order.id}</span>
                        <span className={`status-pill ${getStatusClass(order.status)}`}>
                            {order.status}
                        </span>
                    </div>

                    <div className="order-body">
                        <div className="address-info">
                            <span style={{ color: 'var(--color-primary)' }}>📍</span>
                            <div className="address-text">{order.address}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingLeft: '25px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#999' }}>
                                📅 {new Date(order.date).toLocaleDateString()}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 'bold' }}>
                            🛵 🚗 {order.typevehicle?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="order-footer">
                        <button 
                            onClick={() => navigate(`/client/order/${order.id}`)}
                            style={{ background: 'transparent', border: '1px solid #eee', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            Ver seguimiento
                        </button>
                        <div className="price-tag">
                            <span className="amount-ves">Bs. {order.total}</span>
                            <span className="amount-usd">${order.total_usd} USD</span>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '2px dashed #eee' }}>
                    <p style={{ color: '#999' }}>
                        {searchTerm ? 'No se encontraron pedidos que coincidan.' : 'No tienes pedidos registrados.'}
                    </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../../hooks/AuthContext'; 

// const API_BASE_URL = window.GLOBAL_API_URL || 'http://localhost:4000';

// function ClientDashboard() {
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [isLoadingOrders, setIsLoadingOrders] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (loading) return; 
//     if (!isAuthenticated) { navigate('/'); return; }

//     const fetchOrders = async () => {
//       setIsLoadingOrders(true);
//       try {
//         const response = await axios.get(`${API_BASE_URL}/client/orders`, { withCredentials: true });
//         setOrders(Array.isArray(response.data) ? response.data : []);
//       } catch (err) {
//         setError('No se pudieron cargar tus pedidos.');
//       } finally {
//         setIsLoadingOrders(false);
//       }
//     };
//     fetchOrders();
//   }, [isAuthenticated, loading, navigate]);

//   // Función para asignar la clase CSS según el estado del backend
//   const getStatusClass = (status) => {
//     const s = status?.toLowerCase() || '';
//     if (s.includes('pendien')) return 'pill-pendiente';
//     if (s.includes('asigna')) return 'pill-asignado';
//     if (s.includes('ruta') || s.includes('camino')) return 'pill-en-ruta';
//     if (s.includes('entrega')) return 'pill-entregado';
//     return 'pill-cancelado';
//   };

//   const userName = user?.nombre || 'Cliente'; 

//   return (
//     <div className="app-container">
//       <div className="client-dashboard">
        
//         <header style={{ marginBottom: '30px', textAlign: 'center' }}>
//             <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>
//                 👋 ¡Hola, <span style={{ color: 'var(--color-primary)' }}>{userName}</span>!
//             </h2>
//             <p style={{ color: '#666', marginTop: '5px' }}>¿Qué enviaremos hoy?</p>
            
//             <button 
//                 onClick={() => navigate('/client/new-order')}
//                 className="btn-primary"
//                 style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
//             >
//                 <span>🚀</span> Solicitar Nueva Entrega
//             </button>
//         </header>

//         <div className="recent-orders">
//           <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Mis Pedidos Recientes</h3>
          
//           {isLoadingOrders ? (
//               <div style={{ textAlign: 'center', padding: '40px' }}>
//                   <p>Cargando tus entregas...</p>
//               </div>
//           ) : (
//             <div className="orders-grid">
//               {orders.length > 0 ? (
//                 orders.map(order => (
//                   <div key={order.id} className="order-card-modern">
                    
//                     <div className="order-card-header">
//                         <span className="order-id-badge">Solicitud #{order.id}</span>
//                         <span className={`status-pill ${getStatusClass(order.status)}`}>
//                             {order.status}
//                         </span>
//                     </div>

//                     <div className="order-body">
//                         <div className="address-info">
//                             <span style={{ color: 'var(--color-primary)' }}>📍</span>
//                             <div className="address-text">
//                                 {order.address}
//                             </div>
//                         </div>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingLeft: '25px' }}>
//                             <span style={{ fontSize: '1rem', color: '#999' }}>
//                                 📅 {new Date(order.date).toLocaleDateString()}
//                             </span>
//                             <span style={{ fontSize: '0.8rem', color: '#999' }}>
//                                 📦 {order.typevehicle || 'Estándar'}
//                             </span>
//                         </div>
//                     </div>

//                     <div className="order-footer">
//                         <button 
//                             onClick={() => navigate(`/client/order/${order.id}`)}
//                             style={{ 
//                                 background: 'transparent', 
//                                 border: '1px solid #eee', 
//                                 padding: '6px 12px', 
//                                 fontSize: '0.8rem',
//                                 borderRadius: '8px'
//                             }}
//                         >
//                             Detalles
//                         </button>
//                         <div className="price-tag">
//                             <span className="amount-ves">Bs. {order.total}</span>
//                             <span className="amount-usd">${order.total_usd} USD</span>
//                         </div>
//                     </div>

//                   </div>
//                 ))
//               ) : (
//                 <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '2px dashed #eee' }}>
//                     <p style={{ color: '#999' }}>No tienes pedidos registrados.</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ClientDashboard;