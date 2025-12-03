import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ScrollText, Calendar, CheckCircle, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';

const Cheques = () => {
  // TAB MODU: 'in' (Alınan / Portföy), 'out' (Verilen / Borçlarımız)
  const [activeTab, setActiveTab] = useState('in'); 
  
  const [cheques, setCheques] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]); // Tedarikçiler eklendi
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false); // İşlem Modalı (Tahsilat veya Ödeme)

  // Yeni Evrak Formu
  const [newCheque, setNewCheque] = useState({ 
    type: 'Çek', 
    portfolioNo: '', 
    dueDate: '', 
    amount: '', 
    bankName: '', 
    contactId: '', // Müşteri veya Tedarikçi ID
    contactName: '' 
  });

  const [selectedCheque, setSelectedCheque] = useState(null);
  const [targetAccountId, setTargetAccountId] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const storedCheques = await window.db.get('cheques') || [];
    const storedCustomers = await window.db.get('customers') || [];
    const storedSuppliers = await window.db.get('suppliers') || [];
    const storedAccounts = await window.db.get('accounts') || [];
    
    setCheques(storedCheques.reverse());
    setCustomers(storedCustomers);
    setSuppliers(storedSuppliers);
    setAccounts(storedAccounts);
  };

  // --- EVRAK KAYDETME ---
  const handleSave = async () => {
    if (!newCheque.amount || !newCheque.dueDate || !newCheque.contactId) return alert("Eksik bilgi!");

    const chequeToAdd = {
        id: `DOC-${Date.now()}`,
        direction: activeTab, // 'in' (Alınan) veya 'out' (Verilen)
        status: activeTab === 'in' ? 'Portföyde' : 'Ödenecek', // Başlangıç durumu
        ...newCheque,
        amount: Number(newCheque.amount)
    };

    // 1. Evrağı Listeye Ekle
    const updatedCheques = [chequeToAdd, ...cheques];
    await window.db.set('cheques', updatedCheques);

    // 2. Bakiyeden Düş (Müşteri veya Tedarikçi)
    if (activeTab === 'in') {
        // Müşteriden aldık -> Müşteri Borcu Azalır
        const updatedCustomers = customers.map(c => {
            if (c.id === Number(newCheque.contactId)) return { ...c, balance: c.balance - Number(newCheque.amount) };
            return c;
        });
        await window.db.set('customers', updatedCustomers);
        setCustomers(updatedCustomers);
        
        // Müşteri Hareketine İşle
        const trans = await window.db.get('transactions') || [];
        await window.db.set('transactions', [...trans, {
            id: `TR-${Date.now()}`, customerId: Number(newCheque.contactId), date: new Date().toLocaleDateString('tr-TR'),
            type: 'payment', amount: Number(newCheque.amount), description: `Evrak Alındı (${newCheque.type})`
        }]);

    } else {
        // Tedarikçiye verdik -> Tedarikçi Borcumuz Azalır (Ödedik sayılır)
        const updatedSuppliers = suppliers.map(s => {
            if (s.id === Number(newCheque.contactId)) return { ...s, balance: s.balance - Number(newCheque.amount) };
            return s;
        });
        await window.db.set('suppliers', updatedSuppliers);
        setSuppliers(updatedSuppliers);

        // Tedarikçi Hareketine İşle
        const trans = await window.db.get('supplier_transactions') || [];
        await window.db.set('supplier_transactions', [...trans, {
            id: `TR-${Date.now()}`, supplierId: Number(newCheque.contactId), date: new Date().toLocaleDateString('tr-TR'),
            type: 'payment', amount: Number(newCheque.amount), description: `Evrak Verildi (${newCheque.type})`
        }]);
    }

    setCheques(updatedCheques);
    setShowModal(false);
    setNewCheque({ type: 'Çek', portfolioNo: '', dueDate: '', amount: '', bankName: '', contactId: '', contactName: '' });
  };

  // --- İŞLEM YAP (TAHSİL ET veya ÖDE) ---
  const handleProcess = async () => {
    if (!targetAccountId) return alert("Hesap seçin!");

    const amount = selectedCheque.amount;
    
    // 1. Hesap Bakiyesini Güncelle
    const updatedAccounts = accounts.map(acc => {
        if (acc.id === targetAccountId) {
            // Alınan çekse para girer (+), Verilen çekse para çıkar (-)
            const change = selectedCheque.direction === 'in' ? amount : -amount;
            return { ...acc, balance: acc.balance + change };
        }
        return acc;
    });
    await window.db.set('accounts', updatedAccounts);

    // 2. Çek Durumunu Güncelle
    const updatedCheques = cheques.map(c => {
        if (c.id === selectedCheque.id) {
            return { ...c, status: selectedCheque.direction === 'in' ? 'Tahsil Edildi' : 'Ödendi (Kapandı)' };
        }
        return c;
    });
    await window.db.set('cheques', updatedCheques);

    // 3. Hesap Hareketine İşle
    const accTrans = await window.db.get('account_transactions') || [];
    const newAccTrans = {
        id: Date.now(),
        date: new Date().toLocaleDateString('tr-TR'),
        description: selectedCheque.direction === 'in' ? `Çek Tahsilatı (${selectedCheque.contactName})` : `Çek Ödemesi (${selectedCheque.contactName})`,
        fromName: selectedCheque.direction === 'in' ? 'Portföy' : accounts.find(a => a.id === targetAccountId).name,
        toName: selectedCheque.direction === 'in' ? accounts.find(a => a.id === targetAccountId).name : 'Tedarikçi',
        amount: amount
    };
    await window.db.set('account_transactions', [newAccTrans, ...accTrans]);

    setCheques(updatedCheques);
    setAccounts(updatedAccounts);
    setShowProcessModal(false);
    alert("İşlem tamamlandı!");
  };

  const deleteCheque = async (id) => {
      if(confirm("Evrak silinecek! Cari bakiyeler değişmez. Emin misin?")) {
          const updated = cheques.filter(c => c.id !== id);
          setCheques(updated);
          await window.db.set('cheques', updated);
      }
  }

  // Listeyi Sekmeye Göre Filtrele
  const filteredCheques = cheques.filter(c => 
      c.direction === activeTab && 
      c.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Çek & Senet Yönetimi</h2>
            <p className="text-gray-500 text-sm">Finansal evrak takibi</p>
        </div>
        <div className="flex gap-3">
            <input className="pl-4 pr-4 py-2 border rounded-lg w-64" placeholder="Evrak Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black shadow-md">
              <Plus size={18}/> <span>Yeni Evrak</span>
            </button>
        </div>
      </div>

      {/* SEKMELER (TABS) */}
      <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('in')}
            className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'in' ? 'border-green-500 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <ArrowDownLeft size={20}/> ALINAN (Müşteri)
          </button>
          <button 
            onClick={() => setActiveTab('out')}
            className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'out' ? 'border-red-500 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <ArrowUpRight size={20}/> VERİLEN (Tedarikçi)
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-xs text-gray-500">
            <tr>
              <th className="px-6 py-4">TÜR</th>
              <th className="px-6 py-4">VADE</th>
              <th className="px-6 py-4">{activeTab === 'in' ? 'MÜŞTERİ' : 'TEDARİKÇİ'} / BANKA</th>
              <th className="px-6 py-4">TUTAR</th>
              <th className="px-6 py-4">DURUM</th>
              <th className="px-6 py-4 text-right">İŞLEM</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCheques.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4 font-bold text-gray-700 flex items-center gap-2">
                    <ScrollText size={16} className={activeTab === 'in' ? 'text-green-500' : 'text-red-500'}/> {item.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700"><Calendar size={14} className="inline mr-1 text-gray-400"/> {item.dueDate}</td>
                <td className="px-6 py-4">
                    <p className="font-bold text-gray-800 text-sm">{item.contactName}</p>
                    <p className="text-xs text-gray-500">{item.bankName}</p>
                </td>
                <td className={`px-6 py-4 font-bold ${activeTab === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{item.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg text-xs border font-bold bg-gray-100 text-gray-600">{item.status}</span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* İşlem Butonu: Tahsil Et (in) veya Öde (out) */}
                  {(item.status === 'Portföyde' || item.status === 'Ödenecek') && (
                      <button 
                        onClick={() => { setSelectedCheque(item); setShowProcessModal(true); }} 
                        className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'in' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                          {activeTab === 'in' ? 'TAHSİL ET' : 'ÖDEME YAP'}
                      </button>
                  )}
                  <button onClick={() => deleteCheque(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
            {filteredCheques.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-gray-400">Kayıt yok.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* --- YENİ EVRAK MODALI --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                <h3 className="font-bold text-lg mb-4 text-gray-800">
                    {activeTab === 'in' ? 'Alınan Evrak (Giriş)' : 'Verilen Evrak (Çıkış)'}
                </h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <select className="p-2 border rounded" value={newCheque.type} onChange={e => setNewCheque({...newCheque, type: e.target.value})}>
                            <option>Çek</option><option>Senet</option>
                        </select>
                        <input type="date" className="p-2 border rounded" value={newCheque.dueDate} onChange={e => setNewCheque({...newCheque, dueDate: e.target.value})}/>
                    </div>
                    
                    {/* Sekmeye göre Müşteri veya Tedarikçi Listesi */}
                    <select className="w-full p-2 border rounded" value={newCheque.contactId} onChange={e => {
                        const list = activeTab === 'in' ? customers : suppliers;
                        const contact = list.find(c => c.id === Number(e.target.value));
                        setNewCheque({...newCheque, contactId: e.target.value, contactName: contact?.name || ''});
                    }}>
                        <option value="">{activeTab === 'in' ? 'Müşteri Seç...' : 'Tedarikçi Seç...'}</option>
                        {(activeTab === 'in' ? customers : suppliers).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <input type="number" placeholder="Tutar (TL)" className="w-full p-2 border rounded font-bold" value={newCheque.amount} onChange={e => setNewCheque({...newCheque, amount: e.target.value})}/>
                    <input placeholder="Banka / Açıklama" className="w-full p-2 border rounded" value={newCheque.bankName} onChange={e => setNewCheque({...newCheque, bankName: e.target.value})}/>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">İptal</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black">Kaydet</button>
                </div>
            </div>
        </div>
      )}

      {/* --- İŞLEM MODALI (TAHSİLAT / ÖDEME) --- */}
      {showProcessModal && selectedCheque && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                  <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${selectedCheque.direction === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                      <CheckCircle size={24}/> {selectedCheque.direction === 'in' ? 'Tahsilat Onayı' : 'Ödeme Onayı'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                      <strong>{selectedCheque.amount} TL</strong> tutarındaki evrak işlem görecek.
                      {selectedCheque.direction === 'in' ? ' (Para Kasaya Girer)' : ' (Para Kasadan Çıkar)'}
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                      <label className="text-xs font-bold text-gray-500 block mb-1">İŞLEM HESABI</label>
                      <select className="w-full p-2 border rounded bg-white" value={targetAccountId} onChange={e => setTargetAccountId(e.target.value)}>
                          <option value="">Hesap Seçin...</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>)}
                      </select>
                  </div>

                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowProcessModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">İptal</button>
                      <button onClick={handleProcess} className={`px-4 py-2 text-white rounded font-bold ${selectedCheque.direction === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                          Onayla
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Cheques;