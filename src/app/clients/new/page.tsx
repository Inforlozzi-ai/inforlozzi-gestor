'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Plus, Smartphone } from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    photo_url: '',
    plan_id: '',
    product_id: '',
    xtream_username: '',
    xtream_password: '',
    expiration_date: '',
    notes: '',
    status: 'active',
    active: true
  });

  // Array de dispositivos (pode ter vários)
  const [devices, setDevices] = useState<any[]>([
    { app_type: '', app_url: '', mac_address: '', connections: 1 }
  ]);

  useEffect(() => {
    fetchPlans();
    fetchProducts();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        devices // Enviar dispositivos junto
      };

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert('✅ Cliente salvo com sucesso!');
        router.push('/clients');
      } else {
        alert('❌ Erro: ' + (data.error || 'Falha ao salvar'));
        console.error('Erro detalhado:', data);
      }
    } catch (err) {
      alert('Erro de conexão: ' + (err as Error).message);
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Adicionar novo dispositivo
  const addDevice = () => {
    setDevices([...devices, { app_type: '', app_url: '', mac_address: '', connections: 1 }]);
  };

  // Remover dispositivo
  const removeDevice = (index: number) => {
    if (devices.length > 1) {
      const newDevices = devices.filter((_, i) => i !== index);
      setDevices(newDevices);
    }
  };

  // Atualizar dispositivo
  const updateDevice = (index: number, field: string, value: string) => {
    const newDevices = [...devices];
    newDevices[index] = { ...newDevices[index], [field]: value };
    setDevices(newDevices);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Novo Cliente</h1>
          <p className="text-gray-400">Cadastre um novo cliente IPTV</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
        
        {/* Dados Pessoais */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Dados Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telefone (WhatsApp) *</label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="5531999999999"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email (opcional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL da Foto</label>
              <input
                type="text"
                name="photo_url"
                value={formData.photo_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Plano e Painel */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Plano e Painel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plano</label>
              <select
                name="plan_id"
                value={formData.plan_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Selecione um plano</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price} ({plan.duration_days} mês(es))
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Painel (Produto) *</label>
              <select
                name="product_id"
                required
                value={formData.product_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Selecione um produto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - R$ {product.price}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dispositivos Múltiplos */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Dispositivos / Aplicativos
            </h2>
            <button
              type="button"
              onClick={addDevice}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar Dispositivo
            </button>
          </div>

          <div className="space-y-4">
            {devices.map((device, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Dispositivo {index + 1}</span>
                  {devices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDevice(index)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tipo de Aplicativo</label>
                    <select
                      value={device.app_type}
                      onChange={(e) => updateDevice(index, 'app_type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      <option value="smarters">IPTV Smarters Pro</option>
                      <option value="tivimate">TiviMate</option>
                      <option value="xciptv">XCIPTV Player</option>
                      <option value="iptvextreme">IPTV Extreme</option>
                      <option value="netiptv">Net IPTV</option>
                      <option value="ssiptv">SS IPTV</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">MAC Address</label>
                    <input
                      type="text"
                      value={device.mac_address}
                      onChange={(e) => updateDevice(index, 'mac_address', e.target.value)}
                      placeholder="00:1A:79:XX:XX:XX"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL do App</label>
                    <input
                      type="text"
                      value={device.app_url}
                      onChange={(e) => updateDevice(index, 'app_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Conexões</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={device.connections}
                      onChange={(e) => updateDevice(index, 'connections', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credenciais e Vencimento */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Credenciais e Vencimento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Usuário IPTV</label>
              <input
                type="text"
                name="xtream_username"
                value={formData.xtream_username}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha IPTV</label>
              <input
                type="text"
                name="xtream_password"
                value={formData.xtream_password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data de Vencimento</label>
              <input
                type="date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
