import React, { useEffect, useState } from 'react';
import { Percent, Tag, Calendar } from 'lucide-react';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'percentage', discount: '', productId: '', minQty: '1', startDate: '', endDate: '', active: true });
  const [products, setProducts] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setCampaigns(await window.db.get('campaigns') || []);
    setProducts(await window.db.get('products') || []);
  };

  const saveCampaign = async () => {
    if (!form.name || !form.discount) return alert('Ad ve indirim değeri zorunlu');
    const item = { id: `CMP-${Date.now()}`, ...form, discount: Number(form.discount), minQty: Number(form.minQty) };
    const updated = [item, ...campaigns];
    await window.db.set('campaigns', updated);
    setCampaigns(updated);
    setShowModal(false);
    setForm({ name: '', type: 'percentage', discount: '', productId: '', minQty: '1', startDate: '', endDate: '', active: true });
  };

  const toggleActive = async (id) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, active: !c.active } : c);
    await window.db.set('campaigns', updated);
    setCampaigns(updated);
  };

  const removeCampaign = async (id) => {
    if (!confirm('Kampanya silinsin mi?')) return;
    const updated = campaigns.filter(c => c.id !== id);
    await window.db.set('campaigns', updated);
    setCampaigns(updated);
  };

  return (
    <div className="p-8 h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-indigo-700"><Percent/> <h2 className="text-2xl font-bold">Kampanya & Promosyon</h2></div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Yeni Kampanya</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Ad</th>
              <th className="p-3 text-left">Tür</th>
              <th className="p-3 text-right">İndirim</th>
              <th className="p-3 text-left">Ürün</th>
              <th className="p-3 text-right">Min Adet</th>
              <th className="p-3 text-left">Tarih</th>
              <th className="p-3 text-center">Durum</th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.type === 'percentage' ? 'Yüzde' : 'Tutar'}</td>
                <td className="p-3 text-right">{c.type === 'percentage' ? `%${c.discount}` : `₺${c.discount}`}</td>
                <td className="p-3">{c.productId ? (products.find(p => p.id === Number(c.productId))?.name || '-') : 'Genel'}</td>
                <td className="p-3 text-right">{c.minQty || 1}</td>
                <td className="p-3">{c.startDate || '-'} {c.endDate ? `→ ${c.endDate}` : ''}</td>
                <td className="p-3 text-center"><span className={`px-2 py-1 rounded text-xs ${c.active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>{c.active ? 'Aktif' : 'Pasif'}</span></td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleActive(c.id)} className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded mr-2">Durum</button>
                  <button onClick={() => removeCampaign(c.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded">Sil</button>
                </td>
              </tr>
            ))}
            {campaigns.length===0 && <tr><td colSpan={8} className="p-6 text-center text-gray-400">Kampanya bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[520px] shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-gray-700"><Tag/> <h3 className="font-bold">Yeni Kampanya</h3></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Ad</label>
                <input className="w-full p-2 border rounded" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tür</label>
                <select className="w-full p-2 border rounded" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                  <option value="percentage">Yüzde</option>
                  <option value="amount">Tutar</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">İndirim</label>
                <input type="number" className="w-full p-2 border rounded" value={form.discount} onChange={e=>setForm({...form, discount: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Minimum Adet</label>
                <input type="number" className="w-full p-2 border rounded" value={form.minQty} onChange={e=>setForm({...form, minQty: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Ürün (boş bırakılırsa geneldir)</label>
                <select className="w-full p-2 border rounded" value={form.productId} onChange={e=>setForm({...form, productId: e.target.value})}>
                  <option value="">Genel</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Başlangıç</label>
                <input type="date" className="w-full p-2 border rounded" value={form.startDate} onChange={e=>setForm({...form, startDate: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Bitiş</label>
                <input type="date" className="w-full p-2 border rounded" value={form.endDate} onChange={e=>setForm({...form, endDate: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500">Durum</label>
                <select className="w-full p-2 border rounded" value={form.active ? '1' : '0'} onChange={e=>setForm({...form, active: e.target.value === '1'})}>
                  <option value="1">Aktif</option>
                  <option value="0">Pasif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">İptal</button>
              <button onClick={saveCampaign} className="px-4 py-2 bg-indigo-600 text-white rounded">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
