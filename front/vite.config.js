// // import { defineConfig } from 'vite'
// // import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// // export default defineConfig({
// //   plugins: [react()],
// // })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // --- ESTO ES LO QUE SOLUCIONA TU PROBLEMA DE CACHÉ ---
      registerType: 'prompt', // Avisa cuando hay código nuevo para no esperar días
      workbox: {
        cleanupOutdatedCaches: true, // Borra la basura de versiones viejas
        skipWaiting: true,           // Fuerza al nuevo código a estar listo
        clientsClaim: true,          // Toma el control de la página de inmediato
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
      },
      // ----------------------------------------------------
      manifest: {
        name: 'Gazzella Express',
        short_name: 'Gazzella',
        description: 'Aplicación de Delivery Gazzella Express',
        start_url: '/',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'], // Corregido: comillas separadas
        background_color: '#ffffff', // Sugerencia: blanco suele verse mejor en el splash
        theme_color: 'orange',
        lang: 'es-ES',
        dir: 'ltr',
        categories: ["shopping", "delivery"],
        screenshots: [
          {
            src: '/screenshots/fast512.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            form_factor: 'wide'
          },
          {
            src: '/screenshots/fast512.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
            // form_factor: 'narrow' // Podrías añadir uno para móviles (vertical)
          }
        ],
        icons: [
          {
            src: '/icons/fast.png',
            sizes: '148x148',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/fast.png', // Recomendado: tener uno de 512 para calidad
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// // import react from '@vitejs/plugin-react-swc'
// import { VitePWA } from 'vite-plugin-pwa'

// // https://vitejs.dev/config/
// export default defineConfig({
// 	plugins: [
// 		react(),
// 		VitePWA({
// 			manifest: {
// 				background_color: 'green', // color de fondo de la aplicacion
// 				categories: [ "education", "music"],
// 				description: 'Aplicacion Delivery',
//         start_url: '/',
// 				dir: 'ltr', // forma en la que se va a leer el texto
// 				display_override: ['standalone,fullscreen'],
// 				display: 'standalone',
// 				lang: 'es-ES',
// 				name: 'delivery',
// 				short_name: 'deliver',
// 				theme_color: 'orange',
//               // Configuración de caché (estrategia de trabajo offline)
//       workbox: {
//         navigateFallback: 'index.html',
//         globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
//       },
//         screenshots: [
//           {
//             src:'/screenshots/fast512.jpeg',
//             sizes: '512x512',
//             type: 'image/jpeg',
//             form_factor: 'wide'
//           },
//           {
//             src:'/screenshots/fast512.jpeg',
//             sizes: '512x512',
//             type: 'image/jpeg',
//             form_factor: 'wide'
//           }
//         ],
				
// 				icons: [
// 					{
// 						src: '/icons/fast.png',
// 						sizes: '148x148',
// 						type: 'image/png',
// 						purpose: 'any',
// 					}
// 					// {
// 					// 	src: 'fast.png',
// 					// 	sizes: '512x512',
// 					// 	type: 'image/png',
// 					// 	purpose: 'maskable',
// 					// },
// 				],
// 			},
// 		}),
// 	],
// })