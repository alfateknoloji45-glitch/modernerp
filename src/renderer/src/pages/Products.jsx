import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Package, AlertTriangle, X, Edit2, Scan, Printer, TrendingUp, Scale, PackageCheck } from 'lucide-react';
import Barcode from 'react-barcode';

const Products = ({ userRole }) => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  // YENİ: scaleCode ve isWeightBased eklendi
  const [formData, setFormData] = useState({ name: '', barcode: '', category: '', purchasePrice: '', price: '', stock: '', isWeightBased: false, scaleCode: '' });
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: '', reason: '' });
  const [countForm, setCountForm] = useState({ currentSystemStock: 0, physicalCount: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setProducts(await window.db.get('products') || []);
    setTransactions(await window.db.get('product_logs') || []);
  };

  const openModal = (product = null) => {
    if (userRole !== 'Admin' && userRole !== 'Depocu') return alert("Bu işlem için yetkiniz yok.");
    if (product) {
        setIsEditing(true);
        setFormData(product);
    } else {
        setIsEditing(false);
        setFormData({ name: '', barcode: '', category: '', purchasePrice: '', price: '', stock: '', isWeightBased: false, scaleCode: '' });
    }
    setShowModal(true);
  };
  
  const handleSave = async () => {
    if (!formData.name || !formData.price) return alert("Ad ve Satış Fiyatı zorunlu!");

    const productData = {
        id: isEditing ? formData.id : Date.now(),
        name: formData.name,
        barcode: formData.barcode || Math.floor(Math.random() * 1000000000000).toString(),
        category: formData.category || 'Genel',
        purchasePrice: userRole === 'Admin' ? (Number(formData.purchasePrice) || 0) : (selectedProduct ? selectedProduct.purchasePrice : 0),
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
        status: Number(formData.stock) < 5 ? 'Kritik' : 'Yeterli',
        // YENİ KAYITLAR
        isWeightBased: formData.isWeightBased, 
        scaleCode: formData.isWeightBased ? formData.scaleCode : ''
    };

    let updatedList;
    if (isEditing) { updatedList = products.map(p => p.id === productData.id ? productData : p); } 
    else { updatedList = [...products, productData]; }

    await window.db.set('products', updatedList);
    setProducts(updatedList);
    setShowModal(false);
  };

  const calculateProfit = (price, cost) => price - (cost || 0);
  const handlePrintBarcode = (product) => {
    setSelectedProduct(product);
    setShowBarcodeModal(true);
  };
  const handleDelete = async (e, id) => {
    if (e) e.stopPropagation();
    if (!confirm('Ürünü silmek istiyor musun?')) return;
    const updated = products.filter(p => p.id !== id);
    await window.db.set('products', updated);
    setProducts(updated);
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Stok & Ürün Yönetimi</h2>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input className="pl-10 pr-4 py-2 border rounded-lg w-full" placeholder="Ürün adı veya barkod ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => openModal(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18}/> Ürün Ekle
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          <div className="mx-auto mb-3 w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Package size={24}/></div>
          <p>Henüz ürün bulunmuyor.</p>
          <button onClick={() => openModal(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Ürün Oluştur</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Ürün</th>
                <th className="px-6 py-4">Barkod</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Satış Fiyatı</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)))
                .map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2"><Package size={16}/> {p.name}</td>
                    <td className="px-6 py-4 text-gray-600">{p.barcode}</td>
                    <td className="px-6 py-4 text-gray-600">{p.category || 'Genel'}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">₺{p.price}</td>
                    <td className="px-6 py-4">{p.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Kritik' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(p)} className="p-2 text-gray-500 hover:text-blue-600"><Edit2 size={16}/></button>
                        <button onClick={(e) => handleDelete(e, p.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16}/></button>
                        <button onClick={() => handlePrintBarcode(p)} className="p-2 text-gray-500 hover:text-gray-800"><Printer size={16}/></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Ürün Ekle/Düzenle (Terazi Alanı Eklendi) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="font-bold text-lg">{isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h3>
            <div className="space-y-3 mt-4">
                {/* Checkbox (AĞIRLIK BAZLI MI?) */}
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                    <input type="checkbox" id="isWeight" checked={formData.isWeightBased} onChange={e => setFormData({...formData, isWeightBased: e.target.checked})} />
                    <label htmlFor="isWeight" className="text-sm font-bold text-gray-700 flex items-center gap-1"><Scale size={16}/> Tartılı Ürün (Kg/Gr)</label>
                </div>

                {/* Barkod (Normal veya Terazi Kodu) */}
                <div className="flex items-center border rounded mt-1 bg-gray-50">
                    <div className="p-2 text-gray-400"><Scan size={18}/></div>
                    <input placeholder={formData.isWeightBased ? 'Terazi Kodu (Örn: 00500)' : 'Barkod (869...)'} className="w-full p-2 bg-transparent outline-none" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
                
                {/* Ekstra Terazi Kodu Alanı */}
                {formData.isWeightBased && (
                    <input placeholder="Terazi Kodu (PLU)" className="w-full p-2 border rounded" value={formData.scaleCode} onChange={e => setFormData({...formData, scaleCode: e.target.value})} />
                )}
                
                <input placeholder="Ürün Adı" className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-blue-600">SATIŞ FİYATI</label><input type="number" className="w-full p-2 border-2 border-blue-100 rounded focus:border-blue-500 font-bold" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                    {userRole === 'Admin' && <div><label className="text-xs font-bold text-gray-500">ALIŞ FİYATI</label><input type="number" className="w-full p-2 border rounded bg-gray-50" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} /></div>}
                </div>
                
                {/* STOK ADEDİ (Tartılı ürünlerde adet girmek mantıksızdır, ama sayım için bırakalım) */}
                {!formData.isWeightBased && (
                    <div><label className="text-xs font-bold text-gray-500">STOK ADEDİ</label><input type="number" className="w-full p-2 border rounded" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} /></div>
                )}
            </div>
            <button onClick={handleSave} className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-bold shadow-lg">
                {isEditing ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {showBarcodeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Barkod Yazdır</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="text-gray-800 font-bold">{selectedProduct.name}</div>
              <Barcode value={String(selectedProduct.barcode || '')} width={2} height={60} displayValue />
              <div className="flex gap-2 mt-4">
                <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white rounded">Yazdır</button>
                <button onClick={() => setShowBarcodeModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded">Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Products;
