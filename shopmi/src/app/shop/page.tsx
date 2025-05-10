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
import SortSelect from '../../components/shop/SortSelect'; // Importar o novo componente

const ITEMS_PER_PAGE = 12; // Defina quantos produtos por página

// Função para mapear o valor do parâmetro de ordenação da URL para sortKey e reverse
const getSortOptionsFromParam = (sortParam?: string | string[]): { sortKey?: string; reverse?: boolean } => {
  const sortValue = Array.isArray(sortParam) ? sortParam[0] : sortParam;
  switch (sortValue) {
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false };
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true };
    case 'name-asc':
      return { sortKey: 'TITLE', reverse: false };
    case 'name-desc':
      return { sortKey: 'TITLE', reverse: true };
    case 'created-desc':
      return { sortKey: 'CREATED_AT', reverse: true };
    case 'created-asc':
      return { sortKey: 'CREATED_AT', reverse: false };
    case 'featured':
    default:
      return { sortKey: 'RELEVANCE', reverse: false };
  }
};

// Reintroduzindo getPriceQueryFromParam para retornar string
const getPriceQueryFromParam = (priceRangeParam?: string | string[]): string | undefined => {
  const priceRangeValue = Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam;
  if (!priceRangeValue || priceRangeValue === 'any') {
    return undefined;
  }
  const parts = priceRangeValue.split('-');
  if (parts.length === 2) {
    if (parts[0] === '0') return `price:<=${parts[1]}`; 
    if (parts[1] === undefined || parts[1] === '+') return `price:>=${parts[0]}`; 
    return `(price:>=${parts[0]} AND price:<=${parts[1]})`; 
  } else if (priceRangeValue.endsWith('+')) {
    const min = priceRangeValue.slice(0, -1);
    return `price:>=${min}`; 
  }
  console.warn(`[ShopPage] Faixa de preço desconhecida para query string: ${priceRangeValue}`);
  return undefined; 
};

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
    sortKey?: string;
    reverse?: boolean;
    query?: string; // Reintroduzido
    // filters?: ProductPriceFilter[]; // Removido para /shop page
  }

  const sortParam = searchParams?.sort;
  const priceRangeParam = searchParams?.priceRange;

  const { sortKey: initialSortKey, reverse: initialReverse } = getSortOptionsFromParam(sortParam);
  const priceQuery = getPriceQueryFromParam(priceRangeParam); 

  let effectiveSortKey = initialSortKey;
  let effectiveReverse = initialReverse;

  // Se um filtro de preço está ativo e a ordenação padrão é RELEVANCE,
  // RELEVANCE pode não funcionar bem com filtros de campo sem um termo de busca textual.
  // Altera para uma ordenação mais explícita (ex: Preço ASC) para garantir que o filtro de preço funcione.
  if (priceQuery && effectiveSortKey === 'RELEVANCE') {
    effectiveSortKey = 'PRICE';
    effectiveReverse = false;
    // O SortSelect na UI continuará mostrando "Em destaque" a menos que seja atualizado para refletir essa mudança.
    // Para este fix, focamos na funcionalidade do filtro.
  }

  console.log("[ShopPage] Generated priceQuery:", priceQuery); 
  console.log("[ShopPage] Initial Sort options from URL:", { initialSortKey, initialReverse });
  console.log("[ShopPage] Effective Sort options for API:", { sortKey: effectiveSortKey, reverse: effectiveReverse });


  let productParams: ProductRequestParams = { 
    first: ITEMS_PER_PAGE,
    sortKey: effectiveSortKey,
    reverse: effectiveReverse,
    query: priceQuery, 
  };

  if (afterCursor) {
    productParams.after = afterCursor;
    delete productParams.before; 
    delete productParams.last; 
  } else if (beforeCursor) {
    productParams = { 
      last: ITEMS_PER_PAGE, 
      before: beforeCursor,
      sortKey: effectiveSortKey, // Usar effectiveSortKey
      reverse: effectiveReverse, // Usar effectiveReverse
      query: priceQuery, 
    };
    delete productParams.first; 
    delete productParams.after; 
  }
  
  const productData: ProductsConnection = await getProducts(productParams);
  const collections: Collection[] = await getCollections();

  const products = productData.edges.map(edge => edge.node);
  const pageInfo = productData.pageInfo;

  const buildPaginationLink = (cursorType: 'after' | 'before', cursorValue: string): string => {
    const currentParams = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (key !== 'after' && key !== 'before' && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => currentParams.append(key, v));
          } else {
            currentParams.set(key, value);
          }
        }
      });
    }
    currentParams.set(cursorType, cursorValue);
    return `/shop?${currentParams.toString()}`;
  };

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
          <FiltersSidebarContent 
            collections={collections} 
            currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
          />
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
                    <FiltersSidebarContent 
                      collections={collections} 
                      currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
                    />
                    <SheetClose asChild>
                      <Button variant="outline" className="mt-4 w-full">Fechar</Button>
                    </SheetClose>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Select de Ordenação */}
              <SortSelect initialSortValue={Array.isArray(sortParam) ? sortParam[0] : sortParam} />
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
                        <PaginationPrevious href={buildPaginationLink('before', pageInfo.startCursor)} />
                      </PaginationItem>
                    )}
                    
                    {/* Lógica para números de página (1, 2, 3...) - Requer totalCount */}
                    {/* Esta parte será abordada após confirmação sobre como obter totalCount */}

                    {pageInfo.hasNextPage && pageInfo.endCursor && (
                      <PaginationItem>
                        <PaginationNext href={buildPaginationLink('after', pageInfo.endCursor)} />
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
