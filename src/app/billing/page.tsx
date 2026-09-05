'use client';
import { useState, useEffect } from 'react';
import { Bell, Save, Send, Copy, Clock, Image as ImageIcon, AlertCircle, Key, RefreshCw, CheckCircle } from 'lucide-react';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'before' | 'on_day' | 'after' | 'renewal'>('before');
  const [currentTime, setCurrentTime] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const [settings, setSettings] = useState<any>({
    company_name: 'Inforlozzi',
    mercado_pago_access_token: '',
    mercado_pago_expiration: 86400,
    notification_image_url: '',
    duplicate_check: true,
    days_before: [3, 1],
    days_after: [1],
    send_on_due_date: true,
    schedule_times: ['09:30'],
    template_before: '',
    template_on_day: '',
    template_after: '',
    template_renewal: ''
  });

  const defaultTemplates: Record<string, string> = {
    before: `Olá *{{customer_first_name}}* tudo bem?! 👋

Seu *{{customer_plan_name}}* vence em *{{customer_days}}* DIAS.

📅 Vencimento: {{customer_duedate}}
💰 Valor: {{customer_plan_value}}

*PIX Copia e Cola:*
{{pix_mercadopago_code}}

*QR Code:*
{{pix_qrcode_url}}

⏰ Não perca o acesso! Renove agora.`,

    on_day: `Olá *{{customer_first_name}}*! ⚠️

Seu *{{customer_plan_name}}* vence HOJE!

📅 Vencimento: {{customer_duedate}}
 Valor: {{customer_plan_value}}

*PIX Copia e Cola:*
{{pix_mercadopago_code}}

*QR Code:*
{{pix_qrcode_url}}

⚠️ Pague agora para não perder o acesso!`,

    after: `Olá *{{customer_first_name}}*! 😟

Seu *{{customer_plan_name}}* venceu há {{customer_days}} dia(s).

📅 Vencimento: {{customer_duedate}}
💰 Valor: {{customer_plan_value}}

*PIX Copia e Cola:*
{{pix_mercadopago_code}}

️ Regularize agora para manter seu acesso.`,

    renewal: `Olá *{{customer_first_name}}*! 🎉

Seu *{{customer_plan_name}}* foi renovado com sucesso!

✅ Pagamento confirmado!
📅 Novo vencimento: {{customer_duedate}}

Obrigado pela preferência!`
  };

  useEffect(() => { 
    fetchSettings();
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('🔄 Buscando configurações...');
      const res = await fetch('/api/billing', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        console.log('📦 Dados recebidos:', data.data);
        
        if (data.data) {
          // Usar dados do banco
          setSettings({
            ...settings,
            ...data.data,
            // Garantir que arrays sejam parseados corretamente
            days_before: Array.isArray(data.data.days_before) ? data.data.days_before : [3, 1],
            days_after: Array.isArray(data.data.days_after) ? data.data.days_after : [1],
            schedule_times: Array.isArray(data.data.schedule_times) ? data.data.schedule_times : ['09:30']
          });
        } else {
          // Nenhum registro no banco - usar padrões
          console.log('⚠️ Nenhum registro encontrado, usando padrões');
          setSettings({
            ...settings,
            template_before: defaultTemplates.before,
            template_on_day: defaultTemplates.on_day,
            template_after: defaultTemplates.after,
            template_renewal: defaultTemplates.renewal
          });
        }
      } else {
        console.error('❌ Erro na resposta:', data.error);
      }
    } catch (err) { 
      console.error('❌ Erro ao buscar:', err); 
    }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Salvando configurações...');
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      
      console.log(' Resposta do servidor:', data);
      
      if (data.success) {
        alert('✅ Configurações salvas com sucesso!');
        setHasChanges(false);
        // Recarregar para confirmar
        await fetchSettings();
      } else {
        alert('❌ Erro ao salvar: ' + data.error);
      }
    } catch (err) { 
      console.error(' Erro ao salvar:', err);
      alert('Erro ao salvar configurações'); 
    }
    finally { setSaving(false); }
  };

  const handleSendNow = async () => {
    if (!settings.mercado_pago_access_token) {
      alert('⚠️ Configure o Access Token do Mercado Pago primeiro!');
      return;
    }
    if (!confirm(`Enviar mensagens "${activeTab}" agora?`)) return;
    setSending(true);
    try {
      const res = await fetch('/api/billing/send-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab })
      });
      const data = await res.json();
      if (data.success) alert(`✅ Enviadas: ${data.sent}\n❌ Erros: ${data.errors}\n⏭️ Ignoradas: ${data.skipped || 0}`);
      else alert('Erro: ' + data.error);
    } catch (err) { alert('Erro ao enviar'); }
    finally { setSending(false); }
  };

  const loadDefaultTemplates = () => {
    if (!confirm('Carregar templates padrão? Isso substituirá os templates atuais.')) return;
    setSettings({
      ...settings,
      template_before: defaultTemplates.before,
      template_on_day: defaultTemplates.on_day,
      template_after: defaultTemplates.after,
      template_renewal: defaultTemplates.renewal
    });
    setHasChanges(true);
    alert('✅ Templates padrão carregados! Clique em "Salvar Configurações" para persistir.');
  };

  const updateSettings = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const toggleDayBefore = (day: number) => {
    const current = settings.days_before || [];
    const updated = current.includes(day) ? current.filter((d: number) => d !== day) : [...current, day];
    updateSettings('days_before', updated);
  };

  const toggleDayAfter = (day: number) => {
    const current = settings.days_after || [];
    const updated = current.includes(day) ? current.filter((d: number) => d !== day) : [...current, day];
    updateSettings('days_after', updated);
  };

  const addScheduleTime = () => {
    if (settings.schedule_times.length >= 5) { alert('Máximo 5 horários!'); return; }
    const updated = [...(settings.schedule_times || []), '10:00'];
    updateSettings('schedule_times', updated);
  };

  const removeScheduleTime = (index: number) => {
    const updated = settings.schedule_times.filter((_: any, i: number) => i !== index);
    updateSettings('schedule_times', updated);
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    alert(`✅ Variável copiada: ${variable}`);
  };

  const variables = [
    '{{customer_first_name}}', '{{customer_name}}', '{{customer_days}}',
    '{{customer_duedate}}', '{{customer_plan_value}}', '{{customer_plan_name}}',
    '{{customer_usuario}}', '{{customer_password}}', '{{customer_email}}',
    '{{customer_phone}}', '{{customer_product_name}}', '{{company_name}}',
    '{{pix_mercadopago_code}}', '{{pix_qrcode_url}}'
  ];

  const getTemplateKey = () => {
    switch (activeTab) {
      case 'before': return 'template_before';
      case 'on_day': return 'template_on_day';
      case 'after': return 'template_after';
      case 'renewal': return 'template_renewal';
    }
  };

  const currentTemplate = settings[getTemplateKey()] || '';

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-600 rounded-lg">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Notificações de Cobrança</h1>
            <p className="text-gray-400">Cobranças PIX automáticas via Mercado Pago + WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Horário atual</p>
            <p className="text-2xl font-bold text-white font-mono">{currentTime}</p>
          </div>
          <button onClick={loadDefaultTemplates} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <RefreshCw className="w-4 h-4" /> Templates Padrão
          </button>
        </div>
      </div>

      {/* Indicador de alterações não salvas */}
      {hasChanges && (
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-yellow-200">Você tem alterações não salvas. Clique em "Salvar Configurações" para persistir.</p>
        </div>
      )}

      {/* Status do Sistema */}
      <div className="bg-gray-800 rounded-xl border border-blue-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-white font-semibold">Sistema de Automação Ativo</p>
            <p className="text-sm text-gray-400">
              Verificando a cada minuto • Próximos envios: {settings.schedule_times?.join(', ') || 'Nenhum horário configurado'}
            </p>
          </div>
        </div>
      </div>

      {/* Configurações Mercado Pago */}
      <div className="bg-gray-800 rounded-xl border border-green-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Key className="w-6 h-6 text-green-400" /> Integração Mercado Pago
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">🔑 Access Token *</label>
            <input type="password" placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono"
              value={settings.mercado_pago_access_token}
              onChange={e => updateSettings('mercado_pago_access_token', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">⏰ Validade da Cobrança (segundos)</label>
            <input type="number" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              value={settings.mercado_pago_expiration || 86400}
              onChange={e => updateSettings('mercado_pago_expiration', parseInt(e.target.value) || 86400)} />
          </div>
        </div>
      </div>

      {/* Imagem Padrão */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" /> Imagem Padrão (opcional)
        </h2>
        <input type="text" placeholder="https://seusite.com/imagem.jpg"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          value={settings.notification_image_url}
          onChange={e => updateSettings('notification_image_url', e.target.value)} />
        {settings.notification_image_url && (
          <img src={settings.notification_image_url} alt="Notificação" className="mt-4 w-32 h-32 rounded-lg object-cover border-2 border-gray-600" />
        )}
      </div>

      {/* Verificação de Duplicidade */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <div>
            <h3 className="text-white font-semibold">Verificação de duplicidade</h3>
            <p className="text-sm text-gray-400">Evita enviar a mesma notificação no mesmo dia</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={settings.duplicate_check}
            onChange={e => updateSettings('duplicate_check', e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
        </label>
      </div>

      {/* Dias Antes e Após */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4"> Dias antes do vencimento</h3>
          <div className="grid grid-cols-2 gap-2">
            {[7, 5, 3, 2, 1].map(day => (
              <label key={day} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input type="checkbox" checked={(settings.days_before || []).includes(day)}
                  onChange={() => toggleDayBefore(day)} className="w-4 h-4" />
                <span>{day} dias antes</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input type="checkbox" checked={settings.send_on_due_date}
                onChange={e => updateSettings('send_on_due_date', e.target.checked)} className="w-4 h-4" />
              <span>No dia do vencimento</span>
            </label>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4"> Dias após o vencimento</h3>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 5, 7, 15].map(day => (
              <label key={day} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input type="checkbox" checked={(settings.days_after || []).includes(day)}
                  onChange={() => toggleDayAfter(day)} className="w-4 h-4" />
                <span>{day} dia{day > 1 ? 's' : ''} após</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Horários de Disparo */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Horários de Disparo
          </h3>
          <button onClick={addScheduleTime} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm">
            <Copy className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">O sistema verifica a cada minuto se é hora de enviar</p>
        <div className="space-y-2">
          {(settings.schedule_times || []).map((time: string, index: number) => (
            <div key={index} className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-lg">
              <input type="time" value={time}
                onChange={e => {
                  const updated = [...settings.schedule_times];
                  updated[index] = e.target.value;
                  updateSettings('schedule_times', updated);
                }} className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white" />
              <span className="text-gray-300 flex-1">Ativo</span>
              <button onClick={() => removeScheduleTime(index)} className="text-red-400 hover:text-red-300">
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Templates de Mensagem */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Templates de Mensagem</h2>
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Variáveis Disponíveis</h3>
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <button key={v} onClick={() => copyVariable(v)}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 hover:bg-gray-600 flex items-center gap-1">
                <Copy className="w-3 h-3" /> {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex border-b border-gray-700 mb-4">
          {(['before', 'on_day', 'after', 'renewal'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium ${activeTab === tab ? 'text-white border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}>
              {tab === 'before' ? '📅 Antes' : tab === 'on_day' ? '⚠️ No Dia' : tab === 'after' ? '🔔 Após' : '✅ Renovação'}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Mensagem para envio {activeTab === 'before' ? 'antes' : activeTab === 'on_day' ? 'no dia' : activeTab === 'after' ? 'após' : 'de'} do vencimento
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white h-96 font-mono text-sm resize-none focus:border-yellow-500 focus:outline-none"
            value={currentTemplate}
            onChange={e => updateSettings(getTemplateKey(), e.target.value)}
            placeholder="Digite a mensagem aqui..."
          />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-semibold">
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : '💾 Salvar Configurações'}
          </button>
          <button onClick={handleSendNow} disabled={sending}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-semibold">
            <Send className="w-4 h-4" /> {sending ? 'Enviando...' : '🚀 Enviar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
