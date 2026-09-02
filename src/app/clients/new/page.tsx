'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Plus, Trash2, Smartphone } from 'lucide-react';
import Link from 'next/link';

interface Device {
  app_name: string;
  mac_address: string;
  device_id: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    xtream_username: '',
    xtream_password: '',
    status: 'active',
    panel_name: '',
    devices: [] as Device[],
    expiration_date: '',
    photo_url: ''
  });

  const [newDevice, setNewDevice] = useState<Device>({
    app_name: '',
    mac_address: '',
    device_id: ''
  });

  const handleAddDevice = () => {
    if (newDevice.app_name && (newDevice.mac_address || newDevice.device_id)) {
      setFormData(prev => ({
        ...prev,
        devices: [...prev.devices, { ...newDevice }]
      }));
      setNewDevice({ app_name: '', mac_address: '', device_id: '' });
    } else {
      alert('Preencha pelo menos o nome do app e MAC ou ID');
    }
  };

  const handleRemoveDevice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      devices: prev.devices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert('Cliente criado com sucesso!');
        router.push('/clients');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/clients" className="inline-flex items-center text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Clientes
      </Link>
      
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-white">
          <Users className="w-6 h-6 text-blue-400"/> Novo Cliente
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Foto do Cliente (URL)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600 overflow-hidden">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <input 
                type="text" 
                placeholder="https://..."
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                value={formData.photo_url}
                onChange={e => setFormData({...formData, photo_url: e.target.value})}
              />
            </div>
          </div>

          {/* Nome e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
              <input type="text" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telefone *</label>
              <input type="text" required placeholder="5511999999999" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
            <input type="email" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          {/* Usuário e Senha IPTV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Usuário IPTV</label>
              <input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={formData.xtream_username} onChange={e => setFormData({...formData, xtream_username: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha IPTV</label>
              <input type="text" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={formData.xtream_password} onChange={e => setFormData({...formData, xtream_password: e.target.value})} />
            </div>
          </div>

          {/* Painel e Vencimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Painel</label>
              <input 
                type="text" 
                placeholder="Ex: Xtream Codes, Stalker, etc."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                value={formData.panel_name}
                onChange={e => setFormData({...formData, panel_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data de Vencimento</label>
              <input type="date" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} />
            </div>
          </div>

          {/* Dispositivos/Apps */}
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Dispositivos/Apps (Adicione quantos quiser)
            </label>
            
            {/* Lista de dispositivos adicionados */}
            {formData.devices.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.devices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex-1">
                      <p className="text-white font-medium">{device.app_name}</p>
                      <p className="text-xs text-gray-400">
                        {device.mac_address && `MAC: ${device.mac_address}`}
                        {device.mac_address && device.device_id && ' | '}
                        {device.device_id && `ID: ${device.device_id}`}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveDevice(index)}
                      className="ml-4 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário para adicionar novo dispositivo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Nome do App (Ex: Smart TV)"
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                value={newDevice.app_name}
                onChange={e => setNewDevice({...newDevice, app_name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="MAC Address"
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                value={newDevice.mac_address}
                onChange={e => setNewDevice({...newDevice, mac_address: e.target.value})}
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Device ID"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                  value={newDevice.device_id}
                  onChange={e => setNewDevice({...newDevice, device_id: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={handleAddDevice}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select 
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="suspended">Suspenso</option>
              <option value="trial">Teste</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold mt-4"
          >
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </form>
      </div>
    </div>
  );
}
