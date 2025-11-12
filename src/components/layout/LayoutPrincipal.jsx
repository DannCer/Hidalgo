import React from 'react';
import Header from './Header';
import Footer from './Footer';

const LayoutPrincipal = ({children}) => {
  return (
    <div className="layout-principal">
      <Header />
      <main className="container-max" >{children}</main>
      <Footer />
    </div>
  );
};

export default LayoutPrincipal;