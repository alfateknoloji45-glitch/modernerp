import React, { useState, useEffect } from 'react';
import { Search, PackageCheck, AlertCircle, RefreshCcw, Save, TrendingUp, Plus } from 'lucide-react';

const StockCount = ({ userRole }) => {
  const [products, setProducts] = useState([]);
  const [isCounting, setIsCounting] = useState(false);
  const [countRecords, setCountRecords] = useState([]); // Sayım anındaki sistem stoğunu tutar
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadProducts(); }, [isCounting]);

  const loadProducts = async () => {
    // Ürünleri çek
    const storedProducts = await window.db.get('products') || [];
    setProducts(storedProducts);
    
    // Eğer sayım aktifse, kayıtları da yükle
    const records = await window.db.get('current_count_records');
    if (records) {
        setCountRecords(records);
        // Eğer kayıt varsa ve ürün sayısı uyuşuyorsa sayımı aktif say
        if (records.length > 0 && records.length === storedProducts.length) {
            setIsCounting(true);
        }
    }
  };

  // --- İŞLEM FONKSİYONLARI ---

  // 1. Sayımı Başlat
  const handleStartCount = async () => {
    if(!confirm("Resmi sayıma başlamak istediğinize emin misiniz? Bu işlem mevcut stokları sayım anındaki miktarlarına kilitler.")) return;
    
    // Mevcut stokları kaydet (Sistem Sayımı)
    const initialRecords = products.map(p => ({
        id: p.id,
        name: p.name,
        systemStock: p.stock,
        physicalCount: p.stock // Başlangıçta fiziki sayımı sisteme eşitliyoruz
    }));

    await window.db.set('current_count_records', initialRecords);
    setCountRecords(initialRecords);
    setIsCounting(true);
    alert("Sayım başarıyla başlatıldı! Lütfen fiziksel sayımı girin.");
  };

  // 2. Sayımı Bitir ve Düzelt (Finalize)
  const handleFinalizeCount = async () => {
      if(!confirm("Sayımdaki farklılıklar stoğa işlenecek. Onaylıyor musunuz?")) return;

      let totalVariance = 0;
      let varianceLogs = [];
      
      // Ana ürün stoğunu güncelle
      const updatedProducts = products.map(p => {
          const record = countRecords.find(r => r.id === p.id);
          if (record && record.physicalCount !== record.systemStock) {
              const diff = record.physicalCount - record.systemStock;
              totalVariance += diff;
              
              // Log kaydı
              varianceLogs.push({
                  id: Date.now() + p.id,
                  productId: p.id,
                  date: new Date().toLocaleDateString('tr-TR'),
                  type: diff > 0 ? 'Sayım Fazlası' : 'Sayım Eksiği (Zayi)',
                  amount: Math.abs(diff),
                  reason: 'Resmi Envanter Sayımı',
                  user: userRole
              });
              
              // Yeni stok miktarını ayarla
              return { ...p, stock: record.physicalCount, status: record.physicalCount < 5 ? 'Kritik' : 'Yeterli' };
          }
          return p;
      });

      // Veritabanına yaz
      await window.db.set('products', updatedProducts);
      await window.db.set('product_logs', [...(await window.db.get('product_logs') || []), ...varianceLogs]);
      await window.db.delete('current_count_records'); // Sayımı sıfırla

      alert(`Sayım başarıyla tamamlandı. Toplam fark: ${totalVariance} Adet.`);
      
      setProducts(updatedProducts);
      setIsCounting(false);
  };
  
  // Arayüzdeki Sayım Girişini Güncelle
  const handlePhysicalCountChange = (productId, count) => {
      setCountRecords(countRecords.map(r => r.id === productId ? { ...r, physicalCount: Number(count) } : r));
  };

  // Stok Durumu Filtresi
  const filteredCountRecords = countRecords.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PackageCheck className="text-blue-600"/> Stok Sayım Modülü
        </h2>
        
        {isCounting ? (
            <button onClick={handleFinalizeCount} className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all font-bold">
                <Save size={18}/> SAYIMI BİTİR & DÜZELT
            </button>
        ) : (
            <button onClick={handleStartCount} className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold">
                <Plus size={18}/> YENİ SAYIM BAŞLAT
            </button>
        )}
      </div>

      {/* SAYIM AKTİFSE */}
      {isCounting && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Fiziksel Sayım Girişi</h3>
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input className="pl-10 pr-4 py-2 border rounded-lg w-64" placeholder="Ürün Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                  </div>
              </div>

              <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                      <tr>
                          <th className="px-6 py-3">ÜRÜN ADI</th>
                          <th className="px-6 py-3 text-right">SİSTEM STOĞU</th>
                          <th className="px-6 py-3 text-center w-40">FİZİKSEL SAYIM</th>
                          <th className="px-6 py-3 text-right">FARK</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y">
                      {filteredCountRecords.map(r => {
                          const variance = r.physicalCount - r.systemStock;
                          return (
                              <tr key={r.id} className={`${variance !== 0 ? 'bg-yellow-50/50' : ''}`}>
                                  <td className="px-6 py-3 font-bold text-gray-800">{r.name}</td>
                                  <td className="px-6 py-3 text-right text-gray-600">{r.systemStock}</td>
                                  <td className="px-6 py-3 text-center">
                                      <input 
                                          type="number" 
                                          className="w-full p-2 border rounded-lg text-lg text-center font-bold outline-none focus:border-blue-500" 
                                          value={r.physicalCount} 
                                          onChange={e => handlePhysicalCountChange(r.id, e.target.value)}
                                      />
                                  </td>
                                  <td className={`px-6 py-3 text-right font-bold ${variance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {variance}
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      )}
      
      {/* SAYIM AKTİF DEĞİLSE BİLGİ VER */}
      {!isCounting && (
          <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
              <RefreshCcw size={48} className="mx-auto text-gray-300 mb-4"/>
              <p className="font-bold text-lg mb-2">Resmi Sayım Başlatılmadı</p>
              <p className="text-sm">Sayım başlatmak için yukarıdaki butona basarak envanteri sayım anındaki miktarına kilitleyin.</p>
          </div>
      )}
    </div>
  );
};

export default StockCount;
