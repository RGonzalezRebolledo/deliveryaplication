// Escuchar el evento de instalación y precachear recursos.
self.addEventListener("install", (event) => {
    console.log("Service Worker instalado.");
    event.waitUntil(
      caches.open("v1").then((cache) => {
        console.log("Cache creado y recursos precacheados.");
        return cache.addAll([
          "/", // Ruta de inicio.
          "/index.html", // Tu archivo HTML principal.
          "/styles.css", // Archivos de estilo.
          "/icon-192x192.png", // Icono pequeño.
          "/icon-512x512.png", // Icono grande.
        ]);
      })
    );
  });
  
  // Activar el Service Worker y limpiar cachés antiguas.
  self.addEventListener("activate", (event) => {
    console.log("Service Worker activado.");
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== "v1") {
              console.log("Caché antigua eliminada:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });
  
  // Interceptar solicitudes de red y responder desde caché.
  self.addEventListener("fetch", (event) => {
    console.log("Interceptando solicitud:", event.request.url);
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  