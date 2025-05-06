'use client';

import React, { useState } from 'react';

export default function TesteShopifyPage() {
  const [responseData, setResponseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);
    setResponseData(null); // Limpa dados anteriores

    try {
      // Chama a rota da API interna que faz a query ao Shopify Admin API
      const response = await fetch('/api/admin/shopify-proxy');
      const data = await response.json();

      if (!response.ok) {
        // Trata erros HTTP retornados pela rota da API
        throw new Error(data.error || data.details || `Erro HTTP: ${response.status}`);
      }

      // Trata erros específicos retornados no payload JSON pela rota da API
      if (data.error) {
         throw new Error(`Erro da API Shopify: ${data.details || data.error}`);
      }

      // Define os dados brutos recebidos da API no estado
      setResponseData(data);

    } catch (err: any) {
      console.error("Erro ao buscar dados via API proxy:", err);
      setError(err.message || 'Ocorreu um erro desconhecido ao buscar dados.');
    } finally {
      setIsLoading(false); // Garante que o loading seja desativado
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Query Shopify (via API Proxy)</h1>
      <p className="mb-4">Clique no botão para buscar os 5 primeiros produtos via API Admin do Shopify (através da rota interna /api/admin/shopify-proxy) e exibir a resposta JSON bruta.</p>
      <button
        onClick={handleFetchData}
        disabled={isLoading}
        className="bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Buscando...' : 'Buscar Dados da API Shopify'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
          <p className="font-semibold">Erro ao buscar dados:</p>
          <pre className="whitespace-pre-wrap break-words text-sm mt-2">{error}</pre>
        </div>
      )}

      {responseData && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Resposta Bruta da API Shopify:</h2>
          <pre className="bg-gray-800 text-green-300 p-4 rounded text-xs overflow-auto shadow-inner">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
