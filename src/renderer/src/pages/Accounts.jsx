import React, { useState, useEffect } from 'react';
import { Wallet, Building2, Plus, ArrowRightLeft, TrendingUp, TrendingDown, History } from 'lucide-react';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]); // Hesap hareketleri
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Formlar
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Kasa', balance: 0, currency: 'TL' });
  const [transfer, setTransfer] = useState({ fromId: '', toId: '', amount: '', description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Varsayılan hesaplar yoksa oluştur
    let storedAccounts = await window.db.get('accounts');
    if (!storedAccounts || storedAccounts.length === 0) {
        storedAccounts = [
            { id: 'acc_cash', name: 'Merkez Kasa', type: 'Kasa', balance: 0, icon: 'cash' },
            { id: 'acc_pos', name: 'POS / Banka', type: 'Banka', balance: 0, icon: 'bank' }
        ];
        await window.db.set('accounts', storedAccounts);
    }
    setAccounts(storedAccounts);

    // Hareketleri çek (Para transferleri vb.)
    const storedTrans = await window.db.get('account_transactions') || [];
    setTransactions(storedTrans.reverse()); // En yeniden eskiye
  };

  // 1. Yeni Hesap Ekleme
  const handleAddAccount = async () => {
    if (!newAccount.name) return alert("Hesap adı giriniz!");
    const acc = { ...newAccount, id: `acc_${Date.now()}`, icon: newAccount.type === 'Kasa' ? 'cash' : 'bank' };
    const updated = [...accounts, acc];
    setAccounts(updated);
    await window.db.set('accounts', updated);
    setShowAccountModal(false);
  };

  // 2. Para Transferi (Virman)
  const handleTransfer = async () => {
    if (!transfer.fromId || !transfer.toId || !transfer.amount) return alert("Bilgileri eksiksiz giriniz!");
    if (transfer.fromId === transfer.toId) return alert("Aynı hesaba transfer yapılamaz!");

    const amount = Number(transfer.amount);
    const fromAcc = accounts.find(a => a.id === transfer.fromId);
    
    if (fromAcc.balance < amount) return alert("Kaynak hesapta yeterli bakiye yok!");

    // Hesapları Güncelle
    const updatedAccounts = accounts.map(acc => {
        if (acc.id === transfer.fromId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === transfer.toId) return { ...acc, balance: acc.balance + amount };
        return acc;
    });

    // Hareketi Kaydet
    const newTrans = {
        id: Date.now(),
        date: new Date().toLocaleDateString('tr-TR'),
        description: transfer.description || 'Virman / Transfer',
        fromName: accounts.find(a => a.id === transfer.fromId).name,
        toName: accounts.find(a => a.id === transfer.toId).name,
        amount: amount
    };

    setAccounts(updatedAccounts);
    setTransactions([newTrans, ...transactions]);
    
    await window.db.set('accounts', updatedAccounts);
    await window.db.set('account_transactions', [newTrans, ...transactions]);

    setShowTransferModal(false);
    setTransfer({ fromId: '', toId: '', amount: '', description: '' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Kasa & Banka</h2>
            <p className="text-gray-500 text-sm">Nakit akışı ve hesap yönetimi</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowTransferModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md">
                <ArrowRightLeft size={18}/> <span>Para Transferi (Virman)</span>
            </button>
            <button onClick={() => setShowAccountModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
                <Plus size={18}/> <span>Hesap Ekle</span>
            </button>
        </div>
      </div>

      {/* HESAP KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {accounts.map(acc => (
            <div key={acc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${acc.type === 'Kasa' ? 'text-green-600' : 'text-blue-600'}`}>
                    {acc.type === 'Kasa' ? <Wallet size={100}/> : <Building2 size={100}/>}
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg ${acc.type === 'Kasa' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {acc.type === 'Kasa' ? <Wallet size={24}/> : <Building2 size={24}/>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{acc.name}</h3>
                        <p className="text-xs text-gray-500">{acc.type}</p>
                    </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">₺{acc.balance.toLocaleString('tr-TR')}</p>
            </div>
        ))}
      </div>

      {/* SON HAREKETLER TABLOSU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2 font-bold text-gray-700">
            <History size={18}/> Son Transferler
        </div>
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <tr>
                    <th className="px-6 py-3">TARİH</th>
                    <th className="px-6 py-3">AÇIKLAMA</th>
                    <th className="px-6 py-3">KAYNAK HESAP</th>
                    <th className="px-6 py-3">HEDEF HESAP</th>
                    <th className="px-6 py-3 text-right">TUTAR</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600">{t.date}</td>
                        <td className="px-6 py-3 font-medium">{t.description}</td>
                        <td className="px-6 py-3 text-red-500 flex items-center gap-1"><TrendingDown size={14}/> {t.fromName}</td>
                        <td className="px-6 py-3 text-green-500 flex items-center gap-1"><TrendingUp size={14}/> {t.toName}</td>
                        <td className="px-6 py-3 text-right font-bold">₺{t.amount.toLocaleString()}</td>
                    </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-400">Henüz işlem yok.</td></tr>}
            </tbody>
        </table>
      </div>

      {/* --- MODALLAR --- */}
      
      {/* 1. HESAP EKLEME MODALI */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                <h3 className="font-bold text-lg mb-4">Yeni Hesap Ekle</h3>
                <div className="space-y-3">
                    <input placeholder="Hesap Adı (Örn: İş Bankası)" className="w-full p-2 border rounded" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})}/>
                    <select className="w-full p-2 border rounded" value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})}>
                        <option>Kasa</option>
                        <option>Banka</option>
                    </select>
                    <input type="number" placeholder="Açılış Bakiyesi" className="w-full p-2 border rounded" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})}/>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowAccountModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">İptal</button>
                    <button onClick={handleAddAccount} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ekle</button>
                </div>
            </div>
        </div>
      )}

      {/* 2. TRANSFER (VİRMAN) MODALI */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                <h3 className="font-bold text-lg mb-4 text-purple-800">Para Transferi</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 font-bold">ÇIKIŞ YAPILACAK HESAP</label>
                        <select className="w-full p-2 border rounded mt-1" value={transfer.fromId} onChange={e => setTransfer({...transfer, fromId: e.target.value})}>
                            <option value="">Seçiniz</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (₺{a.balance})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold">GİRİŞ YAPILACAK HESAP</label>
                        <select className="w-full p-2 border rounded mt-1" value={transfer.toId} onChange={e => setTransfer({...transfer, toId: e.target.value})}>
                            <option value="">Seçiniz</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <input type="number" placeholder="Tutar (TL)" className="w-full p-2 border rounded font-bold" value={transfer.amount} onChange={e => setTransfer({...transfer, amount: e.target.value})}/>
                    <input placeholder="Açıklama" className="w-full p-2 border rounded" value={transfer.description} onChange={e => setTransfer({...transfer, description: e.target.value})}/>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">İptal</button>
                    <button onClick={handleTransfer} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold">Transfer Yap</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;