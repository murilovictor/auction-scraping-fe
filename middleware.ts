import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { PROTECTED_ROUTES } from "./src/utils/protectedRoutes";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: PROTECTED_ROUTES,
}; 