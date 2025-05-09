'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  image: {
    src: string;
    alt: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  handle,
  description,
  price,
  image,
}) => {
  const { addToCart } = useCart();

  // Função para formatar preço
  const formatPrice = (amount: string, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  // Função para adicionar ao carrinho
  const handleAddToCart = () => {
    addToCart({
      id,
      title,
      price: parseFloat(price.amount),
      currencyCode: price.currencyCode,
      image: image.src,
      variantId: id, // Usando o ID do produto como ID da variante por simplicidade
      productId: id,
      handle: handle, // Adicionado o handle do produto
      quantity: 1,
    });
  };

  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Imagem do produto com link para a página de detalhes */}
      <Link href={`/product/${handle}`} className="block relative h-64 overflow-hidden">
        {image.src ? (
          <Image
            src={image.src}
            alt={image.alt || title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-scale-down group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
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
      </Link>

      {/* Detalhes do produto */}
      <div className="p-4">
        <Link href={`/product/${handle}`} className="block">
          <h3 className="text-lg font-medium text-gray-800 mb-1 hover:text-[#FF6700] transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-[#FF6700] font-semibold">
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-[#FF6700] text-white py-2 px-4 rounded-md hover:bg-[#E05A00] transition-colors text-sm font-medium"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
