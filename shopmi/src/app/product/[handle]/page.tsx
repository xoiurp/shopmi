import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { getProductByHandle } from '@/lib/shopify';
import ProductClientDetails from '@/components/product/ProductClientDetails';

// Função auxiliar para ler o conteúdo do CSS
async function getCssContent(filePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    console.log(`Tentando ler CSS de: ${fullPath}`);
    return await fs.promises.readFile(fullPath, 'utf8');
  } catch (error) {
    console.error(`Erro ao ler o arquivo CSS: ${filePath}`, error);
    return '';
  }
}

export type ParamsType = Promise<{ handle: string }>;

export default async function ProductPage({ params }: { params: ParamsType }) {
  const { handle } = await params;

  const product = await getProductByHandle(handle);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
        <p className="mb-8">O produto que você está procurando não existe ou foi removido.</p>
        <Link
          href="/shop"
          className="bg-[#FF6700] text-white py-2 px-6 rounded-md hover:bg-[#E05A00] transition-colors inline-block"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const formatPrice = (amount: string, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  const images = product.images.edges.map((edge: { node: { originalSrc: string; altText: string | null } }) => ({
    src: edge.node.originalSrc,
    alt: edge.node.altText || product.title,
  }));

  const variants = product.variants?.edges.map((edge: {
    node: {
      id: string;
      title: string;
      price: { amount: string; currencyCode: string };
      compareAtPrice?: { amount: string; currencyCode: string } | null;
      availableForSale: boolean;
      quantityAvailable?: number;
      selectedOptions: { name: string; value: string }[];
      metafield?: { value: string } | null;
      mediavariant?: { references?: { nodes: { image: { originalSrc: string; altText: string | null } }[] } } | null;
    };
  }) => ({
    ...edge.node,
    colorHex: edge.node.metafield?.value || null,
    variantImages: edge.node.mediavariant?.references?.nodes
      ?.filter((node: { image: { originalSrc: string; altText: string | null } }) => node && node.image)
      .map((node: { image: { originalSrc: string; altText: string | null } }) => ({
        src: node.image.originalSrc,
        alt: node.image.altText || product.title,
      })) || [],
  })) || []; // Fallback para array vazio se product.variants ou product.variants.edges for undefined
  

  const colorOptionsMap = new Map<string, string>();
  variants.forEach((variant: { selectedOptions: { name: string; value: string }[]; colorHex: string | null }) => {
    const colorOption = variant.selectedOptions.find(
      (option: { name: string }) => option.name.toLowerCase() === 'cor'
    );
    if (colorOption && colorOption.value && variant.colorHex && !colorOptionsMap.has(colorOption.value)) {
      colorOptionsMap.set(colorOption.value, variant.colorHex);
    }
  });

  const uniqueColors = Array.from(colorOptionsMap, ([name, hex]) => ({ name, hex }));

  const mainImage = images[0] || { src: '', alt: product.title };
  const price = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  );

  const desktopCss = await getCssContent('../main-desk-14c.css');
  const mobileCss = await getCssContent('../main-mob-14.css');

  return (
    <ProductClientDetails
      product={product}
      variants={variants}
      images={images}
      uniqueColors={uniqueColors}
      price={price}
      mainImage={mainImage}
      desktopCss={desktopCss}
      mobileCss={mobileCss}
    />
  );
}
