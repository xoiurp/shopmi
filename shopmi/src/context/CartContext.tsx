'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definindo os tipos
export interface CartItem {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
  quantity: number;
  image: string;
  variantId: string;
  productId: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void; // Aceita o item completo com quantidade
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// Criando o contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}

// Provedor do contexto
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  // Estado para o carrinho
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Carregar carrinho do localStorage ao iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
      }
    }
  }, []);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Adicionar item ao carrinho (com quantidade específica)
  const addToCart = (itemToAdd: CartItem) => {
    setCart((prevCart) => {
      // Verificar se o item (mesmo produto e variante) já existe no carrinho
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.variantId === itemToAdd.variantId
      ); // Usar variantId para unicidade

      if (existingItemIndex >= 0) {
        // Se o item já existe, aumentar a quantidade pela quantidade adicionada
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += itemToAdd.quantity; // Soma a quantidade
        return updatedCart;
      } else {
        // Se o item não existe, adicionar ao carrinho com a quantidade especificada
        return [...prevCart, { ...itemToAdd }]; // Adiciona o item como está (já tem quantity)
      }
    });
    
    // Abrir o carrinho quando um item é adicionado
    setIsCartOpen(true);
  };

  // Remover item do carrinho
  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // Atualizar quantidade de um item
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Limpar o carrinho
  const clearCart = () => {
    setCart([]);
  };

  // Alternar visibilidade do carrinho
  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  // Calcular total de itens
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Calcular preço total
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Valor do contexto
  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    toggleCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}