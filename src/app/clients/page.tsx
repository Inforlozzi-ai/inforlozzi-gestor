'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Users, Plus, Edit2, Trash2, MessageSquare, Search, Send, Image as ImageIcon, X, FileText, Smartphone, PlusCircle, Trash } from 'lucide-react';

interface Device { app_name: string; mac_address: string; device_id: string; }

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'image'>('text');
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchClients(); fetchPlans(); fetchProducts(); fetchTemplates(); }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setClients(data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (err) { console.error(err); }
  };

  const getDurationText = (days: number): string => {
    if (!days || days <= 0) return '30 dias';
    if (days >= 30 && days % 30 === 0) {
      const months = days / 30;
      return months === 1 ? '1 mês' : `${months} meses`;
    }
    return days === 1 ? '1 dia' : `${days} dias`;
  };

  const getPlanValue = (client: any): string => {
    if (!client.plan_name) return 'R$ 0,00';
    const plan = plans.find(p => p.name?.toLowerCase() === client.plan_name?.toLowerCase());
    if (plan && plan.price) {
      return `R$ ${parseFloat(plan.price).toFixed(2).replace('.', ',')}`;
    }
    return 'R$ 0,00';
  };

  // Função para formatar data corretamente (sem problema de fuso)
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Usar toLocaleDateString com timezone do Brasil
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { alert('Excluído!'); fetchClients(); }
    } catch (err) { alert('Erro'); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingClient) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', editingClient.id);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setEditingClient({ ...editingClient, photo_url: data.url });
        alert('Foto enviada!');
      }
    } catch (err) { alert('Erro no upload'); }
    finally { setUploadingPhoto(false); }
  };

  const addDevice = () => {
    const newDevice: Device = { app_name: '', mac_address: '', device_id: '' };
    const currentDevices = editingClient.devices || [];
    setEditingClient({ ...editingClient, devices: [...currentDevices, newDevice] });
  };

  const removeDevice = (index: number) => {
    const currentDevices = editingClient.devices || [];
    setEditingClient({ ...editingClient, devices: currentDevices.filter((_: any, i: number) => i !== index) });
  };

  const updateDevice = (index: number, field: keyof Device, value: string) => {
    const currentDevices = editingClient.devices || [];
    const newDevices = [...currentDevices];
    newDevices[index] = { ...newDevices[index], [field]: value };
    setEditingClient({ ...editingClient, devices: newDevices });
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
    
    // Encontrar o template e preencher a mensagem com substituições
    const template = templates.find(t => t.id === templateId);
    if (template && template.content && selectedClient) {
      const expDate = selectedClient.expiration_date 
        ? new Date(selectedClient.expiration_date).toLocaleDateString('pt-BR') 
        : 'N/A';
      const valorPlano = selectedClient.plan?.price || selectedClient.product?.price || '0';
      
      let msg = template.content
        .replace(/{nome}/gi, selectedClient.name || 'Cliente')
        .replace(/{usuario}/gi, selectedClient.xtream_username || 'N/A')
        .replace(/{senha}/gi, selectedClient.xtream_password || 'N/A')
        .replace(/{vencimento}/gi, expDate)
        .replace(/{painel}/gi, selectedClient.panel_name || 'N/A')
        .replace(/{valor}/gi, valorPlano)
        .replace(/{dias}/gi, 'X')
        .replace(/{pix}/gi, '')
        .replace(/{link}/gi, '')
        .replace(/{servidor}/gi, '')
        .replace(/{app_url}/gi, '');
      
      setMessageText(msg);
    }
  };
  const handleSendMessage = async () => {
    if (!messageText.trim()) { alert('Mensagem vazia!'); return; }
    setSendingMessage(true);
    try {
      const res = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: selectedClient.id, 
          clientPhone: selectedClient.phone, 
          message: messageText, 
          mediaUrl, 
          messageType 
        }),
      });
      const data = await res.json();
      if (data.success) { alert('Enviada!'); setShowMessageModal(false); }
    } catch (err) { alert('Erro'); }
    finally { setSendingMessage(false); }
  };

  const openEditModal = (client: any) => { 
    setEditingClient({ 
      ...client, 
      plan_id: client.plan_id || '', 
      plan_name: client.plan_name || '', 
      devices: client.devices || [] 
    }); 
    setShowEditModal(true); 
  };

  const handleSaveEdit = async () => {
    try {
      if (editingClient.plan_id) {
        const selectedPlan = plans.find(p => p.id === editingClient.plan_id);
        if (selectedPlan) {
          editingClient.plan_name = selectedPlan.name;
        }
      } else {
        editingClient.plan_name = null;
      }
      
      const { plan_id, ...dataToSave } = editingClient;
      
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      
      if (data.success) { 
        alert('Salvo com sucesso!'); 
        setShowEditModal(false); 
        await fetchClients();
      } else { 
        alert('Erro: ' + data.error); 
      }
    } catch (err: any) { 
      alert('Erro ao salvar: ' + err.message); 
    }
  };

  const getStatusColor = (s: string) => s === 'active' ? 'bg-green-900/50 text-green-400' : s === 'suspended' ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400';
  const getStatusText = (s: string) => s === 'active' ? 'Ativo' : s === 'suspended' ? 'Suspenso' : 'Inativo';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Users className="w-8 h-8 text-blue-400"/> Clientes</h1>
        <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus className="w-5 h-5" /> Novo Cliente</Link>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input type="text" placeholder="Buscar por nome, telefone ou email..." className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-gray-400">Carregando...</p> : clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <p className="p-6 text-center text-gray-400">Nenhum cliente encontrado.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((client) => (
              <div key={client.id} className="bg-gray-700/50 rounded-lg border border-gray-600 p-4 hover:border-blue-500 transition">
                <div className="flex items-center gap-3 mb-3">
                  {client.photo_url ? <img src={client.photo_url} alt={client.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-600" /> : <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center"><Users className="w-6 h-6 text-gray-400" /></div>}
                  <div><h3 className="font-bold text-white text-lg">{client.name}</h3><span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(client.status)}`}>{getStatusText(client.status)}</span></div>
                </div>
                <div className="space-y-1 text-sm text-gray-300 mb-4">
                  <p>📱 {client.phone}</p>
                  {client.email && <p>✉️ {client.email}</p>}
                  {client.panel_name && <p>🖥️ {client.panel_name}</p>}
                  {client.plan_name && <p>📦 {client.plan_name}</p>}
                  {client.expiration_date && <p>📅 {formatDate(client.expiration_date)}</p>}
                  {client.devices && client.devices.length > 0 && <p>📱 {client.devices.length} dispositivo(s)</p>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => openMessageModal(client)} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg flex justify-center"><MessageSquare className="w-4 h-4" /></button>
                  <button onClick={() => openEditModal(client)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex justify-center"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(client.id, client.name)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg flex justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold text-white mb-6">Editar Cliente</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Foto do Cliente</label>
                <div className="flex items-center gap-4">
                  {editingClient.photo_url ? <img src={editingClient.photo_url} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-blue-500" /> : <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center"><Users className="w-10 h-10 text-gray-400" /></div>}
                  <div className="flex-1 space-y-2">
                    <input type="text" placeholder="URL da imagem" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" value={editingClient.photo_url || ''} onChange={e => setEditingClient({...editingClient, photo_url: e.target.value})} />
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm">{uploadingPhoto ? 'Enviando...' : 'Upload de Foto'}</button>
                      {editingClient.photo_url && <button onClick={() => setEditingClient({...editingClient, photo_url: ''})} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Remover</button>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label><input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Telefone *</label><input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} /></div>
              </div>

              <div><label className="block text-sm font-medium text-gray-300 mb-2">Email</label><input type="email" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})} /></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Plano</label>
                  <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.plan_id || ''} onChange={e => setEditingClient({...editingClient, plan_id: e.target.value})}>
                    <option value="">Selecione um plano...</option>
                    {plans.map(plan => (<option key={plan.id} value={plan.id}>{plan.name} - R$ {parseFloat(plan.price).toFixed(2)} ({getDurationText(plan.duration_days)})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Painel (Produto)</label>
                  <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.panel_name || ''} onChange={e => setEditingClient({...editingClient, panel_name: e.target.value})}>
                    <option value="">Selecione um painel...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.name}>{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-2">Data de Vencimento</label><input type="date" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.expiration_date ? new Date(editingClient.expiration_date).toISOString().split('T')[0] : ''} onChange={e => setEditingClient({...editingClient, expiration_date: e.target.value})} /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.status || 'active'} onChange={e => setEditingClient({...editingClient, status: e.target.value})}>
                    <option value="active">Ativo</option><option value="inactive">Inativo</option><option value="suspended">Suspenso</option><option value="trial">Teste</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Smartphone className="w-5 h-5" /> Dispositivos/Apps</h3>
                  <button onClick={addDevice} className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"><PlusCircle className="w-4 h-4" /> Adicionar</button>
                </div>
                <div className="space-y-2">
                  {(editingClient.devices || []).map((device: Device, index: number) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                      <div className="flex-1 space-y-2">
                        <input type="text" placeholder="Nome do App" className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm" value={device.app_name} onChange={(e) => updateDevice(index, 'app_name', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="MAC Address" className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm" value={device.mac_address} onChange={(e) => updateDevice(index, 'mac_address', e.target.value)} />
                          <input type="text" placeholder="Device ID" className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm" value={device.device_id} onChange={(e) => updateDevice(index, 'device_id', e.target.value)} />
                        </div>
                      </div>
                      <button onClick={() => removeDevice(index)} className="p-2 text-red-400 hover:text-red-300"><Trash className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {(editingClient.devices || []).length === 0 && <p className="text-sm text-gray-400 italic">Nenhum dispositivo cadastrado</p>}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Credenciais IPTV</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">Usuário IPTV</label><input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.xtream_username || ''} onChange={e => setEditingClient({...editingClient, xtream_username: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">Senha IPTV</label><input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={editingClient.xtream_password || ''} onChange={e => setEditingClient({...editingClient, xtream_password: e.target.value})} /></div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800 pb-2">
                <button onClick={handleSaveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">Salvar Alterações</button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && selectedClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MessageSquare className="w-6 h-6 text-green-400"/> Enviar Mensagem</h2>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-300">Para: <span className="text-white font-semibold">{selectedClient.name}</span> ({selectedClient.phone})</p></div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Selecionar Template</label>
              <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={selectedTemplate} onChange={(e) => handleTemplateSelect(e.target.value)}>
                <option value="">-- Escolha um modelo --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Tipo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="radio" checked={messageType === 'text'} onChange={() => setMessageType('text')} className="w-4 h-4" /> <span className="text-gray-300">Texto</span></label>
                <label className="flex items-center gap-2"><input type="radio" checked={messageType === 'image'} onChange={() => setMessageType('image')} className="w-4 h-4" /> <span className="text-gray-300 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Imagem</span></label>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Mensagem</label>
              <textarea className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 focus:border-green-500 focus:outline-none resize-none" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
            </div>
            {messageType === 'image' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">URL da Imagem</label>
                <input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="https://..." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
                {mediaUrl && <img src={mediaUrl} className="mt-2 max-h-32 rounded-lg" />}
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={handleSendMessage} disabled={sendingMessage} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold">{sendingMessage ? 'Enviando...' : <><Send className="w-5 h-5" /> Enviar</>}</button>
              <button onClick={() => setShowMessageModal(false)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
