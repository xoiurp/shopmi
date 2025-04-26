'use client';

import React, { useState } from 'react';
// Removido createProduct e createCollection, pois serão chamados via API routes
// import { createProduct, createCollection, ProductCreateInput } from '../../lib/shopify';
import { ProductCreateInput } from '../../lib/shopify'; // Manter a interface se ainda for necessária
import Link from 'next/link';

export default function AdminPage() {
  // Estado para o formulário de produto
  const [productForm, setProductForm] = useState<ProductCreateInput>({
    title: '',
    descriptionHtml: '',
    productType: '',
    vendor: 'Xiaomi',
    tags: [],
    images: [{ src: '', altText: '' }],
    variants: [{ price: '0.00' }]
  });

  // Estado para o formulário de coleção
  const [collectionForm, setCollectionForm] = useState({
    title: '',
    description: '',
    image: ''
  });

  // Estado para mensagens de feedback
  const [productMessage, setProductMessage] = useState({ type: '', text: '' });
  const [collectionMessage, setCollectionMessage] = useState({ type: '', text: '' });

  // Estado para controlar o carregamento
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isCollectionLoading, setIsCollectionLoading] = useState(false);

  // Função para atualizar o formulário de produto
  const updateProductForm = (field: keyof ProductCreateInput, value: string | string[] | { src: string; altText?: string }[] | { price: string; compareAtPrice?: string; sku?: string; inventoryQuantity?: number; requiresShipping?: boolean; taxable?: boolean }[]) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  // Função para atualizar as tags do produto
  const updateProductTags = (tagsString: string) => {
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    updateProductForm('tags', tagsArray);
  };

  // Função para atualizar a primeira imagem do produto
  const updateProductImage = (field: string, value: string) => {
    const updatedImages = [...productForm.images || []];
    if (updatedImages.length === 0) {
      updatedImages.push({ src: '', altText: '' });
    }
    updatedImages[0] = { ...updatedImages[0], [field]: value };
    updateProductForm('images', updatedImages);
  };

  // Tipo seguro para variante
  type VariantType = NonNullable<ProductCreateInput['variants']>[number];

  // Função para atualizar a primeira variante do produto
  const updateProductVariant = (field: keyof VariantType, value: string | number) => {
    const updatedVariants = [...(productForm.variants || [])];
    if (updatedVariants.length === 0) {
      updatedVariants.push({ price: '0.00' });
    }
    updatedVariants[0] = { ...updatedVariants[0], [field]: value };
    updateProductForm('variants', updatedVariants);
  };

  // Função para enviar o formulário de produto (agora chama a API route)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProductLoading(true);
    setProductMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Erro desconhecido ao criar produto');
      }

      setProductMessage({
        type: 'success',
        text: `Produto "${result.title}" criado com sucesso! ID: ${result.id}`
      });
      // Limpar o formulário
      setProductForm({
        title: '',
        descriptionHtml: '',
        productType: '',
        vendor: 'Xiaomi',
        tags: [],
        images: [{ src: '', altText: '' }],
        variants: [{ price: '0.00' }]
      });
    } catch (error) {
      setProductMessage({
        type: 'error',
        text: `Erro ao criar produto: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsProductLoading(false);
    }
  };

  // Função para enviar o formulário de coleção (agora chama a API route)
  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCollectionLoading(true);
    setCollectionMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || 'Erro desconhecido ao criar coleção');
      }

      setCollectionMessage({
        type: 'success',
        text: `Coleção "${result.title}" criada com sucesso! ID: ${result.id}`
      });
      // Limpar o formulário
      setCollectionForm({
        title: '',
        description: '',
        image: ''
      });
    } catch (error) {
      setCollectionMessage({
        type: 'error',
        text: `Erro ao criar coleção: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsCollectionLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-[#FF6700]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span>Admin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário para criar produto */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Criar Novo Produto</h2>

          {productMessage.text && (
            <div className={`mb-4 p-3 rounded ${
              productMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {productMessage.text}
            </div>
          )}

          <form onSubmit={handleProductSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productTitle">
                Título*
              </label>
              <input
                id="productTitle"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                value={productForm.title}
                onChange={(e) => updateProductForm('title', e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productDescription">
                Descrição
              </label>
              <textarea
                id="productDescription"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                rows={4}
                value={productForm.descriptionHtml}
                onChange={(e) => updateProductForm('descriptionHtml', e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productType">
                Tipo de Produto
              </label>
              <input
                id="productType"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                value={productForm.productType}
                onChange={(e) => updateProductForm('productType', e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productVendor">
                Fabricante
              </label>
              <input
                id="productVendor"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                value={productForm.vendor}
                onChange={(e) => updateProductForm('vendor', e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productTags">
                Tags (separadas por vírgula)
              </label>
              <input
                id="productTags"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                value={productForm.tags?.join(', ') || ''}
                onChange={(e) => updateProductTags(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Imagem
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="productImageSrc">
                    URL da Imagem
                  </label>
                  <input
                    id="productImageSrc"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                    value={productForm.images?.[0]?.src || ''}
                    onChange={(e) => updateProductImage('src', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="productImageAlt">
                    Texto Alternativo
                  </label>
                  <input
                    id="productImageAlt"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                    value={productForm.images?.[0]?.altText || ''}
                    onChange={(e) => updateProductImage('altText', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Variante
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="productPrice">
                    Preço*
                  </label>
                  <input
                    id="productPrice"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                    value={productForm.variants?.[0]?.price || '0.00'}
                    onChange={(e) => updateProductVariant('price', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="productCompareAtPrice">
                    Preço Comparativo
                  </label>
                  <input
                    id="productCompareAtPrice"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                    value={productForm.variants?.[0]?.compareAtPrice || ''}
                    onChange={(e) => updateProductVariant('compareAtPrice', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="productSKU">
                    SKU
                  </label>
                  <input
                    id="productSKU"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                    value={productForm.variants?.[0]?.sku || ''}
                    onChange={(e) => updateProductVariant('sku', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2" htmlFor="productInventory">
                    Quantidade em Estoque
                  </label>
                  <input
                    id="productInventory"
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                    value={productForm.variants?.[0]?.inventoryQuantity || 0}
                    onChange={(e) => updateProductVariant('inventoryQuantity', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#FF6700] text-white py-2 px-4 rounded-md hover:bg-[#E05A00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:ring-opacity-50 disabled:opacity-50"
              disabled={isProductLoading}
            >
              {isProductLoading ? 'Criando...' : 'Criar Produto'}
            </button>
          </form>
        </div>

        {/* Formulário para criar coleção */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Criar Nova Coleção</h2>

          {collectionMessage.text && (
            <div className={`mb-4 p-3 rounded ${
              collectionMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {collectionMessage.text}
            </div>
          )}

          <form onSubmit={handleCollectionSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collectionTitle">
                Título*
              </label>
              <input
                id="collectionTitle"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                value={collectionForm.title}
                onChange={(e) => setCollectionForm({...collectionForm, title: e.target.value})}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collectionDescription">
                Descrição
              </label>
              <textarea
                id="collectionDescription"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                rows={4}
                value={collectionForm.description}
                onChange={(e) => setCollectionForm({...collectionForm, description: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collectionImage">
                URL da Imagem
              </label>
              <input
                id="collectionImage"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
                value={collectionForm.image}
                onChange={(e) => setCollectionForm({...collectionForm, image: e.target.value})}
              />
            </div>

            <button
              type="submit"
              className="bg-[#FF6700] text-white py-2 px-4 rounded-md hover:bg-[#E05A00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:ring-opacity-50 disabled:opacity-50"
              disabled={isCollectionLoading}
            >
              {isCollectionLoading ? 'Criando...' : 'Criar Coleção'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
