'use client';

'use client';

'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../cart/CartDrawer';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ListItem } from "@/components/ui/list-item";

interface Collection {
  id: string; // Mudar para string, pois o ID do Shopify é gid://...
  handle: string;
  title: string;
  subcollections?: Array<{
    id: string; // Mudar para string
    handle: string;
    title: string;
  }>;
}

// Ajustada para refletir os dados da API Admin (getProducts)
interface Product {
  id: string; // Adicionado
  title: string; // Adicionado
  handle: string;
  descriptionHtml: string; // Adicionado
  // variants não são mais buscados aqui por padrão
  images?: { // Mantido opcional
    edges: Array<{
      node: {
        id?: string; // Adicionado opcionalmente
        src: string;
        altText?: string;
      }
    }>
  };
}

const Header = () => {
  const router = useRouter();
  const { totalItems, toggleCart, isCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null); // Removido - não utilizado
  const [collections, setCollections] = useState<Collection[]>([]);
  // const [products, setProducts] = useState<Product[]>([]); // Removido, não buscamos mais produtos gerais inicialmente
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  let leaveTimeout: NodeJS.Timeout | null = null;

  useEffect(() => {
    const fetchShopifyData = async () => {
      try {
        // Fetch collections
        const collectionsResponse = await fetch('/api/admin/collections');
        console.log('Collections Response Status:', collectionsResponse.status);
        const collectionsData = await collectionsResponse.json();
        console.log('Collections Data:', collectionsData);
        // Filtrar coleções vazias ou sem título, se necessário
        const validCollections = collectionsData.collections?.filter((c: Collection) => c.id && c.title) || [];
        setCollections(validCollections);

      } catch (error) {
        console.error('Erro ao buscar dados iniciais do Shopify:', error);
      }
    };

    fetchShopifyData();
  }, []);

  // Função para buscar produtos por ID da coleção
  const fetchProductsByCollectionId = async (collectionId: string, identifier: string) => {
    console.log(`[fetchProductsByCollectionId] Iniciando busca para identifier: ${identifier}, collectionId: ${collectionId}`);
    // Usar o identifier (handle ou id) como chave para o cache
    if (productsByCategory[identifier] && productsByCategory[identifier].length > 0) { // Verifica se já tem dados e não está vazio
      console.log(`[fetchProductsByCollectionId] Produtos para ${identifier} já existem no cache.`);
      return;
    }
     // Se existe a chave mas está vazia (erro anterior?), busca novamente.
     if (productsByCategory.hasOwnProperty(identifier) && productsByCategory[identifier].length === 0) {
       console.log(`[fetchProductsByCollectionId] Cache para ${identifier} estava vazio (possível erro anterior), buscando novamente.`);
     }


    try {
      // Passar collectionId como parâmetro
      const response = await fetch(`/api/admin/products?collectionId=${collectionId}&limit=4`);
      console.log(`[fetchProductsByCollectionId] Resposta da API para ${identifier} status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[fetchProductsByCollectionId] Dados recebidos para ${identifier}:`, data.products);


      if (data.error) {
         console.error(`Erro da API ao buscar produtos da coleção ${identifier}:`, data.details || data.error);
         // Atualizar estado para indicar erro ou array vazio, evitando estado inconsistente
         setProductsByCategory(prev => ({
           ...prev,
           [identifier]: []
         }));
         return;
      }

      setProductsByCategory(prev => ({
        ...prev,
        [identifier]: data.products || [] // Garantir que seja um array
      }));
    } catch (error) {
      console.error(`Erro ao buscar produtos da coleção ${identifier} (ID: ${collectionId}):`, error);
       // Atualizar estado para indicar erro ou array vazio
       setProductsByCategory(prev => ({
         ...prev,
         [identifier]: []
       }));
    }
  };


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleMouseEnter = (menuHandle: string) => { // Renomeado para menuHandle para clareza
    console.log(`[handleMouseEnter] Mouse entrou em: ${menuHandle}`);
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      leaveTimeout = null;
    }
    // setActiveMegaMenu(menuHandle); // Removido - não utilizado

    // Buscar produtos para a coleção quando o mouse passar sobre o item
    // Não buscar para 'todos-produtos' aqui, pois ele não tem ID único
    if (menuHandle !== 'todos-produtos' && collections && collections.length > 0) {
      const collection = collections.find(c => c.handle === menuHandle); // Encontra a coleção pelo handle
      if (collection && collection.id) { // Verifica se encontrou e se tem ID
        console.log(`[handleMouseEnter] Coleção encontrada: ${collection.title} (ID: ${collection.id}, Handle: ${collection.handle})`);
        fetchProductsByCollectionId(collection.id, collection.handle); // Passa o ID e o handle
      } else {
        console.log(`[handleMouseEnter] Coleção com handle ${menuHandle} não encontrada ou sem ID.`);
      }
    } else if (menuHandle === 'todos-produtos') {
       console.log("[handleMouseEnter] 'todos-produtos' - Nenhuma busca específica de coleção iniciada.");
    }
  };

  const handleMouseLeave = () => {
    leaveTimeout = setTimeout(() => {
      // setActiveMegaMenu(null); // Removido - não utilizado
    }, 200); // 200ms delay
  };

  // Função auxiliar para renderizar produtos (evita repetição)
  const renderProductGrid = (collectionHandle: string) => {
    const products = productsByCategory[collectionHandle];
    console.log(`[renderProductGrid] Renderizando produtos para handle: ${collectionHandle}. Produtos encontrados:`, products);

    return (
      <div className="col-span-4 grid grid-cols-4 gap-4">
        {products ? (
          products.length > 0 ? (
            products.slice(0, 4).map((product) => (
              // Adicionado flex/flex-col/items-center ao Link para centralizar o texto abaixo da imagem menor
              <Link href={`/product/${product.handle}`} key={product.id} className="group flex flex-col items-center text-center">
                {/* Adicionado w-20 h-20 e removido aspect-square para definir tamanho fixo menor */}
                <div className="relative overflow-hidden rounded-lg bg-white w-24 h-24 mb-1">
                  {product.images && product.images.edges && product.images.edges[0]?.node?.src && (
                    <Image
                      src={product.images.edges[0].node.src}
                      alt={product.images.edges[0].node.altText || product.title}
                      fill
                      sizes="240px" // Ajustar sizes para o novo tamanho fixo
                      className="object-contain transition-transform group-hover:scale-105" // Mudado para object-contain
                      priority={false}
                    />
                  )}
                </div>
                {/* Ajustado para ter largura máxima e centralizar texto */}
                <h4 className="mt-1 text-xs font-medium text-gray-700 w-full truncate px-1">{product.title}</h4>
              </Link>
            ))
          ) : (
            <div className="col-span-4 text-center text-gray-500">Nenhum produto encontrado nesta categoria.</div>
          )
        ) : (
          // Mostrar "Carregando..." apenas se a busca foi iniciada mas ainda não retornou
          productsByCategory.hasOwnProperty(collectionHandle) ?
          <div className="col-span-4 text-center text-gray-500">Carregando produtos...</div> :
          <div className="col-span-4 text-center text-gray-400">Passe o mouse para carregar.</div> // Mensagem inicial
        )}
      </div>
    );
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
                width={45}
                height={40}
                priority
              />
            </Link>

            {/* Menu de navegação para desktop usando shadcnui */}
            <nav className="hidden md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link href="/" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Início
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      onMouseEnter={() => handleMouseEnter('todos-produtos')}
                    >
                      Todos os Produtos
                    </NavigationMenuTrigger>
                    <NavigationMenuContent
                      onMouseEnter={() => handleMouseEnter('todos-produtos')} // Manter handleMouseEnter para buscar dados se necessário
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Conteúdo dinâmico para "Todos os Produtos" */}
                      {/* A key agora está no elemento div pai do map */}
                      <ul className="grid w-[1000px] gap-3 p-4 grid-cols-5">
                        {collections && collections.length > 0 ? (
                          collections.map((collection) => (
                            <div key={collection.id} className="pr-4 border-r border-gray-200 last:border-r-0">
                              <h3 className="font-bold text-lg mb-4">{collection.title}</h3>
                              {/* A ul interna não precisa de key, pois seus filhos terão */}
                              <ul>
                                {/* Key adicionada ao ListItem estático */}
                                <ListItem key={`ver-tudo-${collection.id}`} href={`/shop/${collection.handle}`} title="VER TUDO">
                                  Confira todos os produtos de {collection.title}
                                </ListItem>
                                {collection.subcollections && collection.subcollections.map((sub) => (
                                  <ListItem
                                    key={sub.id} // Key já estava aqui
                                    href={`/shop/${collection.handle}/${sub.handle}`} // Ajustar o href se necessário
                                    title={sub.title}
                                  />
                                ))}
                              </ul>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-5 text-center text-gray-500">Carregando categorias...</div>
                        )}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Loop para gerar itens de menu dinamicamente */}
                  {collections && collections.map((collection) => (
                    <NavigationMenuItem key={collection.id}>
                      <NavigationMenuTrigger
                        onMouseEnter={() => handleMouseEnter(collection.handle)}
                      >
                        {collection.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent
                        onMouseEnter={() => handleMouseEnter(collection.handle)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="grid grid-cols-5 gap-4 p-4 w-[1000px]">
                          {/* Coluna de subcategorias */}
                          <div className="col-span-1 border-r border-gray-200 pr-4">
                            <h3 className="font-medium text-size mb-4">Categorias</h3>
                            {/* A ul interna não precisa de key, pois seus filhos terão */}
                            <ul className="space-y-2">
                              {/* Key adicionada ao li estático */}
                              <li key={`ver-tudo-${collection.id}`}>
                                <Link href={`/shop/${collection.handle}`} className="text-[#FF6700] hover:underline flex items-center">
                                  Ver Tudo <span className="ml-1">&rarr;</span>
                                </Link>
                              </li>
                              {collection.subcollections && collection.subcollections.map((sub) => (
                                <li key={sub.id}> {/* Key já estava aqui */}
                                  <Link href={`/shop/${collection.handle}/${sub.handle}`} className="text-gray-600 hover:text-[#FF6700]">
                                    {sub.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Produtos em destaque */}
                          {/* Chamando a função auxiliar para renderizar o grid de produtos */}
                          {renderProductGrid(collection.handle)}

                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ))}
                  {/* Fim do loop dinâmico */}

                </NavigationMenuList>
              </NavigationMenu>
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
                <div className="relative p-1 border border-gray-200 rounded-md hover:border-[#FF6700] transition-colors duration-200">
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
                      strokeWidth={1.2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </Link>

              {/* Ícone do Carrinho */}
              <button
                onClick={toggleCart}
                className="text-gray-600 hover:text-[#FF6700] relative"
                aria-label="Carrinho"
              >
                <div className="relative p-1 border border-gray-200 rounded-md hover:border-[#FF6700] transition-colors duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FF6700] text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>
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

          {/* Menu mobile usando shadcnui */}
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
                <NavigationMenu orientation="vertical" className="w-full">
                  <NavigationMenuList className="flex-col space-y-2">
                    <NavigationMenuItem>
                      <Link href="/" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Início
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/shop" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Loja
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/shop/smartphones" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Smartphones
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/shop/acessorios" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Acessórios
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/shop/casa-inteligente" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Casa Inteligente
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* O Mega Menu antigo foi substituído pelo Navigation Menu da shadcnui */}

      {/* Drawer do Carrinho */}
      <CartDrawer isOpen={isCartOpen} onClose={toggleCart} />
    </header>
  );
};

export default Header;
