import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Interfaces para tipagem
export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  productType?: string; // Adicionado tipo do produto
  tags?: string[]; // Adicionado tags
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: {
      node: {
        originalSrc: string;
        altText: string | null;
      };
    }[];
  };
  variants?: {
    edges: {
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        compareAtPrice?: {
          amount: string;
          currencyCode: string;
        } | null;
        availableForSale: boolean;
        quantityAvailable?: number;
        selectedOptions: { name: string; value: string }[];
        metafield?: { value: string } | null;
        mediavariant?: {
          references?: {
            nodes: {
              image: {
                originalSrc: string;
                altText: string | null;
              };
            }[];
          };
        } | null;
      };
    }[];
  };
  metafields?: {
    key: string;
    value: string;
    namespace: string;
  }[];
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  image?: {
    originalSrc: string;
    altText: string | null;
  } | null;
}

// Tokens da API Shopify - usando variáveis de ambiente
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN_CLIENT = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN; // Mantido para log, mas não usado no cliente

if (!SHOPIFY_STOREFRONT_TOKEN_CLIENT) {
  throw new Error("A variável de ambiente NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT não está definida.");
}
// A verificação de SHOPIFY_ADMIN_API_TOKEN foi removida daqui, pois será feita no lado do servidor

// URL da API GraphQL da Shopify
// Como estamos em modo de demonstração, usaremos dados mockados quando a API não estiver disponível

// Função para criar dados mockados
const createMockData = () => {
  // Produtos mockados
  const mockProducts = Array(10).fill(null).map((_, index) => ({
    id: `gid://shopify/Product/${index + 1}`,
    title: `Xiaomi Smartphone ${index + 1}`,
    handle: `xiaomi-smartphone-${index + 1}`,
    description: `Este é um smartphone Xiaomi de alta qualidade com excelentes recursos e desempenho.`,
    priceRange: {
      minVariantPrice: {
        amount: `${999 + index * 100}`,
        currencyCode: 'BRL',
      },
    },
    images: {
      edges: [
        {
          node: {
            originalSrc: 'https://placehold.co/600x400?text=Xiaomi+Smartphone',
            altText: `Xiaomi Smartphone ${index + 1}`,
          },
        },
      ],
    },
  }));

  // Coleções mockadas
  const mockCollections = [
    {
      id: 'gid://shopify/Collection/1',
      title: 'Smartphones',
      handle: 'smartphones',
      description: 'Nossa coleção de smartphones Xiaomi',
      image: {
        originalSrc: 'https://placehold.co/600x400?text=Smartphones',
        altText: 'Smartphones',
      },
    },
    {
      id: 'gid://shopify/Collection/2',
      title: 'Acessórios',
      handle: 'acessorios',
      description: 'Acessórios para seus dispositivos Xiaomi',
      image: {
        originalSrc: 'https://placehold.co/600x400?text=Acessorios',
        altText: 'Acessórios',
      },
    },
    {
      id: 'gid://shopify/Collection/3',
      title: 'Casa Inteligente',
      handle: 'casa-inteligente',
      description: 'Produtos Xiaomi para sua casa inteligente',
      image: {
        originalSrc: 'https://placehold.co/600x400?text=Casa+Inteligente',
        altText: 'Casa Inteligente',
      },
    },
  ];

  return { mockProducts, mockCollections };
};

// Criando o link HTTP para a API Storefront GraphQL
const storefrontLink = createHttpLink({
  uri: `https://${SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`,
  headers: {
    'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN_CLIENT,
    'Content-Type': 'application/json',
  },
});

// Criando o cliente Apollo para a Storefront API
export const storefrontClient = new ApolloClient({
  link: storefrontLink,
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
  },
});

// Funções para obter dados (Storefront API)
export async function getProducts() {
  const query = `
    query GetProducts {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  originalSrc
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(query),
    });
    
    // Removido log da resposta da API
    return response.data.products.edges.map((edge: { node: Product }) => edge.node);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error); // Manter log de erro
    // Retornar dados mockados em caso de erro
    console.warn('Usando dados mockados para produtos devido a erro na API');
    const { mockProducts } = createMockData();
    return mockProducts;
  }
}

export async function getProductByHandle(handle: string) {
  const query = `
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        productType # Buscar productType
        tags # Buscar tags
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 5) {
          edges {
            node {
              originalSrc
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              # Adiciona compareAtPrice à query se necessário
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              quantityAvailable # Pede a quantidade disponível
              selectedOptions {
                name
                value
              }
              # Adiciona busca pelo metafield da cor na variante
              metafield(namespace: "custom", key: "cor") {
                 value
              }
              # Busca o metafield com as imagens da variante
              mediavariant: metafield(namespace: "custom", key: "mediavariant") {
                # Assumindo que o valor é uma lista de referências de mídia
  references(first: 20) { # Pega as primeiras 20 imagens da variante
     nodes {
       ... on MediaImage {
         id
         image {
           originalSrc
           altText
         }
       }
     }
  }
              }
            }
          }
        }
        # Adicionando busca por metacampos específicos
        metafields(identifiers: [
          # Especificações técnicas
          {namespace: "custom", key: "tela"},
          {namespace: "custom", key: "sistema_operacional"},
          {namespace: "custom", key: "sensores"},
          {namespace: "custom", key: "rede_bandas"},
          {namespace: "custom", key: "processador"},
          {namespace: "custom", key: "memoria"},
          {namespace: "custom", key: "garantia"},
          {namespace: "custom", key: "dimensoes"},
          {namespace: "custom", key: "conteudo_embalagem"},
          {namespace: "custom", key: "conectividade"},
          {namespace: "custom", key: "camera"},
          {namespace: "custom", key: "bateria"},
          {namespace: "custom", key: "audio_video"},
          # Conteúdo HTML específico para dispositivos móveis
          {namespace: "custom", key: "html_mobile"}
        ]) {
          key
          value
          namespace
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(query),
      variables: { handle },
    });
    return response.data.productByHandle;
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    // Retornar um produto mockado em caso de erro
    const { mockProducts } = createMockData();
    return mockProducts.find((p) => p.handle === handle) || null;
  }
}

export async function getCollections() {
  const query = `
    query GetCollections {
      collections(first: 250) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              originalSrc
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(query),
    });
    
    // Removido log da resposta da API
    return response.data.collections.edges.map((edge: { node: Collection }) => edge.node);
  } catch (error) {
    console.error('Erro ao buscar coleções:', error); // Manter log de erro
    // Retornar coleções mockadas em caso de erro
    console.warn('Usando dados mockados para coleções devido a erro na API');
    const { mockCollections } = createMockData();
    return mockCollections;
  }
}

export async function getProductsByCollection(collectionHandle: string) {
  const query = `
    query GetProductsByCollection($handle: String!) {
      collectionByHandle(handle: $handle) {
        title
        products(first: 20) {
          edges {
            node {
              id
              title
              handle
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    originalSrc
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(query),
      variables: { handle: collectionHandle },
    });
    
    // Verificar se collectionByHandle existe antes de acessar suas propriedades
    if (response.data.collectionByHandle) {
      return {
        title: response.data.collectionByHandle.title,
        products: response.data.collectionByHandle.products.edges.map((edge: { node: Product }) => edge.node),
      };
    } else {
      console.error('Coleção não encontrada');
      // Retornar dados mockados em caso de coleção não encontrada
      const { mockProducts, mockCollections } = createMockData();
      const collection = mockCollections.find((c) => c.handle === collectionHandle);
      return {
        title: collection?.title || '',
        products: mockProducts
      };
    }
  } catch (error) {
    console.error('Erro ao buscar produtos da coleção:', error);
    // Retornar dados mockados em caso de erro
    const { mockProducts, mockCollections } = createMockData();
    const collection = mockCollections.find((c) => c.handle === collectionHandle);
    return {
      title: collection?.title || '',
      products: mockProducts
    };
  }
}

export async function searchProducts(query: string) {
  const gqlQuery = `
    query SearchProducts($query: String!) {
      products(first: 20, query: $query) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  originalSrc
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(gqlQuery),
      variables: { query },
    });
    return response.data.products.edges.map((edge: { node: Product }) => edge.node);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    // Retornar produtos mockados filtrados pelo termo de busca
    const { mockProducts } = createMockData();
    return mockProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Interface para os dados do produto a ser criado (mantida para referência, mas a função será movida)
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

// As funções createProduct e createCollection foram movidas para shopify-admin.ts
