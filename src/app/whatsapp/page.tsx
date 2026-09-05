'use client';
import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Pause, Play, RefreshCw, QrCode, Trash2, Plus, Loader2 } from 'lucide-react';

export default function WhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<any[]>([]);
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [actionLoading, setActionLoading] = useState<{ type: string; name: string } | null>(null);

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/whatsapp/instances', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        // Mapear instâncias com status
        const mappedInstances = data.data.map((inst: any) => ({
          name: inst.instanceName || inst.name,
          status: inst.state === 'open' ? 'connected' : 'disconnected'
        }));
        setInstances(mappedInstances);
      } else {
        console.error('Erro ao buscar instâncias:', data.error);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      alert('Digite um nome para a instância');
      return;
    }

    setCreatingInstance(true);
    try {
      const res = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: newInstanceName })
      });
      const data = await res.json();

      if (data.success) {
        alert('✅ Instância criada com sucesso!');
        setShowNewInstanceModal(false);
        setNewInstanceName('');
        await fetchInstances();
      } else {
        alert(' Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar instância');
    } finally {
      setCreatingInstance(false);
    }
  };

  const handleConnect = async (instanceName: string) => {
    setActionLoading({ type: 'connect', name: instanceName });
    setShowQR(instanceName);
    setQrCodeImage('');

    try {
      const res = await fetch(`/api/whatsapp/instances/${instanceName}/connect`);
      const data = await res.json();

      if (data.success && data.qrCode) {
        setQrCodeImage(data.qrCode);
      } else {
        alert('⚠️ Instância já conectada ou erro ao gerar QR Code');
        setShowQR(null);
      }
    } catch (err) {
      alert('Erro ao conectar');
      setShowQR(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (instanceName: string) => {
    if (!confirm(`Desconectar instância "${instanceName}"?`)) return;

    setActionLoading({ type: 'disconnect', name: instanceName });
    try {
      const settings = await fetch('/api/billing', { cache: 'no-store' }).then(r => r.json());
      const { whatsapp_api_url, whatsapp_api_key } = settings.data;

      await fetch(`${whatsapp_api_url}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': whatsapp_api_key }
      });

      await fetchInstances();
      setShowQR(null);
      setQrCodeImage('');
    } catch (err) {
      alert('Erro ao desconectar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (instanceName: string) => {
    if (!confirm(`⚠️ Deletar permanentemente a instância "${instanceName}"? Esta ação não pode ser desfeita.`)) return;

    setActionLoading({ type: 'delete', name: instanceName });
    try {
      const res = await fetch(`/api/whatsapp/instances/${instanceName}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        alert('✅ Instância deletada!');
        await fetchInstances();
        if (showQR === instanceName) {
          setShowQR(null);
          setQrCodeImage('');
        }
      } else {
        alert(' Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao deletar');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'connected':
        return { color: 'bg-green-500', textColor: 'text-green-400', text: 'Conectado', icon: CheckCircle };
      case 'disconnected':
        return { color: 'bg-red-500', textColor: 'text-red-400', text: 'Desconectado', icon: XCircle };
      default:
        return { color: 'bg-gray-500', textColor: 'text-gray-400', text: 'Indefinido', icon: XCircle };
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-600 rounded-lg">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">WhatsApp</h1>
            <p className="text-gray-400">Gerencie suas conexões</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewInstanceModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" /> Nova Conexão
        </button>
      </div>

      {/* Lista de Instâncias */}
      {instances.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma conexão cadastrada</h3>
          <p className="text-gray-400 mb-6">Clique em "Nova Conexão" para começar</p>
          <button
            onClick={() => setShowNewInstanceModal(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
          >
            Criar Primeira Conexão
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {instances.map((instance) => {
            const statusInfo = getStatusInfo(instance.status);
            const StatusIcon = statusInfo.icon;
            const isLoading = actionLoading?.name === instance.name;

            return (
              <div key={instance.name} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${statusInfo.color} ${instance.status === 'connected' ? 'animate-pulse' : ''}`}></div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{instance.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIcon className={`w-4 h-4 ${statusInfo.textColor}`} />
                        <span className={`text-sm ${statusInfo.textColor}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {instance.status === 'connected' ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(instance.name)}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                          Pausar
                        </button>
                        <button
                          onClick={() => handleDelete(instance.name)}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Deletar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleConnect(instance.name)}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Conectar
                        </button>
                        <button
                          onClick={() => handleDelete(instance.name)}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Deletar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                {showQR === instance.name && qrCodeImage && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <img src={qrCodeImage} alt="QR Code" className="w-64 h-64" />
                      </div>
                      <p className="text-gray-300 text-center text-sm">
                        📱 Abra o WhatsApp → Configurações → Dispositivos Conectados → Conectar Dispositivo
                      </p>
                      <button
                        onClick={() => { setShowQR(null); setQrCodeImage(''); fetchInstances(); }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Instância */}
      {showNewInstanceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Nova Conexão</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Instância</label>
              <input
                type="text"
                placeholder="Ex: cliente01, revendedor02"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                value={newInstanceName}
                onChange={e => setNewInstanceName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Use apenas letras, números e hífens</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateInstance}
                disabled={creatingInstance || !newInstanceName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold"
              >
                {creatingInstance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creatingInstance ? 'Criando...' : 'Criar'}
              </button>
              <button
                onClick={() => { setShowNewInstanceModal(false); setNewInstanceName(''); }}
                className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-3">📋 Como Usar:</h3>
        <ol className="space-y-2 text-gray-300 list-decimal list-inside text-sm">
          <li>Clique em <strong>"Nova Conexão"</strong> para criar uma instância</li>
          <li>Dê um nome único (ex: nome do cliente)</li>
          <li>Clique em <strong>"Conectar"</strong> na instância criada</li>
          <li>Escaneie o QR Code com o WhatsApp</li>
          <li>Pronto! O status mudará para "Conectado"</li>
        </ol>
      </div>
    </div>
  );
}
