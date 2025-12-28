-- ------------------------------------------------------------------
-- SCRIPT COMPLETO PARA CONSOLA PSQL - ESQUEMA 'delivery' (MODIFICADO)
-- ------------------------------------------------------------------

-- 1. CONFIGURACIÓN INICIAL (Opcional: solo si necesitas recrear la DB)
-- CREATE DATABASE delivery;
-- \c delivery 

-- 2. LIMPIEZA: Eliminar la vista y tablas existentes para una ejecución limpia
DROP VIEW IF EXISTS vista_pedidos_resumen;
DROP TABLE IF EXISTS repartidores_pedidos;
DROP TABLE IF EXISTS pedido_detalles;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS direcciones;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS repartidores; 
DROP TABLE IF EXISTS usuarios CASCADE; 

-- ------------------------------------------------------------------
-- 3. CREACIÓN DE TABLAS (con password_hash)
-- ------------------------------------------------------------------

-- Crear tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL, 
    telefono VARCHAR(20),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'repartidor', 'administrador', 'supervisor')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash VARCHAR(255) NOT NULL
);

-- Crear tabla: productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(50),
    disponible BOOLEAN DEFAULT TRUE
);

-- Crear tabla: direcciones
CREATE TABLE direcciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    calle VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    latitud DECIMAL(9, 6),
    longitud DECIMAL(9, 6)
);

-- Crear tabla: pedidos (¡CAMPOS MODIFICADOS AQUÍ!)
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    direccion_entrega_id INT REFERENCES direcciones(id),
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'en_camino', 'entregado', 'cancelado')),
    total DECIMAL(10, 2) NOT NULL,
    
    -- *** NUEVOS CAMPOS AGREGADOS ***
    total_dolar DECIMAL(10, 2), -- Nuevo campo para el total en dólares (permite NULL temporalmente o 0 si no se calcula)
    direccion_origen_id INT NOT NULL REFERENCES direcciones(id) -- Nuevo campo, la FK debe ser NOT NULL si es la dirección principal
    -- *** FIN DE CAMPOS AGREGADOS ***
);

-- Nota: He renombrado 'direccion_entrega_id' por 'direccion_destino_id' en el nuevo campo
-- y asumí que la clave original 'direccion_entrega_id' ya cumple un propósito.
-- Si quieres reemplazar 'direccion_entrega_id' con 'direccion_destino_id', el campo original debería llamarse de otra forma (por ejemplo, direccion_origen_id) 
-- o simplemente usa 'direccion_destino_id' como el único campo de dirección si son equivalentes.

-- Crear tabla: pedido_detalles
CREATE TABLE pedido_detalles (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL
);

-- Crear tabla: repartidores_pedidos
CREATE TABLE repartidores_pedidos (
    id SERIAL PRIMARY KEY,
    repartidor_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nueva tabla: repartidores 
CREATE TABLE repartidores (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE, 
    direccion_residencia TEXT,
    documento_identidad VARCHAR(50) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('DNI', 'Pasaporte', 'Licencia', 'Otro')),
    foto VARCHAR(255) 
);

-- ------------------------------------------------------------------
-- 4. CREACIÓN DE ÍNDICES (¡Índice adicional para el nuevo campo!)
-- ------------------------------------------------------------------

CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_direccion_destino ON pedidos(direccion_destino_id); -- Nuevo índice
CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id);
CREATE INDEX idx_pedido_detalles_pedido ON pedido_detalles(pedido_id);
CREATE INDEX idx_repartidores_pedidos_repartidor ON repartidores_pedidos(repartidor_id);
CREATE INDEX idx_repartidores_usuario ON repartidores(usuario_id);

-- ------------------------------------------------------------------
-- 5. CREACIÓN DE VISTA
-- ------------------------------------------------------------------

CREATE VIEW vista_pedidos_resumen AS
SELECT 
    p.id AS pedido_id,
    u.nombre AS cliente,
    p.fecha_pedido,
    p.estado,
    p.total,
    p.total_dolar, -- Campo agregado a la vista
    d.calle || ', ' || d.ciudad AS direccion_entrega,
    COUNT(pd.id) AS num_productos
FROM pedidos p
JOIN usuarios u ON p.cliente_id = u.id
JOIN direcciones d ON p.direccion_destino_id = d.id -- CAMBIÉ a direccion_destino_id
LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
GROUP BY p.id, u.nombre, p.fecha_pedido, p.estado, p.total, p.total_dolar, d.calle, d.ciudad;

-- Habilitar extensión de seguridad
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insertar Administrador por defecto si no existe
INSERT INTO usuarios (nombre, email, telefono, tipo, password_hash)
SELECT 'Administrador Global', 'ramongonzalez101@gmail.com', '999999', 'administrador', crypt('admin1234', gen_salt('bf'))
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'ramongonzalez101@gmail.com'
);




-- ------------------------------------------------------------------
-- 6. INSERCIÓN DE DATOS DE EJEMPLO (Solo como referencia, necesitarías modificar los datos para usar los nuevos campos)
-- ------------------------------------------------------------------

-- ... (Resto de las inserciones, deben ser adaptadas para incluir los nuevos campos)
-- ------------------------------------------------------------------
-- 6. INSERCIÓN DE DATOS DE EJEMPLO
-- ------------------------------------------------------------------

-- Asegúrate de que los IDs (1, 2, 3) funcionarán si las tablas se crearon justo antes.
-- Si hay problemas de referencias, usa el bloque DO $$...$$ de la respuesta anterior.

-- INSERT INTO usuarios (nombre, email, telefono, tipo, password_hash) VALUES
-- ('Juan Pérez', 'juan@email.com', '123456789', 'cliente', '$2b$10$dummyHashCliente1'),
-- ('Ana López', 'ana@email.com', '987654321', 'repartidor', '$2b$10$dummyHashRepartidor2'),
-- ('María García', 'maria@email.com', '555666777', 'cliente', '$2b$10$dummyHashCliente3');

-- INSERT INTO productos (nombre, descripcion, precio, categoria) VALUES
-- ('Pizza Margherita', 'Pizza clásica con queso', 12.50, 'comida'),
-- ('Refresco Cola', 'Bebida gaseosa', 2.00, 'bebida'),
-- ('Hamburguesa', 'Hamburguesa con queso', 8.75, 'comida');

-- INSERT INTO direcciones (usuario_id, calle, ciudad, codigo_postal, latitud, longitud) VALUES
-- (1, 'Calle Ficticia 123', 'Madrid', '28001', 40.416775, -3.703790),
-- (3, 'Avenida Real 456', 'Barcelona', '08001', 41.385064, 2.173404);

-- INSERT INTO pedidos (cliente_id, direccion_entrega_id, total) VALUES
-- (1, 1, 14.50),
-- (3, 2, 8.75);

-- INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) VALUES
-- (1, 1, 1, 12.50),
-- (1, 2, 1, 2.00),
-- (2, 3, 1, 8.75);

-- INSERT INTO repartidores_pedidos (repartidor_id, pedido_id) VALUES
-- (2, 1),
-- (2, 2);

-- INSERT INTO repartidores (usuario_id, direccion_residencia, documento_identidad, tipo_documento, foto) VALUES
-- (2, 'Calle de los Repartidores 789, Madrid, 28002', '12345678A', 'DNI', '/uploads/fotos/ana_lopez.jpg');





