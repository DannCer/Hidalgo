import React from 'react';
import Header from './Header';

const LayoutObservatorio = ({children}) => {
  return (
    <div>
      <Header />
      <main style={{padding: '0', margin:0}}>{children}</main>
    </div>
  );
};

export default LayoutObservatorio;