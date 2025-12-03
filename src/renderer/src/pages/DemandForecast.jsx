import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';

const DemandForecast = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [horizon, setHorizon] = useState(7);
  const [windowSize, setWindowSize] = useState(14);
  const [rows, setRows] = useState([]);

  useEffect(() => { load(); }, []);
  useEffect(() => { compute(); }, [sales, products, horizon, windowSize]);

  const load = async () => {
    setSales(await window.db.get('sales') || []);
    setProducts(await window.db.get('products') || []);
  };

  const compute = () => {
    if (!sales.length || !products.length) { setRows([]); return; }
    const days = {};
    sales.forEach(s => {
      const d = s.date || new Date(s.createdAt).toLocaleDateString('tr-TR');
      if (!days[d]) days[d] = {};
      s.items.forEach(it => {
        days[d][it.id] = (days[d][it.id] || 0) + (it.quantity || 1);
      });
    });
    const lastDates = Object.keys(days).sort((a,b)=> new Date(a)-new Date(b)).slice(-windowSize);
    const totals = {};
    lastDates.forEach(d => { Object.entries(days[d]).forEach(([pid,qty]) => { totals[pid] = (totals[pid]||0)+qty; }); });
    const avgPerDay = Object.fromEntries(Object.entries(totals).map(([pid, t]) => [pid, t / Math.max(lastDates.length,1)]));
    const data = products.map(p => {
      const avg = avgPerDay[p.id] || 0;
      const forecast = Math.round(avg * horizon);
      const deficit = Math.max(0, forecast - (p.stock || 0));
      return { id: p.id, name: p.name, stock: p.stock || 0, avgPerDay: Number(avg.toFixed(2)), forecast, recommendedOrder: deficit };
    }).sort((a,b)=> b.forecast - a.forecast);
    setRows(data);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-indigo-700 mb-6"><ClipboardList/> <h2 className="text-2xl font-bold">Talep Tahmini</h2></div>
      <div className="flex gap-4 mb-4">
        <label className="text-sm text-gray-600">Ufuk (gün):
          <input type="number" value={horizon} onChange={e=>setHorizon(Number(e.target.value)||7)} className="ml-2 border rounded px-2 py-1 w-20" />
        </label>
        <label className="text-sm text-gray-600">Hareketli Ortalama Penceresi (gün):
          <input type="number" value={windowSize} onChange={e=>setWindowSize(Number(e.target.value)||14)} className="ml-2 border rounded px-2 py-1 w-28" />
        </label>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Ürün</th>
              <th className="text-right p-3">Stok</th>
              <th className="text-right p-3">Günlük Ortalama</th>
              <th className="text-right p-3">7G Tahmin</th>
              <th className="text-right p-3">Önerilen Sipariş</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-right">{r.stock}</td>
                <td className="p-3 text-right">{r.avgPerDay}</td>
                <td className="p-3 text-right">{r.forecast}</td>
                <td className="p-3 text-right font-semibold">{r.recommendedOrder}</td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Veri bulunamadı</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DemandForecast;
