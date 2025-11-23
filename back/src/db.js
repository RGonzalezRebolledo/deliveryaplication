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
