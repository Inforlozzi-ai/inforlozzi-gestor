'use client';
import { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Loader } from 'lucide-react';

export default function WhatsAppPage() {
  const [instanceName, setInstanceName] = useState('gestor-iptv');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [loading, setLoading] = useState(false);

  const createInstance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/create-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('connecting');
        getQRCode();
      } else {
        alert('Erro: ' + (data.error?.message || 'Falha ao criar'));
      }
    } catch (err) {
      alert('Erro ao criar instância');
    } finally {
      setLoading(false);
    }
  };

  const getQRCode = async () => {
    try {
      const res = await fetch(`/api/whatsapp/get-qrcode?instanceName=${instanceName}`);
      const data = await res.json();
      if (data.success && data.data?.base64) {
        setQrCode(data.data.base64);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (status === 'connecting') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/whatsapp/check-status?instanceName=${instanceName}`);
          const data = await res.json();
          if (data.success && data.data?.instance?.state === 'open') {
            setStatus('connected');
            setQrCode(null);
          }
        } catch (err) {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status, instanceName]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2"><QrCode className="w-8 h-8 text-green-400"/> WhatsApp</h1>
      
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8 text-center">
        {status === 'disconnected' && (
          <div className="space-y-4">
            <p className="text-gray-400">Conecte seu WhatsApp para enviar cobranças automáticas.</p>
            <input 
              type="text" 
              value={instanceName} 
              onChange={e => setInstanceName(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none" 
              placeholder="Nome da instância (ex: gestor-iptv)" 
            />
            <button 
              onClick={createInstance} 
              disabled={loading} 
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />} 
              {loading ? 'Conectando...' : 'Gerar QR Code'}
            </button>
          </div>
        )}

        {status === 'connecting' && qrCode && (
          <div className="space-y-4">
            <p className="text-gray-300 text-lg">Escaneie o QR Code com seu WhatsApp</p>
            <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64 mx-auto border-4 border-gray-700 rounded-lg bg-white p-2" />
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Loader className="w-5 h-5 animate-spin" /> Aguardando leitura...
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="space-y-4 py-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <p className="text-green-400 font-bold text-2xl">WhatsApp Conectado!</p>
            <p className="text-gray-400">Instância ativa: <span className="text-white font-mono">{instanceName}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
