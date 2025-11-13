import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate

function DeliveryLogin() {
    const navigate = useNavigate(); // ✅ Hook llamado DENTRO del componente
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí se llamaría a 'services/authService.js' para verificar credenciales
    console.log('Intentando iniciar sesión como repartidor con:', { email, password });
    
    // Simulación de éxito:
    if (email === 'driver@app.com' && password === '12345') {
        alert('Inicio de sesión exitoso. Navegando al Dashboard.');
        navigate('/delivery/dashboard'); // Ejemplo de navegación
        // Aquí se navegaría a /delivery/dashboard
    } else {
        alert('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  
  return (
    <div className="delivery-login">
      <h2>🔑 Acceso para Repartidores</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input 
            id="email" 
            type="email" 
            // value={email} 
            // value= 'driver@app.com'
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="correo@ejemplo.com"
            
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input 
            id="password" 
            type="password" 
            // value={password} 
            // value='12345'
            onChange={(e) => setPassword(e.target.value)} 
            // placeholder="********"
            required 
          />
        </div>
        <button type="submit" className="btn-delivery">
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}

export default DeliveryLogin;