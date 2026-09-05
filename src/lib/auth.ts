import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔍 Tentativa de login:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Email ou senha não fornecidos');
          return null;
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error) {
          console.log('❌ Erro ao buscar no banco:', error.message);
          return null;
        }

        if (!user) {
          console.log('❌ Usuário não encontrado');
          return null;
        }

        console.log('✅ Usuário encontrado:', user.email);
        console.log('🔐 Senha do banco:', user.password);
        console.log('🔐 Senha digitada:', credentials.password);

        // Comparação direta (texto puro)
        if (credentials.password !== user.password) {
          console.log('❌ Senhas não conferem');
          return null;
        }

        console.log('🎉 Login bem-sucedido para:', user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        } as any;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-123456',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  }
};
