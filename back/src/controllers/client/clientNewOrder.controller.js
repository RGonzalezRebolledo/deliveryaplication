import { pool } from '../../db.js';
/**
 * Controlador para crear un nuevo pedido (Order).
 * Este proceso es transaccional: debe insertar dos direcciones y el pedido.
 * Requiere: req.userId (del token), y body: { pickup, delivery, details, price }.
 */
export const createOrder = async (req, res) => {
    // 1. Extraer ID del cliente del token (inyectado por verifyToken)
    const clienteId = req.userId; 
    const { pickup, delivery, details, price } = req.body;

    if (!clienteId || !pickup || !delivery || !details || price === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para crear el pedido.' });
    }

    // Usamos una transacción para garantizar la integridad de los datos
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciar la transacción

        // 2. Insertar Dirección de Recogida (Origen) en la tabla 'direcciones'
        const pickupQuery = `
            INSERT INTO direcciones (calle, ciudad, pais) 
            VALUES ($1, $2, $3) 
            RETURNING id;
        `;
        // Usamos valores por defecto para ciudad/país
        const pickupResult = await client.query(pickupQuery, [pickup, 'Desconocida', 'CR']); 
        const direccionRecogidaId = pickupResult.rows[0].id;

        // 3. Insertar Dirección de Entrega (Destino) en la tabla 'direcciones'
        const deliveryQuery = `
            INSERT INTO direcciones (calle, ciudad, pais) 
            VALUES ($1, $2, $3) 
            RETURNING id;
        `;
        const deliveryResult = await client.query(deliveryQuery, [delivery, 'Desconocida', 'CR']); 
        const direccionEntregaId = deliveryResult.rows[0].id;

        // 4. Insertar el Nuevo Pedido en la tabla 'pedidos'
        const orderQuery = `
            INSERT INTO pedidos (
                cliente_id, 
                direccion_recogida_id, 
                direccion_entrega_id, 
                total, 
                estado, 
                detalles, 
                fecha_pedido
            ) 
            VALUES ($1, $2, $3, $4, 'pendiente', $5, NOW())
            RETURNING id;
        `;
        const orderResult = await client.query(orderQuery, [
            clienteId, 
            direccionRecogidaId, 
            direccionEntregaId, 
            price, 
            details
        ]);

        await client.query('COMMIT'); // Confirmar la transacción

        res.status(201).json({ 
            message: 'Pedido creado exitosamente y en espera de repartidor.',
            orderId: orderResult.rows[0].id 
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Revertir si algo falla
        console.error("Error en la transacción al crear el pedido:", error);
        res.status(500).json({ error: 'Error interno del servidor al procesar el pedido.' });
    } finally {
        client.release();
    }
};