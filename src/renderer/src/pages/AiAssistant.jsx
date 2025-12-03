import React, { useState, useEffect } from 'react';
import { PieChart, Search } from 'lucide-react';

const AiAssistant = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState({ topProducts: [], lowStock: [] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const s = await window.db.get('sales') || [];
    const p = await window.db.get('products') || [];
    setSales(s);
    setProducts(p);
    const totals = {};
    s.forEach(sale => sale.items.forEach(it => { totals[it.id] = (totals[it.id] || 0) + it.quantity; }));
    const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]).slice(0,3).map(([id, qty]) => ({ id: Number(id), qty, name: p.find(px => px.id === Number(id))?.name || 'Ürün' }));
    const lows = p.filter(px => (px.stock || 0) < 5).slice(0,5);
    setSuggestions({ topProducts: sorted, lowStock: lows });
  };

  const addMessage = (role, text) => setMessages(prev => [...prev, { role, text, time: new Date().toLocaleTimeString('tr-TR') }]);

  const handleAsk = () => {
    if (!input.trim()) return;
    const q = input.trim().toLowerCase();
    addMessage('user', input);

    // Basit kurallı yanıtlar
    let answer = 'Bu konuda yardımcı olabilmem için daha fazla detay verin.';
    if (q.includes('bugün') && q.includes('satış')) {
      const today = new Date().toLocaleDateString('tr-TR');
      const total = sales.filter(s => s.date === today).reduce((acc, s) => acc + (s.total || 0), 0);
      answer = `Bugünkü toplam satış: ₺${total.toLocaleString()}.`;
    } else if (q.includes('kritik') && q.includes('stok')) {
      const names = suggestions.lowStock.map(p => `${p.name} (${p.stock})`).join(', ');
      answer = names ? `Kritik stok ürünleri: ${names}` : 'Kritik stok ürünü bulunmuyor.';
    } else if (q.includes('en çok') && (q.includes('satan') || q.includes('satılan'))) {
      const names = suggestions.topProducts.map(t => `${t.name} (${t.qty})`).join(', ');
      answer = names ? `En çok satanlar: ${names}` : 'Veri bulunamadı.';
    }

    addMessage('assistant', answer);
    setInput('');
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-indigo-700"><PieChart/> <h2 className="text-2xl font-bold">Yapay Zeka Asistan</h2></div>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAsk()} className="pl-10 pr-4 py-2 border rounded-lg w-full" placeholder="Soru sor (örn: Bugün satış?)" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <div className="space-y-3 h-[420px] overflow-y-auto">
            {messages.map((m, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${m.role==='user' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                <div className="text-xs text-gray-400">{m.role==='user'?'Kullanıcı':'Asistan'} • {m.time}</div>
                <div className="font-medium">{m.text}</div>
              </div>
            ))}
            {messages.length===0 && <div className="text-gray-400 text-sm">Sorularınızı üstteki alana yazın.</div>}
          </div>
          <div className="mt-4 text-right">
            <button onClick={handleAsk} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Gönder</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-700 mb-3">Öneriler</h3>
          <div className="space-y-2">
            <div>
              <div className="text-xs font-bold text-gray-500">En Çok Satanlar</div>
              {suggestions.topProducts.map(t => <div key={t.id} className="text-sm">• {t.name} — {t.qty} adet</div>)}
              {suggestions.topProducts.length===0 && <div className="text-xs text-gray-400">Veri yok</div>}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 mt-2">Kritik Stok</div>
              {suggestions.lowStock.map(p => <div key={p.id} className="text-sm">• {p.name} — {p.stock} adet</div>)}
              {suggestions.lowStock.length===0 && <div className="text-xs text-gray-400">Veri yok</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
