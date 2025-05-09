import React from 'react';
import { getProductsByCollection, getCollections, Collection, CollectionWithProductsPage } from '../../../lib/shopify';
import ProductCard from '../../../components/product/ProductCard';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious, // Descomentado para usar
  // PaginationLink,
  // PaginationEllipsis,
} from '../../../components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '../../../components/ui/sheet';
import FiltersSidebarContent from '../../../components/shop/FiltersSidebarContent';
import { Button } from '../../../components/ui/button';
import { FilterIcon } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { category } = params;
  const afterCursor = typeof searchParams?.after === 'string' ? searchParams.after : null;
  const beforeCursor = typeof searchParams?.before === 'string' ? searchParams.before : null;

  interface ProductsByCollectionRequestParams {
    collectionHandle: string;
    first?: number;
    last?: number;
    after?: string | null;
    before?: string | null;
    // Adicione aqui outros filtros se getProductsByCollection os suportar
  }

  let productParams: ProductsByCollectionRequestParams = { collectionHandle: category, first: ITEMS_PER_PAGE };
  if (afterCursor) {
    productParams.after = afterCursor;
  } else if (beforeCursor) {
    productParams = { collectionHandle: category, last: ITEMS_PER_PAGE, before: beforeCursor };
    delete productParams.first;
  }

  const categoryData: CollectionWithProductsPage | null = await getProductsByCollection(productParams);
  const allCollections: Collection[] = await getCollections();

  // Se a categoria não for encontrada ou não houver dados
  if (!categoryData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
        <p className="mb-8">A categoria que você está procurando não existe ou foi removida.</p>
        <Link
          href="/shop"
          className="bg-[#FF6700] text-white py-2 px-6 rounded-md hover:bg-[#E05A00] transition-colors inline-block"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const products = categoryData.products.edges.map(edge => edge.node);
  const pageInfo = categoryData.products.pageInfo;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{categoryData.title}</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-[#FF6700]">
            Loja
          </Link>
          <span className="mx-2">/</span>
          <span>{categoryData.title}</span>
        </div>
      </div>

      {/* Filtros e produtos */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar para Desktop */}
        <div className="hidden md:block w-full md:w-64 flex-shrink-0">
          <FiltersSidebarContent
            collections={allCollections}
            currentCategoryHandle={category}
          />
        </div>

        {/* Lista de produtos */}
        <div className="flex-grow">
          {/* Controles: Botão de Filtros (Mobile) e Select de Ordenação */}
          <div className="flex flex-row md:flex-col items-center gap-4 mb-6"> {/* Container principal dos controles */}
            <div className="flex flex-row w-full items-center gap-4 md:justify-end md:border-b md:pb-4"> {/* Wrapper para layout mobile e desktop */}
              {/* Botão de Filtros para Mobile (SheetTrigger) */}
              <div className="w-1/2 md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-2 px-3">
                      <FilterIcon size={18} />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] p-6 overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle>Filtros e Categorias</SheetTitle>
                    </SheetHeader>
                    <FiltersSidebarContent
                      collections={allCollections}
                      currentCategoryHandle={category}
                    />
                    <SheetClose asChild>
                      <Button variant="outline" className="mt-4 w-full">Fechar</Button>
                    </SheetClose>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Select de Ordenação */}
              <div className="flex items-center w-1/2 md:w-auto">
                <label htmlFor="sort" className="sr-only md:not-sr-only md:mr-2 text-gray-600">
                  Ordenar por:
                </label>
                <select
                  id="sort"
                  className="border rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent w-full"
                >
                  <option value="featured">Em destaque</option>
                  <option value="price-asc">Preço: Menor para maior</option>
                  <option value="price-desc">Preço: Maior para menor</option>
                  <option value="name-asc">Nome: A-Z</option>
                  <option value="name-desc">Nome: Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid de produtos */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6"> {/* Alterado de grid-cols-1 sm:grid-cols-2 para grid-cols-2 */}
                {products.map((product) => (
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
              {/* Componente de Paginação */}
              <div className="mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {pageInfo.hasPreviousPage && pageInfo.startCursor && (
                      <PaginationItem>
                        <PaginationPrevious href={`/shop/${category}?before=${pageInfo.startCursor}`} />
                      </PaginationItem>
                    )}

                    {/* Lógica para números de página (1, 2, 3...) - Requer totalCount */}
                    
                    {pageInfo.hasNextPage && pageInfo.endCursor && (
                      <PaginationItem>
                        <PaginationNext href={`/shop/${category}?after=${pageInfo.endCursor}`} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria.</p>
              <Link
                href="/shop"
                className="mt-4 inline-block text-[#FF6700] hover:underline"
              >
                Ver todos os produtos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
