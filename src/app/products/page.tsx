'use client';
import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    active: true
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) { console.error('❌ Erro:', err); } 
    finally { setLoading(false); }
  };

  const openNewModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', active: true });
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? String(product.price) : '',
      active: product.active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { alert('Produto excluído!'); fetchProducts(); }
      else { alert('Erro: ' + data.error); }
    } catch (err) { alert('Erro ao excluir'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(editingProduct ? 'Produto atualizado!' : 'Produto criado!');
        setShowModal(false);
        fetchProducts();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) { 
      alert('Erro ao salvar'); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Package className="w-8 h-8 text-orange-400"/> Produtos (Painéis)
        </h1>
        <button onClick={openNewModal} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Novo Produto
        </button>
      </div>

      <div className="bg-gray-800 shadow rounded-xl border border-gray-700 overflow-hidden">
        {loading ? <p className="p-6 text-center text-gray-400">Carregando...</p> : products.length === 0 ? <p className="p-6 text-center text-gray-400">Nenhum produto cadastrado.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-700/50 rounded-lg border border-gray-600 p-4 hover:border-orange-500 transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white text-lg">{product.name}</h3>
                  {product.active ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  {product.description && <p className="text-xs text-gray-400 line-clamp-2">{product.description}</p>}
                  {product.price > 0 && <p className="text-lg font-bold text-orange-400">R$ {parseFloat(product.price).toFixed(2)}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(product)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => handleDelete(product.id, product.name)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Painel *</label>
                <input type="text" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-20 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="active" className="text-gray-300">Produto Ativo</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold">
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
