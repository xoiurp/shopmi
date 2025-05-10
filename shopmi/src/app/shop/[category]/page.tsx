import React from 'react';
import { getProductsByCollection, getCollections, Collection, CollectionWithProductsPage } from '../../../lib/shopify';
// Import ProductPriceFilter if it were in a shared types file, for now defined locally
import ProductCard from '../../../components/product/ProductCard';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
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
import SortSelect from '../../../components/shop/SortSelect'; // Importar o novo componente

const ITEMS_PER_PAGE = 12;

// Definição do tipo para o filtro de preço estruturado
interface ProductPriceFilter {
  price: {
    min?: number;
    max?: number;
  };
}

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
      return { sortKey: 'CREATED', reverse: true };
    case 'created-asc':
      return { sortKey: 'CREATED', reverse: false };
    case 'featured': 
    default:
      return { sortKey: 'BEST_SELLING', reverse: false }; 
  }
};

// Nova função para obter o objeto de filtro de preço
const getPriceFilterObjectFromParam = (priceRangeParam?: string | string[]): ProductPriceFilter | undefined => {
  const priceRangeValue = Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam;

  if (!priceRangeValue || priceRangeValue === 'any') {
    return undefined;
  }

  const filter: ProductPriceFilter = { price: {} };

  switch (priceRangeValue) {
    case '0-500':
      filter.price.max = 500;
      break;
    case '500-1000':
      filter.price.min = 500;
      filter.price.max = 1000;
      break;
    case '1000-2000':
      filter.price.min = 1000;
      filter.price.max = 2000;
      break;
    case '2000+':
      filter.price.min = 2000;
      break;
    default:
      console.warn(`[CategoryPage] Faixa de preço desconhecida: ${priceRangeValue}`);
      return undefined;
  }
  return filter;
};

interface CategoryPageProps {
  params: { category: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = params;
  const afterCursor = typeof searchParams?.after === 'string' ? searchParams.after : null;
  const beforeCursor = typeof searchParams?.before === 'string' ? searchParams.before : null;

  interface ProductsByCollectionRequestParams {
    collectionHandle: string;
    first?: number;
    last?: number;
    after?: string | null;
    before?: string | null;
    sortKey?: string; 
    reverse?: boolean; 
    // query?: string; // REMOVIDO
    filters?: ProductPriceFilter[]; // ADICIONADO
  }

  const sortParam = searchParams?.sort;
  const priceRangeParam = searchParams?.priceRange;

  const { sortKey, reverse } = getSortOptionsFromParam(sortParam);
  // const priceQuery = getPriceQueryFromParam(priceRangeParam); // REMOVIDO
  const priceFilterObject = getPriceFilterObjectFromParam(priceRangeParam); // ADICIONADO

  // console.log(`[CategoryPage: ${category}] Generated priceQuery:`, priceQuery); // REMOVIDO
  console.log(`[CategoryPage: ${category}] Generated priceFilterObject:`, priceFilterObject ? JSON.stringify(priceFilterObject) : undefined); // ATUALIZADO
  console.log(`[CategoryPage: ${category}] Sort options:`, { sortKey, reverse });

  let productParams: ProductsByCollectionRequestParams = { 
    collectionHandle: category, 
    first: ITEMS_PER_PAGE,
    sortKey,
    reverse,
    // query: priceQuery, // REMOVIDO
    filters: priceFilterObject ? [priceFilterObject] : undefined, // ADICIONADO/ATUALIZADO
  };

  if (afterCursor) {
    productParams.after = afterCursor;
    delete productParams.before;
    delete productParams.last;
  } else if (beforeCursor) {
    productParams = { 
      collectionHandle: category, 
      last: ITEMS_PER_PAGE, 
      before: beforeCursor,
      sortKey,
      reverse,
      // query: priceQuery, // REMOVIDO
      filters: priceFilterObject ? [priceFilterObject] : undefined, // ADICIONADO/ATUALIZADO
    };
    delete productParams.first;
    delete productParams.after;
  }

  const categoryData: CollectionWithProductsPage | null = await getProductsByCollection(productParams);
  const allCollections: Collection[] = await getCollections();

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
    return `/shop/${category}?${currentParams.toString()}`;
  };

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

      <div className="flex flex-col md:flex-row gap-8">
        <div className="hidden md:block w-full md:w-64 flex-shrink-0">
          <FiltersSidebarContent
            collections={allCollections}
            currentCategoryHandle={category}
            currentPriceRange={Array.isArray(priceRangeParam) ? priceRangeParam[0] : priceRangeParam}
          />
        </div>

        <div className="flex-grow">
          <div className="flex flex-row md:flex-col items-center gap-4 mb-6">
            <div className="flex flex-row w-full items-center gap-4 md:justify-end md:border-b md:pb-4">
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

          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {pageInfo.hasPreviousPage && pageInfo.startCursor && (
                      <PaginationItem>
                        <PaginationPrevious href={buildPaginationLink('before', pageInfo.startCursor)} />
                      </PaginationItem>
                    )}
                    
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
