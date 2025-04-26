import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Tokens da API Shopify - usando variáveis de ambiente (apenas no servidor)
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN; // Ainda precisamos do domínio
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

if (!SHOPIFY_STORE_DOMAIN) {
  throw new Error("A variável de ambiente NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN não está definida.");
}
if (!SHOPIFY_ADMIN_API_TOKEN) {
  throw new Error("A variável de ambiente SHOPIFY_ADMIN_API_TOKEN não está definida.");
}

// Criando o link HTTP para a API Admin GraphQL
const adminLink = createHttpLink({
  uri: `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/graphql.json`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
    'Content-Type': 'application/json',
  },
});

// Criando o cliente Apollo para a Admin API
export const adminClient = new ApolloClient({
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

// Funções administrativas que usarão o adminClient (movidas de shopify.ts)
export const adminOperations = {
  createProduct: async (productData: ProductCreateInput) => {
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
  // Adicionar outras operações administrativas conforme necessário
};
