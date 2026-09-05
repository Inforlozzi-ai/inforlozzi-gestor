import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Permitir acesso às APIs sem autenticação de sessão
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    
    // Para páginas, verificar se está autenticado
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Permitir todas as rotas de API
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }
        
        // Para páginas, exigir token (exceto login)
        if (req.nextUrl.pathname === '/login') {
          return true;
        }
        
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
