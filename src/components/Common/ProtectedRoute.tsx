"use client";

import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth(true);

  // Mostra loading enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não há sessão, não renderiza nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Se há sessão, renderiza o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute; 