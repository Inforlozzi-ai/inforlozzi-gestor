'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, Users, UserPlus, Tag, Receipt, 
  FileText, MessageSquare, Package, Bell, Settings, LogOut
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  // Usar de forma segura para evitar erro de undefined no build
  const sessionData = useSession();
  const session = sessionData?.data;
  const userRole = (session?.user as any)?.role || 'operator';

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Clientes', icon: Users },
    { href: '/clients/new', label: 'Novo Cliente', icon: UserPlus },
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/plans', label: 'Planos', icon: Tag },
    { href: '/billing', label: 'Cobranças', icon: Bell },
    { href: '/templates', label: 'Templates', icon: FileText },
    { href: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ];

  const adminItems = [
    { href: '/admin/settings', label: 'Configurações Admin', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Inforlozzi Gestor</h1>
        <p className="text-xs text-gray-400 mt-1 truncate">
          {session?.user?.email || 'Carregando...'} ({userRole})
        </p>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {userRole === 'admin' && (
          <>
            <div className="border-t border-gray-700 my-4"></div>
            <p className="text-xs text-gray-500 px-4 mb-2">ADMINISTRAÇÃO</p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition mt-4"
      >
        <LogOut className="w-5 h-5" />
        <span>Sair</span>
      </button>
    </aside>
  );
}
