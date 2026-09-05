'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Settings, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [config, setConfig] = useState({
    company_name: 'Inforlozzi',
    whatsapp_api_url: '',
    whatsapp_api_key: '',
    whatsapp_instance_name: '',
    mercado_pago_access_token: '',
    mercado_pago_expiration: 86400,
    notification_image_url: '',
    duplicate_check: true,
    days_before: [3, 1],
    days_after: [1],
    send_on_due_date: true,
    schedule_times: ['09:30'],
    auto_renew: false,
    grace_period_days: 3,
    max_reminders: 3,
    reminder_interval_hours: 24
  });

  useEffect(() => {
    if (session && (session.user as any)?.role !== 'admin') {
      router.push('/');
    }
    fetchConfig();
  }, [session]);

  const fetchConfig = async () => {
    try {
      // Usar a API correta
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success && data.data) {
        setConfig(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✅ Configurações salvas com sucesso!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: '❌ Erro: ' + (data.error || 'Falha ao salvar') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Erro de conexão: ' + (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações Admin</h1>
          <p className="text-gray-400 mt-1">Configure integrações e parâmetros do sistema</p>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/30 border border-green-700 text-green-400' 
            : 'bg-red-900/30 border border-red-700 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Formulário */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
        
        {/* Evolution API */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Evolution API (WhatsApp)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL da API *</label>
              <input
                type="text"
                name="whatsapp_api_url"
                value={config.whatsapp_api_url}
                onChange={handleChange}
                placeholder="https://evolution.seudominio.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Key *</label>
              <input
                type="text"
                name="whatsapp_api_key"
                value={config.whatsapp_api_key}
                onChange={handleChange}
                placeholder="Sua chave da Evolution API"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Instância *</label>
              <input
                type="text"
                name="whatsapp_instance_name"
                value={config.whatsapp_instance_name}
                onChange={handleChange}
                placeholder="Inforplay"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mercado Pago */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Mercado Pago (PIX)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Access Token *</label>
              <input
                type="text"
                name="mercado_pago_access_token"
                value={config.mercado_pago_access_token}
                onChange={handleChange}
                placeholder="APP_USR-..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Expiração do QR Code (segundos)</label>
              <input
                type="number"
                name="mercado_pago_expiration"
                value={config.mercado_pago_expiration}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Empresa */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa</label>
              <input
                type="text"
                name="company_name"
                value={config.company_name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL da Imagem de Notificação</label>
              <input
                type="text"
                name="notification_image_url"
                value={config.notification_image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
