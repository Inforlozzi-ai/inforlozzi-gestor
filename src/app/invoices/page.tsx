'use client';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><FileText className="w-8 h-8 text-yellow-400"/> Cobranças</h1>
        <Link href="/invoices/new" className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Nova Cobrança
        </Link>
      </div>
      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <p className="text-xl text-gray-300">Gerencie suas cobranças e gere PIX rapidamente.</p>
        <p className="mt-2 text-gray-500">Clique no botão acima para começar.</p>
      </div>
    </div>
  );
}
