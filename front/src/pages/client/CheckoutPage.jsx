import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CheckoutPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Recuperamos la data del formulario anterior
    const orderData = state?.orderData;

    const [paymentInfo, setPaymentInfo] = useState({
        payerPhone: '',
        receptpay: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!orderData) {
        return <div className="message-box message-error">No hay datos de pedido pendientes.</div>;
    }

    const handleConfirmPayment = async () => {
        setLoading(true);
        setError(null);

        try {
            // Combinamos los datos del pedido con los datos del pago móvil
            const finalPayload = {
                ...orderData,
                payerPhone: paymentInfo.payerPhone,
                receptpay: paymentInfo.receptpay
            };

            const response = await axios.post(`${API_BASE_URL}/client/new-order`, finalPayload, { 
                withCredentials: true 
            });

            alert("¡Pago verificado y pedido creado!");
            navigate('/client/dashboard');

        } catch (err) {
            setError(err.response?.data?.error || 'Error al verificar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="order-wrapper">
            <div className="order-form">
                <h2 className="title-heading">💳 Resumen y Pago</h2>
                
                <div className="price-summary" style={{ marginBottom: '20px' }}>
                    <p>Total a pagar en Bolívares:</p>
                    <h3 className="price-ves">{orderData.price.toFixed(2)} Bs.</h3>
                    <p className="text-muted small">Tasa: {orderData.exchangeRate} Bs/USD</p>
                </div>

                <div className="payment-instructions" style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <h4>Datos para Pago Móvil:</h4>
                    <p><strong>Banco:</strong> Mercantil (0105)</p>
                    <p><strong>RIF:</strong> J-12345678-9</p>
                    <p><strong>Teléfono:</strong> 0412-1234567</p>
                </div>

                <hr />

                <div className="form-group">
                    <label>Teléfono del Pagador (Desde donde envió el dinero)</label>
                    <input 
                        type="text" 
                        placeholder="Ej: 04141234567"
                        value={paymentInfo.payerPhone}
                        onChange={(e) => setPaymentInfo({...paymentInfo, payerPhone: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Número de Referencia (Últimos 6 u 8 dígitos)</label>
                    <input 
                        type="text" 
                        placeholder="Ej: 123456"
                        value={paymentInfo.receptpay}
                        onChange={(e) => setPaymentInfo({...paymentInfo, receptpay: e.target.value})}
                    />
                </div>

                {error && <div className="message-box message-error">{error}</div>}

                <button 
                    onClick={handleConfirmPayment}
                    disabled={loading || !paymentInfo.payerPhone || !paymentInfo.receptpay}
                    className="btn-delivery"
                >
                    {loading ? 'Verificando con el Banco...' : 'Verificar Pago y Solicitar Delivery'}
                </button>
                
                <button onClick={() => navigate(-1)} className="btn-secondary">Volver</button>
            </div>
        </div>
    );
}

export default CheckoutPage;