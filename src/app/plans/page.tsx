'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, Plus } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/plans').then(res => res.json()).then(data => {
      if (data.success) setPlans(data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Tag className="w-8 h-8 text-purple-400"/> Planos</h1>
        <Link href="/plans/new" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Novo Plano
        </Link>
      </div>

      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 p-6">
        {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
          plans.length === 0 ? <p className="text-center text-gray-400">Nenhum plano cadastrado.</p> :
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p: any) => (
              <div key={p.id} className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 hover:border-purple-500 transition shadow-lg">
                <h3 className="font-bold text-xl text-white">{p.name}</h3>
                <p className="text-3xl font-semibold text-purple-400 mt-2">R$ {parseFloat(p.price).toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-2">Duração: {p.duration_days} dias</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
