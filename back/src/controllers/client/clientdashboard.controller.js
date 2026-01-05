import { pool } from '../../db.js';

export const getClientOrders = async (req, res) => {
    const clienteId = req.userId; 

    if (!clienteId) return res.status(401).json({ error: 'No autorizado' });

    try {
        const result = await pool.query(
            `SELECT 
                p.id,
                p.fecha_pedido,
                p.estado,
                p.total,
                p.total_dolar,
                p.nro_recibo,
                d.calle,   -- Cambiado de 'direccion' a 'calle' según tu tabla
                d.ciudad
             FROM pedidos p
             LEFT JOIN direcciones d ON p.direccion_destino_id = d.id
             WHERE p.cliente_id = $1
             ORDER BY p.fecha_pedido DESC`,
            [clienteId]
        );

        const orders = result.rows.map(order => ({
            id: order.id,
            date: new Date(order.fecha_pedido).toLocaleDateString('es-ES', { 
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
            }),
            status: order.estado,
            total: parseFloat(order.total).toFixed(2),
            total_usd: parseFloat(order.total_dolar).toFixed(2),
            // Concatenamos calle y ciudad para que el cliente vea la ubicación clara
            address: order.calle ? `${order.calle}` : 'Dirección no disponible',
            receipt: order.nro_recibo
        }));

        res.status(200).json(orders);

    } catch (error) {
        // Esto saldrá en tu terminal de Node si algo más falla
        console.error("ERROR SQL:", error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};







// import { pool } from '../../db.js';

// export const getClientOrders = async (req, res) => {
//     const clienteId = req.userId; 

//     if (!clienteId) {
//         return res.status(401).json({ error: 'No autorizado. Sesión inválida.' });
//     }

//     try {
//         // Explicación de la consulta:
//         // 1. p.* : Traemos datos del pedido.
//         // 2. d_orig.direccion AS origen: Traemos el texto de la dirección de salida.
//         // 3. d_dest.direccion AS destino: Traemos el texto de la dirección de entrega.
//         const result = await pool.query(
//             `SELECT 
//                 p.id,
//                 p.fecha_pedido,
//                 p.estado,
//                 p.total,
//                 p.total_dolar,
//                 p.nro_recibo,
//                 p.calle
//              FROM pedidos p
//              JOIN direcciones d_orig ON p.direccion_origen_id = d_orig.id
//              JOIN direcciones d_dest ON p.direccion_destino_id = d_dest.id
//              WHERE p.cliente_id = $1
//              ORDER BY p.fecha_pedido DESC`,
//             [clienteId]
//         );

//         // Si no hay filas, result.rows será [], lo cual es correcto para el frontend
//         const orders = result.rows.map(order => ({
//             id: order.id,
//             // Formateo de fecha: 05 ene 2024, 10:30
//             date: new Date(order.fecha_pedido).toLocaleDateString('es-ES', { 
//                 year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
//             }),
//             status: order.estado,
//             total: parseFloat(order.total).toFixed(2),
//             total_usd: parseFloat(order.total_dolar).toFixed(2),
//             pickup: order.origen,
//             address: order.destino, // Esta es la que muestras en la "Card" principal
//             receipt: order.nro_recibo
//         }));

//         // Enviamos el array (si está vacío, envía [])
//         res.status(200).json(orders);

//     } catch (error) {
//         console.error("Error detallado al obtener pedidos:", error);
//         res.status(500).json({ 
//             error: 'Error al consultar la base de datos.',
//             details: error.message 
//         });
//     }
// };






// import { pool } from '../../db.js';

// export const getClientOrders = async (req, res) => {
//     const clienteId = req.userId; 

//     if (!clienteId) return res.status(401).json({ error: 'No autorizado' });

//     try {
//         const result = await pool.query(
//             `SELECT 
//                 p.id AS pedido_id,
//                 p.fecha_pedido,
//                 p.estado,
//                 p.total,
//                 d.calle,
//                 d.ciudad
//              FROM pedidos p
//              JOIN direcciones d ON p.direccion_destino_id = d.id  -- CORREGIDO: destino_id
//              WHERE p.cliente_id = $1
//              ORDER BY p.fecha_pedido DESC`,
//             [clienteId]
//         );

//         // MAPEAR SIEMPRE A UN ARRAY (Incluso si está vacío)
//         const orders = result.rows.map(order => ({
//             id: order.pedido_id,
//             date: new Date(order.fecha_pedido).toLocaleDateString('es-ES', { 
//                 year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
//             }),
//             status: order.estado,
//             total: parseFloat(order.total).toFixed(2),
//             // address: `${order.calle}, ${order.ciudad}`
//             address: `${order.direccion_destino_id}`
//         }));

//         res.status(200).json(orders); // Devuelve SIEMPRE un array [{}, {}] o []

//     } catch (error) {
//         console.error("Error al obtener pedidos:", error);
//         res.status(500).json({ error: 'Error al consultar pedidos.' });
//     }
// };



