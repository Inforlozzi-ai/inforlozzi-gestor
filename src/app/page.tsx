'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, DollarSign, AlertTriangle, CheckCircle, XCircle, 
  Clock, TrendingUp, Smartphone, Wifi, WifiOff, 
  ChevronRight, Phone, Calendar, Filter, X, Eye
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    expiredClients: 0,
    expiringSoon: 0,
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0
  });
  const [waStatus, setWaStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchWhatsAppStatus();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();

      if (data.success && data.data) {
        setClients(data.data);
        calculateStats(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientsList: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    let active = 0, expired = 0, expiringSoon = 0;
    let revToday = 0, revWeek = 0, revMonth = 0;

    clientsList.forEach((c: any) => {
      if (c.status === 'active' || c.active) active++;
      
      if (c.expiration_date) {
        const expDate = new Date(c.expiration_date);
        if (expDate < today) expired++;
        else if (expDate <= in3Days && expDate >= today) expiringSoon++;
      }

      const price = parseFloat(c.plan?.price || c.product?.price || 0);
      const created = new Date(c.created_at);

      if (created >= today) revToday += price;
      if (created >= weekAgo) revWeek += price;
      if (created >= monthAgo) revMonth += price;
    });

    setStats({
      totalClients: clientsList.length,
      activeClients: active,
      expiredClients: expired,
      expiringSoon: expiringSoon,
      revenueToday: revToday,
      revenueWeek: revWeek,
      revenueMonth: revMonth
    });
  };

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/check-status');
      const data = await res.json();
      setWaStatus(data.connected ? 'connected' : 'disconnected');
    } catch {
      setWaStatus('disconnected');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sem data';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Filtrar clientes baseado no card clicado
  const handleCardClick = (filterType: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    let filtered: any[] = [];

    switch (filterType) {
      case 'total':
        filtered = clients;
        break;
      case 'active':
        filtered = clients.filter(c => c.status === 'active' || c.active);
        break;
      case 'expiringSoon':
        filtered = clients.filter(c => {
          if (!c.expiration_date) return false;
          const expDate = new Date(c.expiration_date);
          return expDate >= today && expDate <= in3Days;
        });
        break;
      case 'expired':
        filtered = clients.filter(c => {
          if (!c.expiration_date) return false;
          const expDate = new Date(c.expiration_date);
          return expDate < today;
        });
        break;
      default:
        filtered = clients;
    }

    setFilteredClients(filtered);
    setSelectedFilter(filterType);
  };

  const getFilterTitle = () => {
    switch (selectedFilter) {
      case 'total': return 'Todos os Clientes';
      case 'active': return 'Clientes Ativos';
      case 'expiringSoon': return 'Clientes a Vencer (3 dias)';
      case 'expired': return 'Clientes Vencidos';
      default: return 'Clientes';
    }
  };

  const getFilterColor = () => {
    switch (selectedFilter) {
      case 'active': return 'green';
      case 'expiringSoon': return 'yellow';
      case 'expired': return 'red';
      default: return 'blue';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Clique nos cards para ver os detalhes</p>
        </div>
        
        {/* Status WhatsApp */}
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border cursor-pointer hover:opacity-80 transition ${
          waStatus === 'connected' 
            ? 'bg-green-900/30 border-green-700 text-green-400' 
            : 'bg-red-900/30 border-red-700 text-red-400'
        }`} onClick={() => router.push('/whatsapp')}>
          {waStatus === 'connected' ? (
            <Wifi className="w-6 h-6" />
          ) : (
            <WifiOff className="w-6 h-6" />
          )}
          <div>
            <p className="text-sm font-medium">WhatsApp</p>
            <p className="text-lg font-bold">
              {waStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 ml-2" />
        </div>
      </div>

      {/* Cards de Clientes - CLICÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => handleCardClick('total')}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalClients}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            Clientes cadastrados
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </p>
        </div>

        <div 
          onClick={() => handleCardClick('active')}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Ativos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeClients}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            Planos ativos
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </p>
        </div>

        <div 
          onClick={() => handleCardClick('expiringSoon')}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-yellow-600/20 rounded-lg group-hover:bg-yellow-600/30 transition">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">A Vencer</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.expiringSoon}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            Vencem em 3 dias
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </p>
        </div>

        <div 
          onClick={() => handleCardClick('expired')}
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-600/20 rounded-lg group-hover:bg-red-600/30 transition">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Vencidos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.expiredClients}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            Precisam renovar
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </p>
        </div>
      </div>

      {/* Cards de Receita */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-600/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Receita Hoje</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenueToday)}</p>
            </div>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-1/3"></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Receita Semanal</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenueWeek)}</p>
            </div>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-2/3"></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <Smartphone className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Receita Mensal</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.revenueMonth)}</p>
            </div>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-full"></div>
          </div>
        </div>
      </div>

      {/* Modal/Tabela de Clientes Filtrados */}
      {selectedFilter && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header da Modal */}
            <div className={`p-6 border-b border-gray-700 flex items-center justify-between bg-${getFilterColor()}-900/20`}>
              <div className="flex items-center gap-3">
                <Filter className={`w-6 h-6 text-${getFilterColor()}-400`} />
                <div>
                  <h2 className="text-2xl font-bold text-white">{getFilterTitle()}</h2>
                  <p className="text-gray-400 text-sm">{filteredClients.length} cliente(s) encontrado(s)</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFilter(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Tabela de Clientes */}
            <div className="overflow-auto flex-1 p-6">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhum cliente encontrado nesta categoria</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-900/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Telefone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plano</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Vencimento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredClients.map((client) => {
                      const isExpired = client.expiration_date && new Date(client.expiration_date) < new Date();
                      const isExpiringSoon = client.expiration_date && 
                        new Date(client.expiration_date) >= new Date() && 
                        new Date(client.expiration_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

                      return (
                        <tr key={client.id} className="hover:bg-gray-700/30 transition">
                          <td className="px-4 py-4">
                            <div className="font-medium text-white">{client.name}</div>
                            {client.email && <div className="text-sm text-gray-400">{client.email}</div>}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Phone className="w-4 h-4" />
                              {client.phone || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-white">{client.plan?.name || client.product?.name || '—'}</div>
                            <div className="text-sm text-gray-400">
                              {formatCurrency(parseFloat(client.plan?.price || client.product?.price || 0))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`flex items-center gap-2 ${
                              isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-gray-300'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              {formatDate(client.expiration_date)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isExpired 
                                ? 'bg-red-900/50 text-red-400 border border-red-700' 
                                : isExpiringSoon
                                ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                                : 'bg-green-900/50 text-green-400 border border-green-700'
                            }`}>
                              {isExpired ? 'Vencido' : isExpiringSoon ? 'A Vencer' : 'Ativo'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => router.push(`/clients/${client.id}`)}
                              className="p-2 hover:bg-blue-600/20 text-blue-400 rounded-lg transition"
                              title="Ver detalhes"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer da Modal */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setSelectedFilter(null)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alertas Rápidos */}
      {stats.expiredClients > 0 && !selectedFilter && (
        <div 
          onClick={() => handleCardClick('expired')}
          className="bg-red-900/20 border border-red-700 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-900/30 transition"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-200 font-medium">Atenção!</p>
            <p className="text-red-300 text-sm">
              Você tem <strong>{stats.expiredClients} cliente(s) vencido(s)</strong>. 
              Clique aqui para ver a lista.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </div>
      )}
    </div>
  );
}
