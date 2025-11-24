import { pool } from '../db.js';
import bcrypt from 'bcrypt';  // Asegúrate de instalarlo

export const validateUser = async (req, res, next) => {
  const { email, password } = req.body;  // Cambia a 'password' para consistencia con React
  try {
    const resultUser = await pool.query('SELECT email, password_hash FROM usuarios WHERE email = $1', [email]);
    if (resultUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = resultUser.rows[0];
    // Compara el hash con el password enviado usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Clave incorrecta' });
    }
    // Respuesta exitosa con objeto JSON
    return res.status(200).json({ message: 'Acceso concedido', user: { email: user.email } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};


//import {pool} from '../db.js'

// export const validateUser = async (req,res,next) => {

//     const {email,password_hash} = req.body
    
//     try {
//         const resultUser = await pool.query ('SELECT email,password_hash FROM usuarios WHERE email = $1' , [email])

//         if (resultUser.rows.length > 0) {

//             if (resultUser.rows[0].email != email) {
//                 console.log (resultUser.rows.email)
//                 return res.status(409).json('mail incorrecto')
//             }

//             if (resultUser.rows[0].password_hash != password_hash) {
//                 return res.status(409).json('clave incorrecta')
//             }
//         }

//         if (resultUser.rows.length === 0) {
//             return res.status(404).json('usuario no encontrado')
//         } 

//         return res.status(200).json ('acceso concedido')
        
//     } catch (error) {
//         console.error(error)
//         // return res.status.json ('error en el servidor')
//         return res.status(500).json({ error: 'Error en el servidor' });
//     }
// }