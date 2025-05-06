
import React from 'react';
import Link from 'next/link';
import fs from 'fs'; // Importa o módulo file system do Node.js
import path from 'path'; // Importa o módulo path do Node.js
import { getProductByHandle } from '@/lib/shopify';
import ProductClientDetails from '@/components/product/ProductClientDetails'; // Importar o novo componente

// Função auxiliar para ler o conteúdo do CSS
async function getCssContent(filePath: string): Promise<string> {
  try {
    // Constrói o caminho absoluto baseado na raiz do projeto
    // process.cwd() geralmente aponta para a raiz onde o comando 'next dev' ou 'next build' foi executado
    const fullPath = path.join(process.cwd(), filePath);
    console.log(`Tentando ler CSS de: ${fullPath}`); // Log para depuração
    return await fs.promises.readFile(fullPath, 'utf8');
  } catch (error) {
    console.error(`Erro ao ler o arquivo CSS: ${filePath}`, error);
    return ''; // Retorna string vazia em caso de erro
  }
}

interface ProductPageProps {
  params: {
    handle: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // No Next.js 15, precisamos aguardar os parâmetros antes de usá-los
  const resolvedParams = await params;
  const product = await getProductByHandle(resolvedParams.handle);

  // Se o produto não for encontrado
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

  // Formatando o preço
  const formatPrice = (amount: string, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  // Extraindo dados do produto
  const images = product.images.edges.map((edge: { node: { originalSrc: string; altText: string | null } }) => ({
    src: edge.node.originalSrc,
    alt: edge.node.altText || product.title,
  }));

  // Mapeia as variantes, incluindo o valor do metafield da cor e objetos de preço completos
  // Atualiza a tipagem inline de edge.node para incluir quantityAvailable
  const variants = product.variants.edges.map((edge: { node: { id: string; title: string; price: { amount: string; currencyCode: string }; compareAtPrice?: { amount: string; currencyCode: string } | null; availableForSale: boolean; quantityAvailable?: number; selectedOptions: { name: string; value: string }[]; metafield?: { value: string } | null; mediavariant?: { references?: { nodes: { image: { originalSrc: string; altText: string | null } }[] } } | null } }) => ({
    ...edge.node, // Inclui todas as propriedades originais do node, incluindo mediavariant
    colorHex: edge.node.metafield?.value || null, // Adiciona a propriedade colorHex
    // Extrai as imagens da variante do metafield 'mediavariant' e as mantém em variantImages (para compatibilidade com o uso atual em ProductClientDetails)
    variantImages: edge.node.mediavariant?.references?.nodes
      ?.filter((node: { image: { originalSrc: string; altText: string | null } }) => node && node.image) // Filtra nós válidos com imagem
      .map((node: { image: { originalSrc: string; altText: string | null } }) => ({
        src: node.image.originalSrc,
        alt: node.image.altText || product.title, // Usa alt text da imagem da variante ou fallback
      })) || [], // Retorna array vazio se não houver imagens
  }));
  // Removendo logs de depuração
  // Removido o '}));' extra daqui
  // Extrair opções de cor únicas com nome e valor hexadecimal
  const colorOptionsMap = new Map<string, string>(); // Usar Map para garantir unicidade e associar nome com hex

  variants.forEach((variant: { selectedOptions: { name: string; value: string }[]; colorHex: string | null }) => {
    const colorOption = variant.selectedOptions.find(
      (option: { name: string }) => option.name.toLowerCase() === 'cor' // Revertido para buscar pelo nome "Cor"
    );
    if (colorOption && colorOption.value && variant.colorHex && !colorOptionsMap.has(colorOption.value)) {
      // Adiciona ao Map apenas se tiver nome da cor, valor hexadecimal e ainda não existir
      colorOptionsMap.set(colorOption.value, variant.colorHex);
    }
  });

  // Converter o Map para um array de objetos { name: string, hex: string }
  const uniqueColors = Array.from(colorOptionsMap, ([name, hex]) => ({ name, hex }));
  // Removendo log de depuração



  const mainImage = images[0] || { src: '', alt: product.title };
  const price = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  );

  // Lê o conteúdo dos arquivos CSS locais
  // Ajuste os caminhos se os arquivos não estiverem um nível acima da raiz do projeto
  const desktopCss = await getCssContent('../main-desk-14c.css');
  const mobileCss = await getCssContent('../main-mob-14.css');

  // Determina se a bag de frete grátis deve ser exibida (preço acima de R$800)
  const showFreeShippingBag = parseFloat(product.priceRange.minVariantPrice.amount) > 800;

  // Renderiza o componente cliente, passando os dados e o CSS como props
  return (
    <ProductClientDetails
      product={product}
      variants={variants}
      images={images}
      uniqueColors={uniqueColors} // Passa o array de objetos { name, hex }
      price={price}
      mainImage={mainImage}
      desktopCss={desktopCss} // Passa o CSS desktop
      mobileCss={mobileCss}   // Passa o CSS mobile
      showFreeShippingBag={showFreeShippingBag} // Passa a nova prop
    />
  );
}
