import React, { useEffect, useState } from 'react';
import { Package, Hash, Layers, Plus, Trash2 } from 'lucide-react';

const SerialLot = () => {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [trackType, setTrackType] = useState('none');
  const [serialInput, setSerialInput] = useState('');
  const [lotForm, setLotForm] = useState({ code: '', qty: '', expiry: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const list = await window.db.get('products') || [];
    setProducts(list);
  };

  const current = products.find(p => p.id === Number(selectedId));

  const saveProduct = async (updated) => {
    const next = products.map(p => p.id === updated.id ? updated : p);
    setProducts(next);
    await window.db.set('products', next);
  };

  const applyTrackType = async () => {
    if (!current) return;
    const updated = { ...current, serialTracked: trackType === 'serial', lotTracked: trackType === 'lot', serials: current.serials || [], lots: current.lots || [] };
    await saveProduct(updated);
  };

  const addSerial = async () => {
    if (!current || !serialInput.trim()) return;
    const serials = (current.serials || []);
    if (serials.some(s => s.code === serialInput.trim())) return alert('Seri zaten mevcut');
    const updated = { ...current, serials: [{ code: serialInput.trim(), status: 'available' }, ...serials], stock: Number(current.stock || 0) + 1 };
    setSerialInput('');
    await saveProduct(updated);
  };

  const deleteSerial = async (code) => {
    if (!current) return;
    const serials = (current.serials || []).filter(s => s.code !== code);
    const updated = { ...current, serials, stock: Math.max(0, Number(current.stock || 0) - 1) };
    await saveProduct(updated);
  };

  const addLot = async () => {
    if (!current || !lotForm.code || !lotForm.qty) return;
    const lots = current.lots || [];
    const updatedLots = [{ code: lotForm.code, qty: Number(lotForm.qty), expiry: lotForm.expiry || null }, ...lots];
    const updated = { ...current, lots: updatedLots, stock: Number(current.stock || 0) + Number(lotForm.qty) };
    setLotForm({ code: '', qty: '', expiry: '' });
    await saveProduct(updated);
  };

  const deleteLot = async (code) => {
    if (!current) return;
    const lots = (current.lots || []);
    const toDelete = lots.find(l => l.code === code);
    const updatedLots = lots.filter(l => l.code !== code);
    const updated = { ...current, lots: updatedLots, stock: Math.max(0, Number(current.stock || 0) - Number(toDelete?.qty || 0)) };
    await saveProduct(updated);
  };

  useEffect(() => {
    if (!current) return;
    if (current.serialTracked) setTrackType('serial');
    else if (current.lotTracked) setTrackType('lot');
    else setTrackType('none');
  }, [selectedId]);

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-indigo-700 mb-6"><Package/> <h2 className="text-2xl font-bold">Seri / Lot Yönetimi</h2></div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500">Ürün</label>
          <select className="w-full p-2 border rounded mt-1" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
            <option value="">Seçiniz</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">Takip Türü</label>
          <select className="w-full p-2 border rounded mt-1" value={trackType} onChange={e=>setTrackType(e.target.value)}>
            <option value="none">Yok</option>
            <option value="serial">Seri</option>
            <option value="lot">Lot</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={applyTrackType} className="px-4 py-2 bg-indigo-600 text-white rounded-lg w-full">Uygula</button>
        </div>
      </div>

      {current && trackType === 'serial' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700"><Hash/> <h3 className="font-bold">Seriler</h3></div>
            <div className="space-y-2">
              {(current.serials || []).map(s => (
                <div key={s.code} className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">{s.code}</span>
                  <span className={`text-xs px-2 py-1 rounded ${s.status==='available'?'bg-green-50 text-green-700 border border-green-200':'bg-gray-50 text-gray-600 border border-gray-200'}`}>{s.status}</span>
                  <button onClick={() => deleteSerial(s.code)} className="text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
              {(current.serials || []).length===0 && <div className="text-sm text-gray-400">Seri yok</div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700"><Plus/> <h3 className="font-bold">Yeni Seri</h3></div>
            <input className="w-full p-2 border rounded mb-2" placeholder="Seri Kodu" value={serialInput} onChange={e=>setSerialInput(e.target.value)} />
            <button onClick={addSerial} className="px-4 py-2 bg-indigo-600 text-white rounded-lg w-full">Ekle</button>
          </div>
        </div>
      )}

      {current && trackType === 'lot' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700"><Layers/> <h3 className="font-bold">Lotlar</h3></div>
            <div className="space-y-2">
              {(current.lots || []).map(l => (
                <div key={l.code} className="grid grid-cols-4 gap-2 p-2 border rounded items-center">
                  <span className="text-sm">{l.code}</span>
                  <span className="text-sm text-right">{l.qty}</span>
                  <span className="text-sm">{l.expiry || '-'}</span>
                  <button onClick={() => deleteLot(l.code)} className="text-red-500 justify-self-end"><Trash2 size={16}/></button>
                </div>
              ))}
              {(current.lots || []).length===0 && <div className="text-sm text-gray-400">Lot yok</div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700"><Plus/> <h3 className="font-bold">Yeni Lot</h3></div>
            <input className="w-full p-2 border rounded mb-2" placeholder="Lot Kodu" value={lotForm.code} onChange={e=>setLotForm({...lotForm, code: e.target.value})} />
            <input type="number" className="w-full p-2 border rounded mb-2" placeholder="Miktar" value={lotForm.qty} onChange={e=>setLotForm({...lotForm, qty: e.target.value})} />
            <input type="date" className="w-full p-2 border rounded mb-2" placeholder="SKT" value={lotForm.expiry} onChange={e=>setLotForm({...lotForm, expiry: e.target.value})} />
            <button onClick={addLot} className="px-4 py-2 bg-indigo-600 text-white rounded-lg w-full">Ekle</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SerialLot;
