import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Truck, ArrowRight, Building, MapPin, Package } from 'lucide-react';

const Transfer = () => {
  const [activeTab, setActiveTab] = useState('transfer'); // 'transfer', 'warehouses', 'history'
  
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branchStocks, setBranchStocks] = useState([]); // Şube Stokları
  const [transfers, setTransfers] = useState([]); // Transfer Geçmişi

  // Formlar
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });
  const [transfer, setTransfer] = useState({ 
    sourceId: 'main', // Varsayılan Merkez
    targetId: '', 
    productId: '', 
    quantity: '' 
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setProducts(await window.db.get('products') || []);
    setWarehouses(await window.db.get('warehouses') || []);
    setBranchStocks(await window.db.get('branch_stocks') || []);
    setTransfers(await window.db.get('transfers') || []);
  };

  // --- DEPO İŞLEMLERİ ---
  const handleAddWarehouse = async () => {
    if (!newWarehouse.name) return alert("Depo adı giriniz!");
    const warehouseToAdd = { id: `WH-${Date.now()}`, ...newWarehouse };
    
    const updated = [...warehouses, warehouseToAdd];
    await window.db.set('warehouses', updated);
    setWarehouses(updated);
    setNewWarehouse({ name: '', location: '' });
    alert("Yeni depo/şube açıldı!");
  };

  const deleteWarehouse = async (id) => {
      if(confirm("Depoyu kapatmak istiyor musun? İçindeki stoklar silinebilir.")) {
          const updated = warehouses.filter(w => w.id !== id);
          await window.db.set('warehouses', updated);
          setWarehouses(updated);
      }
  };

  // --- TRANSFER İŞLEMİ (KRİTİK) ---
  const handleTransfer = async () => {
    if (!transfer.targetId || !transfer.productId || !transfer.quantity) return alert("Bilgileri doldurun!");
    if (transfer.sourceId === transfer.targetId) return alert("Aynı depoya transfer yapılamaz!");

    const qty = Number(transfer.quantity);
    const product = products.find(p => p.id === Number(transfer.productId));
    
    // 1. KAYNAK KONTROLÜ VE DÜŞÜM
    let updatedProducts = [...products];
    let updatedBranchStocks = [...branchStocks];

    if (transfer.sourceId === 'main') {
        // Merkezden Çıkış
        if (product.stock < qty) return alert("Merkez stok yetersiz!");
        updatedProducts = products.map(p => p.id === product.id ? { ...p, stock: p.stock - qty } : p);
    } else {
        // Şubeden Çıkış
        const sourceStock = branchStocks.find(s => s.whId === transfer.sourceId && s.prodId === product.id);
        if (!sourceStock || sourceStock.qty < qty) return alert("Şube stoğu yetersiz!");
        
        updatedBranchStocks = branchStocks.map(s => 
            (s.whId === transfer.sourceId && s.prodId === product.id) 
            ? { ...s, qty: s.qty - qty } : s
        );
    }

    // 2. HEDEF KONTROLÜ VE EKLEME
    if (transfer.targetId === 'main') {
        // Merkeze Giriş
        updatedProducts = updatedProducts.map(p => p.id === product.id ? { ...p, stock: p.stock + qty } : p);
    } else {
        // Şubeye Giriş
        const existingStock = updatedBranchStocks.find(s => s.whId === transfer.targetId && s.prodId === product.id);
        if (existingStock) {
            updatedBranchStocks = updatedBranchStocks.map(s => 
                (s.whId === transfer.targetId && s.prodId === product.id) 
                ? { ...s, qty: s.qty + qty } : s
            );
        } else {
            updatedBranchStocks.push({ whId: transfer.targetId, prodId: product.id, qty: qty });
        }
    }

    // 3. TRANSFER GEÇMİŞİNİ KAYDET
    const newTransferLog = {
        id: `TRF-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR'),
        productName: product.name,
        qty: qty,
        sourceName: transfer.sourceId === 'main' ? 'Merkez Depo' : warehouses.find(w => w.id === transfer.sourceId)?.name,
        targetName: transfer.targetId === 'main' ? 'Merkez Depo' : warehouses.find(w => w.id === transfer.targetId)?.name
    };
    const updatedTransfers = [newTransferLog, ...transfers];

    // KAYDET
    await window.db.set('products', updatedProducts);
    await window.db.set('branch_stocks', updatedBranchStocks);
    await window.db.set('transfers', updatedTransfers);

    setProducts(updatedProducts);
    setBranchStocks(updatedBranchStocks);
    setTransfers(updatedTransfers);
    
    alert("Transfer başarıyla tamamlandı.");
    setTransfer({ ...transfer, productId: '', quantity: '' });
  };

  // Şube Stok Bilgisini Getir
  const getBranchStock = (whId, prodId) => {
      const item = branchStocks.find(s => s.whId === whId && s.prodId === prodId);
      return item ? item.qty : 0;
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Depo Transfer</h2>
            <p className="text-gray-500 text-sm">Şubeler arası stok yönetimi</p>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-lg flex">
            <button onClick={() => setActiveTab('transfer')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'transfer' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Transfer Yap</button>
            <button onClick={() => setActiveTab('warehouses')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'warehouses' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Depolar / Şubeler</button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-md text-sm font-bold ${activeTab === 'history' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Geçmiş</button>
        </div>
      </div>

      {/* --- SEKME 1: TRANSFER YAP --- */}
      {activeTab === 'transfer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-blue-700">
                      <Truck/> Transfer Emri
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">ÇIKIŞ (Kaynak)</label>
                              <select className="w-full p-3 border rounded-lg bg-red-50 font-bold" value={transfer.sourceId} onChange={e => setTransfer({...transfer, sourceId: e.target.value})}>
                                  <option value="main">Merkez Depo</option>
                                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                              </select>
                          </div>
                          <div className="flex items-center justify-center pt-4">
                              <ArrowRight className="text-gray-400" size={32}/>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 block mb-1">GİRİŞ (Hedef)</label>
                              <select className="w-full p-3 border rounded-lg bg-green-50 font-bold" value={transfer.targetId} onChange={e => setTransfer({...transfer, targetId: e.target.value})}>
                                  <option value="">Seçiniz...</option>
                                  <option value="main">Merkez Depo</option>
                                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-1">ÜRÜN SEÇ</label>
                          <select className="w-full p-3 border rounded-lg" value={transfer.productId} onChange={e => setTransfer({...transfer, productId: e.target.value})}>
                              <option value="">Ürün Seçiniz...</option>
                              {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                      {p.name} (Merkez Stok: {p.stock})
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-1">ADET</label>
                          <input type="number" className="w-full p-3 border rounded-lg font-bold text-lg" placeholder="0" value={transfer.quantity} onChange={e => setTransfer({...transfer, quantity: e.target.value})}/>
                      </div>

                      <button onClick={handleTransfer} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
                          TRANSFERİ ONAYLA
                      </button>
                  </div>
              </div>

              {/* Şube Stok Durumu (Özet) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-y-auto max-h-[500px]">
                  <h3 className="font-bold text-gray-700 mb-4">Şube Stok Durumları</h3>
                  {warehouses.length === 0 ? <p className="text-gray-400 text-sm">Henüz şube tanımlanmadı.</p> : (
                      <div className="space-y-4">
                          {warehouses.map(w => (
                              <div key={w.id} className="border p-3 rounded-lg">
                                  <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-2"><Building size={14}/> {w.name}</h4>
                                  <div className="text-xs space-y-1">
                                      {products.map(p => {
                                          const qty = getBranchStock(w.id, p.id);
                                          if (qty > 0) return (
                                              <div key={p.id} className="flex justify-between border-b border-dashed pb-1">
                                                  <span>{p.name}</span>
                                                  <span className="font-bold text-blue-600">{qty} Adet</span>
                                              </div>
                                          );
                                          return null;
                                      })}
                                      {!branchStocks.some(s => s.whId === w.id && s.qty > 0) && <span className="text-gray-400 italic">Depo boş.</span>}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- SEKME 2: DEPO TANIMLAMA --- */}
      {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                  <h3 className="font-bold text-lg mb-4">Yeni Şube / Depo Ekle</h3>
                  <div className="space-y-3">
                      <input placeholder="Depo Adı (Örn: Kadıköy Şube)" className="w-full p-2 border rounded" value={newWarehouse.name} onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}/>
                      <input placeholder="Konum / Adres" className="w-full p-2 border rounded" value={newWarehouse.location} onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})}/>
                      <button onClick={handleAddWarehouse} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Ekle</button>
                  </div>
              </div>

              <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex justify-between items-center">
                      <div>
                          <h4 className="font-bold text-blue-900">MERKEZ DEPO (Ana Stok)</h4>
                          <p className="text-xs text-blue-600">Varsayılan depo</p>
                      </div>
                      <Building size={24} className="text-blue-400"/>
                  </div>
                  {warehouses.map(w => (
                      <div key={w.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center relative group">
                          <div>
                              <h4 className="font-bold text-gray-800">{w.name}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/> {w.location || 'Konum yok'}</p>
                          </div>
                          <button onClick={() => deleteWarehouse(w.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- SEKME 3: GEÇMİŞ --- */}
      {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                      <tr><th className="px-6 py-3">TARİH</th><th className="px-6 py-3">ÜRÜN</th><th className="px-6 py-3">ÇIKIŞ</th><th className="px-6 py-3">GİRİŞ</th><th className="px-6 py-3 text-right">ADET</th></tr>
                  </thead>
                  <tbody className="divide-y">
                      {transfers.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-gray-600">{t.date}</td>
                              <td className="px-6 py-3 font-bold text-gray-800">{t.productName}</td>
                              <td className="px-6 py-3 text-red-500">{t.sourceName}</td>
                              <td className="px-6 py-3 text-green-500">{t.targetName}</td>
                              <td className="px-6 py-3 text-right font-bold">{t.qty}</td>
                          </tr>
                      ))}
                      {transfers.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-400">Kayıt yok.</td></tr>}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};

export default Transfer;