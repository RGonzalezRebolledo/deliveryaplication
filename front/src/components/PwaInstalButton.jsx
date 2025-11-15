import React, { useState, useEffect, useCallback } from 'react';

const PWAInstallButton = () => {
  // Estado para guardar el evento de instalación que dispara el navegador
//   const [deferredPrompt, setDeferredPrompt] = useState(null);
//   // Estado para controlar la visibilidad del botón
//   const [showButton, setShowButton] = useState(false);

//   useEffect(() => {
//     // 1. Manejador del evento 'beforeinstallprompt'
//     const handleBeforeInstallPrompt = (e) => {
//       // Previene que el navegador muestre su propio mensaje de instalación por defecto
//       e.preventDefault();
      
//       // Guarda el evento para usarlo más tarde al hacer clic en el botón
//       setDeferredPrompt(e);
      
//       // Muestra el botón de instalación en la UI
//       setShowButton(true);
//     };

//     // 2. Agrega el listener
//     window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

//     // 3. Limpia el listener cuando el componente se desmonte
//     return () => {
//       window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
//     };
//   }, []);

//   Función para manejar el clic en el botón
//   const handleInstallClick = useCallback(() => {
//     if (deferredPrompt) {
//       4. Muestra el prompt de instalación guardado
//       deferredPrompt.prompt();

//       5. Escucha la respuesta del usuario al prompt
//       deferredPrompt.userChoice.then((choiceResult) => {
//         if (choiceResult.outcome === 'accepted') {
//           console.log('El usuario aceptó la instalación de la PWA');
//         } else {
//           console.log('El usuario canceló la instalación de la PWA');
//         }

//         6. El prompt solo se puede usar una vez. 
//         Esconde el botón y limpia el estado.
//         setDeferredPrompt(null);
//         setShowButton(false);
//       });
//     }
//   }, [deferredPrompt]);

//   Si no hay evento guardado o si ya se instaló, no mostramos nada
//   if (!showButton) {
//     return null;
//   }

  // Si el evento está disponible, mostramos el botón
  return (
    <button 
    //   onClick={handleInstallClick}
      style={{
        padding: '10px 20px', 
        backgroundColor: '#007bff', 
        color: 'black', 
        border: 'none', 
        borderRadius: '5px',
        cursor: 'pointer',
        margin: '0px 0 20px 0'  
      }}
    >
      Descargar / Instalar Aplicación
    </button>
  );
};

export default PWAInstallButton;