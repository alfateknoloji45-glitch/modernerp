import React, { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';

const DynamicPricing = () => {
  const [products, setProducts] = useState([]);
  const [marginPct, setMarginPct] = useState(20);
  const [rows, setRows] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => { compute(); }, [products, marginPct]);

  const load = async () => {
    setProducts(await window.db.get('products') || []);
  };

  const compute = () => {
    const m = marginPct / 100;
    setRows(products.map(p => {
      const purchase = Number(p.purchasePrice || 0);
      const current = Number(p.price || 0);
      const suggested = Math.max(current, Math.round(purchase * (1 + m)));
      return { id: p.id, name: p.name, purchase, current, suggested };
    }));
  };

  const applyPrices = async () => {
    setUpdating(true);
    try {
      const updated = products.map(p => {
        const row = rows.find(r => r.id === p.id);
        return { ...p, price: row?.suggested ?? p.price };
      });
      await window.db.set('products', updated);
      setProducts(updated);
    } finally { setUpdating(false); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-indigo-700 mb-6"><Tag/> <h2 className="text-2xl font-bold">Dinamik Fiyatlama</h2></div>
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-gray-600">Hedef Marj (%):
          <input type="number" value={marginPct} onChange={e=>setMarginPct(Number(e.target.value)||0)} className="ml-2 border rounded px-2 py-1 w-20" />
        </label>
        <button onClick={applyPrices} disabled={updating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">{updating?'Uygulanıyor...':'Önerileri Uygula'}</button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Ürün</th>
              <th className="text-right p-3">Alış Fiyatı</th>
              <th className="text-right p-3">Mevcut Fiyat</th>
              <th className="text-right p-3">Önerilen Fiyat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-right">₺{r.purchase.toLocaleString()}</td>
                <td className="p-3 text-right">₺{r.current.toLocaleString()}</td>
                <td className="p-3 text-right font-semibold">₺{r.suggested.toLocaleString()}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Ürün bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicPricing;
