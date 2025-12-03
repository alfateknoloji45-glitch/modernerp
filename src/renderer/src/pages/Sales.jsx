import React, { useState, useEffect, useRef } from 'react';
import { Search, Scan, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Printer, CheckCircle, User, X, Package, CalendarClock, Hash, Layers } from 'lucide-react';

const Sales = ({ userRole, logActivity, activeModules }) => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  
  // Müşteri & Taksit State'leri
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState({ downPayment: '', count: '3' }); // Peşinat ve Taksit Sayısı
  const [serialModal, setSerialModal] = useState({ open: false, product: null, available: [], selected: [] });
  const [lotModal, setLotModal] = useState({ open: false, product: null, lots: [], allocations: [] });

  const searchInputRef = useRef(null);

  useEffect(() => { 
      loadData(); 
      if(searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const loadData = async () => {
    const storedProducts = await window.db.get('products') || [];
    const storedCustomers = await window.db.get('customers') || [];
    setProducts(storedProducts);
    setCustomers(storedCustomers);
  };

  const getActiveCampaigns = async () => {
    if (!activeModules || !activeModules.includes('campaigns')) return [];
    const list = await window.db.get('campaigns') || [];
    const today = new Date().toISOString().slice(0,10);
    return list.filter(c => c.active && (!c.startDate || c.startDate <= today) && (!c.endDate || c.endDate >= today));
  };

  const calculateUnitPrice = async (product, qty) => {
    const campaigns = await getActiveCampaigns();
    const base = Number(product.price || 0);
    let best = base;
    campaigns.forEach(c => {
      const matchesProduct = !c.productId || Number(c.productId) === product.id;
      const meetsQty = Number(qty || 1) >= Number(c.minQty || 1);
      if (matchesProduct && meetsQty) {
        const discounted = c.type === 'percentage' ? base * (1 - Number(c.discount)/100) : Math.max(0, base - Number(c.discount));
        if (discounted < best) best = discounted;
      }
    });
    return Math.round(best);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        const exactMatch = products.find(p => p.barcode === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch) {
            addToCart(exactMatch);
            setSearchTerm("");
        } else {
            if (searchTerm.length > 3 && !isNaN(searchTerm)) {
                alert("Ürün bulunamadı!");
                setSearchTerm("");
            }
        }
    }
  };

  const addToCart = async (product) => {
    if (product.stock <= 0) return alert("Stok yok!");
    const existing = cart.find(i => i.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + 1 > product.stock) return alert("Stok yetersiz!");

    if (existing) {
        const newQty = existing.quantity + 1;
        const unit = await calculateUnitPrice(product, newQty);
        setCart(cart.map(i => i.id === product.id ? { ...i, quantity: newQty, price: unit } : i));
    } else {
        const unit = await calculateUnitPrice(product, 1);
        setCart([...cart, { ...product, quantity: 1, price: unit, serialTracked: !!product.serialTracked, lotTracked: !!product.lotTracked, selectedSerials: [], lotUsed: [] }]);
        if (product.serialTracked) {
          const available = (product.serials || []).filter(s => s.status !== 'sold').map(s => s.code);
          setSerialModal({ open: true, product, available, selected: [] });
        }
        if (product.lotTracked) {
          const lots = (product.lots || []).filter(l => Number(l.qty) > 0);
          setLotModal({ open: true, product, lots, allocations: [] });
        }
    }
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));
  
  const updateQuantity = async (id, delta) => {
    const updated = await Promise.all(cart.map(async item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if (delta > 0 && item.quantity + 1 > product.stock) return item;
        const newQty = Math.max(1, item.quantity + delta);
        const unit = await calculateUnitPrice(product, newQty);
        const nextSelected = (item.selectedSerials || []).slice(0, newQty);
        let nextLotUsed = item.lotUsed || [];
        const totalLot = nextLotUsed.reduce((a,b)=>a+Number(b.qty||0),0);
        if (totalLot > newQty) {
          let remaining = newQty;
          const trimmed = [];
          for (let k=0; k<nextLotUsed.length; k++) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, Number(nextLotUsed[k].qty||0));
            if (take > 0) trimmed.push({ code: nextLotUsed[k].code, qty: take });
            remaining -= take;
          }
          nextLotUsed = trimmed;
        }
        return { ...item, quantity: newQty, price: unit, selectedSerials: nextSelected, lotUsed: nextLotUsed };
      }
      return item;
    }));
    setCart(updated);
  };

  // --- SATIŞI TAMAMLA ---
  const handlePayment = async (method, installmentData = null) => {
    if (cart.length === 0) return alert("Sepet boş!");
    if ((method === 'Veresiye' || method === 'Taksitli') && !selectedCustomer) return alert("Müşteri seçin!");
    const serialRequired = cart.filter(i => i.serialTracked);
    if (serialRequired.some(i => (i.selectedSerials || []).length !== i.quantity)) return alert("Seri takipli ürünler için seri numarası atayın!");
    const lotRequired = cart.filter(i => i.lotTracked);
    if (lotRequired.some(i => (i.lotUsed || []).reduce((a,b)=>a+Number(b.qty||0),0) !== i.quantity)) return alert("Lot takipli ürünler için lot miktarı atayın!");
    
    const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    // 1. SATIŞ KAYDI
    const newSale = {
        id: `SAT-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR'),
        items: [...cart],
        total: totalAmount,
        method: method,
        customerId: selectedCustomer ? selectedCustomer.id : null,
        customerName: selectedCustomer ? selectedCustomer.name : 'Misafir',
        downPayment: method === 'Taksitli' && installmentData ? Number(installmentData.downPayment || 0) : 0,
        installmentCount: method === 'Taksitli' && installmentData ? Number(installmentData.count || 0) : 0
    };

    // 2. STOK DÜŞ
    const updatedProds = products.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (!cartItem) return p;
        const next = Math.max(0, Number(p.stock || 0) - cartItem.quantity);
        let updated = { ...p, stock: next, status: next < 5 ? 'Kritik' : 'Yeterli' };
        if (p.serialTracked && cartItem.selectedSerials) {
          const newSerials = (p.serials || []).map(s => (cartItem.selectedSerials || []).includes(s.code) ? { ...s, status: 'sold' } : s);
          updated = { ...updated, serials: newSerials };
        }
        if (p.lotTracked && cartItem.lotUsed) {
          const lotMap = {};
          (cartItem.lotUsed || []).forEach(u => { lotMap[u.code] = (lotMap[u.code]||0) + u.qty; });
          const newLots = (p.lots || []).map(l => ({ ...l, qty: Math.max(0, l.qty - (lotMap[l.code]||0)) }));
          updated = { ...updated, lots: newLots };
        }
        return updated;
    });
    await window.db.set('products', updatedProds);

    // 3. FİNANSAL İŞLEMLER
    if (method === 'Taksitli' && installmentData) {
        // A. TAKSİT PLANI OLUŞTUR
        const remainingAmount = totalAmount - Number(installmentData.downPayment);
        const monthlyAmount = remainingAmount / Number(installmentData.count);
        const installments = [];
        
        // Peşinat Kaydı (Varsa)
        if(installmentData.downPayment > 0) {
            let accounts = await window.db.get('accounts') || [];
            const updatedAcc = accounts.map(a => a.id === 'acc_cash' ? {...a, balance: (a.balance || 0) + Number(installmentData.downPayment)} : a);
            await window.db.set('accounts', updatedAcc);
            const accountTrans = await window.db.get('account_transactions') || [];
            accountTrans.unshift({ id: `AT-${Date.now()}`, date: new Date().toLocaleDateString('tr-TR'), time: new Date().toLocaleTimeString('tr-TR'), accountId: 'acc_cash', type: 'income', amount: Math.round(Number(installmentData.downPayment)), description: 'Taksit peşinat' });
            await window.db.set('account_transactions', accountTrans);
        }

        // Taksitleri Oluştur
        const today = new Date();
        for (let i = 1; i <= Number(installmentData.count); i++) {
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + i);
            installments.push({
                id: `INS-${Date.now()}-${i}`,
                saleId: newSale.id,
                no: i,
                date: nextMonth.toLocaleDateString('tr-TR'),
                amount: Math.round(monthlyAmount), // Küsürat yuvarlama
                status: 'Bekliyor'
            });
        }

        // Taksitleri Müşteriye Kaydet (Yeni bir 'installments' tablosu veya müşteri içine)
        // Kolaylık olsun diye 'installments' tablosu kullanalım
        const allInstallments = await window.db.get('installments') || [];
        // Her taksit objesine müşteri ID ekleyelim
        const finalInstallments = installments.map(ins => ({...ins, customerId: selectedCustomer.id, customerName: selectedCustomer.name}));
        await window.db.set('installments', [...finalInstallments, ...allInstallments]);

        // Müşteri Bakiyesini Artır (Toplam Borç)
        const updatedCust = customers.map(c => c.id === selectedCustomer.id ? {...c, balance: (c.balance || 0) + remainingAmount} : c);
        await window.db.set('customers', updatedCust);
        setCustomers(updatedCust);

    } else if (method === 'Veresiye') {
        // Müşteri Borçlanır
        const updatedCust = customers.map(c => c.id === selectedCustomer.id ? {...c, balance: (c.balance || 0) + totalAmount} : c);
        await window.db.set('customers', updatedCust);
        setCustomers(updatedCust);
    } else {
        // Nakit/Kart -> Kasaya Girer
        let accounts = await window.db.get('accounts') || [];
        if (!accounts || accounts.length === 0) {
          accounts = [
            { id: 'acc_cash', name: 'Merkez Kasa', type: 'Kasa', balance: 0 },
            { id: 'acc_pos', name: 'POS / Banka', type: 'Banka', balance: 0 }
          ];
        }
        const targetAccId = method === 'Nakit' ? 'acc_cash' : 'acc_pos';
        const updatedAcc = accounts.map(a => a.id === targetAccId ? {...a, balance: (a.balance || 0) + totalAmount} : a);
        await window.db.set('accounts', updatedAcc);

        const accountTrans = await window.db.get('account_transactions') || [];
        accountTrans.unshift({
          id: `AT-${Date.now()}`,
          date: new Date().toLocaleDateString('tr-TR'),
          time: new Date().toLocaleTimeString('tr-TR'),
          accountId: targetAccId,
          type: 'income',
          amount: totalAmount,
          description: method === 'Nakit' ? 'Nakit satış' : 'Kartlı satış'
        });
        await window.db.set('account_transactions', accountTrans);
    }

    // Satışı Kaydet
    const currentSales = await window.db.get('sales') || [];
    await window.db.set('sales', [newSale, ...currentSales]);

    // 4. STOK HAREKET LOGU
    const productLogs = await window.db.get('product_logs') || [];
    cart.forEach(ci => {
      const s = (ci.selectedSerials || []).length > 0 ? `Seri: ${(ci.selectedSerials || []).join(', ')}` : '';
      const l = (ci.lotUsed || []).length > 0 ? `Lot: ${(ci.lotUsed || []).map(x => `${x.code} x${x.qty}`).join(', ')}` : '';
      const info = [s,l].filter(Boolean).join(' • ');
      productLogs.push({
        id: Date.now() + ci.id,
        productId: ci.id,
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR'),
        type: 'Satış Çıkış',
        amount: ci.quantity,
        reason: info ? `POS satış • ${info}` : 'POS satış',
        user: userRole
      });
    });
    await window.db.set('product_logs', productLogs);

    // Temizlik
    setProducts(updatedProds);
    setLastSale(newSale);
    setCart([]);
    setShowInstallmentModal(false);
    setSelectedCustomer(null);
    setShowSuccessModal(true);
    if(searchInputRef.current) setTimeout(() => searchInputRef.current.focus(), 500);

    if (typeof logActivity === 'function') {
      logActivity('SALE', `Satış tamamlandı. Tutar: ${totalAmount} ₺, Yöntem: ${method}`);
    }
  };

  return (
    <>
    <div className="flex h-full h-screen relative">
       {/* SUCCESS MODAL */}
       {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl text-center w-96 animate-in zoom-in duration-200">
                <CheckCircle className="text-green-500 mx-auto mb-4" size={64}/>
                <h2 className="text-2xl font-bold mb-2">Satış Başarılı!</h2>
                <div className="flex gap-2 mt-6">
                    <button onClick={() => window.print()} className="flex-1 bg-gray-800 text-white py-3 rounded-lg flex items-center justify-center gap-2"><Printer size={18}/> Yazdır</button>
                    <button onClick={() => setShowSuccessModal(false)} className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-lg">Kapat</button>
                </div>
            </div>
        </div>
      )}

      {/* TAKSİT PLANI MODALI */}
      {showInstallmentModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
              <div className="bg-white p-6 rounded-xl w-96 shadow-2xl animate-in zoom-in">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-700"><CalendarClock/> Taksit Planı</h3>
                  <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                      <div className="flex justify-between mb-1"><span>Toplam Tutar:</span> <strong>{cart.reduce((a,b)=>a+(b.price*b.quantity),0)} TL</strong></div>
                      <div className="flex justify-between text-gray-500"><span>Müşteri:</span> <span>{selectedCustomer?.name}</span></div>
                  </div>
                  
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-gray-500">PEŞİNAT (Varsa)</label>
                          <input type="number" className="w-full p-2 border rounded" placeholder="0" value={installmentPlan.downPayment} onChange={e => setInstallmentPlan({...installmentPlan, downPayment: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">TAKSİT SAYISI (Ay)</label>
                          <select className="w-full p-2 border rounded" value={installmentPlan.count} onChange={e => setInstallmentPlan({...installmentPlan, count: e.target.value})}>
                              {[2,3,4,5,6,9,10,12,18,24].map(n => <option key={n} value={n}>{n} Taksit</option>)}
                          </select>
                      </div>
                      
                      {/* Özet Hesap */}
                      <div className="border-t pt-2 text-center">
                          <p className="text-xs text-gray-500">Aylık Ödeme</p>
                          <p className="text-2xl font-bold text-indigo-600">
                              ₺{Math.round((cart.reduce((a,b)=>a+(b.price*b.quantity),0) - Number(installmentPlan.downPayment)) / Number(installmentPlan.count))}
                          </p>
                      </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setShowInstallmentModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded font-bold">İptal</button>
                      <button onClick={() => handlePayment('Taksitli', installmentPlan)} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">Onayla</button>
                  </div>
              </div>
          </div>
      )}

      {/* NORMAL EKRAN (Sol: Ürünler, Sağ: Sepet) */}
      <div className="flex-1 p-6 bg-gray-50 overflow-y-auto print:hidden" onClick={() => setShowCustomerList(false)}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Hızlı Satış</h2>
          
          <div className="flex gap-4">
              <div className="relative z-20" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowCustomerList(!showCustomerList)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all w-64 justify-between ${selectedCustomer ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                      <div className="flex items-center gap-2 overflow-hidden"><User size={20}/><span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Müşteri Seç'}</span></div>
                      {selectedCustomer && <X size={16} onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} />}
                  </button>
                  {showCustomerList && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto p-2">
                          {customers.map(c => <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerList(false); }} className="p-3 hover:bg-purple-50 rounded-lg cursor-pointer flex justify-between items-center text-sm"><span className="font-bold">{c.name}</span><span className={c.balance > 0 ? 'text-red-500' : 'text-green-500'}>₺{c.balance}</span></div>)}
                      </div>
                  )}
              </div>
              <div className="relative w-80">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{searchTerm ? <Search size={20}/> : <Scan size={20}/>}</div>
                <input ref={searchInputRef} type="text" placeholder="Barkod / Ürün Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} className="pl-10 pr-4 py-3 border-2 border-blue-500/30 rounded-xl focus:outline-none w-full shadow-sm text-lg" autoFocus />
              </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm))).map(p => (
                <div key={p.id} onClick={() => addToCart(p)} className={`bg-white p-4 rounded-xl border cursor-pointer hover:border-blue-500 transition-all ${p.stock <= 0 && 'opacity-50 grayscale'}`}>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mb-2">{p.name[0]}</div>
                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                    <p className="text-blue-600 font-bold">₺{p.price}</p>
                </div>
            ))}
         </div>
      </div>

      <div className="w-96 bg-white border-l p-6 flex flex-col print:hidden shadow-xl z-10">
         <div className="flex items-center gap-2 mb-4 text-gray-800"><ShoppingCart className="text-blue-600" size={24}/><h2 className="text-xl font-bold">Sepet ({cart.reduce((a,b)=>a+b.quantity,0)})</h2></div>
         <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {cart.map(i => (
                <div key={i.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-700">{i.name}</div>
                      <div className="text-xs text-gray-500">₺{i.price} x {i.quantity}</div>
                      {(i.serialTracked && (i.selectedSerials||[]).length>0) && (
                        <div className="mt-1 text-[11px] text-indigo-700">Seri: {(i.selectedSerials||[]).join(', ')}</div>
                      )}
                      {(i.lotTracked && (i.lotUsed||[]).length>0) && (
                        <div className="mt-1 text-[11px] text-purple-700">Lot: {(i.lotUsed||[]).map(l=>`${l.code} x${l.qty}`).join(', ')}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(i.id, -1)} className="p-1 hover:bg-gray-200 rounded"><Minus size={14}/></button>
                        <span className="font-bold text-sm">{i.quantity}</span>
                        <button onClick={() => updateQuantity(i.id, 1)} className="p-1 hover:bg-gray-200 rounded"><Plus size={14}/></button>
                        {i.serialTracked && <button onClick={() => { const product = products.find(p => p.id === i.id); const available = (product.serials || []).filter(s => s.status !== 'sold').map(s => s.code); setSerialModal({ open: true, product, available, selected: i.selectedSerials || [] }); }} className="p-1 bg-indigo-100 text-indigo-700 rounded text-xs flex items-center gap-1"><Hash size={12}/> Seri</button>}
                        {i.lotTracked && <button onClick={() => { const product = products.find(p => p.id === i.id); const lots = (product.lots || []).filter(l => Number(l.qty) > 0); setLotModal({ open: true, product, lots, allocations: i.lotUsed || [] }); }} className="p-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center gap-1"><Layers size={12}/> Lot</button>}
                        <button onClick={() => removeFromCart(i.id)} className="text-red-400 ml-1"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
         </div>
         <div className="border-t border-gray-200 pt-4 mt-2">
             <div className="flex justify-between items-end mb-4"><span className="text-gray-500 text-sm">TOPLAM</span><span className="text-3xl font-bold text-blue-600">₺{cart.reduce((a,b)=>a+(b.price*b.quantity),0)}</span></div>
             <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={() => handlePayment('Nakit')} className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 active:scale-95 transition-all">NAKİT</button>
                <button onClick={() => handlePayment('Kart')} className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all">KART</button>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handlePayment('Veresiye')} className={`py-3 rounded-lg font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center justify-center gap-1 ${!selectedCustomer && 'opacity-50 cursor-not-allowed'}`}><User size={18}/> Veresiye</button>
                <button onClick={() => { if(selectedCustomer) setShowInstallmentModal(true); else alert("Müşteri seçin!"); }} className={`py-3 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-1 ${!selectedCustomer && 'opacity-50 cursor-not-allowed'}`}><CalendarClock size={18}/> Taksit</button>
             </div>
         </div>
      </div>
    </div>
    {serialModal.open && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
        <div className="bg-white p-6 rounded-xl w-[520px] shadow-2xl">
          <div className="flex items-center gap-2 mb-3 text-gray-700"><Hash/> <h3 className="font-bold">Seri Seçimi — {serialModal.product?.name}</h3></div>
          <div className="text-xs text-gray-500 mb-2">Adet: {cart.find(i => i.id === serialModal.product?.id)?.quantity}</div>
          <div className="max-h-64 overflow-y-auto grid grid-cols-2 gap-2">
            {serialModal.available.map(code => (
              <button key={code} onClick={() => { const sel = serialModal.selected.includes(code) ? serialModal.selected.filter(c => c !== code) : [...serialModal.selected, code]; setSerialModal({ ...serialModal, selected: sel }); }} className={`px-3 py-2 border rounded text-sm ${serialModal.selected.includes(code) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>{code}</button>
            ))}
            {serialModal.available.length===0 && <div className="text-sm text-gray-400">Uygun seri yok</div>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setSerialModal({ open: false, product: null, available: [], selected: [] })} className="px-4 py-2 text-gray-600">İptal</button>
            <button onClick={() => { const item = cart.find(i => i.id === serialModal.product.id); if (!item) return setSerialModal({ open: false, product: null, available: [], selected: [] }); if (serialModal.selected.length !== item.quantity) return alert('Seçilen seri sayısı ürün adedi ile aynı olmalı'); setCart(cart.map(i => i.id === item.id ? { ...i, selectedSerials: [...serialModal.selected] } : i)); setSerialModal({ open: false, product: null, available: [], selected: [] }); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Uygula</button>
          </div>
        </div>
      </div>
    )}
    {lotModal.open && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
        <div className="bg-white p-6 rounded-xl w-[560px] shadow-2xl">
          <div className="flex items-center gap-2 mb-3 text-gray-700"><Layers/> <h3 className="font-bold">Lot Seçimi — {lotModal.product?.name}</h3></div>
          <div className="text-xs text-gray-500 mb-2">Adet: {cart.find(i => i.id === lotModal.product?.id)?.quantity}</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lotModal.lots.map(l => {
              const existing = (lotModal.allocations || []).find(a => a.code === l.code);
              const val = existing ? Number(existing.qty||0) : 0;
              return (
                <div key={l.code} className="grid grid-cols-4 gap-2 items-center p-2 border rounded">
                  <span className="text-sm">{l.code}</span>
                  <span className="text-sm text-right">{l.qty}</span>
                  <input type="number" min="0" max={l.qty} value={val} onChange={e => {
                    const v = Math.max(0, Math.min(Number(e.target.value||0), Number(l.qty)));
                    const next = (lotModal.allocations || []).filter(a => a.code !== l.code);
                    if (v > 0) next.push({ code: l.code, qty: v });
                    setLotModal({ ...lotModal, allocations: next });
                  }} className="w-24 p-2 border rounded text-sm"/>
                  <span className="text-xs text-gray-400">{l.expiry || '-'}</span>
                </div>
              );
            })}
            {lotModal.lots.length===0 && <div className="text-sm text-gray-400">Uygun lot yok</div>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setLotModal({ open: false, product: null, lots: [], allocations: [] })} className="px-4 py-2 text-gray-600">İptal</button>
            <button onClick={() => {
              const item = cart.find(i => i.id === lotModal.product.id);
              if (!item) return setLotModal({ open: false, product: null, lots: [], allocations: [] });
              const total = (lotModal.allocations || []).reduce((a,b)=>a+Number(b.qty||0),0);
              if (total !== item.quantity) return alert('Seçilen lot miktarı ürün adedi ile aynı olmalı');
              const over = (lotModal.allocations || []).some(a => a.qty > (lotModal.lots.find(l => l.code === a.code)?.qty || 0));
              if (over) return alert('Lot miktarı stoktan fazla olamaz');
              setCart(cart.map(i => i.id === item.id ? { ...i, lotUsed: (lotModal.allocations || []).filter(a => Number(a.qty)>0) } : i));
              setLotModal({ open: false, product: null, lots: [], allocations: [] });
            }} className="px-4 py-2 bg-purple-600 text-white rounded">Uygula</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
export default Sales;
