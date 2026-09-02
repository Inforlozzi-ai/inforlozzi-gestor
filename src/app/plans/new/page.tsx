'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_days: 30 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, is_active: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Plano criado com sucesso!');
        router.push('/plans');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/plans" className="inline-flex items-center text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Planos
      </Link>
      
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-white">
          <Tag className="w-6 h-6 text-purple-400"/> Novo Plano
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Plano</label>
            <input type="text" required placeholder="Ex: Mensal Premium" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
              <input type="number" step="0.01" required placeholder="30.00" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duração (dias)</label>
              <input type="number" required placeholder="30" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: parseInt(e.target.value)})} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold mt-4">
            {loading ? 'Salvando...' : 'Salvar Plano'}
          </button>
        </form>
      </div>
    </div>
  );
}
