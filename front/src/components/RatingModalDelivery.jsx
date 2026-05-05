import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function DriverRatingModal({ pedidoId, nombreCliente, clienteTelefono, onCalificado }) {
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
        `${API_BASE_URL}/driver/rate-client`,
        {
          pedido_id: pedidoId,
          estrellas: estrellas,
          comentario: comentario,
        },
        { withCredentials: true }
      );
      onCalificado();
      alert("¡Calificación enviada! Gracias por tu feedback.");
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      alert("Hubo un error. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={badgeStyle}>PEDIDO #{pedidoId}</div>
        
        <h3 style={{ margin: "10px 0 5px 0", color: "#0f172a" }}>¡Entrega Completada! ✅</h3>
        
        <p style={{ fontSize: "0.95rem", color: "#475569", marginBottom: "20px" }}>
          Califica la experiencia con tu cliente:<br/>
          <strong style={{ color: "#10b981" }}>{nombreCliente}</strong>
          <br/><small style={{ color: "#94a3b8" }}>({clienteTelefono})</small>
        </p>

        <div style={{ margin: "15px 0" }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <span
              key={num}
              onClick={() => setEstrellas(num)}
              style={{
                fontSize: "2.5rem",
                cursor: "pointer",
                color: num <= estrellas ? "#10b981" : "#cbd5e1",
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
          placeholder="Comentario sobre el cliente (opcional)..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={textareaStyle}
          maxLength={200}
        />

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={onCalificado}
            style={{ ...btnCancelStyle }}
          >
            Saltar
          </button>
          <button
            onClick={handleSubmit}
            disabled={enviando || estrellas === 0}
            style={enviando || estrellas === 0 ? { ...btnStyle, opacity: 0.7 } : btnStyle}
          >
            {enviando ? "Enviando..." : "Calificar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos
const modalOverlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
  backgroundColor: "rgba(15, 23, 42, 0.95)", display: "flex", justifyContent: "center",
  alignItems: "center", zIndex: 10000, padding: "20px", backdropFilter: "blur(4px)"
};

const modalContentStyle = {
  backgroundColor: "#fff", padding: "35px 25px", borderRadius: "28px",
  maxWidth: "380px", width: "100%", textAlign: "center",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
};

const badgeStyle = {
  backgroundColor: "#f1f5f9", color: "#64748b", padding: "5px 12px",
  borderRadius: "50px", fontSize: "0.75rem", fontWeight: "800",
  display: "inline-block", marginBottom: "10px", border: "1px solid #e2e8f0"
};

const textareaStyle = {
  width: "100%", height: "90px", borderRadius: "15px", border: "1px solid #e2e8f0",
  padding: "12px", marginBottom: "20px", fontSize: "0.9rem", resize: "none",
  backgroundColor: "#f8fafc", outline: "none"
};

const btnStyle = {
  flex: 1, backgroundColor: "#10b981", color: "#fff", border: "none",
  padding: "14px", borderRadius: "16px", fontWeight: "800", cursor: "pointer",
  fontSize: "0.95rem", transition: "background 0.3s"
};

const btnCancelStyle = {
  flex: 1, backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
  padding: "14px", borderRadius: "16px", fontWeight: "800", cursor: "pointer",
  fontSize: "0.95rem", transition: "background 0.3s"
};

export default DriverRatingModal;