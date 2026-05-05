

import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function RatingModal({ pedidoId, nombreConductor, onCalificado }) {
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (estrellas === 0) {
      alert("Por favor, selecciona una puntuación.");
      return;
    }

    setEnviando(true);
    try {
      await axios.post(
        `${API_BASE_URL}/enviar-calificacion`,
        {
          pedidoId: pedidoId,
          estrellas: estrellas,
          comentario: comentario,
        },
        { withCredentials: true }
      );
      onCalificado();
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      alert("Hubo un error al guardar tu calificación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={badgeStyle}>PEDIDO #{pedidoId}</div>
        
        <h3 style={{ margin: "10px 0 5px 0", color: "#0f172a" }}>¡Pedido Entregado! 📦</h3>
        
        <p style={{ fontSize: "0.95rem", color: "#475569", marginBottom: "20px" }}>
          ¿Qué tal fue tu experiencia con <br/>
          <strong style={{ color: "#007bff" }}>{nombreConductor}</strong>?
        </p>

        <div style={{ margin: "15px 0" }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <span
              key={num}
              onClick={() => setEstrellas(num)}
              style={{
                fontSize: "2.5rem",
                cursor: "pointer",
                color: num <= estrellas ? "#ffb400" : "#cbd5e1",
                transition: "transform 0.2s, color 0.2s",
                display: "inline-block",
                padding: "0 5px"
              }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="Cuéntanos más sobre el servicio (opcional)..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={textareaStyle}
        />

        <button
          onClick={handleSubmit}
          disabled={enviando}
          style={enviando ? { ...btnStyle, opacity: 0.7 } : btnStyle}
        >
          {enviando ? "Guardando..." : "Finalizar y Calificar"}
        </button>
      </div>
    </div>
  );
}

// --- ESTILOS ADICIONALES ---

const badgeStyle = {
  backgroundColor: "#f1f5f9",
  color: "#64748b",
  padding: "5px 12px",
  borderRadius: "50px",
  fontSize: "0.75rem",
  fontWeight: "800",
  display: "inline-block",
  marginBottom: "10px",
  border: "1px solid #e2e8f0"
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(15, 23, 42, 0.95)", 
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
  padding: "20px",
  backdropFilter: "blur(4px)" // Efecto moderno de desenfoque
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "35px 25px",
  borderRadius: "28px",
  maxWidth: "380px",
  width: "100%",
  textAlign: "center",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
};

const textareaStyle = {
  width: "100%",
  height: "90px",
  borderRadius: "15px",
  border: "1px solid #e2e8f0",
  padding: "12px",
  marginBottom: "20px",
  fontSize: "0.9rem",
  resize: "none",
  backgroundColor: "#f8fafc",
  outline: "none"
};

const btnStyle = {
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  padding: "16px 20px",
  borderRadius: "16px",
  fontWeight: "800",
  cursor: "pointer",
  width: "100%",
  fontSize: "1rem",
  transition: "background 0.3s"
};

export default RatingModal;


// import React, { useState } from "react";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// function RatingModal({ pedidoId, onCalificado }) {
//   const [estrellas, setEstrellas] = useState(0);
//   const [comentario, setComentario] = useState("");
//   const [enviando, setEnviando] = useState(false);

//   const handleSubmit = async () => {
//     if (estrellas === 0) {
//       alert("Por favor, selecciona una puntuación.");
//       return;
//     }

//     setEnviando(true);
//     try {
//       await axios.post(
//         `${API_BASE_URL}/enviar-calificacion`,
//         {
//           pedidoId: pedidoId,
//           estrellas: estrellas,
//           comentario: comentario,
//         },
//         { withCredentials: true }
//       );

//       // Llamamos a la función del padre para refrescar el estado y quitar el bloqueo
//       onCalificado();
//     } catch (error) {
//       console.error("Error al enviar calificación:", error);
//       alert("Hubo un error al guardar tu calificación. Inténtalo de nuevo.");
//     } finally {
//       setEnviando(false);
//     }
//   };

//   return (
//     <div style={modalOverlayStyle}>
//       <div style={modalContentStyle}>
//         <h3 style={{ margin: "0 0 10px 0" }}>¡Pedido Entregado! 📦</h3>
//         <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
//           Tu opinión es muy importante para nosotros y para el repartidor.
//         </p>

//         <div style={{ margin: "20px 0" }}>
//           {[1, 2, 3, 4, 5].map((num) => (
//             <span
//               key={num}
//               onClick={() => setEstrellas(num)}
//               style={{
//                 fontSize: "2rem",
//                 cursor: "pointer",
//                 color: num <= estrellas ? "#ffb400" : "#cbd5e1",
//                 transition: "color 0.2s",
//               }}
//             >
//               ★
//             </span>
//           ))}
//         </div>

//         <textarea
//           placeholder="Escribe un comentario opcional..."
//           value={comentario}
//           onChange={(e) => setComentario(e.target.value)}
//           style={textareaStyle}
//         />

//         <button
//           onClick={handleSubmit}
//           disabled={enviando}
//           style={enviando ? { ...btnStyle, opacity: 0.7 } : btnStyle}
//         >
//           {enviando ? "Enviando..." : "Enviar Calificación"}
//         </button>
//       </div>
//     </div>
//   );
// }

// // Estilos rápidos para el modal
// const modalOverlayStyle = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   width: "100%",
//   height: "100%",
//   backgroundColor: "rgba(15, 23, 42, 0.9)", // Fondo oscuro para bloqueo total
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   zIndex: 9999,
//   padding: "20px",
// };

// const modalContentStyle = {
//   backgroundColor: "#fff",
//   padding: "30px",
//   borderRadius: "20px",
//   maxWidth: "400px",
//   width: "100%",
//   textAlign: "center",
//   boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
// };

// const textareaStyle = {
//   width: "100%",
//   height: "80px",
//   borderRadius: "10px",
//   border: "1px solid #e2e8f0",
//   padding: "10px",
//   marginBottom: "20px",
//   fontSize: "0.9rem",
//   resize: "none",
// };

// const btnStyle = {
//   backgroundColor: "#007bff",
//   color: "#fff",
//   border: "none",
//   padding: "12px 20px",
//   borderRadius: "12px",
//   fontWeight: "bold",
//   cursor: "pointer",
//   width: "100%",
// };

// export default RatingModal;