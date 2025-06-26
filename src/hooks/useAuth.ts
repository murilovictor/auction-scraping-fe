import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useAuth = (requireAuth: boolean = false) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (requireAuth && !session) {
      router.push("/signin");
    }
  }, [session, status, router, requireAuth]);

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === "loading",
  };
}; 