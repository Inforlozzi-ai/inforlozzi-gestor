'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Loader, CheckCircle, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewInvoicePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(d => { if(d.success) setClients(d.data); });
    fetch('/api/plans').then(res => res.json()).then(d => { if(d.success) setPlans(d.data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient, amount, description: 'Cobrança IPTV', dueDate }),
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qr_code_base64);
        setPixPayload(data.data.qr_code);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar cobrança');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/invoices" className="inline-flex items-center text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Cobranças
      </Link>

      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-white">
          <DollarSign className="w-6 h-6 text-yellow-400"/> Nova Cobrança PIX
        </h2>

        {!qrCode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cliente</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none" required>
                <option value="">Selecione um cliente</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plano</label>
              <select value={selectedPlan} onChange={e => { setSelectedPlan(e.target.value); const p = plans.find((x: any) => x.id === e.target.value); if(p) setAmount(p.price); }} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none" required>
                <option value="">Selecione um plano</option>
                {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} - R$ {parseFloat(p.price).toFixed(2)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vencimento</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold mt-4">
              {loading && <Loader className="w-4 h-4 animate-spin" />} {loading ? 'Gerando PIX...' : 'Gerar Cobrança PIX'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6 py-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-bold text-white">Cobrança Criada com Sucesso!</h3>
            
            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600">
              <p className="text-sm font-medium mb-4 text-gray-300">QR Code PIX:</p>
              {qrCode && <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-56 h-56 mx-auto bg-white p-2 rounded" />}
            </div>

            {pixPayload && (
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <p className="text-sm font-medium mb-2 text-gray-300">PIX Copia e Cola:</p>
                <div className="flex gap-2">
                  <input type="text" value={pixPayload} readOnly className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-xs text-gray-300 font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(pixPayload); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                    <Copy className="w-4 h-4" /> {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            <button onClick={() => { setQrCode(null); setPixPayload(null); setSelectedClient(''); setSelectedPlan(''); setAmount(''); setDueDate(''); }} className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition">
              Criar Nova Cobrança
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
