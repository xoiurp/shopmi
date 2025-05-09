'use client';

import React from 'react'; // Removido useRef, useEffect
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import { SheetClose } from '../ui/sheet'; // Caminho relativo
import { Button } from '../ui/button';   // Caminho relativo

// Props isOpen e onClose não são mais necessárias, pois o Sheet gerencia seu estado.
// O componente agora representa o CONTEÚDO do Sheet.
const CartDrawerContent: React.FC = () => {
  const { cart, totalItems, totalPrice, clearCart, selectedShipping } = useCart();

  // Função para formatar preço
  const formatPrice = (price: number | string, currencyCode: string = 'BRL') => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return 'Preço inválido';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(numericPrice);
  };

  // useEffect e drawerRef removidos

  return (
    // A div externa com classes de posicionamento e transição é removida.
    // O SheetContent da Shadcn UI cuidará disso.
    // O conteúdo interno é mantido.
    // O cabeçalho interno foi removido pois agora é gerenciado pelo SheetHeader no Header.tsx
    <div className="flex flex-col h-full"> {/* Este h-full é para o conteúdo dentro do SheetContent */}
      {/* Conteúdo do carrinho */}
      {/* Adicionado padding ao container do conteúdo, já que o p-0 foi usado no SheetContent do Header */}
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
            <SheetClose asChild>
              <Button className="mt-6 px-6 py-2 bg-[#FF6700] text-white rounded-md hover:bg-[#E05A00] transition-colors">
                Continuar Comprando
              </Button>
            </SheetClose>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <CartItem key={item.variantId} item={item} />
            ))}
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
            {selectedShipping && (
              <div className="flex justify-between mb-2 font-medium">
                <span>Total com frete:</span>
                <span>{formatPrice(totalPrice + parseFloat(selectedShipping.price))}</span>
              </div>
            )}
            <div className="flex justify-between mb-4 text-sm">
              <span>Frete:</span>
              {selectedShipping ? (
                <div className="text-right">
                  <span className="font-medium text-gray-700">{formatPrice(selectedShipping.price)}</span>
                  <div className="text-xs text-gray-500">
                    {selectedShipping.name} ({selectedShipping.delivery_time} dias úteis)
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Calculado no checkout</span>
              )}
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
  );
};

export default CartDrawerContent; // Renomeado para refletir que é o conteúdo
