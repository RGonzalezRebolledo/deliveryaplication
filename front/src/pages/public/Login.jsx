
// Login.jsx (actualizado)
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Agregamos useLocation

function Login() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para acceder al state de la navegación
  const role = location.state?.role || 'delivery'; // Obtenemos el role del state, default a 'delivery' si no hay

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí se llamaría a 'services/authService.js' para verificar credenciales
    console.log(`Intentando iniciar sesión como ${role} con:`, { email, password });
    
    // Simulación de éxito (puedes ajustar las credenciales de prueba según el role)
    const isValid = (role === 'cliente' && email === 'cliente@app.com' && password === '12345') ||
                    (role === 'delivery' && email === 'driver@app.com' && password === '12345');
    
    if (isValid) {
      alert('Inicio de sesión exitoso. Navegando al Dashboard.');
      // Navegamos según el role
      if (role === 'cliente') {
        navigate('/client/dashboard');
      } else {
        navigate('/delivery/dashboard');
      }
    } else {
      alert('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="delivery-login"> {/* Puedes cambiar la clase si quieres una genérica, ej. "login-form" */}
      <h2>{role === 'cliente' ? '🔑 Acceso para Clientes' : '🔑 Acceso para Repartidores'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input 
            id="email" 
            type="email" 
            value={email} 
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
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="********"
            required 
          />
        </div>
        <button type="submit" className={role === 'cliente' ? 'btn-client' : 'btn-delivery'}>
          Iniciar Sesión
        </button>
      </form>
      <button className="btn-client" onClick={handleRegister}>
        Registro
      </button>
    </div>
  );
}

export default Login;