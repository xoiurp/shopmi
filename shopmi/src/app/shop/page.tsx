import React from 'react';
import { getProducts, getCollections, Product, Collection } from '../../lib/shopify';
import ProductCard from '../../components/product/ProductCard';
import Link from 'next/link';

export default async function ShopPage() {
  // Buscando produtos e coleções da API da Shopify
  const products = await getProducts();
  const collections = await getCollections();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Loja</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span>Loja</span>
        </div>
      </div>

      {/* Filtros e produtos */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar com filtros */}
        <div className="w-full md:w-64 flex-shrink-0">
          {/* Categorias */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Categorias</h2>
            <ul className="space-y-2">
              {collections.map((collection: Collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/shop/${collection.handle}`}
                    className="text-gray-600 hover:text-[#FF6700] transition-colors"
                  >
                    {collection.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Filtro de preço */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Preço</h2>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#FF6700]" />
                <span className="ml-2 text-gray-600">Até R$500</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#FF6700]" />
                <span className="ml-2 text-gray-600">R$500 - R$1000</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#FF6700]" />
                <span className="ml-2 text-gray-600">R$1000 - R$2000</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#FF6700]" />
                <span className="ml-2 text-gray-600">Acima de R$2000</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de produtos */}
        <div className="flex-grow">
          {/* Cabeçalho com contagem e ordenação */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
            <p className="text-gray-600 mb-4 sm:mb-0">
              Mostrando <span className="font-medium">{products.length}</span> produtos
            </p>
            <div className="flex items-center">
              <label htmlFor="sort" className="mr-2 text-gray-600">
                Ordenar por:
              </label>
              <select
                id="sort"
                className="border rounded-md py-1 px-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent"
              >
                <option value="featured">Em destaque</option>
                <option value="price-asc">Preço: Menor para maior</option>
                <option value="price-desc">Preço: Maior para menor</option>
                <option value="name-asc">Nome: A-Z</option>
                <option value="name-desc">Nome: Z-A</option>
              </select>
            </div>
          </div>

          {/* Grid de produtos */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: Product) => (
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}