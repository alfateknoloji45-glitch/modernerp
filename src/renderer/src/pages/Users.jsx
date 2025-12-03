import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Shield, User } from 'lucide-react';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Kasiyer', name: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    // Varsayılan Admin yoksa oluştur
    let storedUsers = await window.db.get('app_users');
    if (!storedUsers || storedUsers.length === 0) {
        storedUsers = [{ id: 1, name: 'Patron', username: 'admin', password: '123', role: 'Admin' }];
        await window.db.set('app_users', storedUsers);
    }
    setUsers(storedUsers);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return alert("Bilgileri doldurun!");
    
    // Kullanıcı adı kontrolü
    if (users.find(u => u.username === newUser.username)) return alert("Bu kullanıcı adı zaten var!");

    const userToAdd = { id: Date.now(), ...newUser };
    const updatedList = [...users, userToAdd];
    
    await window.db.set('app_users', updatedList);
    setUsers(updatedList);
    setShowModal(false);
    setNewUser({ username: '', password: '', role: 'Kasiyer', name: '' });
  };

  const handleDelete = async (id) => {
    if (users.length <= 1) return alert("Son kullanıcı silinemez!");
    if(confirm("Kullanıcıyı silmek istiyor musun?")) {
        const updated = users.filter(u => u.id !== id);
        setUsers(updated);
        await window.db.set('app_users', updated);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
            <p className="text-gray-500 text-sm">Sisteme giriş yapacak personelleri yönetin.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
          <Plus size={18}/> <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map(user => (
            <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
                {user.role !== 'Admin' && (
                    <button onClick={() => handleDelete(user.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                )}
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl ${user.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                        {user.role === 'Admin' ? <Shield size={24}/> : <User size={24}/>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{user.name}</h3>
                        <p className="text-sm text-gray-500">@{user.username} • <span className="font-bold">{user.role}</span></p>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                <h3 className="font-bold text-lg mb-4">Yeni Kullanıcı</h3>
                <div className="space-y-3">
                    <input autoFocus placeholder="Ad Soyad" className="w-full p-2 border rounded" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}/>
                    <input placeholder="Kullanıcı Adı (Giriş için)" className="w-full p-2 border rounded" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}/>
                    <input type="text" placeholder="Şifre" className="w-full p-2 border rounded" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}/>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">YETKİ ROLÜ</label>
                        <select className="w-full p-2 border rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="Kasiyer">Kasiyer (Sadece Satış)</option>
                            <option value="Depocu">Depocu (Sadece Stok)</option>
                            <option value="Admin">Admin (Tam Yetki)</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">İptal</button>
                    <button onClick={handleAddUser} className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;