'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'featured', label: 'Em destaque' }, // Mapear para RELEVANCE ou BEST_SELLING se aplicável, ou sem sortKey
  { value: 'price-asc', label: 'Preço: Menor para maior' },
  { value: 'price-desc', label: 'Preço: Maior para menor' },
  { value: 'name-asc', label: 'Nome: A-Z' },
  { value: 'name-desc', label: 'Nome: Z-A' },
  { value: 'created-desc', label: 'Mais recentes' }, // Mapear para CREATED_AT desc
  { value: 'created-asc', label: 'Mais antigos' }, // Mapear para CREATED_AT asc
];

interface SortSelectProps {
  initialSortValue?: string;
}

const SortSelect: React.FC<SortSelectProps> = ({ initialSortValue }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSort, setSelectedSort] = useState(initialSortValue || 'featured');

  useEffect(() => {
    // Sincroniza o estado se o initialSortValue (da URL) mudar
    if (initialSortValue && initialSortValue !== selectedSort) {
      setSelectedSort(initialSortValue);
    }
  }, [initialSortValue, selectedSort]);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (value === 'featured') {
      current.delete('sort'); // Ou o nome do parâmetro que você escolher
      current.delete('sKey');
      current.delete('sRev');
    } else {
      current.set('sort', value); // Mantém o valor amigável para a URL e para o select
      // O mapeamento para sortKey e reverse será feito no server component
    }

    // Remove parâmetros de paginação para resetar para a primeira página ao mudar a ordenação
    current.delete('after');
    current.delete('before');

    const queryString = current.toString();
    // Preserva o pathname atual ao construir a nova URL
    // Não precisamos do pathname completo aqui, pois o router.push lida com isso.
    router.push(`?${queryString}`, { scroll: false });
  };

  return (
    <div className="flex items-center w-1/2 md:w-auto md:flex-row">
      <label htmlFor="sort-select" className="mr-2 text-gray-600 whitespace-nowrap">
        Ordenar por:
      </label>
      <Select value={selectedSort} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-full md:w-[200px]">
          <SelectValue placeholder="Selecione a ordenação" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="md:hidden">Ordenar por:</SelectLabel>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortSelect;
