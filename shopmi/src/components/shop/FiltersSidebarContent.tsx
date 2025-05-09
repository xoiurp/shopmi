'use client'; // Se houver interatividade nos filtros (checkboxes), pode precisar ser client component

import React from 'react';
import Link from 'next/link';
import { Collection } from '../../lib/shopify';

interface FiltersSidebarContentProps {
  collections: Collection[];
  currentCategoryHandle?: string;
  // Adicionar props para estado dos filtros de preço se forem interativos e gerenciados aqui
}

const FiltersSidebarContent: React.FC<FiltersSidebarContentProps> = ({
  collections,
  currentCategoryHandle,
}) => {
  // TODO: Implementar lógica de estado e manipulação para filtros de preço se necessário
  // Por enquanto, os checkboxes são apenas visuais como no código original.

  return (
    <>
      {/* Categorias */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Categorias</h2>
        <ul className="space-y-2">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                href={`/shop/${collection.handle}`}
                className={`transition-colors ${
                  collection.handle === currentCategoryHandle
                    ? 'text-[#FF6700] font-medium'
                    : 'text-gray-600 hover:text-[#FF6700]'
                }`}
              >
                {collection.title}
              </Link>
            </li>
          ))}
           {/* Adicionar link para "Todas as Categorias" ou "Loja Principal" */}
           <li>
            <Link
              href="/shop"
              className={`transition-colors ${
                !currentCategoryHandle // Ativo se nenhuma categoria específica estiver selecionada
                  ? 'text-[#FF6700] font-medium'
                  : 'text-gray-600 hover:text-[#FF6700]'
              }`}
            >
              Ver Tudo
            </Link>
          </li>
        </ul>
      </div>

      {/* Filtro de preço */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Preço</h2>
        {/* A lógica de filtro de preço real precisaria de estado e onChange handlers */}
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
      {/* Adicionar mais filtros aqui se necessário */}
    </>
  );
};

export default FiltersSidebarContent;
