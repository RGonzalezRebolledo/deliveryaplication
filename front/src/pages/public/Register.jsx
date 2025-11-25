import React, { useState } from 'react';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    rol: 'cliente', // Valor por defecto: cliente
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación básica
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    // Aquí puedes manejar el envío del formulario, por ejemplo, enviarlo a una API
    console.log('Datos de registro:', formData);
    alert('Registro exitoso!');
  };

  return (
    <div className='order-form'> {/* Reutilizamos la clase para consistencia con el CSS */}
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="rol">Tipo de Usuario</label>
          <select
            id="rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            required
          >
            <option value="cliente">Cliente</option>
            <option value="delivery">Delivery (Repartidor)</option>
          </select>
        </div>
        <button type="submit" className="btn-success">
          Registrarse
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
