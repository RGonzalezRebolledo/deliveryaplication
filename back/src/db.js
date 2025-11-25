import pg from 'pg';
import {pgdb} from './config.js'

export const pool = new pg.Pool (
    {
       user: pgdb.DB_USER,
       host: pgdb.DB_HOST,
       database: pgdb.DB_DATABASE,
       password: pgdb.DB_PASSWORD,
       port: pgdb.DB_PORT,
    }
) 

// Función para borrar todos los registros (deja tablas intactas)
export const clearDatabase = async () => {
    try {
      const clearScript = `
        -- Borrar registros en orden inverso a las dependencias (para evitar errores de FK)
        TRUNCATE TABLE repartidores_pedidos RESTART IDENTITY CASCADE;
        TRUNCATE TABLE pedido_detalles RESTART IDENTITY CASCADE;
        TRUNCATE TABLE pedidos RESTART IDENTITY CASCADE;
        TRUNCATE TABLE direcciones RESTART IDENTITY CASCADE;
        TRUNCATE TABLE repartidores RESTART IDENTITY CASCADE;
        TRUNCATE TABLE productos RESTART IDENTITY CASCADE;
        TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE;
      `;
      await pool.query(clearScript);
      console.log('Todos los registros borrados de la base de datos.');
    } catch (error) {
      console.error('Error al borrar registros:', error);
    }
  };
  // Mantén initializeDatabase si la usas para recrear datos después
  export const initializeDatabase = async () => {
    // Tu código anterior para crear tablas e insertar datos
    
  };