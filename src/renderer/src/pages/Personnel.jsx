import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Users, Briefcase, Wallet, DollarSign } from 'lucide-react';

const Personnel = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({ name: '', position: '', salary: '', phone: '' });
  const [payment, setPayment] = useState({ employeeId: '', type: 'Maaş', amount: '', description: '' });
  const [selectedEmp, setSelectedEmp] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const stored = await window.db.get('employees') || [];
    setEmployees(stored);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.salary) return alert("İsim ve Maaş zorunludur!");
    const empToAdd = { id: Date.now(), ...newEmployee, balance: 0 };
    const updated = [...employees, empToAdd];
    await window.db.set('employees', updated);
    setEmployees(updated);
    setShowAddModal(false);
    setNewEmployee({ name: '', position: '', salary: '', phone: '' });
  };

  const handleDelete = async (id) => {
    if(confirm("Personeli silmek istediğine emin misin?")) {
        const updated = employees.filter(e => e.id !== id);
        setEmployees(updated);
        await window.db.set('employees', updated);
    }
  };

  const handlePayment = async () => {
    if (!payment.amount) return alert("Tutar giriniz!");
    const amount = Number(payment.amount);
    
    if (payment.type === 'Maaş') {
        const expenses = await window.db.get('expenses') || [];
        const newExpense = {
            id: Date.now(),
            title: `Maaş Ödemesi: ${selectedEmp.name}`,
            amount: amount,
            category: 'Personel',
            date: new Date().toLocaleDateString('tr-TR')
        };
        await window.db.set('expenses', [newExpense, ...expenses]);
    }

    const accounts = await window.db.get('accounts') || [];
    const updatedAccounts = accounts.map(acc => {
        if (acc.type === 'Kasa') return { ...acc, balance: acc.balance - amount };
        return acc;
    });
    await window.db.set('accounts', updatedAccounts);

    const updatedEmployees = employees.map(emp => {
        if (emp.id === selectedEmp.id && payment.type === 'Avans') {
            return { ...emp, balance: (emp.balance || 0) + amount };
        }
        return emp;
    });
    await window.db.set('employees', updatedEmployees);
    setEmployees(updatedEmployees);

    alert(`${payment.type} ödemesi yapıldı.`);
    setShowPayModal(false);
    setPayment({ employeeId: '', type: 'Maaş', amount: '', description: '' });
  };

  const openPayModal = (emp) => {
    setSelectedEmp(emp);
    setPayment({ ...payment, amount: emp.salary, employeeId: emp.id });
    setShowPayModal(true);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div><h2 className="text-2xl font-bold text-gray-800">Personel Yönetimi</h2><p className="text-gray-500 text-sm">İK ve Maaş İşlemleri</p></div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
          <Plus size={18}/> <span>Personel Ekle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
            <div key={emp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative">
                <button onClick={() => handleDelete(emp.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">{emp.name.charAt(0)}</div>
                    <div><h3 className="font-bold text-gray-800">{emp.name}</h3><p className="text-sm text-gray-500">{emp.position}</p></div>
                </div>
                <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Maaş:</span><span className="font-bold">₺{Number(emp.salary).toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Avans:</span><span className="text-red-500 font-bold">₺{emp.balance.toLocaleString()}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => { setSelectedEmp(emp); setPayment({...payment, type: 'Avans', amount: ''}); setShowPayModal(true); }} className="bg-orange-50 text-orange-600 py-2 rounded-lg text-sm font-bold">Avans</button>
                    <button onClick={() => openPayModal(emp)} className="bg-green-50 text-green-600 py-2 rounded-lg text-sm font-bold">Maaş Öde</button>
                </div>
            </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
                <h3 className="font-bold text-lg mb-4">Yeni Personel</h3>
                <div className="space-y-3">
                    <input placeholder="Ad Soyad" className="w-full p-2 border rounded" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}/>
                    <input placeholder="Pozisyon" className="w-full p-2 border rounded" value={newEmployee.position} onChange={e => setNewEmployee({...newEmployee, position: e.target.value})}/>
                    <input placeholder="Telefon" className="w-full p-2 border rounded" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}/>
                    <input type="number" placeholder="Maaş (TL)" className="w-full p-2 border rounded" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: e.target.value})}/>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500">İptal</button>
                    <button onClick={handleAddEmployee} className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button>
                </div>
            </div>
        </div>
      )}

      {showPayModal && selectedEmp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
                <h3 className="font-bold text-lg mb-2">{selectedEmp.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{payment.type} Ödemesi</p>
                <div className="space-y-3">
                    <input type="number" className="w-full p-2 border rounded font-bold text-lg" value={payment.amount} onChange={e => setPayment({...payment, amount: e.target.value})}/>
                    <textarea placeholder="Açıklama" className="w-full p-2 border rounded" value={payment.description} onChange={e => setPayment({...payment, description: e.target.value})}></textarea>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-gray-500">İptal</button>
                    <button onClick={handlePayment} className="px-4 py-2 bg-green-600 text-white rounded font-bold">Öde ve Kaydet</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default Personnel;