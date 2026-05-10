/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Qualquer host HTTPS/HTTP para `next/image` (fotos vêm de Caixa, Megaleilões, Azure Blob, etc.).
    // Alguns hosts (ex.: Caixa) devolvem 403 ao fetch feito pelo otimizador no servidor; nesses casos o front
    // usa `unoptimized` — ver `src/lib/shouldBypassNextImageOptimization.ts`.
    // Só use URLs confiáveis (API própria / parceiros). SVG remoto de origem desconhecida pode ser arriscado.
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "**", pathname: "/**" },
    ],
  },
};

module.exports = nextConfig;
