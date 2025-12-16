import 'dotenv/config'
import express from 'express'
import { pgdb } from './config.js'
import morgan  from 'morgan'
import cors from 'cors'
import routerUsers from './routes/users.route.js'
import routerLogin from './routes/login.route.js'
import routerAuth from './routes/auth.route.js'
import routerClientOrders from './routes/client/clientdashboard.route.js'
import routerCheckSesion from './routes/checkSesion.route.js'
import routerClientNewOrder from './routes/client/clientNewOrder.route.js'
import routerExchangeRate from './routes/apis/exchangeRate.route.js' 
import routerCalculateDeliveryCost from './routes/delivery.route.js'
import { clearDatabase, initializeDatabase } from './db.js';
import cookieParser from 'cookie-parser';
import routerClientAddresses from './routes/client/clientaddresses.route.js'



const app = express ();

app.use (morgan('dev'))
// app.use(cors());

// app.use(cors({
//   origin: process.env.PORT, // Reemplaza con el origen exacto de tu frontend
//   credentials: true,               // 💡 DEBE SER TRUE EN EL BACKEND
//   // ... otros headers permitidos
// }));

// app.use(cors({
//   origin: '*', // PERMITE TODOS LOS ORÍGENES (NO USAR EN PRODUCCIÓN)
//   credentials: true,
// }));

const allowedOrigins = [
  process.env.FRONTEND_URL_DEV, // 💡 ¡AGREGA EL ORIGEN CORRECTO DE VITE!
  process.env.FRONTEND_URL_PROD, // (Si quieres mantener el antiguo por si acaso)
  // Agrega aquí tu URL de producción (ej: https://deliveryaplication-ioll.vercel.app)
];

app.use(cors({
  origin: (origin, callback) => {
      // Permitir solicitudes sin origen (para herramientas REST o CURL) o si está en la lista blanca
      if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use (express.json())
app.use (express.urlencoded({extended: false}))



// handling errors
app.use((err, req, res, next) => {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  });

  app.use(cookieParser()); // 👈 Usar antes de tus rutas
  app.use(routerCheckSesion)
  app.use(routerUsers)
  app.use(routerLogin)
  app.use(routerAuth)
  app.use(routerClientOrders)
  app.use(routerClientNewOrder)
  app.use(routerExchangeRate) 
  app.use(routerCalculateDeliveryCost)  
  app.use (routerClientAddresses)

  app.listen (pgdb.PORT)
app.delete('/clear-db', async (req, res) => {
  await clearDatabase();
  res.json({ message: 'Base de datos limpiada' });
});

console.log ('conectado en el puerto', pgdb.PORT)

