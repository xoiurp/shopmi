import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Interfaces para tipagem
export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
}

export interface ProductsConnection {
  edges: {
    node: Product;
  }[];
  pageInfo: PageInfo;
  // totalCount não é diretamente suportado pela Storefront API para products connection
  // para fins de performance. O total de produtos/páginas precisará ser gerenciado
  // de forma diferente se um contador exato for necessário para a UI de paginação.
  // Para a paginação da Shadcn, geralmente precisamos saber o número total de páginas.
  // Isso pode exigir uma query separada para contar todos os produtos ou uma estimativa.
  // Por ora, focaremos em implementar a navegação "próxima página".
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  productType?: string;
  tags?: string[];
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
  // Adicionando products connection para quando uma coleção é buscada com seus produtos paginados
  products?: ProductsConnection;
}

// Interface para o retorno de getProductsByCollection
export interface CollectionWithProductsPage extends Collection {
  products: ProductsConnection;
}


// Tokens da API Shopify - usando variáveis de ambiente
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN_CLIENT = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT;

if (!SHOPIFY_STOREFRONT_TOKEN_CLIENT) {
  throw new Error("A variável de ambiente NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN_CLIENT não está definida.");
}

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
interface GetProductsParams {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
}

export async function getProducts(params: GetProductsParams): Promise<ProductsConnection> {
  const { first = 20, after = null, last = null, before = null } = params;

  let queryArgsDefs = "";
  let productArgs = "";

  const variables: any = {};

  if (last && before) {
    queryArgsDefs = "$last: Int!, $before: String";
    productArgs = "last: $last, before: $before";
    variables.last = last;
    variables.before = before;
  } else {
    queryArgsDefs = "$first: Int!, $after: String";
    productArgs = "first: $first, after: $after";
    variables.first = first;
    if (after) variables.after = after; // 'after' é opcional para a primeira página
  }

  const query = `
    query GetProducts(${queryArgsDefs}) {
      products(${productArgs}) {
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
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(query),
      variables,
    });
    return response.data.products as ProductsConnection;
  } catch (error)
 {
    console.error('Erro ao buscar produtos:', error);
    console.warn('Usando dados mockados para produtos devido a erro na API');
    const { mockProducts } = createMockData();
    // Simulação de paginação para mock data
    let paginatedMockProducts;
    let hasNext = false;
    let hasPrev = false;
    let startIdx = 0;

    if (after) { // Simula 'after'
      const afterIdx = mockProducts.findIndex(p => p.id === after); // Supondo que 'after' é um ID para mock
      if (afterIdx !== -1) startIdx = afterIdx + 1;
      hasPrev = true;
    } else if (before) { // Simula 'before'
      const beforeIdx = mockProducts.findIndex(p => p.id === before);
      if (beforeIdx !== -1) {
        startIdx = Math.max(0, beforeIdx - (last || first));
      }
      hasNext = true;
    }
    
    const itemsToTake = last || first;
    paginatedMockProducts = mockProducts.slice(startIdx, startIdx + itemsToTake);
    
    if (!before) hasNext = (startIdx + itemsToTake) < mockProducts.length;
    if (!after && startIdx > 0) hasPrev = true;


    return {
      edges: paginatedMockProducts.map(node => ({ node })),
      pageInfo: {
        hasNextPage: hasNext,
        endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null, // Usando ID como cursor mock
        hasPreviousPage: hasPrev,
        startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null, // Usando ID como cursor mock
      },
    };
  }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
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
          {namespace: "custom", key: "html_mobile"},
          # Metafields específicos para Smartwatch (sw_)
          {namespace: "custom", key: "sw_conectividade-bluetooth"},
          {namespace: "custom", key: "sw_conectividade_gps"},
          {namespace: "custom", key: "sw_conectividade_wifi"},
          {namespace: "custom", key: "sw_others_app"},
          {namespace: "custom", key: "sw_others_bateria"},
          {namespace: "custom", key: "sw_others_camera"},
          {namespace: "custom", key: "sw_others_chamada"},
          {namespace: "custom", key: "sw_others_diferenciais"},
          {namespace: "custom", key: "sw_others_embalagem"},
          {namespace: "custom", key: "sw_others_memoria_local"},
          {namespace: "custom", key: "sw_others_musica"},
          {namespace: "custom", key: "sw_others_pulseira"},
          {namespace: "custom", key: "sw_others_saude"},
          {namespace: "custom", key: "sw_others_sensores"},
          {namespace: "custom", key: "sw_others_sports"},
          {namespace: "custom", key: "sw_others_watter"},
          {namespace: "custom", key: "sw_protecao_tela"},
          {namespace: "custom", key: "sw_recursos_tela"},
          {namespace: "custom", key: "sw_resolucao"},
          {namespace: "custom", key: "sw_tamanho_tela"},
          {namespace: "custom", key: "sw_tela_sensivel_ao_toque"},
          {namespace: "custom", key: "sw_tipo_tela"}
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
    const { mockProducts } = createMockData();
    return mockProducts.find((p) => p.handle === handle) || null;
  }
}

export async function getCollections(): Promise<Collection[]> {
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
    console.warn('Usando dados mockados para coleções devido a erro na API');
    const { mockCollections } = createMockData();
    return mockCollections;
  }
}

interface GetProductsByCollectionParams extends GetProductsParams {
  collectionHandle: string;
}

export async function getProductsByCollection(
  params: GetProductsByCollectionParams
): Promise<CollectionWithProductsPage | null> {
  const { collectionHandle, first = 20, after = null, last = null, before = null } = params;

  let queryArgsDefs = "$handle: String!, ";
  let productArgs = "";
  const variables: any = { handle: collectionHandle };

  if (last && before) {
    queryArgsDefs += "$last: Int!, $before: String";
    productArgs = "last: $last, before: $before";
    variables.last = last;
    variables.before = before;
  } else {
    queryArgsDefs += "$first: Int!, $after: String";
    productArgs = "first: $first, after: $after";
    variables.first = first;
    if (after) variables.after = after;
  }

  const query = `
    query GetProductsByCollection(${queryArgsDefs}) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        description
        image {
          originalSrc
          altText
        }
        products(${productArgs}) {
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
          pageInfo {
            hasNextPage
            endCursor
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(query),
      variables,
    });
    
    if (response.data.collectionByHandle) {
      return response.data.collectionByHandle as CollectionWithProductsPage;
    } else {
      console.error(`Coleção não encontrada: ${collectionHandle}`);
      return null; // Retorna null se a coleção não for encontrada
    }
  } catch (error) {
    console.error(`Erro ao buscar produtos da coleção ${collectionHandle}:`, error);
    console.warn(`Usando dados mockados para a coleção ${collectionHandle} devido a erro na API`);
    const { mockProducts, mockCollections } = createMockData();
    const collectionMock = mockCollections.find((c) => c.handle === collectionHandle);
    if (collectionMock) {
      // Simulação de paginação para mock data
      let paginatedMockProducts;
      let hasNext = false;
      let hasPrev = false;
      let startIdx = 0;
      const itemsToTake = last || first;

      if (after) {
        const afterIdx = mockProducts.findIndex(p => p.id === after);
        if (afterIdx !== -1) startIdx = afterIdx + 1;
        hasPrev = true;
      } else if (before) {
        const beforeIdx = mockProducts.findIndex(p => p.id === before);
        if (beforeIdx !== -1) startIdx = Math.max(0, beforeIdx - itemsToTake);
        hasNext = true;
      }
      
      paginatedMockProducts = mockProducts.slice(startIdx, startIdx + itemsToTake);
      if (!before) hasNext = (startIdx + itemsToTake) < mockProducts.length;
      if (!after && startIdx > 0) hasPrev = true;

      return {
        ...collectionMock,
        products: {
          edges: paginatedMockProducts.map(node => ({ node })),
          pageInfo: {
            hasNextPage: hasNext,
            endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null,
            hasPreviousPage: hasPrev,
            startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null,
          },
        },
      };
    }
    return null;
  }
}

interface SearchProductsParams extends GetProductsParams {
  queryText: string;
}

export async function searchProducts(params: SearchProductsParams): Promise<ProductsConnection> {
  const { queryText, first = 20, after = null, last = null, before = null } = params;

  let queryArgsDefs = "$queryText: String!, ";
  let productArgs = "query: $queryText, ";
  const variables: any = { queryText };

  if (last && before) {
    queryArgsDefs += "$last: Int!, $before: String";
    productArgs += "last: $last, before: $before";
    variables.last = last;
    variables.before = before;
  } else {
    queryArgsDefs += "$first: Int!, $after: String";
    productArgs += "first: $first, after: $after";
    variables.first = first;
    if (after) variables.after = after;
  }

  const gqlQuery = `
    query SearchProducts(${queryArgsDefs}) {
      products(${productArgs}) {
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
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
      }
    }
  `;

  try {
    const response = await storefrontClient.query({
      query: gql(gqlQuery),
      variables,
    });
    return response.data.products as ProductsConnection;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    const { mockProducts } = createMockData();
    // Simulação de paginação para mock data
    const filtered = mockProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(queryText.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(queryText.toLowerCase()))
    );
    
    let paginatedMockProducts;
    let hasNext = false;
    let hasPrev = false;
    let startIdx = 0;
    const itemsToTake = last || first;

    if (after) {
      const afterIdx = filtered.findIndex(p => p.id === after);
      if (afterIdx !== -1) startIdx = afterIdx + 1;
      hasPrev = true;
    } else if (before) {
      const beforeIdx = filtered.findIndex(p => p.id === before);
      if (beforeIdx !== -1) startIdx = Math.max(0, beforeIdx - itemsToTake);
      hasNext = true;
    }
    
    paginatedMockProducts = filtered.slice(startIdx, startIdx + itemsToTake);
    if (!before) hasNext = (startIdx + itemsToTake) < filtered.length;
    if (!after && startIdx > 0) hasPrev = true;
    
    return {
      edges: paginatedMockProducts.map(node => ({ node })),
      pageInfo: {
        hasNextPage: hasNext,
        endCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[paginatedMockProducts.length - 1].id : null,
        hasPreviousPage: hasPrev,
        startCursor: paginatedMockProducts.length > 0 ? paginatedMockProducts[0].id : null,
      },
    };
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
