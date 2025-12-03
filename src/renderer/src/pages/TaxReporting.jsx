import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

const TaxReporting = () => {
  const [sales, setSales] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rate, setRate] = useState(18);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

  useEffect(() => { load(); }, []);
  useEffect(() => { compute(); }, [sales, year, rate]);

  const load = async () => {
    setSales(await window.db.get('sales') || []);
  };

  const compute = () => {
    const taxRate = Number(rate) / 100;
    const filtered = sales.filter(s => (new Date(s.date)).getFullYear() === Number(year) && s.status !== 'İade');
    const map = new Map();
    filtered.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const gross = (s.items || []).reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const net = gross / (1 + taxRate);
      const tax = gross - net;
      const prev = map.get(key) || { month: key, subtotal: 0, tax: 0, total: 0 };
      map.set(key, { month: key, subtotal: prev.subtotal + net, tax: prev.tax + tax, total: prev.total + gross });
    });
    const arr = Array.from(map.values()).sort((a,b)=> a.month.localeCompare(b.month));
    setRows(arr);
    const sum = arr.reduce((acc, r) => ({ subtotal: acc.subtotal + r.subtotal, tax: acc.tax + r.tax, total: acc.total + r.total }), { subtotal: 0, tax: 0, total: 0 });
    setTotals(sum);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-indigo-700"><FileText/> <h2 className="text-2xl font-bold">Vergi Raporlama</h2></div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">Yıl:
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value)||new Date().getFullYear())} className="ml-2 border rounded px-2 py-1 w-24" />
          </label>
          <label className="text-sm text-gray-600">KDV (%):
            <input type="number" value={rate} onChange={e=>setRate(Number(e.target.value)||18)} className="ml-2 border rounded px-2 py-1 w-20" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Ay</th>
                <th className="text-right p-3">Ara Toplam (KDV Hariç)</th>
                <th className="text-right p-3">Hesaplanan KDV</th>
                <th className="text-right p-3">Genel Toplam</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.month} className="border-t">
                  <td className="p-3">{r.month}</td>
                  <td className="p-3 text-right">₺{r.subtotal.toFixed(2)}</td>
                  <td className="p-3 text-right">₺{r.tax.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold">₺{r.total.toFixed(2)}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Kayıt bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-bold text-gray-700 mb-3">Toplamlar</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Ara Toplam</span><span className="font-semibold">₺{totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Hesaplanan KDV</span><span className="font-semibold">₺{totals.tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Genel Toplam</span><span className="font-semibold">₺{totals.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReporting;
