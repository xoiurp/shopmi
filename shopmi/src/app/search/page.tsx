'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '../../components/product/ProductCard';

// Importando a função de busca de produtos
import { searchProducts, Product } from '../../lib/shopify';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);

  // Buscar produtos quando a consulta mudar
  useEffect(() => {
    const fetchProducts = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const resultsConnection = await searchProducts({ queryText: query, first: 20 }); // Ajustado para passar objeto
        setProducts(resultsConnection.edges.map(edge => edge.node)); // Extrair produtos dos edges
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  // Função para lidar com a submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Atualizar a URL com o novo termo de busca
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchTerm);
    window.history.pushState({}, '', url.toString());

    // Recarregar a página para acionar a nova busca
    window.location.href = url.toString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Busca</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span>Busca</span>
        </div>
      </div>

      {/* Formulário de busca */}
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="flex w-full max-w-3xl mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="O que você está procurando?"
            className="flex-grow py-3 px-4 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-[#FF6700] text-white py-3 px-6 rounded-r-md hover:bg-[#E05A00] transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Resultados da busca */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6700]"></div>
            <p className="mt-4 text-gray-600">Buscando produtos...</p>
          </div>
        ) : (
          <>
            {query ? (
              <h2 className="text-xl font-semibold mb-6">
                {products.length > 0
                  ? `${products.length} resultados para "${query}"`
                  : `Nenhum resultado encontrado para "${query}"`}
              </h2>
            ) : (
              <h2 className="text-xl font-semibold mb-6">
                Digite um termo para buscar produtos
              </h2>
            )}

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: Product) => ( // Adicionada tipagem explícita para product
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    handle={product.handle}
                    description={product.description || ""}
                    price={{
                      amount: product.priceRange.minVariantPrice.amount,
                      currencyCode: product.priceRange.minVariantPrice.currencyCode,
                    }}
                    image={{
                      src: product.images.edges[0]?.node.originalSrc || "",
                      alt: product.images.edges[0]?.node.altText || product.title,
                    }}
                  />
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  Não encontramos produtos correspondentes à sua busca.
                </p>
                <p className="text-gray-500 mb-6">
                  Tente usar termos mais gerais ou verifique a ortografia.
                </p>
                <Link
                  href="/shop"
                  className="bg-[#FF6700] text-white py-2 px-6 rounded-md hover:bg-[#E05A00] transition-colors inline-block"
                >
                  Ver todos os produtos
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Use a barra de busca acima para encontrar produtos.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6700]"></div><p className="mt-4 text-gray-600">Carregando busca...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
