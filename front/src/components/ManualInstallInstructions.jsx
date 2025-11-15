// En src/components/ManualInstallInstructions.jsx (o donde lo almacenes)
import React from 'react';

const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isFirefox = userAgent.includes("Firefox");

    if (isIOS) {
        // Instrucciones para Safari en iOS
        return (
            <>
                <p><strong>Paso 1:</strong> Pulsa el icono de **Compartir** ($\u21E7$) en la barra de navegación inferior.</p>
                <p><strong>Paso 2:</strong> Desplázate y selecciona **"Añadir a pantalla de inicio"**.</p>
                <p><strong>Paso 3:</strong> Confirma la instalación.</p>
                
            </>
        );
    } 
    
    if (isFirefox) {
        // Instrucciones para Firefox (desktop o Android)
        return (
            <>
                <p><strong>Paso 1:</strong> Pulsa el icono de **Menú** ($\u2630$) en la esquina superior derecha.</p>
                <p><strong>Paso 2:</strong> Busca y selecciona la opción **"Instalar"** o **"Añadir a la pantalla de inicio"**.</p>
            </>
        );
    }
    
    // Instrucciones genéricas (Opera, Edge, etc.)
    return (
        <p>
            Busca el icono de **"Instalar"** (usualmente un ícono de descarga o un signo más) o la opción **"Añadir a la pantalla de inicio"** en el menú de configuración ($\u2630$ o $\dots$) del navegador.
        </p>
    );
};

const ManualInstallInstructions = () => {
    return (
        <div style={{ padding: '15px', border: '1px solid #007bff', borderRadius: '8px', backgroundColor: '#e9f7ff', margin: '20px 0' }}>
            <h3 style={{ marginTop: 0, color: '#007bff' }}>Instala nuestra App en tu dispositivo 🚀</h3>
            <p>Tu navegador no admite la instalación automática. Sigue estos pasos para instalarla manualmente:</p>
            {getBrowserInstructions()}
        </div>
    );
};

export default ManualInstallInstructions;