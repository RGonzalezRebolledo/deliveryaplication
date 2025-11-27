import React, { useState } from 'react';
import axios from 'axios'; // Importamos Axios
import { useLocation } from 'react-router-dom'; // <--- Importar useLocation

// Asegúrate de cambiar esta URL base por la dirección de tu API (ej: 'http://localhost:3000/api')
// const API_BASE_URL = 'http://localhost:4000'; 
// const API_BASE_URL = process.env.REACT_APP_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_URL;

const RegistrationForm = () => {
  // 💡 USAR useLocation PARA LEER EL STATE
  const location = useLocation();
  const initialRole = location.state?.role || 'cliente'; // Default a 'cliente' si no se pasa nada

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        rol: initialRole, // Corresponde al campo 'tipo' en tu backend
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validar coincidencia de contraseñas en el frontend
        if (formData.password !== formData.confirmPassword) {
            setMessage('❌ Las contraseñas no coinciden. Por favor, revíselas.');
            setIsError(true);
            return;
        }

        // 2. Preparar el objeto de datos para la API
        // Tu controlador espera 'password_hash' y 'tipo'.
        const dataToSend = {
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            password_hash: formData.password, // Enviamos el password en texto plano para que el controlador haga el hash
            tipo: formData.rol, // Mapeamos 'rol' a 'tipo'
        };

        // 3. Ejecutar la llamada a la API con Axios
        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/users`, // Asume que la ruta de tu API es /api/usuarios
                dataToSend,
                {
                    withCredentials: true // 💡 Permite que Axios envíe y reciba cookies
                }
            );

            // Éxito (status 201 en tu controlador)
            setLoading(false);
            setMessage('✅ ¡Registro exitoso! Ya puedes iniciar sesión.');
            setIsError(false);
            
            // Opcional: Limpiar el formulario y guardar el token si es necesario
            console.log('Token JWT recibido:', response.data.mensaje);
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                password: '',
                confirmPassword: '',
                rol: 'cliente',
            });

        } catch (error) {
            setLoading(false);
            setIsError(true);
            
            // Manejar errores específicos de la API (ej: 409 Conflicto)
            if (error.response) {
                // El servidor respondió con un código de estado fuera del rango 2xx
                const apiMessage = error.response.data.message || error.response.data.error;
                setMessage(`⚠️ Error: ${apiMessage || 'Ocurrió un error en el registro.'}`);
            } else if (error.request) {
                // La solicitud fue hecha pero no se recibió respuesta (ej: API caída)
                setMessage('❌ Error de conexión: No se pudo conectar al servidor.');
            } else {
                // Algo más sucedió al configurar la solicitud
                setMessage('❌ Error desconocido al enviar la solicitud.');
            }
            console.error('Error de registro:', error);
        }
    };

    return (
        <div className='order-form'>
            <h2> {initialRole === 'cliente' ? '🔑 Registro para Clientes' : '🔑 Registro para Conductores'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                {/* Mostrar mensaje de estado/error */}
                {message && (
                    <p style={{ 
                        color: isError ? 'red' : 'green', 
                        fontWeight: 'bold', 
                        padding: '10px', 
                        border: `1px solid ${isError ? 'red' : 'green'}`,
                        margin: '10 10 10 10'
                    }}>
                        {message}
                    </p>
                )}
                </div>

                {/* Campos del formulario */}
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
                {/* <div className="form-group">
                    <label htmlFor="rol">Tipo de Usuario</label>
                    <select
                        id="rol"
                        name="rol"
                        value={formData.rol}
                        onChange={handleChange}
                        required
                    >
                        <option value="cliente">Cliente</option>
                        <option value="repartidor">Repartidor (Conductor)</option>
                    </select>
                </div> */}
                <button type="submit" className="btn-success" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrarse'}
                </button>
            </form>
        </div>
    );
};

export default RegistrationForm;


// import React, { useState } from 'react';

// const RegistrationForm = () => {
//   const [formData, setFormData] = useState({
//     nombre: '',
//     email: '',
//     telefono: '',
//     password: '',
//     confirmPassword: '',
//     rol: 'cliente', // Valor por defecto: cliente
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Validación básica
//     if (formData.password !== formData.confirmPassword) {
//       alert('Las contraseñas no coinciden.');
//       return;
//     }
//     // Aquí puedes manejar el envío del formulario, por ejemplo, enviarlo a una API
//     console.log('Datos de registro:', formData);
//     alert('Registro exitoso!');
//   };

//   return (
//     <div className='order-form'> {/* Reutilizamos la clase para consistencia con el CSS */}
//       <h2>Registro de Usuario</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label htmlFor="nombre">Nombre Completo</label>
//           <input
//             type="text"
//             id="nombre"
//             name="nombre"
//             value={formData.nombre}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="email">Correo Electrónico</label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="telefono">Teléfono</label>
//           <input
//             type="tel"
//             id="telefono"
//             name="telefono"
//             value={formData.telefono}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="password">Contraseña</label>
//           <input
//             type="password"
//             id="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="confirmPassword">Confirmar Contraseña</label>
//           <input
//             type="password"
//             id="confirmPassword"
//             name="confirmPassword"
//             value={formData.confirmPassword}
//             onChange={handleChange}
//             required
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="rol">Tipo de Usuario</label>
//           <select
//             id="rol"
//             name="rol"
//             value={formData.rol}
//             onChange={handleChange}
//             required
//           >
//             <option value="cliente">Cliente</option>
//             <option value="delivery">Delivery (Conductor)</option>
//           </select>
//         </div>
//         <button type="submit" className="btn-success">
//           Registrarse
//         </button>
//       </form>
//     </div>
//   );
// };

// export default RegistrationForm;
