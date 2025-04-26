'use client';

import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  startOpen?: boolean; // Prop opcional para iniciar aberto
}

const Accordion: React.FC<AccordionProps> = ({ title, children, startOpen = false }) => {
  const [isOpen, setIsOpen] = useState(startOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-6">
      <button
        onClick={toggleAccordion}
        className="flex justify-between items-center w-full py-4 px-0 text-left font-bold text-gray-900 focus:outline-none transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-2xl">{title}</span>
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-screen' : 'max-h-0'
        }`}
        style={{ transitionProperty: 'max-height' }} // Garante que a transição seja aplicada ao max-height
      >
        <div className="py-4"> {/* Mantém o padding interno */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;