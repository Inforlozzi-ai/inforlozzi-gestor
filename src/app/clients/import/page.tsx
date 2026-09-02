'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';

export default function ImportClientsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5)); // Mostra apenas os 5 primeiros para prévia
      },
      error: (err) => {
        setMessage({ text: `Erro ao ler arquivo: ${err.message}`, type: 'error' });
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch('/api/clients/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clients: results.data }),
          });
          const data = await res.json();
          
          if (data.success) {
            setMessage({ text: data.message, type: 'success' });
            setFile(null);
            setPreview([]);
          } else {
            setMessage({ text: `Erro: ${data.error}`, type: 'error' });
          }
        } catch (err) {
          setMessage({ text: 'Erro de conexão com o servidor.', type: 'error' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,phone,email,xtream_username,xtream_password\nCliente Exemplo,5511999999999,cliente@email.com,usuario123,senha123";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modelo_clientes.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/clients" className="inline-flex items-center text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Clientes
      </Link>
      
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Upload className="w-6 h-6 text-blue-400"/> Importar Clientes em Massa
            </h2>
            <p className="text-gray-400 mt-2">Carregue uma planilha CSV para cadastrar múltiplos clientes de uma vez.</p>
          </div>
          <button onClick={downloadTemplate} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Download className="w-4 h-4" /> Baixar Modelo CSV
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition bg-gray-700/30">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">Selecione seu arquivo CSV</p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Prévia dos dados (5 primeiros):</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                  <tr>
                    {Object.keys(preview[0]).map(key => <th key={key} className="px-4 py-2">{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-gray-700">
                      {Object.values(row).map((val: any, j) => <td key={j} className="px-4 py-2">{val}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <button 
          onClick={handleImport} 
          disabled={!file || loading} 
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
        >
          {loading ? 'Importando...' : 'Importar Clientes'}
        </button>
      </div>
    </div>
  );
}
