/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Qualquer host HTTPS/HTTP para `next/image` (fotos vêm de Caixa, Megaleilões, Azure Blob, etc.).
    // Só use URLs confiáveis (API própria / parceiros). SVG remoto de origem desconhecida pode ser arriscado.
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "**", pathname: "/**" },
    ],
  },
};

module.exports = nextConfig;
