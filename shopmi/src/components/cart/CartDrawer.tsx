'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, totalItems, totalPrice, clearCart } = useCart();

  // Função para formatar preço
  const formatPrice = (price: number, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full md:max-w-md md:w-full md:inset-y-auto md:top-4 md:bottom-4 md:max-h-[calc(100vh-2rem)] bg-white shadow-xl rounded-lg overflow-hidden transform transition-all duration-300 ease-in-out ${ // Adicionado overflow-hidden e transition-all
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none' // Usa translate, opacity e pointer-events para ocultar/mostrar
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Cabeçalho do carrinho */}
        <div className="flex items-center justify-between p-4 border-b bg-white text-gray-900"> {/* Mudado bg e text color */}
          <div className="flex items-center gap-2"> {/* Container para ícone e texto */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-semibold">Minhas Compras</h2> {/* Texto atualizado */}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800" // Mudado text color do botão fechar
            aria-label="Fechar carrinho"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Conteúdo do carrinho */}
        <div className="flex-grow overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-lg font-medium">Seu carrinho está vazio</p>
              <p className="mt-2 text-center">
                Adicione produtos para continuar suas compras
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-[#FF6700] text-white rounded-md hover:bg-[#E05A00] transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => { // Abre chaves
                return <CartItem key={item.variantId} item={item} />; // Usa return explícito
              })} 
            </div>
          )}
        </div>

        {/* Rodapé do carrinho com resumo e botão de checkout */}
        {cart.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between mb-2 font-medium">
              <span>Subtotal ({totalItems} itens):</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-gray-500">
              <span>Frete:</span>
              <span>Calculado no checkout</span>
            </div>
            <button className="w-full py-3 bg-[#FF6700] text-white rounded-md hover:bg-[#E05A00] transition-colors font-medium">
              Finalizar Compra
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Limpar Carrinho
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;