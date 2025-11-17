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
				background_color: 'green', // color de fondo de la aplicacion
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
            src:'/screenshots/fast512.jpeg',
            sizes: '512x512',
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
})