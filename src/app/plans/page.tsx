'use client';
import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    duration_type: 'days'
  });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) { console.error('❌ Erro:', err); } 
    finally { setLoading(false); }
  };

  const openNewModal = () => {
    setEditingPlan(null);
    setFormData({ name: '', price: '', duration_days: '', duration_type: 'days' });
    setShowModal(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    // Inferir tipo baseado no valor (múltiplo de 30 = meses)
    const days = plan.duration_days || 30;
    const isMonths = days >= 30 && days % 30 === 0;
    setFormData({
      name: plan.name || '',
      price: plan.price ? String(plan.price) : '',
      duration_days: isMonths ? String(days / 30) : String(days),
      duration_type: isMonths ? 'months' : 'days'
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${name}"?`)) return;
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { alert('Plano excluído!'); fetchPlans(); }
      else { alert('Erro: ' + data.error); }
    } catch (err) { alert('Erro ao excluir'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(editingPlan ? 'Plano atualizado!' : 'Plano criado!');
        setShowModal(false);
        fetchPlans();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) { 
      alert('Erro ao salvar'); 
    }
  };

  // Função inteligente para exibir duração
  const getDurationText = (days: number): string => {
    if (!days || days <= 0) return '30 dias';
    // Se for múltiplo de 30 e >= 30, mostrar como meses
    if (days >= 30 && days % 30 === 0) {
      const months = days / 30;
      return months === 1 ? '1 mês' : `${months} meses`;
    }
    return days === 1 ? '1 dia' : `${days} dias`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Tag className="w-8 h-8 text-purple-400"/> Planos
        </h1>
        <button onClick={openNewModal} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Novo Plano
        </button>
      </div>

      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-gray-400">Carregando...</p> : plans.length === 0 ? <p className="p-6 text-center text-gray-400">Nenhum plano cadastrado.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-gray-700/50 rounded-lg border border-gray-600 p-4 hover:border-purple-500 transition">
                <div className="mb-3">
                  <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <p className="text-2xl font-bold text-purple-400">R$ {parseFloat(plan.price || 0).toFixed(2)}</p>
                  <p>⏱️ {getDurationText(plan.duration_days)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(plan)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => handleDelete(plan.id, plan.name)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Plano *</label>
                <input type="text" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preço (R$) *</label>
                  <input type="number" step="0.01" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duração *</label>
                  <input type="number" required min="1" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Duração</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  value={formData.duration_type}
                  onChange={e => setFormData({...formData, duration_type: e.target.value})}
                >
                  <option value="days">Dias</option>
                  <option value="months">Meses</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.duration_type === 'months' 
                    ? `📅 Equivale a ${parseInt(formData.duration_days || '0') * 30} dias` 
                    : `📅 ${formData.duration_days || 0} dia(s)`}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold">
                  {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
