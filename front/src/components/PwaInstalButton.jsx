import React, { useState, useEffect } from 'react';

const InstallPWAButton = () => {
  // 1. Estado para almacenar el evento de instalación (prompt)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // 2. Estado para saber si el botón debe mostrarse (si la PWA es instalable)
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 3. Función manejadora del evento 'beforeinstallprompt'
    const handler = (e) => {
      // Previene que el navegador muestre su propio mensaje de instalación
      e.preventDefault();
      
      // Guarda el evento para que pueda ser activado más tarde
      setDeferredPrompt(e);
      
      // Muestra el botón de instalación
      setIsInstallable(true);
    };

    // 4. Agregar el listener del evento
    window.addEventListener('beforeinstallprompt', handler);

    // 5. Función de limpieza (importante en React)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  // 6. Función para manejar el clic del botón
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Oculta el botón
      setIsInstallable(false);
      
      // Muestra el mensaje de instalación del navegador
      deferredPrompt.prompt();
      
      // Espera la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      // Opcional: registrar si el usuario instaló o canceló
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Limpia el evento guardado
      setDeferredPrompt(null);
    }
  };

  // 7. Renderizado condicional
  if (!isInstallable) {
    return null; // No muestra el botón si la PWA ya está instalada o no es instalable
  }

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
      }}
    >
      Descargar e Instalar la App 📱
    </button>
  );
};

export default InstallPWAButton;