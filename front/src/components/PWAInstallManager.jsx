// En src/components/PWAInstallManager.jsx
import React, { useState, useEffect } from 'react';
import ManualInstallInstructions from './ManualInstallInstructions'; // <-- ¡Importamos el nuevo componente!

const PWAInstallManager = () => {
  // 1. Estado para almacenar el evento de instalación (prompt)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // 2. Estado para saber si el botón debe mostrarse (si la PWA es instalable en Chrome/Chromium)
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Función manejadora del evento 'beforeinstallprompt'
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true); // Se activa porque el navegador envió el evento
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Limpieza
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Función para manejar el clic del botón de instalación
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstallable(false); // Oculta el botón
      deferredPrompt.prompt(); // Muestra el mensaje de instalación nativo
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
  };
  
  // Función para verificar si la App ya se está ejecutando en modo PWA
  const isInstalled = () => {
    // Para la mayoría de los navegadores (Chrome, Edge, Firefox Android)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Para Safari en iOS (deprecated, pero útil como fallback)
    const isSafariStandalone = window.navigator.standalone; 
    
    return isStandalone || isSafariStandalone;
  }
  
  // 7. Lógica de Renderizado Condicional
  
  // No mostrar nada si la App ya está instalada y ejecutándose en modo PWA
  if (isInstalled()) {
    return null;
  }
  
  // Caso 1: Si el navegador envió el evento (Chrome/Chromium)
  if (isInstallable) {
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
        Descargar e Instalar la App 📱 (Opción Rápida)
      </button>
    );
  }
  
  // Caso 2: El evento NO se disparó (Firefox, Safari, Opera variable)
  //return <ManualInstallInstructions />;

};

export default PWAInstallManager;