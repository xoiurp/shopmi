// import type { NextConfig } from "next"; // Removido para .mjs

const nextConfig = { // Removida a anotação de tipo ': NextConfig'
  images: {
    domains: [
      'i01.appmifile.com',
      'placehold.co',
      'cdn.shopify.com',
      'uxh1te-1d.myshopify.com'
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Expor variáveis de ambiente para o cliente
  env: {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_STOREFRONT_TOKEN_CLIENT: process.env.SHOPIFY_STOREFRONT_TOKEN_CLIENT,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  output: 'standalone', // Adiciona esta linha para criar um build standalone
};

export default nextConfig;
