import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Tokens da API Shopify - usando variáveis de ambiente
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
// Usar a variável de ambiente correta e segura para o token Admin (sem NEXT_PUBLIC_)
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

if (!SHOPIFY_STORE_DOMAIN) {
  throw new Error("A variável de ambiente NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN não está definida.");
}

// Inicializa adminClient como null. Ele só será criado se o token existir.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: ApolloClient<any> | null = null;

if (SHOPIFY_ADMIN_API_TOKEN) {
  // Criando o link HTTP para a API Admin GraphQL
  const adminLink = createHttpLink({
    uri: `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`,
    headers: {
      // Garantido que SHOPIFY_ADMIN_API_TOKEN é string aqui
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      'Content-Type': 'application/json',
    },
  });

  // Criando o cliente Apollo para a Admin API
  adminClient = new ApolloClient({
    link: adminLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
} else {
  // Logar aviso apenas se o token estiver faltando no ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.warn("A variável de ambiente SHOPIFY_ADMIN_API_TOKEN não está definida. Operações de Admin podem falhar ou estar desabilitadas.");
  }
}

// Exporta o cliente que pode ser null
export { adminClient };


// Interface para os dados do produto a ser criado (copiada de shopify.ts)
export interface ProductCreateInput {
  title: string;
  descriptionHtml?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  images?: {
    src: string;
    altText?: string;
  }[];
  variants?: {
    price: string;
    compareAtPrice?: string;
    sku?: string;
    inventoryQuantity?: number;
    requiresShipping?: boolean;
    taxable?: boolean;
  }[];
}

// Funções administrativas que usarão o adminClient
export const adminOperations = {
  createProduct: async (productData: ProductCreateInput) => {
    if (!adminClient) {
      throw new Error("Admin API client não inicializado. Verifique SHOPIFY_ADMIN_API_TOKEN.");
    }
    const productCreateMutation = gql`
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            descriptionHtml
            productType
            vendor
            tags
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  sku
                  inventoryQuantity
                }
              }
            }
            images(first: 10) {
              edges {
                node {
                  id
                  src
                  altText
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Preparar as imagens no formato esperado pela API
    const images = productData.images?.map(image => ({
      src: image.src,
      altText: image.altText || productData.title
    })) || [];

    // Preparar as variantes no formato esperado pela API
    const variants = productData.variants?.map(variant => ({
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      sku: variant.sku,
      inventoryQuantity: variant.inventoryQuantity || 0,
      requiresShipping: variant.requiresShipping !== undefined ? variant.requiresShipping : true,
      taxable: variant.taxable !== undefined ? variant.taxable : true
    })) || [{ price: "0.00" }]; // Pelo menos uma variante é necessária

    // Preparar o input para a mutação
    const input = {
      title: productData.title,
      descriptionHtml: productData.descriptionHtml || "",
      productType: productData.productType || "",
      vendor: productData.vendor || "Xiaomi",
      tags: productData.tags || [],
      images: images,
      variants: variants
    };

    try {
      const response = await adminClient.mutate({
        mutation: productCreateMutation,
        variables: { input }
      });

      if (response.data.productCreate.userErrors.length > 0) {
        console.error('Erros ao criar produto:', response.data.productCreate.userErrors);
        throw new Error(response.data.productCreate.userErrors[0].message);
      }

      return response.data.productCreate.product;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },

  createCollection: async (title: string, description: string, image?: string) => {
    if (!adminClient) {
      throw new Error("Admin API client não inicializado. Verifique SHOPIFY_ADMIN_API_TOKEN.");
    }
    const collectionCreateMutation = gql`
      mutation collectionCreate($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            title
            handle
            descriptionHtml
            image {
              id
              src
              altText
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Preparar o input para a mutação
    const input: { title: string; descriptionHtml: string; image?: { src: string; altText?: string } } = {
      title,
      descriptionHtml: description
    };

    // Adicionar imagem se fornecida
    if (image) {
      input.image = {
        src: image,
        altText: title
      };
    }

    try {
      const response = await adminClient.mutate({
        mutation: collectionCreateMutation,
        variables: { input }
      });

      if (response.data.collectionCreate.userErrors.length > 0) {
        console.error('Erros ao criar coleção:', response.data.collectionCreate.userErrors);
        throw new Error(response.data.collectionCreate.userErrors[0].message);
      }

      return response.data.collectionCreate.collection;
    } catch (error) {
      console.error('Erro ao criar coleção:', error);
      throw error;
    }
  },

  getCollections: async () => {
    if (!adminClient) {
      console.warn("Admin API client não inicializado (getCollections). Retornando array vazio.");
      return []; // Retorna array vazio se o cliente não estiver disponível
    }
    // Query atualizada para buscar o metafield main_collection
    const collectionsQuery = gql`
      query getCollections {
        collections(first: 50) {
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              image {
                src
                altText
              }
              subcollectionsMetafield: metafield(namespace: "custom", key: "subcollections") {
                key
                value
              }
              mainCollectionMetafield: metafield(namespace: "custom", key: "main_collection") {
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    try {
      const response = await adminClient.query({
        query: collectionsQuery,
      });

      console.log("Resposta completa da API Admin (getCollections):", JSON.stringify(response, null, 2));

      if (response.errors && response.errors.length > 0) {
        console.error('Erros GraphQL ao buscar coleções:', response.errors);
        throw new Error(`Erro GraphQL: ${response.errors[0].message}`);
      }

      if (!response.data || !response.data.collections) {
        console.error('Estrutura inesperada na resposta da API Admin (getCollections): data ou data.collections ausente.', response.data);
        throw new Error('Resposta inesperada da API ao buscar coleções.');
      }

      // Filtrar e mapear as coleções
      const allEdges = response.data.collections.edges;
      // TODO: Definir tipos mais precisos para 'edge' e 'node' da API do Shopify
      const filteredAndMappedCollections = allEdges
        .filter((edge: unknown) => { // Filtrar primeiro - Usando unknown
          // Type guard para edge e node
          if (edge && typeof edge === 'object' && 'node' in edge && edge.node && typeof edge.node === 'object') {
            const node = edge.node as { mainCollectionMetafield?: { value?: string | boolean } }; // Type assertion
            // Incluir apenas se mainCollectionMetafield existir e seu valor for 'true'
            return node.mainCollectionMetafield && (node.mainCollectionMetafield.value === 'true' || node.mainCollectionMetafield.value === true);
          }
          return false;
        })
        .map((edge: unknown) => { // Mapear depois - Usando unknown
           // Type guard para edge e node
           if (!(edge && typeof edge === 'object' && 'node' in edge && edge.node && typeof edge.node === 'object')) {
             return null; // Ou alguma outra forma de tratamento de erro/valor padrão
           }
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           const node = edge.node as { title?: string, subcollectionsMetafield?: { value?: string }, [key: string]: unknown }; // Alterado para unknown
           let subcollections = [];

          if (node.subcollectionsMetafield && node.subcollectionsMetafield.value) {
            try {
              const parsedSubcollections = JSON.parse(node.subcollectionsMetafield.value);
              if (Array.isArray(parsedSubcollections)) {
                subcollections = parsedSubcollections.filter(sub => sub && sub.id);
              }
            } catch (e) {
              console.error(`Erro ao fazer parse ou filtrar o metafield subcollections para ${node.title}:`, e);
              subcollections = [];
            }
          }

          // Remover os metafields extras do objeto final para limpeza
          // Remover os metafields extras do objeto final para limpeza
          // Adicionando eslint-disable para as variáveis não utilizadas na desestruturação
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { subcollectionsMetafield: _subcollectionsMetafield, mainCollectionMetafield: _mainCollectionMetafield, ...restOfNode } = node;

          return {
            ...restOfNode,
            subcollections
          };
        });

      console.log("Coleções filtradas para o menu:", filteredAndMappedCollections); // Log das coleções filtradas
      return filteredAndMappedCollections;

    } catch (error) {
      console.error('Erro ao buscar e filtrar coleções:', error);
      throw error; // Re-lançar o erro para a API route tratar
    }
  },

  // Função getProducts corrigida para usar collection(id: ...)
  getProducts: async (limit: number = 10, collectionId?: string) => {
    if (!adminClient) {
      console.warn("Admin API client não inicializado (getProducts). Retornando array vazio.");
      return [];
    }

    if (!collectionId) {
       console.warn("getProducts chamado sem collectionId. Retornando array vazio...");
       return [];
    }

    const COLLECTION_PRODUCTS_QUERY = gql`
      query getCollectionWithProducts($id: ID!, $first: Int!) {
        collection(id: $id) {
          id
          title
          handle
          products(first: $first) {
            edges {
              node {
                id
                title
                handle
                descriptionHtml
                images(first: 1) {
                  edges {
                    node {
                      id
                      src
                      altText
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    try {
      console.log(`[adminOperations.getProducts] Buscando coleção e produtos com ID:`, collectionId, `e limite: ${limit}`);
      const response = await adminClient.query({
        query: COLLECTION_PRODUCTS_QUERY,
        variables: { id: collectionId, first: limit },
      });

      console.log(`[adminOperations.getProducts] Resposta da API para ${collectionId}:`, JSON.stringify(response, null, 2));

      if (response.errors && response.errors.length > 0) {
        console.error(`Erros GraphQL ao buscar coleção ${collectionId}:`, response.errors);
        throw new Error(`Erro GraphQL: ${response.errors[0].message}`);
      }

      if (!response.data || !response.data.collection) {
        console.warn(`Coleção com ID ${collectionId} não encontrada pela API.`);
        return [];
      }

      if (!response.data.collection.products) {
         console.error(`Estrutura inesperada: campo 'products' ausente em collection para ${collectionId}.`, response.data);
         return [];
      }
      // TODO: Definir tipo para 'edge'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.collection.products.edges.map((edge: { node: any }) => edge.node); // Mantendo any aqui por simplicidade, desabilitando a regra

    } catch (error) {
       if (!(error instanceof Error && error.message.startsWith('Erro GraphQL:'))) {
          console.error(`Erro ao buscar produtos da coleção ${collectionId} via collection(id: ...):`, error);
       }
       throw error;
    }
  },
};
