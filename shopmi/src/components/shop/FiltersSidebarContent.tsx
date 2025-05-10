'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Collection } from '../../lib/shopify';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'; // Adicionado Accordion

interface PriceRangeOption {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

const priceRanges: PriceRangeOption[] = [
  { value: 'any', label: 'Qualquer Preço' },
  { value: '0-500', label: 'Até R$500', max: 500 },
  { value: '500-1000', label: 'R$500 - R$1000', min: 500, max: 1000 },
  { value: '1000-2000', label: 'R$1000 - R$2000', min: 1000, max: 2000 },
  { value: '2000+', label: 'Acima de R$2000', min: 2000 },
];

interface FiltersSidebarContentProps {
  collections: Collection[];
  currentCategoryHandle?: string;
  currentPriceRange?: string;
}

const FiltersSidebarContent: React.FC<FiltersSidebarContentProps> = ({
  collections,
  currentCategoryHandle,
  currentPriceRange,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const [selectedPriceRange, setSelectedPriceRange] = useState(currentPriceRange || 'any'); // Removido estado local

  // useEffect(() => { // Removido useEffect
  //   if (currentPriceRange && currentPriceRange !== selectedPriceRange) {
  //     setSelectedPriceRange(currentPriceRange);
  //   } else if (!currentPriceRange && selectedPriceRange !== 'any') {
  //    setSelectedPriceRange('any');
  //   }
  // }, [currentPriceRange, selectedPriceRange]);

  // O RadioGroup será controlado diretamente pelo valor da URL
  const displayPriceRange = currentPriceRange || 'any';

  const handlePriceChange = (value: string) => {
    // setSelectedPriceRange(value); // Removido, pois não há mais estado local para isso
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (value === 'any') {
      current.delete('priceRange');
    } else {
      current.set('priceRange', value);
    }

    current.delete('after');
    current.delete('before');

    const path = currentCategoryHandle ? `/shop/${currentCategoryHandle}` : '/shop';
    router.push(`${path}?${current.toString()}`, { scroll: false });
  };

  return (
    <Accordion type="multiple" defaultValue={['categories', 'price']} className="w-full">
      {/* Categorias */}
      <AccordionItem value="categories" className="border-b">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
          Categorias
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4">
          <ul className="space-y-2">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/shop/${collection.handle}`}
                  className={`block py-1 transition-colors ${
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
                className={`block py-1 transition-colors ${
                  !currentCategoryHandle // Ativo se nenhuma categoria específica estiver selecionada
                    ? 'text-[#FF6700] font-medium'
                    : 'text-gray-600 hover:text-[#FF6700]'
                }`}
              >
                Ver Tudo
              </Link>
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Filtro de preço */}
      <AccordionItem value="price" className="border-b-0">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
          Preço
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4">
          <RadioGroup value={displayPriceRange} onValueChange={handlePriceChange}>
            {priceRanges.map((range) => (
              <div key={range.value} className="flex items-center space-x-2 py-1">
                <RadioGroupItem value={range.value} id={`price-${range.value}`} />
                <Label htmlFor={`price-${range.value}`} className="text-gray-600 font-normal">
                  {range.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </AccordionContent>
      </AccordionItem>
      {/* Adicionar mais filtros aqui se necessário */}
    </Accordion>
  );
};

export default FiltersSidebarContent;
