'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { CartItem } from '../../context/CartContext'; // Importa o tipo CartItem

interface Product {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  image: string;
  variantId: string;
  productId: string;
}

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  quantity = 1,
  className = '',
}) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);

    // Criar o objeto CartItem completo
    const itemToAdd: CartItem = {
      ...product, // Espalha as propriedades do produto
      quantity: quantity, // Adiciona a quantidade selecionada
    };

    // Adicionar ao carrinho com a quantidade correta
    addToCart(itemToAdd);

    // A lógica de setTimeout e updateQuantity não é mais necessária aqui
    
    // Resetar o estado após um breve período
    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`h-[55px] w-full max-w-[418px] font-bold flex justify-center items-center relative text-white text-sm border border-[#FF6700] bg-[#FF6700] rounded-[50px] transition duration-300 hover:bg-white hover:text-[#FF6700] ${
        isAdding ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer' // Mantido cursor e desabilitado visualmente
      } ${className}`}
    >
      {isAdding ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Adicionando...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Adicionar ao Carrinho
        </>
      )}
    </button>
  );
};

export default AddToCartButton;