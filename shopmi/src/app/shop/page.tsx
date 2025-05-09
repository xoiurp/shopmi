import React from 'react';
import { getProducts, getCollections, Collection, ProductsConnection } from '../../lib/shopify';
import ProductCard from '../../components/product/ProductCard';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose, // Se precisar de um botão de fechar explícito
} from '../../components/ui/sheet';
import FiltersSidebarContent from '../../components/shop/FiltersSidebarContent';
import { Button } from '../../components/ui/button'; // Para o botão de trigger
import { FilterIcon } from 'lucide-react'; // Ícone para o botão

const ITEMS_PER_PAGE = 12; // Defina quantos produtos por página

interface ShopPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const afterCursor = typeof searchParams?.after === 'string' ? searchParams.after : null;
  const beforeCursor = typeof searchParams?.before === 'string' ? searchParams.before : null;

  interface ProductRequestParams {
    first?: number;
    last?: number;
    after?: string | null;
    before?: string | null;
    // Adicione aqui outros filtros se getProducts os suportar, ex: sortKey, query
  }

  let productParams: ProductRequestParams = { first: ITEMS_PER_PAGE };
  if (afterCursor) {
    productParams.after = afterCursor;
  } else if (beforeCursor) {
    productParams = { last: ITEMS_PER_PAGE, before: beforeCursor };
    // Se 'last' e 'before' são usados, não precisamos de 'first' ou 'after'
    delete productParams.first; 
  }
  
  const productData: ProductsConnection = await getProducts(productParams);
  const collections: Collection[] = await getCollections();

  const products = productData.edges.map(edge => edge.node);
  const pageInfo = productData.pageInfo;

  // Lógica para calcular totalPages - DESAFIO: Storefront API não fornece totalCount facilmente.
  // Para uma paginação completa (1, 2, 3...), precisaríamos do total de produtos.
  // Por ora, vamos focar nos botões Previous/Next.
  // Se quisermos números de página, precisaríamos de uma query adicional para contar produtos,
  // o que pode não ser performático ou suportado diretamente para "todos os produtos".
  // Uma alternativa é buscar um número muito grande de produtos (ex: 99999) na primeira vez
  // e contar, mas isso é ineficiente.
  // Outra é, se a API permitir, uma query específica de contagem.
  // Shopify Admin API tem `productsCount`, mas Storefront é mais limitada.

  // Para este exemplo, vamos simular totalPages se tivéssemos um totalCount.
  // const totalProducts = ???; // Precisaria buscar este valor
  // const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  // const currentPage = ???; // Precisaria calcular com base no cursor 'after' ou 'before'

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
        {/* Sidebar para Desktop */}
        <div className="hidden md:block w-full md:w-64 flex-shrink-0">
          <FiltersSidebarContent collections={collections} />
        </div>

        {/* Lista de produtos */}
        <div className="flex-grow">
          {/* Controles: Botão de Filtros (Mobile) e Select de Ordenação */}
          {/* Este container será flex-row no mobile e md:flex-col para o select ir para baixo no desktop antes de ser movido pelo justify-end do pai */}
          <div className="flex flex-row md:flex-col items-center gap-4 mb-6">
            {/* Wrapper para Botão de Filtros e Select de Ordenação para layout mobile */}
            <div className="flex flex-row w-full items-center gap-4 md:justify-end md:border-b md:pb-4">
              {/* Botão de Filtros para Mobile (SheetTrigger) */}
              <div className="w-1/2 md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-2 px-3"> {/* Ajustado padding/py para altura similar ao select */}
                      <FilterIcon size={18} />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] p-6 overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle>Filtros e Categorias</SheetTitle>
                    </SheetHeader>
                    <FiltersSidebarContent collections={collections} />
                    <SheetClose asChild>
                      <Button variant="outline" className="mt-4 w-full">Fechar</Button>
                    </SheetClose>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Select de Ordenação */}
              <div className="flex items-center w-1/2 md:w-auto"> {/* w-1/2 no mobile, w-auto no desktop */}
                <label htmlFor="sort" className="sr-only md:not-sr-only md:mr-2 text-gray-600">
                  Ordenar por:
                </label>
                <select
                  id="sort"
                  className="border rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent w-full" // w-full para mobile, md:w-auto implícito pelo pai
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
                        <PaginationPrevious href={`/shop?before=${pageInfo.startCursor}`} />
                      </PaginationItem>
                    )}
                    
                    {/* Lógica para números de página (1, 2, 3...) - Requer totalCount */}
                    {/* Esta parte será abordada após confirmação sobre como obter totalCount */}

                    {pageInfo.hasNextPage && pageInfo.endCursor && (
                      <PaginationItem>
                        <PaginationNext href={`/shop?after=${pageInfo.endCursor}`} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </>
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
