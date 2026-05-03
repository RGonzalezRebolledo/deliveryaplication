// // En src/components/PWAInstallManager.jsx


// En src/components/PWAInstallManager.jsx
import React, { useState, useEffect } from 'react';

const PWAInstallManager = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false); // Estado para nueva versión

  useEffect(() => {
    // --- LÓGICA DE INSTALACIÓN ---
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // --- LÓGICA DE ACTUALIZACIÓN (Para ver cambios de Vercel) ---
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Si el Service Worker cambia, significa que hay código nuevo
        setShowUpdateBanner(true);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstallable(false);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
    }
  };

  const handleUpdateClick = () => {
    // Forzamos la recarga para limpiar la caché y ver lo nuevo de Vercel
    window.location.reload();
  };

  const isInstalled = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isSafariStandalone = window.navigator.standalone; 
    return isStandalone || isSafariStandalone;
  }

  // 1. Si hay una actualización pendiente, mostramos ESTO primero
  if (showUpdateBanner) {
    return (
      <button
        onClick={handleUpdateClick}
        style={{
          padding: '12px 20px',
          backgroundColor: '#ff9800', // Color naranja para llamar la atención
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          margin: '20px'
        }}
      >
        ✨ ¡Nueva versión disponible! Haz clic para actualizar Gazzella
      </button>
    );
  }

  // 2. Si no está instalada, mostramos el botón de instalación
  if (!isInstalled() && isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          margin: '0 20px 20px 20px'
        }}
      >
        Descargar e Instalar la App 📱
      </button>
    );
  }

  return null;
};

export default PWAInstallManager;

// import React, { useState, useEffect } from 'react';
// import ManualInstallInstructions from './ManualInstallInstructions'; // <-- ¡Importamos el nuevo componente!

// const PWAInstallManager = () => {
//   // 1. Estado para almacenar el evento de instalación (prompt)
//   const [deferredPrompt, setDeferredPrompt] = useState(null);
//   // 2. Estado para saber si el botón debe mostrarse (si la PWA es instalable en Chrome/Chromium)
//   const [isInstallable, setIsInstallable] = useState(false);

//   useEffect(() => {
//     // Función manejadora del evento 'beforeinstallprompt'
//     const handler = (e) => {
//       e.preventDefault();
//       setDeferredPrompt(e);
//       setIsInstallable(true); // Se activa porque el navegador envió el evento
//     };

//     window.addEventListener('beforeinstallprompt', handler);

//     // Limpieza
//     return () => {
//       window.removeEventListener('beforeinstallprompt', handler);
//     };
//   }, []);

//   // Función para manejar el clic del botón de instalación
//   const handleInstallClick = async () => {
//     if (deferredPrompt) {
//       setIsInstallable(false); // Oculta el botón
//       deferredPrompt.prompt(); // Muestra el mensaje de instalación nativo
      
//       const { outcome } = await deferredPrompt.userChoice;
//       console.log(`User response to the install prompt: ${outcome}`);
//       setDeferredPrompt(null);
//     }
//   };
  
//   // Función para verificar si la App ya se está ejecutando en modo PWA
//   const isInstalled = () => {
//     // Para la mayoría de los navegadores (Chrome, Edge, Firefox Android)
//     const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
//     // Para Safari en iOS (deprecated, pero útil como fallback)
//     const isSafariStandalone = window.navigator.standalone; 
    
//     return isStandalone || isSafariStandalone;
//   }
  
//   // 7. Lógica de Renderizado Condicional
  
//   // No mostrar nada si la App ya está instalada y ejecutándose en modo PWA
//   if (isInstalled()) {
//     return null;
//   }
  
//   // Caso 1: Si el navegador envió el evento (Chrome/Chromium)
//   if (isInstallable) {
//     return (
//       <button
//         onClick={handleInstallClick}
//         style={{
//           padding: '10px 20px',
//           backgroundColor: '#007bff',
//           color: 'white',
//           border: 'none',
//           borderRadius: '5px',
//           cursor: 'pointer',
//           fontWeight: 'bold',
//           margin: '0 20px 20px 20px'
//         }}
//       >
//         Descargar e Instalar la App 📱 (Opción Rápida)
//       </button>
//     );
//   }
  
//   // Caso 2: El evento NO se disparó (Firefox, Safari, Opera variable)
//   //return <ManualInstallInstructions />;

// };

// export default PWAInstallManager;