'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, MessageSquare } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: any) => {
    setEditing({ ...template });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    try {
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch('/api/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing)
      });

      const data = await res.json();
      if (data.success) {
        setEditing(null);
        fetchTemplates();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao salvar: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditing((prev: any) => ({ ...prev, [field]: value }));
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      before: 'Antes do vencimento',
      on_day: 'Dia do vencimento',
      after: 'Após vencimento',
      renewal: 'Renovação',
      welcome: 'Boas-vindas',
      custom: 'Personalizado'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      before: 'yellow',
      on_day: 'red',
      after: 'orange',
      renewal: 'green',
      welcome: 'blue',
      custom: 'purple'
    };
    return colors[type] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-xl">Carregando templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Templates de Mensagens</h1>
        </div>
        <button
          onClick={() => setEditing({ name: '', type: 'custom', content: '', active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Novo Template
        </button>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const color = getTypeColor(template.type);
          return (
            <div
              key={template.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-purple-500 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium bg-${color}-900/50 text-${color}-400 border border-${color}-700`}>
                    {getTypeLabel(template.type)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 hover:bg-blue-600/20 text-blue-400 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {template.content || 'Sem conteúdo'}
              </p>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  template.active
                    ? 'bg-green-900/50 text-green-400 border border-green-700'
                    : 'bg-red-900/50 text-red-400 border border-red-700'
                }`}>
                  {template.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edição */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editing.id ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Template *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Lembrete 3 dias antes"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo *</label>
                <select
                  value={editing.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="before">Antes do vencimento</option>
                  <option value="on_day">Dia do vencimento</option>
                  <option value="after">Após vencimento</option>
                  <option value="renewal">Renovação confirmada</option>
                  <option value="welcome">Boas-vindas</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem *</label>
                <div className="mb-2 text-xs text-gray-400">
                  Variáveis disponíveis: {'{nome}'}, {'{valor}'}, {'{vencimento}'}, {'{dias}'}, {'{usuario}'}, {'{senha}'}, {'{pix}'}, {'{link}'}, {'{servidor}'}, {'{app_url}'}
                </div>
                <textarea
                  value={editing.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  rows={8}
                  placeholder="Olá {nome}! Seu plano vence em {vencimento}..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
                />
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={editing.active}
                  onChange={(e) => handleChange('active', e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="active" className="text-sm text-gray-300">Template ativo</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
