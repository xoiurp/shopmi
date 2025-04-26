'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../cart/CartDrawer';
// Importação do logo antigo removida

const Header = () => {
  const router = useRouter();
  const { totalItems, toggleCart, isCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Barra de promoções */}
      <div className="bg-[#FF6700] text-white py-2">
        <div className="container mx-auto px-4">
          {/* Slider horizontal no mobile */}
          <div className="block md:hidden overflow-hidden relative whitespace-nowrap">
            <div className="flex animate-slide gap-8 px-4">
              <span className="flex items-center flex-shrink-0">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Parcele em até 12x sem juros
              </span>
              <span className="flex items-center flex-shrink-0">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Frete Grátis acima de R$200*
              </span>
              <span className="flex items-center flex-shrink-0">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                8% de desconto à vista**
              </span>
            </div>
          </div>

          {/* Layout original no desktop */}
          <div className="hidden md:flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Parcele em até 12x sem juros
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Frete Grátis acima de R$200*
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              8% de desconto à vista**
            </span>
          </div>
        </div>
      </div>

      {/* Cabeçalho principal */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/mibrasil2svg.svg"
                alt="Mi Brasil Logo"
                width={45} // Adiciona a propriedade width
                height={40}
                priority // Mantém priority se necessário para LCP
              />
            </Link>

            {/* Menu de navegação para desktop (movido) */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="font-sans text-sm text-gray-600 hover:text-[#FF6700] font-medium">
                Início
              </Link>
              <Link href="/shop" className="font-sans text-sm text-gray-600 hover:text-[#FF6700] font-medium">
                Loja
              </Link>
              <Link href="/shop/smartphones" className="font-sans text-sm text-gray-600 hover:text-[#FF6700] font-medium">
                Smartphones
              </Link>
              <Link href="/shop/acessorios" className="font-sans text-sm text-gray-600 hover:text-[#FF6700] font-medium">
                Acessórios
              </Link>
              <Link href="/shop/casa-inteligente" className="font-sans text-sm text-gray-600 hover:text-[#FF6700] font-medium">
                Casa Inteligente
              </Link>
            </nav>

            {/* Barra de busca para desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full py-2 pl-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent min-[990px]:p-0 min-[990px]:pl-5 min-[990px]:pr-[50px] min-[990px]:h-[35px] min-[990px]:border-[1.5px] min-[990px]:border-black min-[990px]:text-[#A5A5A5] min-[990px]:text-sm min-[990px]:font-medium min-[990px]:leading-normal min-[990px]:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-[#FF6700]"
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
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </form>
            </div>

            {/* Ícones (Conta e Carrinho) */}
            <div className="flex items-center space-x-4">
              <Link href="/account" className="text-gray-600 hover:text-[#FF6700]">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>

              {/* Ícone do Carrinho */}
              <button
                onClick={toggleCart}
                className="text-gray-600 hover:text-[#FF6700] relative"
                aria-label="Carrinho"
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6700] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Botão de menu para mobile */}
              <button
                onClick={toggleMenu}
                className="md:hidden text-gray-600 hover:text-[#FF6700]"
                aria-label="Menu"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Menu de navegação movido para a linha principal acima */}

          {/* Menu mobile */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              {/* Barra de busca para mobile */}
              <div className="mb-4">
                <form onSubmit={handleSearch} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    className="w-full py-2 pl-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-[#FF6700]"
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
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </form>
              </div>
              
              <nav className="space-y-3">
                <Link href="/" className="block text-gray-600 hover:text-[#FF6700] font-medium">
                  Início
                </Link>
                <Link href="/shop" className="block text-gray-600 hover:text-[#FF6700] font-medium">
                  Loja
                </Link>
                <Link href="/shop/smartphones" className="block text-gray-600 hover:text-[#FF6700] font-medium">
                  Smartphones
                </Link>
                <Link href="/shop/acessorios" className="block text-gray-600 hover:text-[#FF6700] font-medium">
                  Acessórios
                </Link>
                <Link href="/shop/casa-inteligente" className="block text-gray-600 hover:text-[#FF6700] font-medium">
                  Casa Inteligente
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Drawer do Carrinho */}
      <CartDrawer isOpen={isCartOpen} onClose={toggleCart} />
    </header>
  );
};

export default Header;