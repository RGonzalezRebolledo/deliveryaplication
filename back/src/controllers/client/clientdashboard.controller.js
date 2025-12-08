import { pool } from '../../db.js';

// Controlador para obtener todos los pedidos de un cliente específico
export const getClientOrders = async (req, res) => {
    // El 'id' del usuario (cliente) se extrae del token JWT
    // Se asume que este ID ya fue validado por un middleware de autenticación
    const clienteId = req.userId; 

    if (!clienteId) {
        return res.status(401).json({ error: 'ID de cliente no proporcionado en el token.' });
    }

    try {
        // Consulta para obtener un resumen de los pedidos del cliente
        // Utilizamos la vista o hacemos un JOIN para obtener los datos relevantes
        const result = await pool.query(
            `SELECT 
                p.id AS pedido_id,
                p.fecha_pedido,
                p.estado,
                p.total,
                d.calle,
                d.ciudad
             FROM pedidos p
             JOIN direcciones d ON p.direccion_entrega_id = d.id
             WHERE p.cliente_id = $1
             ORDER BY p.fecha_pedido DESC`,
            [clienteId]
        );

                // 💡 LÓGICA AGREGADA: Verificar si no hay registros
                if (result.rows.length === 0) {
                    // Devolvemos un 200 (OK) con un array vacío pero con un mensaje
                    // El frontend debe manejar el array vacío.
                    return res.status(200).json({
                        message: 'No tienes pedidos registrados en este momento.',
                        orders: []
                    });
                }

        // Mapear los resultados para un formato más limpio antes de enviarlos
        const orders = result.rows.map(order => ({
            id: order.pedido_id,
            date: new Date(order.fecha_pedido).toLocaleDateString('es-ES', { 
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            }),
            status: order.estado,
            total: parseFloat(order.total).toFixed(2),
            address: `${order.calle}, ${order.ciudad}`
        }));


        res.status(200).json(orders);

    } catch (error) {
        console.error("Error al obtener pedidos del cliente:", error);
        res.status(500).json({ error: 'Error interno del servidor al consultar pedidos.' });
    }
};

// NOTA: Debes configurar una ruta para este controlador, por ejemplo:
// router.get('/client/orders', verifyToken, getClientOrders); 
// Donde 'verifyToken' es tu middleware JWT que agrega el req.userId