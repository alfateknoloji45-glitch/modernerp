import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, TrendingDown, Calendar, FileText } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form Verileri
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Genel', date: '' });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const storedExpenses = await window.db.get('expenses');
    if (storedExpenses) {
      setExpenses(storedExpenses);
    }
  };

  const handleSave = async () => {
    if (!newExpense.title || !newExpense.amount) return alert("Açıklama ve Tutar giriniz!");

    const expenseToAdd = {
        id: Date.now(),
        title: newExpense.title,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date || new Date().toLocaleDateString('tr-TR')
    };

    const updatedList = [expenseToAdd, ...expenses];
    setExpenses(updatedList);
    await window.db.set('expenses', updatedList);
    
    setShowModal(false);
    setNewExpense({ title: '', amount: '', category: 'Genel', date: '' });
  };

  const handleDelete = async (id) => {
    if(confirm("Bu gideri silmek istediğine emin misin?")) {
        const updatedList = expenses.filter(e => e.id !== id);
        setExpenses(updatedList);
        await window.db.set('expenses', updatedList);
    }
  };

  // Toplam Gider Hesabı
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Gider Yönetimi</h2>
            <p className="text-gray-500 text-sm">İşletme harcamalarını takip et.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                <div className="p-1 bg-red-100 rounded text-red-600"><TrendingDown size={16}/></div>
                <div>
                    <p className="text-xs text-red-400 font-bold uppercase">TOPLAM GİDER</p>
                    <p className="text-lg font-bold text-red-700">₺{totalExpense.toLocaleString('tr-TR')}</p>
                </div>
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
            >
              <Plus size={18}/> <span>Gider Ekle</span>
            </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">AÇIKLAMA</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">KATEGORİ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">TARİH</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">TUTAR</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">İŞLEM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-400">Henüz gider kaydı yok.</td></tr>
            ) : (
                expenses.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><FileText size={16}/></div>
                        {item.title}
                    </td>
                    <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm flex items-center gap-2">
                        <Calendar size={14}/> {item.date}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600">-₺{item.amount.toLocaleString('tr-TR')}</td>
                    <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                    </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Yeni Gider Ekle</h3>
            <div className="space-y-3">
              <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">AÇIKLAMA</label>
                  <input autoFocus placeholder="Örn: Kira, Elektrik..." className="w-full p-2 border rounded" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">KATEGORİ</label>
                    <select className="w-full p-2 border rounded bg-white" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                        <option>Genel</option>
                        <option>Kira</option>
                        <option>Fatura</option>
                        <option>Personel</option>
                        <option>Tedarik</option>
                        <option>Yemek</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">TUTAR (TL)</label>
                    <input type="number" placeholder="0.00" className="w-full p-2 border rounded" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                  </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">İptal</button>
              <button onClick={handleSave} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;