'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Edit2, Trash2, MessageSquare, Eye, XCircle, CheckCircle, Search, Send, Image as ImageIcon, X, FileText } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'image'>('text');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchTemplates();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) setClients(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Cliente excluído com sucesso!');
        fetchClients();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao excluir cliente');
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = currentStatus === 'active' 
      ? 'Tem certeza que deseja SUSPENDER este cliente?' 
      : 'Tem certeza que deseja ATIVAR este cliente?';
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Cliente ${newStatus === 'active' ? 'ativado' : 'suspenso'} com sucesso!`);
        fetchClients();
      }
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const openMessageModal = (client: any) => {
    setSelectedClient(client);
    setMessageText('');
    setSelectedTemplate('');
    setMediaUrl('');
    setMessageType('text');
    setShowMessageModal(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageText(template.message);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && messageType === 'text') {
      alert('Digite uma mensagem ou selecione um template');
      return;
    }
    if (messageType === 'image' && !mediaUrl.trim()) {
      alert('Adicione uma URL de imagem ou mude para mensagem de texto');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientPhone: selectedClient.phone,
          message: messageText,
          mediaUrl: mediaUrl,
          messageType,
          templateType: selectedTemplate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Mensagem enviada com sucesso!');
        setShowMessageModal(false);
      } else {
        alert('Erro ao enviar: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const openEditModal = (client: any) => {
    setEditingClient({ ...client });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      });
      const data = await res.json();
      if (data.success) {
        alert('Cliente atualizado com sucesso!');
        setShowEditModal(false);
        fetchClients();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao atualizar cliente');
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-900/50 text-green-400 border-green-800';
      case 'suspended': return 'bg-red-900/50 text-red-400 border-red-800';
      case 'inactive': return 'bg-gray-700 text-gray-400 border-gray-600';
      case 'trial': return 'bg-yellow-900/50 text-yellow-400 border-yellow-800';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'Ativo';
      case 'suspended': return 'Suspenso';
      case 'inactive': return 'Inativo';
      case 'trial': return 'Teste';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Users className="w-8 h-8 text-blue-400"/> Clientes
        </h1>
        <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Novo Cliente
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nome, telefone ou email..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400">Carregando...</p>
        ) : filteredClients.length === 0 ? (
          <p className="p-6 text-center text-gray-400">Nenhum cliente encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-gray-700/50 rounded-lg border border-gray-600 p-4 hover:border-blue-500 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {client.photo_url ? (
                      <img src={client.photo_url} alt={client.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-600" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-lg">{client.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(client.status)}`}>
                        {getStatusText(client.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <p>📱 {client.phone}</p>
                  {client.email && <p>✉️ {client.email}</p>}
                  {client.panel_name && <p>🖥️ Painel: {client.panel_name}</p>}
                  {client.expiration_date && (
                    <p>📅 Vencimento: {new Date(client.expiration_date).toLocaleDateString('pt-BR')}</p>
                  )}
                  {client.devices && client.devices.length > 0 && (
                    <p>📱 {client.devices.length} dispositivo(s)</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => openMessageModal(client)} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition flex items-center justify-center" title="Enviar Mensagem">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEditModal(client)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition flex items-center justify-center" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleStatusChange(client.id, client.status)} className={`${client.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white p-2 rounded-lg transition flex items-center justify-center`} title={client.status === 'active' ? 'Suspender' : 'Ativar'}>
                    {client.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(client.id, client.name)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition flex items-center justify-center" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Editar Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Painel</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.panel_name || ''} onChange={e => setEditingClient({...editingClient, panel_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vencimento</label>
                  <input type="date" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.expiration_date ? new Date(editingClient.expiration_date).toISOString().split('T')[0] : ''} onChange={e => setEditingClient({...editingClient, expiration_date: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleSaveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Salvar</button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio de Mensagem */}
      {showMessageModal && selectedClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-green-400"/> Enviar Mensagem
              </h2>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300">Destinatário: <span className="text-white font-semibold">{selectedClient.name}</span></p>
              <p className="text-sm text-gray-300">Telefone: <span className="text-white">{selectedClient.phone}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates Pré-definidos
              </label>
              <select 
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
              >
                <option value="">Selecione um template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Mensagem</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="messageType" checked={messageType === 'text'} onChange={() => setMessageType('text')} className="w-4 h-4" />
                  <span className="text-gray-300">Apenas Texto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="messageType" checked={messageType === 'image'} onChange={() => setMessageType('image')} className="w-4 h-4" />
                  <span className="text-gray-300 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Com Imagem
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
              <textarea 
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 focus:border-green-500 focus:outline-none resize-none"
                placeholder="Digite sua mensagem aqui..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Variáveis: {'{nome}'}, {'{valor}'}, {'{vencimento}'}, {'{dias}'}</p>
            </div>

            {messageType === 'image' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">URL da Imagem</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
                {mediaUrl && (
                  <div className="mt-2">
                    <img src={mediaUrl} alt="Preview" className="max-h-32 rounded-lg border border-gray-600" onError={(e) => (e.currentTarget.src = '')} />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleSendMessage}
                disabled={sendingMessage}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                {sendingMessage ? 'Enviando...' : <><Send className="w-5 h-5" /> Enviar Mensagem</>}
              </button>
              <button onClick={() => setShowMessageModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
