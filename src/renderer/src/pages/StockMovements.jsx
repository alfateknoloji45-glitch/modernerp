import React, { useState, useEffect } from 'react';
import { Search, Move, TrendingUp, TrendingDown, Package, FileText } from 'lucide-react';

const StockMovements = ({ userRole }) => {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Farklı yerlerde tutulan logları ve ana ürün listesini çek
    const productLogs = await window.db.get('product_logs') || []; // Stok Düzeltme Logları
    const productsList = await window.db.get('products') || [];
    
    // Basitlik için sadece Düzeltme Loglarını listeliyoruz.
    // İleride Satış/Alış/İade logları da buraya merge edilebilir.
    setLogs(productLogs.reverse());
    setProducts(productsList);
  };

  const getProductName = (productId) => {
      return products.find(p => p.id === productId)?.name || 'Bilinmiyor';
  };

  const filteredLogs = logs.filter(log => 
      getProductName(log.productId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Stok Hareketleri</h2>
            <p className="text-gray-500 text-sm">Tüm envanter giriş/çıkış kayıtları</p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input className="pl-10 pr-4 py-2 border rounded-lg w-64" placeholder="Ürün veya Sebep Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">TARİH</th>
              <th className="px-6 py-4">ÜRÜN</th>
              <th className="px-6 py-4">TÜR</th>
              <th className="px-6 py-4">SEBEP</th>
              <th className="px-6 py-4">MİKTAR</th>
              <th className="px-6 py-4">İŞLEMİ YAPAN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Hareket kaydı bulunamadı.</td></tr>
            ) : (
                filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{log.date} {log.time}</td>
                    <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2"><Package size={16}/> {getProductName(log.productId)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.type.includes('Giriş') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.reason}</td>
                    <td className={`px-6 py-4 font-bold ${log.type.includes('Giriş') ? 'text-green-600' : 'text-red-600'}`}>
                        {log.type.includes('Giriş') ? '+' : '-'}{log.amount}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{log.user || 'Admin'}</td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovements;