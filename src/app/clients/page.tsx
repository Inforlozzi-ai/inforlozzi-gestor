'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(data => {
      if (data.success) setClients(data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Users className="w-8 h-8 text-blue-400"/> Clientes</h1>
        <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Novo Cliente
        </Link>
      </div>

      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-gray-400">Carregando...</p> : (
          clients.length === 0 ? <p className="p-6 text-center text-gray-400">Nenhum cliente cadastrado.</p> :
          <table className="w-full text-left">
            <thead className="bg-gray-700/50 text-gray-300">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {clients.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-700/30 transition">
                  <td className="px-6 py-4 text-white">{c.name}</td>
                  <td className="px-6 py-4 text-gray-300">{c.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.status === 'active' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                      {c.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
