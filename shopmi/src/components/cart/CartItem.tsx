'use client';

import React from 'react';
import Image from 'next/image';
import { useCart, CartItem as CartItemType } from '../../context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  // Função para formatar preço
  const formatPrice = (price: number, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  // Função para lidar com a mudança de quantidade
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    updateQuantity(item.id, newQuantity);
  };

  return (
    <div className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Imagem do produto */}
      <div className="w-24 h-24 relative flex-shrink-0 bg-white"> {/* Mudado de bg-gray-100 para bg-white */}
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="96px"
            className="object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Detalhes do produto */}
      <div className="flex-grow p-3">
        <div className="flex justify-between">
          <h3 className="font-medium text-gray-800 line-clamp-2">{item.title}</h3>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-gray-400 hover:text-red-500 ml-2"
            aria-label="Remover item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <div className="mt-2 flex justify-between items-center">
          <div className="flex items-center">
            <label htmlFor={`quantity-${item.id}`} className="sr-only">
              Quantidade
            </label>
            <select
              id={`quantity-${item.id}`}
              value={item.quantity}
              onChange={handleQuantityChange}
              className="border rounded-md text-sm py-1 pl-2 pr-8 bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <div className="font-medium text-[#FF6700]">
              {formatPrice(item.price * item.quantity, item.currencyCode)}
            </div>
            {item.quantity > 1 && (
              <div className="text-xs text-gray-500">
                {formatPrice(item.price, item.currencyCode)} cada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;