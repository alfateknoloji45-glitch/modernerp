import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, CheckCircle, XCircle, Printer, ArrowRight } from 'lucide-react';

const Proposals = () => {
  const [viewMode, setViewMode] = useState('list');
  const [proposals, setProposals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Yeni Teklif Formu
  const [newProposal, setNewProposal] = useState({ 
    customerName: '', 
    items: [], 
    date: new Date().toLocaleDateString('tr-TR') 
  });
  
  // Teklif Sepeti (Ürün ekleme için)
  const [cartItem, setCartItem] = useState({ productId: '', quantity: 1 });

  useEffect(() => { loadData(); }, [viewMode]);

  const loadData = async () => {
    const storedProposals = await window.db.get('proposals') || [];
    const storedCustomers = await window.db.get('customers') || [];
    const storedProducts = await window.db.get('products') || [];
    
    setProposals(storedProposals);
    setCustomers(storedCustomers);
    setProducts(storedProducts);
  };

  // --- TEKLİF OLUŞTURMA ---
  const addItemToProposal = () => {
    if (!cartItem.productId) return;
    const product = products.find(p => p.id === Number(cartItem.productId));
    
    const newItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: Number(cartItem.quantity),
        total: product.price * Number(cartItem.quantity)
    };

    setNewProposal({ ...newProposal, items: [...newProposal.items, newItem] });
    setCartItem({ productId: '', quantity: 1 });
  };

  const saveProposal = async () => {
    if (!newProposal.customerName || newProposal.items.length === 0) return alert("Müşteri seçin ve ürün ekleyin!");

    const totalAmount = newProposal.items.reduce((acc, item) => acc + item.total, 0);
    
    const proposalToAdd = {
        id: `TEK-${Date.now()}`,
        customer: newProposal.customerName,
        date: newProposal.date,
        items: newProposal.items,
        total: totalAmount,
        status: 'Bekliyor' // Bekliyor, Onaylandı, Reddedildi
    };

    const updatedList = [proposalToAdd, ...proposals];
    await window.db.set('proposals', updatedList);
    setProposals(updatedList);
    setViewMode('list');
    setNewProposal({ customerName: '', items: [], date: new Date().toLocaleDateString('tr-TR') });
  };

  // --- SATIŞA ÇEVİR (SİHİRLİ BUTON) ---
  const convertToSale = async (proposal) => {
    if(!confirm("Bu teklif satışa dönüştürülsün mü? Stoktan düşülecek.")) return;

    // 1. Satış Kaydı Oluştur
    const newSale = {
        id: `SAT-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR'),
        items: proposal.items,
        total: proposal.total,
        method: 'Nakit' // Varsayılan Nakit (İstenirse sorulabilir)
    };
    const currentSales = await window.db.get('sales') || [];
    await window.db.set('sales', [newSale, ...currentSales]);

    // 2. Stoktan Düş
    const currentProducts = await window.db.get('products') || [];
    const updatedProducts = currentProducts.map(prod => {
        const item = proposal.items.find(i => i.id === prod.id);
        if (item) return { ...prod, stock: prod.stock - item.quantity };
        return prod;
    });
    await window.db.set('products', updatedProducts);

    // 3. Kasaya İşle
    const accounts = await window.db.get('accounts') || [];
    const updatedAccounts = accounts.map(acc => {
        if (acc.id === 'acc_cash') return { ...acc, balance: acc.balance + proposal.total };
        return acc;
    });
    await window.db.set('accounts', updatedAccounts);

    // 4. Teklif Durumunu Güncelle
    const updatedProposals = proposals.map(p => {
        if(p.id === proposal.id) return { ...p, status: 'Onaylandı' };
        return p;
    });
    await window.db.set('proposals', updatedProposals);
    
    setProposals(updatedProposals);
    alert("Teklif başarıyla satışa çevrildi!");
  };

  const deleteProposal = async (id) => {
      if(confirm("Teklifi silmek istiyor musun?")) {
          const updated = proposals.filter(p => p.id !== id);
          setProposals(updated);
          await window.db.set('proposals', updated);
      }
  }

  // --- ARAYÜZ ---
  return (
    <div className="p-8 h-full overflow-y-auto">
      {viewMode === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Teklifler</h2>
                <p className="text-gray-500 text-sm">Verilen fiyat teklifleri ve durumları</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setViewMode('new')} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">
                  <Plus size={18}/> <span>Teklif Hazırla</span>
                </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500">TEKLİF NO</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500">MÜŞTERİ</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500">TARİH</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500">TUTAR</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500">DURUM</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">İŞLEM</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {proposals.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{p.id}</td>
                            <td className="px-6 py-4">{p.customer}</td>
                            <td className="px-6 py-4 text-gray-500">{p.date}</td>
                            <td className="px-6 py-4 font-bold">₺{p.total}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs border ${
                                    p.status === 'Onaylandı' ? 'bg-green-100 text-green-700 border-green-200' : 
                                    p.status === 'Reddedildi' ? 'bg-red-100 text-red-700 border-red-200' : 
                                    'bg-orange-100 text-orange-700 border-orange-200'
                                }`}>{p.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                {p.status === 'Bekliyor' && (
                                    <button onClick={() => convertToSale(p)} className="text-green-600 hover:bg-green-50 p-2 rounded" title="Satışa Çevir">
                                        <CheckCircle size={18}/>
                                    </button>
                                )}
                                <button onClick={() => deleteProposal(p.id)} className="text-red-400 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                            </td>
                        </tr>
                    ))}
                    {proposals.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-400">Teklif bulunamadı.</td></tr>}
                </tbody>
            </table>
          </div>
        </>
      ) : (
        /* YENİ TEKLİF EKRANI */
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Yeni Teklif Oluştur</h2>
                <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-700"><XCircle size={24}/></button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">MÜŞTERİ SEÇ</label>
                    <select className="w-full p-2 border rounded" value={newProposal.customerName} onChange={e => setNewProposal({...newProposal, customerName: e.target.value})}>
                        <option value="">Seçiniz...</option>
                        {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">TARİH</label>
                    <input type="text" className="w-full p-2 border rounded bg-gray-50" value={newProposal.date} readOnly/>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">ÜRÜN EKLE</label>
                    <select className="w-full p-2 border rounded" value={cartItem.productId} onChange={e => setCartItem({...cartItem, productId: e.target.value})}>
                        <option value="">Ürün Seç...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (₺{p.price})</option>)}
                    </select>
                </div>
                <div className="w-24">
                    <label className="block text-xs font-bold text-gray-500 mb-1">ADET</label>
                    <input type="number" className="w-full p-2 border rounded" value={cartItem.quantity} onChange={e => setCartItem({...cartItem, quantity: e.target.value})}/>
                </div>
                <button onClick={addItemToProposal} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-bold">EKLE</button>
            </div>

            <table className="w-full text-left mb-6">
                <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                    <tr><th className="p-3">Ürün</th><th className="p-3">Fiyat</th><th className="p-3">Adet</th><th className="p-3 text-right">Tutar</th></tr>
                </thead>
                <tbody>
                    {newProposal.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                            <td className="p-3">{item.name}</td>
                            <td className="p-3">₺{item.price}</td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3 text-right font-bold">₺{item.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end gap-4 items-center">
                <div className="text-xl font-bold text-gray-800">TOPLAM: ₺{newProposal.items.reduce((a, b) => a + b.total, 0)}</div>
                <button onClick={saveProposal} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold flex items-center gap-2">
                    <FileText size={18}/> Teklifi Kaydet
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;