// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			manifest: {
				background_color: '#d4d4d4', // color de fondo de la aplicacion
				categories: [ "education", "music"],
				description: 'Aplicacion Delivery',
        start_url: '/',
				dir: 'ltr', // forma en la que se va a leer el texto
				display_override: ['standalone,fullscreen'],
				display: 'standalone',
				lang: 'es-ES',
				name: 'delivery',
				short_name: 'deliver',
				theme_color: 'orange',
              // Configuración de caché (estrategia de trabajo offline)
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
      },
        screenshots: [
          {
            src:'/screenshots/fast320.jpeg',
            sizes: '320x320',
            type: 'image/jpeg',
            form_factor: 'wide'
          },
          {
            src:'/screenshots/fast512.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            form_factor: 'wide'
          }
        ],
				
				icons: [
					{
						src: '/icons/fast.png',
						sizes: '148x148',
						type: 'image/png',
						purpose: 'any',
					}
					// {
					// 	src: 'fast.png',
					// 	sizes: '512x512',
					// 	type: 'image/png',
					// 	purpose: 'maskable',
					// },
				],
			},
		}),
	],
	// base: 'https://reposocratech.github.io/PWA-Youtube/',
})

// // import { defineConfig } from "vite"; // Importa la función para definir la configuración de Vite.
// // import react from '@vitejs/plugin-react'
// // import { VitePWA } from "vite-plugin-pwa"; // Importa el plugin para integrar funcionalidades PWA.


// // export default defineConfig({
// //   plugins: [
// //     react(), // Habilita el soporte para React en el proyecto.
// //     VitePWA({
// //       registerType: "autoUpdate", // Configura el Service Worker para actualizarse automáticamente.
// //       manifest: {
// //         name: "Mi PWA React", // Nombre completo de la aplicación.
// //         short_name: "PWA React", // Nombre corto que aparece en la pantalla de inicio.
// //         description: "Una Progressive Web App creada con React y Vite", // Breve descripción de la aplicación.
// //         theme_color: "#ffffff", // Color del tema que se muestra en la barra de herramientas del navegador.
// //         background_color: "#000000", // Color de fondo de la pantalla de carga inicial.
// //         display: "standalone", // Modo de visualización: "standalone" simula una app nativa.
// //         orientation: "portrait", // Orientación preferida de la aplicación.
// //         start_url: "/", // URL inicial al abrir la aplicación.
// //         icons: [
// //           {
// //             src: "/icon.png", // Ruta del icono de 192x192 píxeles.
// //             sizes: "192x192", // Tamaño del icono.
// //             type: "image/png", // Tipo de archivo del icono.
// //           },
// //           {
// //             src: "/icon.png", // Ruta del icono de 512x512 píxeles.
// //             sizes: "512x512", // Tamaño del icono.
// //             type: "image/png", // Tipo de archivo del icono.
// //           },
// //         ],
// //       },
// //       workbox: {
// //         runtimeCaching: [
// //           {
// //             urlPattern: /^http:\/\/localhost:5173\/.*$/, // Patrón para manejar las solicitudes del localhost.
// //             handler: "NetworkFirst", // Intenta primero la red y luego la caché.
// //             options: {
// //               cacheName: "local-cache", // Nombre de la caché para estas solicitudes.
// //               expiration: {
// //                 maxEntries: 50, // Máximo de recursos en caché.
// //                 maxAgeSeconds: 86400, // Duración máxima en la caché (1 día).
// //               },
// //             },
// //           },
// //         ],
// //       },
      
// //     }),
// //   ],
// // });


// // vite.config.js
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { VitePWA } from 'vite-plugin-pwa'; // Importa el plugin

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     VitePWA({
//       registerType: 'autoUpdate', // Genera automáticamente el código para registrar el SW
//       injectRegister: 'auto',     // Inyecta el registro del SW en el punto de entrada
//       manifest: {
//         name: 'Mi Aplicación PWA',
//         short_name: 'MiPWA',
//         description: 'Mi increíble aplicación hecha con React y Vite.',
//         theme_color: '#ffffff',
//         icons: [
//           {
//             src: 'fast.png',
//             sizes: '148x148',
//             type: 'image/png',
//           }
//         //   {
//         //     src: 'fast.png',
//         //     sizes: '512x512',
//         //     type: 'image/png',
//         //   },
//         //   {
//         //     src: 'fast.png',
//         //     sizes: '512x512',
//         //     type: 'image/png',
//         //     purpose: 'maskable',
//         //   },
//         ],
//       },
//       // Configuración de caché (estrategia de trabajo offline)
//       workbox: {
//         globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
//       },
//       devOptions: {
//         enabled: true // Habilita el Service Worker en desarrollo si lo necesitas
//       }
//     })
//   ],
// });