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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allNodes = allEdges.map((edge: { node: any }) => edge.node);

      // Coletar todos os GIDs de subcoleções únicas
      const subcollectionGids = new Set<string>();
      allNodes.forEach((node: { subcollectionsMetafield?: { value?: string } }) => {
        if (node.subcollectionsMetafield && node.subcollectionsMetafield.value) {
          try {
            const parsedGids: string[] = JSON.parse(node.subcollectionsMetafield.value);
            if (Array.isArray(parsedGids)) {
              parsedGids.forEach(gid => {
                if (typeof gid === 'string' && gid.startsWith('gid://shopify/Collection/')) {
                  subcollectionGids.add(gid);
                }
              });
            }
          } catch {
            // console.error(`Erro ao fazer parse do metafield subcollections para ${node.title}:`);
          }
        }
      });

      const subcollectionDetailsMap = new Map();
      if (subcollectionGids.size > 0) {
        const subcollectionIdsArray = Array.from(subcollectionGids);
        // Query para buscar detalhes das subcoleções por IDs
        const SUBCOLLECTIONS_DETAILS_QUERY = gql`
          query getNodes($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Collection {
                id
                title
                handle
                image {
                  src
                  altText
                }
              }
            }
          }
        `;
        const subDetailsResponse = await adminClient.query({
          query: SUBCOLLECTIONS_DETAILS_QUERY,
          variables: { ids: subcollectionIdsArray },
        });

        if (subDetailsResponse.data && subDetailsResponse.data.nodes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subDetailsResponse.data.nodes.forEach((subNode: any) => {
            if (subNode) { // Verificar se o nó não é null (caso um ID não seja encontrado)
              subcollectionDetailsMap.set(subNode.id, subNode);
            }
          });
        }
      }

      // Filtrar coleções principais e popular subcoleções
      const collectionsWithSubcollections = allNodes
        .filter((node: { mainCollectionMetafield?: { value?: string | boolean } }) => {
          return node.mainCollectionMetafield && (node.mainCollectionMetafield.value === 'true' || node.mainCollectionMetafield.value === true);
        })
        .map((node: { id: string, title?: string, subcollectionsMetafield?: { value?: string }, [key: string]: unknown }) => {
          let populatedSubcollections = [];
          if (node.subcollectionsMetafield && node.subcollectionsMetafield.value) {
            try {
              const subGids: string[] = JSON.parse(node.subcollectionsMetafield.value);
              if (Array.isArray(subGids)) {
                populatedSubcollections = subGids
                  .map(gid => subcollectionDetailsMap.get(gid))
                  .filter(Boolean); // Remove undefined/null se alguma subcoleção não foi encontrada
              }
            } catch {
              // console.error(`Erro ao processar subcoleções para ${node.title}:`);
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { subcollectionsMetafield: _sm, mainCollectionMetafield: _mm, ...restOfNode } = node;
          return {
            ...restOfNode,
            subcollections: populatedSubcollections,
          };
        });

      console.log("Coleções com subcoleções populadas:", JSON.stringify(collectionsWithSubcollections, null, 2));
      return collectionsWithSubcollections;

    } catch (error) {
      console.error('Erro ao buscar e processar coleções com subcoleções:', error);
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
      return response.data.collection.products.edges.map((edge: { node: any }) => edge.node); 

    } catch (error) {
       if (!(error instanceof Error && error.message.startsWith('Erro GraphQL:'))) {
          console.error(`Erro ao buscar produtos da coleção ${collectionId} via collection(id: ...):`, error);
       }
       throw error;
    }
  },
};
