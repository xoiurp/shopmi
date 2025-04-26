"use client";

import React from 'react';
import RedmiA5Content from './RedmiA5Content';

const ExampleProductPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Redmi A5</h1>
      
      {/* Informações do produto */}
      <div className="mb-8">
        {/* ... detalhes do produto ... */}
      </div>
      
      {/* Aqui usamos o componente RedmiA5Content que manterá o estilo original */}
      <div className="w-full">
        <RedmiA5Content />
      </div>
    </div>
  );
};

export default ExampleProductPage;
