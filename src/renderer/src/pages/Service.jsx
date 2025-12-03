import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Wrench, CheckCircle, Clock, Smartphone, User, X } from 'lucide-react';

const Service = () => {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // Yeni Servis Kaydı Formu
  const [newTicket, setNewTicket] = useState({ 
    customerName: '', 
    phone: '', 
    device: '', 
    issue: '', 
    price: '',
    status: 'Bekliyor' // Bekliyor, İşlemde, Hazır, Teslim Edildi
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const storedTickets = await window.db.get('service_tickets') || [];
    setTickets(storedTickets.reverse());
  };

  // --- YENİ KAYIT ---
  const handleSave = async () => {
    if (!newTicket.customerName || !newTicket.device || !newTicket.issue) return alert("Bilgileri doldurun!");
    
    const ticketToAdd = {
        id: `SRV-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR'),
        ...newTicket,
        price: Number(newTicket.price) || 0
    };

    const updated = [ticketToAdd, ...tickets];
    await window.db.set('service_tickets', updated);
    setTickets(updated);
    setShowModal(false);
    setNewTicket({ customerName: '', phone: '', device: '', issue: '', price: '', status: 'Bekliyor' });
  };

  // --- DURUM GÜNCELLEME ---
  const updateStatus = async (id, newStatus) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    await window.db.set('service_tickets', updated);
  };

  // --- SİLME ---
  const handleDelete = async (id) => {
    if(confirm("Servis kaydını silmek istiyor musun?")) {
        const updated = tickets.filter(t => t.id !== id);
        setTickets(updated);
        await window.db.set('service_tickets', updated);
    }
  };

  // Renk Kodları
  const getStatusColor = (status) => {
      switch(status) {
          case 'Bekliyor': return 'bg-gray-100 text-gray-600';
          case 'İşlemde': return 'bg-blue-100 text-blue-600';
          case 'Hazır': return 'bg-green-100 text-green-600';
          case 'Teslim Edildi': return 'bg-purple-100 text-purple-600 line-through opacity-70';
          default: return 'bg-gray-100';
      }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Teknik Servis Takip</h2>
            <p className="text-gray-500 text-sm">Arızalı cihaz kabul ve durum yönetimi</p>
        </div>
        <div className="flex gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input className="pl-10 pr-4 py-2 border rounded-lg w-64" placeholder="Fiş No / Müşteri Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-md">
              <Plus size={18}/> <span>Servis Kaydı Aç</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.filter(t => t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm)).map(ticket => (
            <div key={ticket.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all relative group">
                {/* Silme Butonu */}
                <button onClick={() => handleDelete(ticket.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">{ticket.id}</span>
                    <span className="text-xs text-gray-400">{ticket.date}</span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                        <Smartphone size={24}/>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{ticket.device}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><User size={12}/> {ticket.customerName}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4 border border-gray-100">
                    <span className="font-bold text-xs text-gray-400 block mb-1">ARIZA:</span>
                    {ticket.issue}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 font-bold">DURUM</p>
                        <select 
                            className={`text-xs font-bold p-1 rounded border-none outline-none cursor-pointer ${getStatusColor(ticket.status)}`}
                            value={ticket.status}
                            onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        >
                            <option>Bekliyor</option>
                            <option>İşlemde</option>
                            <option>Hazır</option>
                            <option>Teslim Edildi</option>
                        </select>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold">ÜCRET</p>
                        <p className="text-lg font-bold text-orange-600">₺{ticket.price}</p>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Yeni Servis Kaydı</h3>
                    <button onClick={() => setShowModal(false)}><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input autoFocus placeholder="Müşteri Adı" className="w-full p-2 border rounded" value={newTicket.customerName} onChange={e => setNewTicket({...newTicket, customerName: e.target.value})}/>
                    <input placeholder="Telefon" className="w-full p-2 border rounded" value={newTicket.phone} onChange={e => setNewTicket({...newTicket, phone: e.target.value})}/>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 space-y-2">
                        <input placeholder="Cihaz / Marka Model" className="w-full p-2 border rounded" value={newTicket.device} onChange={e => setNewTicket({...newTicket, device: e.target.value})}/>
                        <textarea placeholder="Arıza Şikayeti" className="w-full p-2 border rounded" rows="2" value={newTicket.issue} onChange={e => setNewTicket({...newTicket, issue: e.target.value})}></textarea>
                    </div>
                    <input type="number" placeholder="Tahmini Ücret (TL)" className="w-full p-2 border rounded font-bold" value={newTicket.price} onChange={e => setNewTicket({...newTicket, price: e.target.value})}/>
                </div>
                <button onClick={handleSave} className="w-full mt-6 bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 font-bold shadow-lg">Kaydı Aç</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Service;