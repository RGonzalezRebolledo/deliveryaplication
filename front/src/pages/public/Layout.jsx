import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar'; // Ajusta la ruta si es necesario
import '../../App.css';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Layout = () => {
  return (
    <div className="app-container">
      {/* 💡 1. Navbar se renderiza siempre en la parte superior */}
      <Navbar /> 
      
      {/* 💡 2. Outlet renderiza el componente de la ruta actual */}
      <div> 
        <Outlet /> 
      </div>
      
      {/* Opcional: Footer aquí */}
    </div>
  );
};

export default Layout;