import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-misans)', 'sans-serif'], // Define a fonte padrão 'sans' para usar a variável --font-misans
      },
      colors: {
        // Você pode adicionar suas cores personalizadas aqui se necessário
        // Exemplo:
        // 'brand-orange': '#FF6700',
      },
      // Você pode estender outras propriedades do tema aqui
    },
  },
  plugins: [],
}
export default config