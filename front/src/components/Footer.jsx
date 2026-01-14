import React from 'react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaMotorcycle } from 'react-icons/fa'; // Necesitas instalar react-icons
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3><FaMotorcycle /> DeliveryApp</h3>
          <p>Llevamos tus antojos hasta la puerta de tu casa con rapidez y seguridad.</p>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <p>Email: soporte@tuapp.com</p>
          <p>Tel: +58 412-1234567</p>
        </div>

        <div className="footer-section">
          <h4>Síguenos</h4>
          <div className="social-icons">
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaWhatsapp /></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} DeliveryApp. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;