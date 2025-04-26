"use client";

import React, { useState, useCallback } from 'react'; // Adiciona useCallback
import Link from 'next/link';
import AddToCartButton from '@/components/product/AddToCartButton';
import IsolatedHtmlContent from '@/components/product/DynamicIsolatedHtmlContent';
import ProductGallery from '@/components/product/ProductGallery';
import Accordion from '@/components/ui/Accordion'; // Importar o componente Accordion
import { Product } from '@/lib/shopify'; // Importar a interface Product

// Definir a interface para as props que o componente receberá
type VariantNode = NonNullable<Product['variants']>['edges'][number]['node'];

interface ProductClientDetailsProps {
  product: Product;
  variants: VariantNode[]; // Tipo mais seguro para variantes
  images: { src: string; alt: string }[];
  uniqueColors: { name: string; hex: string }[];
  price: string;
  mainImage: { src: string; alt: string };
  desktopCss?: string;
  mobileCss?: string;
}

// Interface para o metafield
interface Metafield {
  namespace: string;
  key: string;
  value: string;
}

// Função para obter o conteúdo HTML específico para mobile do metafield
function getMobileHtmlContent(product: Product): string | undefined {
  // Verifica se o produto tem metafields
  if (product.metafields && Array.isArray(product.metafields)) {
    // Busca pelo metafield específico (namespace: 'custom', key: 'html_mobile')
    const mobileHtmlMetafield = product.metafields.find(
      (metafield: Metafield | null | undefined) =>
        metafield &&
        metafield.namespace === 'custom' &&
        metafield.key === 'html_mobile'
    );
    
    // Retorna o valor do metafield se encontrado
    if (mobileHtmlMetafield && mobileHtmlMetafield.value) {
      return mobileHtmlMetafield.value;
    }
  }
  
  // Retorna undefined se não encontrar
  return undefined;
}

export default function ProductClientDetails({
  product,
  variants,
  images,
  uniqueColors,
  price,
  mainImage,
  desktopCss, // Recebe a prop
  mobileCss,
}: ProductClientDetailsProps) {
  
  // Estado para a cor selecionada (armazena o NOME da cor)
  const [selectedColor, setSelectedColor] = useState<string | null>(
    uniqueColors.length > 0 ? uniqueColors[0].name : null // Inicializa com o nome da primeira cor
  );

  // TODO: Lógica para encontrar a variantId correta com base na cor selecionada
  const selectedVariantId = variants.find(variant => {
    const colorOption = variant.selectedOptions.find((option: { name: string; value: string }) => option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'cor');
    return colorOption && colorOption.value === selectedColor;
  })?.id || variants[0]?.id || product.variants?.edges?.[0]?.node.id || ""; // Fallback mais seguro para variantId

  const [quantity, setQuantity] = useState(1);

  // Encontra a variante selecionada com base no nome da cor
  const selectedVariant = variants.find(variant => {
    const colorOption = variant.selectedOptions.find((option: { name: string; value: string }) => option.name.toLowerCase() === 'cor');
    return colorOption && colorOption.value === selectedColor;
  });

  // Determina quais imagens exibir na galeria
  type VariantWithImages = VariantNode & { variantImages?: { src: string; alt?: string }[]; currencyCode?: string; };

  const isVariantWithImages = (variant: VariantNode): variant is VariantWithImages =>
    typeof variant === "object" && variant !== null && "variantImages" in variant && Array.isArray((variant as VariantWithImages).variantImages);

  const galleryImages =
    selectedVariant && isVariantWithImages(selectedVariant) && selectedVariant.variantImages && selectedVariant.variantImages.length > 0
      ? selectedVariant.variantImages.map(img => ({
          src: img.src,
          alt: img.alt || "",
        }))
      : images.map(img => ({
          src: img.src,
          alt: img.alt || "",
        }));

  // Função para aumentar a quantidade
  const handleIncreaseQuantity = useCallback(() => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  }, []);

  // Função para diminuir a quantidade, mínimo 1
  const handleDecreaseQuantity = useCallback(() => {
    setQuantity((prevQuantity) => Math.max(1, prevQuantity - 1));
  }, []);

  return (
    <>
      {/* Container principal com largura máxima para galeria e especificações */}
      <div className="w-full lg:max-w-[1200px] mx-auto px-4 py-8">
        {/* Breadcrumbs e Frete Grátis no mobile, acima da galeria */}
        <div className="block md:hidden mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <div className="bg-[#00E676] text-white px-3 py-1 rounded-full text-xs font-medium mr-4">
              Frete Grátis
            </div>
            <Link href="/" className="hover:text-[#FF6700]">
              Home
            </Link>
            <span className="mx-2">|</span>
            <Link href="/shop" className="hover:text-[#FF6700]">
              Celulares
            </Link>
            <span className="mx-2">|</span>
            <span className="truncate max-w-[150px]">{product.title}</span>
          </div>
        </div>

        {/* Conteúdo do produto */}
        <div className="flex flex-col md:flex-row gap-8 mb-16">
          {/* Galeria de imagens com miniaturas verticais */}
          <ProductGallery images={galleryImages} /> {/* Passa as imagens corretas */}

          {/* Detalhes do produto */}
          <div className="w-full md:w-1/2">
            {/* Breadcrumbs */}
            {/* Breadcrumbs e Frete Grátis no desktop */}
            <div className="hidden md:block mb-6">
              <div className="flex items-center text-sm text-gray-500">
                <div className="bg-[#00E676] text-white px-3 py-1 rounded-full text-xs font-medium mr-4">
                  Frete Grátis
                </div>
                <Link href="/" className="hover:text-[#FF6700]">
                  Home
                </Link>
                <span className="mx-2">|</span>
                {/* TODO: Adicionar link de categoria dinâmico se necessário */}
                <Link href="/shop" className="hover:text-[#FF6700]">
                  Celulares
                </Link>
                <span className="mx-2">|</span>
                <span className="truncate max-w-[150px]">{product.title}</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
            
            {/* Código do produto e favoritar */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-500">
                Cód.: {product.id.split('/').pop()?.substring(0, 6)}
              </div>
              <button className="flex items-center text-gray-500 hover:text-[#FF6700]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Favoritar</span>
              </button>
            </div>
            
            {/* Seleção de cores dinâmica */}
            {uniqueColors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-medium mb-3">
                  Selecione uma cor: <span className="font-semibold">{selectedColor || 'Padrão'}</span>
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {uniqueColors.map((color) => ( // Mapeia o array de objetos
                    <button
                      key={color.name} // Usa o nome da cor como chave
                      onClick={() => setSelectedColor(color.name)} // Define o NOME da cor selecionada
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color.name ? 'border-[#FF6700]' : 'border-gray-200' // Compara com o nome da cor
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6700] transition-colors`}
                      style={{ backgroundColor: color.hex }} // Usa o valor hexadecimal para o fundo
                      aria-label={`Selecionar cor ${color.name}`} // Usa o nome da cor no aria-label
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Preço */}
            <div className="mb-6">
              {/* TODO: Adicionar preço "De" (compareAtPrice) se disponível na variante */}
              <div className="text-gray-500 line-through text-sm">De R$ { (parseFloat(product.priceRange.minVariantPrice.amount) * 1.15).toFixed(2) }</div> {/* Exemplo de preço "De" */}
              <div className="text-3xl text-[#FF6700] font-bold">{price}</div>
              {/* TODO: Calcular desconto real se o preço "De" existir */}
              <div className="text-sm text-gray-700">Com 8% de desconto à vista</div>
            </div>
            
            {/* Parcelamento */}
            <div className="mb-8 bg-gray-50 p-4 rounded-md">
              <div className="text-gray-700">Ou R$ {parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}</div>
              {/* TODO: Adicionar lógica de parcelamento real se necessário */}
              <div className="text-gray-700">12 x R$ {(parseFloat(product.priceRange.minVariantPrice.amount) / 12).toFixed(2)} sem juros</div>
            </div>
            
            {/* Quantidade e botão de adicionar ao carrinho */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="flex border rounded-md">
                  <button
                    onClick={handleDecreaseQuantity}
                    className="px-3 py-2 border-r hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1} // Desabilita se a quantidade for 1
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly // Mantém readOnly para evitar digitação direta, mas atualiza com o estado
                    className="w-12 text-center py-2"
                    aria-label="Quantidade"
                  />
                  <button
                    onClick={handleIncreaseQuantity}
                    className="px-3 py-2 border-l hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <AddToCartButton
                  product={{
                    id: product.id,
                    // Combina título do produto e nome da variante (cor)
                    title: `${product.title} - ${selectedVariant?.title || selectedColor || ''}`,
                    price: parseFloat(
                      typeof selectedVariant?.price === "string"
                        ? selectedVariant.price
                        : product.priceRange.minVariantPrice.amount
                    ),
                    currencyCode:
                      (selectedVariant && isVariantWithImages(selectedVariant) && typeof selectedVariant.currencyCode === "string"
                        ? selectedVariant.currencyCode
                        : product.priceRange.minVariantPrice.currencyCode) || "BRL",
                    image:
                      (selectedVariant && isVariantWithImages(selectedVariant) && selectedVariant.variantImages && selectedVariant.variantImages[0]?.src)
                        ? selectedVariant.variantImages[0].src
                        : mainImage.src || "",
                    variantId: selectedVariantId,
                    productId: product.id,
                  }}
                  quantity={quantity} // Passa a quantidade para o botão
                  className="flex-grow text-center" // Removido estilos conflitantes: bg, text, padding, rounded, hover, transition
                  // TODO: Desabilitar botão se a variante selecionada não estiver disponível (availableForSale)
                />
              </div>
            </div>
            
            {/* Frete e devolução */}
            {/* TODO: Implementar cálculo de frete */}
            <div className="border-t border-gray-200 pt-6 flex justify-between">
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#FF6700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Calcule o frete</span>
              </div>
              <div className="flex items-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#FF6700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
                <span>Devolução Grátis</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Acordeon para Especificações Técnicas */}
        {product.metafields && product.metafields.length > 0 && (
          <div className="w-full mb-8">
            <Accordion title="Especificações">
              <div className="space-y-2">
                {product.metafields
                  .filter((mf: Metafield | null | undefined) => mf && mf.namespace === 'specs' && mf.value) // Filtrar por namespace e valor existente, protegendo contra null
                  .map((metafield: Metafield) => (
                    <div key={metafield.key} className="flex text-sm">
                      <span className="font-medium w-1/3 capitalize">
                        {metafield.key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-gray-700 w-2/3">{metafield.value}</span>
                    </div>
                  ))}
              </div>
            </Accordion>
          </div>
        )}

        {/* Título da seção "Detalhes do Produto" */}
        <div className="w-full mt-12 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Detalhes do Produto</h2>
        </div>
      </div>

      {/* Container separado para o IsolatedHtmlContent com largura total real */}
      <div className="fullwidth-html-content">
        <IsolatedHtmlContent
          htmlContent={product.descriptionHtml || ""}
          mobileHtmlContent={getMobileHtmlContent(product) || ""}
          desktopCss={desktopCss}
          mobileCss={mobileCss}
          mobileFooterHeight={600}
          desktopFooterHeight={500}
        />
      </div>
    </>
  );
}
