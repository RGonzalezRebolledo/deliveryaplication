import React from 'react';
import Slider from 'react-slick';
import '../styles/carousel.css'; // Importa los estilos locales

// NOTA IMPORTANTE PARA VITE:
// Al estar en la carpeta 'public', no necesitas 'import'.
// Vite las sirve directamente desde la raíz.
const propa1 = '/assets/propaganda1.png';
const propa2 = '/assets/propaganda2.png';

const Carousel = () => {
  // Configuración del carrusel
  const settings = {
    dots: true,          // Muestra indicadores (puntos) en la parte inferior
    infinite: true,      // Carrusel infinito
    speed: 500,          // Velocidad de transición (ms)
    slidesToShow: 1,     // Número de slides visibles a la vez
    slidesToScroll: 1,   // Número de slides que se desplazan por vez
    autoplay: true,      // Reproducción automática
    autoplaySpeed: 3000, // Velocidad de autoplay (3 segundos)
  };

  // Array de elementos del carrusel ACTUALIZADO
  const slides = [
    {
      id: 1,
      image: propa1, // Usamos la ruta directa a public/assets
      title: 'Propaganda 1',
    },
    {
      id: 2,
      image: propa2, // Usamos la ruta directa a public/assets
      title: 'Propaganda 2',
    },
  ];

  return (
    <div className="carousel-container">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id} className="slide">
            {/* Renderizamos solo la imagen, usando la ruta */}
            <img src={slide.image} alt={slide.title} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Carousel;

// import React from 'react';
// import Slider from 'react-slick';
// import '../styles/carousel.css'; // Importa los estilos locales
// import motoDelivery from '../assets/moto-delivery.jpg';

// const Carousel = () => {
//   // Configuración del carrusel (puedes ajustar estas opciones)
//   const settings = {
//     dots: true,          // Muestra indicadores (puntos) en la parte inferior
//     infinite: true,      // Carrusel infinito
//     speed: 500,          // Velocidad de transición (ms)
//     slidesToShow: 1,     // Número de slides visibles a la vez
//     slidesToScroll: 1,   // Número de slides que se desplazan por vez
//     autoplay: true,      // Reproducción automática
//     autoplaySpeed: 3000, // Velocidad de autoplay (3 segundos)
//   };

//   // Array de elementos del carrusel (puedes agregar más o cambiar los textos/imágenes)
//   const slides = [
//     {
//       id: 1,
//       image: motoDelivery, // Reemplaza con tu imagen real
//       title: 'Bienvenido a nuestra app',
//       description: 'Solicita entregas rápidas y seguras.',
//     },
//     {
//       id: 2,
//       image: IANGEN, // Reemplaza con tu imagen real
//       title: 'Para repartidores',
//       description: 'Gana dinero extra aceptando pedidos.',
//     },
//     {
//       id: 3,
//       image: IAMGEN2, // Reemplaza con tu imagen real
//       title: 'Contacto y soporte',
//       description: 'Estamos aquí para ayudarte.',
//     },
//   ];

//   return (
//     <div className="carousel-container">
//       <Slider {...settings}>
//         {slides.map((slide) => (
//           <div key={slide.id} className="slide">
//             {/* <img src={slide.image} alt={slide.title} /> */}
//                 <img src={slide.image} />
            
//             {/* <div className="slide-content">
//               <h2>{slide.title}</h2>
//               <p>{slide.description}</p>
//             </div> */}
//           </div>
//         ))}
//       </Slider>
//     </div>
//   );
// };

// export default Carousel;