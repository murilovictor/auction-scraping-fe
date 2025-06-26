// Lista de rotas que requerem autenticação
export const PROTECTED_ROUTES = [
  "/auction-list",
  // Adicione outras rotas protegidas aqui
  // "/dashboard",
  // "/profile",
  // "/settings",
];

// Função para verificar se uma rota é protegida
export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
};

// Função para obter a rota de redirecionamento padrão
export const getDefaultRedirectPath = (): string => {
  return "/signin";
}; 