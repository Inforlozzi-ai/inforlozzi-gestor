'use client';
import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'reminder', message: '', is_active: true });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/templates/${editingId}` : '/api/templates';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
        setEditingId(null);
        setNewTemplate(false);
        setFormData({ name: '', type: 'reminder', message: '', is_active: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (template: any) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      type: template.type,
      message: template.message,
      is_active: template.is_active,
    });
  };

  const getTemplateName = (type: string) => {
    const names: any = {
      welcome: 'Boas-vindas',
      reminder_3: 'Lembrete 3 dias antes',
      reminder_1: 'Lembrete 1 dia antes',
      reminder_today: 'Vence Hoje',
      overdue: 'Vencido',
      payment_confirmed: 'Pagamento Confirmado',
      reminder: 'Lembrete Genérico',
    };
    return names[type] || type;
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando templates...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-purple-400"/> Templates de Mensagens
        </h1>
        <button 
          onClick={() => { setNewTemplate(true); setEditingId(null); setFormData({ name: '', type: 'reminder', message: '', is_active: true }); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Novo Template
        </button>
      </div>

      {(newTemplate || editingId) && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? 'Editar Template' : 'Novo Template'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="Ex: Lembrete de vencimento"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="welcome">Boas-vindas</option>
                <option value="reminder_3">Lembrete 3 dias antes</option>
                <option value="reminder_1">Lembrete 1 dia antes</option>
                <option value="reminder_today">Vence Hoje</option>
                <option value="overdue">Vencido</option>
                <option value="payment_confirmed">Pagamento Confirmado</option>
                <option value="reminder">Lembrete Genérico</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
              <p className="text-xs text-gray-400 mb-2">
                Variáveis disponíveis: {'{nome}'}, {'{valor}'}, {'{vencimento}'}, {'{dias}'}, {'{usuario}'}, {'{senha}'}
              </p>
              <textarea 
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})}
                rows={6}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
                placeholder="Olá {nome}! Seu plano vence em {vencimento}..."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="is_active" 
                checked={formData.is_active} 
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-gray-300">Template ativo</label>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Salvar
              </button>
              <button 
                onClick={() => { setEditingId(null); setNewTemplate(false); }}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{template.name}</h3>
                <span className="text-xs text-purple-400">{getTemplateName(template.type)}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(template)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(template.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 line-clamp-3 font-mono">{template.message}</p>
            <div className="mt-3">
              <span className={`text-xs px-2 py-1 rounded ${template.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                {template.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
