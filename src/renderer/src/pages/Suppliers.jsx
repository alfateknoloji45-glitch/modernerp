import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Truck, ArrowLeft, PackagePlus, Wallet } from 'lucide-react';

const Suppliers = ({ userRole }) => {
  const [viewMode, setViewMode] = useState('list');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', balance: 0 });
  const [purchase, setPurchase] = useState({ productId: '', quantity: '', cost: '', description: '' });
  const [serialInput, setSerialInput] = useState('');
  const [lotForm, setLotForm] = useState({ code: '', qty: '', expiry: '' });

  useEffect(() => { loadData(); }, [viewMode]);

  const loadData = async () => {
    setSuppliers(await window.db.get('suppliers') || []);
    setTransactions(await window.db.get('supplier_transactions') || []);
    setProducts(await window.db.get('products') || []);
  };

  const handleSaveSupplier = async () => {
    if (!newSupplier.name) return alert("İsim giriniz!");
    const updated = [...suppliers, { ...newSupplier, id: Date.now(), balance: 0 }];
    await window.db.set('suppliers', updated);
    setSuppliers(updated);
    setShowSupplierModal(false);
  };

  const handlePurchase = async () => {
    const amount = Number(purchase.cost) || 0;
    const qty = Number(purchase.quantity) || 0;

    const newTrans = {
        id: `PUR-${Date.now()}`,
        supplierId: selectedSupplier.id,
        date: new Date().toLocaleDateString('tr-TR'),
        type: purchase.productId ? 'purchase' : 'debt',
        amount: amount,
        description: purchase.description || 'Mal Alımı',
        productName: purchase.productId ? products.find(p => p.id === Number(purchase.productId))?.name : '-'
    };

    const updatedTrans = [...transactions, newTrans];
    await window.db.set('supplier_transactions', updatedTrans);

    const updatedSuppliers = suppliers.map(s => {
        if (s.id === selectedSupplier.id) return { ...s, balance: (s.balance || 0) + amount };
        return s;
    });
    await window.db.set('suppliers', updatedSuppliers);

    if (purchase.productId) {
        const prod = products.find(p => p.id === Number(purchase.productId));
        let updatedProd = { ...prod };
        if (prod.serialTracked) {
            const codes = serialInput.split('\n').map(s => s.trim()).filter(Boolean);
            if (codes.length === 0) return alert('Seri giriniz');
            if (qty !== codes.length) return alert('Adet ile seri sayısı eşit olmalı');
            const existing = prod.serials || [];
            const dup = codes.find(code => existing.some(s => s.code === code));
            if (dup) return alert('Seri zaten mevcut: ' + dup);
            const newSerials = [...codes.map(code => ({ code, status: 'available' })), ...existing];
            updatedProd = { ...prod, serials: newSerials, stock: Number(prod.stock || 0) + codes.length };
        } else if (prod.lotTracked) {
            const lqty = Number(lotForm.qty) || 0;
            const lcode = lotForm.code;
            if (!lcode || lqty <= 0) return alert('Lot kodu ve miktar giriniz');
            if (qty !== lqty) return alert('Adet ile lot miktarı eşit olmalı');
            const lots = prod.lots || [];
            const exists = lots.find(l => l.code === lcode);
            let newLots;
            if (exists) {
                newLots = lots.map(l => l.code === lcode ? { ...l, qty: Number(l.qty || 0) + lqty, expiry: lotForm.expiry || l.expiry || null } : l);
            } else {
                newLots = [{ code: lcode, qty: lqty, expiry: lotForm.expiry || null }, ...lots];
            }
            updatedProd = { ...prod, lots: newLots, stock: Number(prod.stock || 0) + lqty };
        } else {
            updatedProd = { ...prod, stock: Number(prod.stock || 0) + qty };
        }
        const updatedProducts = products.map(p => p.id === updatedProd.id ? updatedProd : p);
        await window.db.set('products', updatedProducts);
        const productLogs = await window.db.get('product_logs') || [];
        productLogs.push({ id: Date.now() + updatedProd.id, productId: updatedProd.id, date: new Date().toLocaleDateString('tr-TR'), time: new Date().toLocaleTimeString('tr-TR'), type: 'Satın Alma Girişi', amount: qty, reason: purchase.description || 'Tedarik', user: userRole });
        await window.db.set('product_logs', productLogs);
    }

    setSuppliers(updatedSuppliers);
    setTransactions(updatedTrans);
    setSelectedSupplier(updatedSuppliers.find(s => s.id === selectedSupplier.id));
    setShowPurchaseModal(false);
    setSerialInput('');
    setLotForm({ code: '', qty: '', expiry: '' });
  };

  if (viewMode === 'list') {
    return (
      <div className="p-8 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tedarikçiler</h2>
          <div className="flex gap-3">
            <input className="pl-4 pr-4 py-2 border rounded-lg w-64" placeholder="Firma Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            <button onClick={() => setShowSupplierModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg">
              <Plus size={18}/> <span>Ekle</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">FİRMA</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">YETKİLİ</th>
                {/* SADECE ADMIN BAKİYE GÖRÜR */}
                {userRole === 'Admin' && <th className="px-6 py-4 text-xs font-bold text-gray-500">BORÇ</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedSupplier(s); setViewMode('detail'); }}>
                  <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2"><Truck size={18} className="text-purple-400"/> {s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.contact}</td>
                  {userRole === 'Admin' && (
                      <td className="px-6 py-4 text-red-600 font-bold">₺{s.balance.toLocaleString()}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showSupplierModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                    <h3 className="font-bold text-lg mb-4">Yeni Tedarikçi</h3>
                    <div className="space-y-3">
                        <input autoFocus placeholder="Firma Adı" className="w-full p-2 border rounded" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}/>
                        <input placeholder="Yetkili" className="w-full p-2 border rounded" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})}/>
                        <input placeholder="Telefon" className="w-full p-2 border rounded" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}/>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setShowSupplierModal(false)} className="px-4 py-2 text-gray-500">İptal</button>
                        <button onClick={handleSaveSupplier} className="px-4 py-2 bg-purple-600 text-white rounded">Kaydet</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (viewMode === 'detail' && selectedSupplier) {
    const supplierTrans = transactions.filter(t => t.supplierId === selectedSupplier.id).reverse();

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewMode('list')} className="p-2 bg-white border rounded-full hover:bg-gray-100"><ArrowLeft size={20}/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedSupplier.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedSupplier.contact}</p>
                </div>
                {userRole === 'Admin' && (
                    <div className="ml-auto text-right">
                        <p className="text-xs text-gray-500 font-bold">TOPLAM BORÇ</p>
                        <p className="text-3xl font-bold text-red-600">₺{selectedSupplier.balance.toLocaleString()}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={() => setShowPurchaseModal(true)} className="bg-purple-600 text-white p-4 rounded-xl shadow-sm hover:bg-purple-700 flex items-center justify-center gap-2 font-bold">
                    <PackagePlus size={24}/> MAL ALIMI (Stok Ekle)
                </button>
                {/* ÖDEME YAPMA SADECE ADMİNE AÇIK OLSUN */}
                {userRole === 'Admin' && (
                    <button className="bg-green-600 text-white p-4 rounded-xl shadow-sm hover:bg-green-700 flex items-center justify-center gap-2 font-bold">
                        <Wallet size={24}/> ÖDEME YAP
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">TARİH</th>
                            <th className="px-6 py-3">İŞLEM</th>
                            <th className="px-6 py-3">AÇIKLAMA / ÜRÜN</th>
                            {userRole === 'Admin' && <th className="px-6 py-3 text-right">TUTAR</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {supplierTrans.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-gray-600">{t.date}</td>
                                <td className="px-6 py-3"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">İŞLEM</span></td>
                                <td className="px-6 py-3 font-medium text-gray-800">{t.productName !== '-' ? t.productName : t.description}</td>
                                {userRole === 'Admin' && <td className="px-6 py-3 text-right font-bold">₺{t.amount.toLocaleString()}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL: Mal Alım (Stok Girişi) - Fiyat Girişi Gizli mi? */}
            {showPurchaseModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">Mal Alımı</h3>
                        <div className="space-y-3">
                            <select className="w-full p-2 border rounded" value={purchase.productId} onChange={e => setPurchase({...purchase, productId: e.target.value})}>
                                <option value="">Ürün Seç...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            
                            <input type="number" className="w-full p-2 border rounded" placeholder="Adet (Stok Artacak)" value={purchase.quantity} onChange={e => setPurchase({...purchase, quantity: e.target.value})}/>
                            {(() => { const sp = products.find(p => p.id === Number(purchase.productId)); return sp && sp.serialTracked ? (
                              <textarea className="w-full p-2 border rounded text-sm" rows={4} placeholder="Seri numaraları (her satıra bir)" value={serialInput} onChange={e => setSerialInput(e.target.value)} />
                            ) : sp && sp.lotTracked ? (
                              <div className="grid grid-cols-3 gap-2">
                                <input className="p-2 border rounded" placeholder="Lot Kodu" value={lotForm.code} onChange={e => setLotForm({...lotForm, code: e.target.value})} />
                                <input type="number" className="p-2 border rounded" placeholder="Lot Miktarı" value={lotForm.qty} onChange={e => setLotForm({...lotForm, qty: e.target.value})} />
                                <input className="p-2 border rounded" placeholder="SKT (opsiyonel)" value={lotForm.expiry} onChange={e => setLotForm({...lotForm, expiry: e.target.value})} />
                              </div>
                            ) : null; })()}

                            {/* DEPOCU FİYAT GİREMEZ, SADECE STOK GİRER */}
                            {userRole === 'Admin' && (
                                <input type="number" className="w-full p-2 border rounded font-bold" placeholder="Toplam Tutar (Borç)" value={purchase.cost} onChange={e => setPurchase({...purchase, cost: e.target.value})}/>
                            )}

                            <input placeholder="Açıklama" className="w-full p-2 border rounded" value={purchase.description} onChange={e => setPurchase({...purchase, description: e.target.value})}/>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowPurchaseModal(false)} className="px-4 py-2 text-gray-500">İptal</button>
                            <button onClick={handlePurchase} className="px-4 py-2 bg-purple-600 text-white rounded">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }
  return null;
};
export default Suppliers;
