import React from 'react';
import Acordeon from '../components/ui/Acordeon';
import Logo from '../assets/img/CINTILLO HGO Y SEMARNATH_COLOR.png';

const Principal = () => {
  return (
    <div className="py-4">
      <div className="text-center">
        <h1 className='titulo-principal d-flex align-items-center justify-content-center'>
          <img src={Logo} alt="Logo" className="logo img-fluid me-4" style={{ height: '80px' }} />
          Observatorio Estatal Hídrico
        </h1>
      </div>
      <Acordeon />
    </div>
  );
};

export default Principal;