import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inforlozzi Gestor",
  description: "Sistema Profissional de Gestão IPTV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white antialiased`}>
        {/* Desktop: Sidebar fixa */}
        <div className="hidden md:flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
        
        {/* Mobile: Menu hamburguer */}
        <div className="md:hidden min-h-screen">
          <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-50">
            <h1 className="text-lg font-bold text-blue-400">Inforlozzi Gestor</h1>
            <MobileMenu />
          </header>
          <main className="p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function MobileMenu() {
  return (
    <nav className="flex gap-2">
      <a href="/" className="text-gray-400 hover:text-white p-2"></a>
      <a href="/clients" className="text-gray-400 hover:text-white p-2">👥</a>
      <a href="/invoices" className="text-gray-400 hover:text-white p-2">💰</a>
      <a href="/whatsapp" className="text-gray-400 hover:text-white p-2">📱</a>
    </nav>
  );
}
