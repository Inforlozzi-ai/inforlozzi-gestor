'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, AlertCircle, TrendingUp, Activity, Send } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalClientes: 0, clientesAtivos: 0, clientesInadimplentes: 0, receitaMes: 0 });
  const [loading, setLoading] = useState(true);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoMsg, setAutoMsg] = useState('');

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        const clientes = data.data;
        const ativos = clientes.filter((c: any) => c.status === 'active').length;
        const inadimplentes = clientes.filter((c: any) => c.status === 'suspended' || c.status === 'overdue').length;
        const receita = clientes.filter((c: any) => c.status === 'active').reduce((acc: number, c: any) => acc + (parseFloat(c.plano?.price) || 30), 0);
        setStats({ totalClientes: clientes.length, clientesAtivos: ativos, clientesInadimplentes: inadimplentes, receitaMes: receita });
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const dispararAutomacao = async () => {
    setAutoLoading(true);
    setAutoMsg('Disparando lembretes...');
    try {
      const res = await fetch('/api/automation/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setAutoMsg(`✅ Sucesso! ${data.message}`);
      } else {
        setAutoMsg('❌ Erro ao disparar.');
      }
    } catch (err) {
      setAutoMsg('❌ Erro de conexão.');
    } finally {
      setAutoLoading(false);
      setTimeout(() => setAutoMsg(''), 5000);
    }
  };

  const dadosGrafico = [
    { nome: 'Semana 1', valor: 1200 }, { nome: 'Semana 2', valor: 1900 },
    { nome: 'Semana 3', valor: 2500 }, { nome: 'Semana 4', valor: stats.receitaMes }
  ];
  const dadosPizza = [
    { nome: 'Ativos', valor: stats.clientesAtivos, cor: '#10b981' },
    { nome: 'Inadimplentes', valor: stats.clientesInadimplentes, cor: '#ef4444' },
    { nome: 'Outros', valor: Math.max(0, stats.totalClientes - stats.clientesAtivos - stats.clientesInadimplentes), cor: '#6b7280' }
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400">Visão geral do Inforlozzi Gestor</p>
        </div>
        <button 
          onClick={dispararAutomacao} 
          disabled={autoLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {autoLoading ? 'Enviando...' : 'Disparar Lembretes Agora'}
        </button>
      </div>
      
      {autoMsg && (
        <div className={`p-4 rounded-lg border ${autoMsg.includes('Sucesso') ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'}`}>
          {autoMsg}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg"><Users className="h-6 w-6 text-blue-400" /></div>
            <div><p className="text-sm text-gray-400">Total de Clientes</p><p className="text-2xl font-bold text-white">{stats.totalClientes}</p></div>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg"><Activity className="h-6 w-6 text-green-400" /></div>
            <div><p className="text-sm text-gray-400">Clientes Ativos</p><p className="text-2xl font-bold text-green-400">{stats.clientesAtivos}</p></div>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-lg"><AlertCircle className="h-6 w-6 text-red-400" /></div>
            <div><p className="text-sm text-gray-400">Inadimplentes</p><p className="text-2xl font-bold text-red-400">{stats.clientesInadimplentes}</p></div>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg"><DollarSign className="h-6 w-6 text-yellow-400" /></div>
            <div><p className="text-sm text-gray-400">Receita do Mês</p><p className="text-2xl font-bold text-yellow-400">R$ {stats.receitaMes.toFixed(2)}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><TrendingUp className="w-5 h-5 text-blue-400" /> Receita por Semana</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="nome" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-white">Distribuição de Clientes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              {/* Removemos a prop 'label' que estava dando erro no TypeScript */}
              <Pie data={dadosPizza} cx="50%" cy="50%" outerRadius={80} dataKey="valor">
                {dadosPizza.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.cor} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
