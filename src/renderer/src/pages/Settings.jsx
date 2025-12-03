import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Database, ShieldAlert, Save, Download, Upload, RefreshCw } from 'lucide-react';

const Settings = () => {
  const fileInputRef = useRef(null);
  
  // Firma Bilgileri State'i
  const [companyInfo, setCompanyInfo] = useState({ name: 'ALFA TEKNOLOJİ', address: 'İstanbul / Türkiye', footer: 'Teşekkürler', logo: '' });
  const [eDocSettings, setEDocSettings] = useState({
    einvoice: { seriesPrefix: 'EINV', profileId: 'EINVOICE', customizationId: 'TR1.2' },
    earchive: { seriesPrefix: 'EARC', profileId: 'EARCHIVE', customizationId: 'TR1.2-ARCHIVE' },
    edispatch: { seriesPrefix: 'EDESP', profileId: 'EDESPATCH', customizationId: 'TR1.2-DESPATCH' }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storedInfo = await window.db.get('company_info');
    if (storedInfo) setCompanyInfo(storedInfo);
    const storedEDoc = await window.db.get('e_doc_settings');
    if (storedEDoc) setEDocSettings(storedEDoc);
  };

  // --- AYARLARI KAYDET ---
  const handleSaveSettings = async () => {
    await window.db.set('company_info', companyInfo);
    alert("Firma bilgileri güncellendi! Fişlerde artık bu bilgiler görünecek.");
  };

  const handleSaveEDocSettings = async () => {
    await window.db.set('e_doc_settings', eDocSettings);
    alert("E-Belge ayarları güncellendi!");
  };

  const handleResetDatabase = async () => {
    if (confirm("DİKKAT! Tüm veriler (Satış, Stok, Cari, Finans, Servis, Depo) silinecek. Emin misin?")) {
        await window.db.delete('sales');
        await window.db.delete('products');
        await window.db.delete('product_logs');
        await window.db.delete('customers');
        await window.db.delete('transactions');
        await window.db.delete('installments');
        await window.db.delete('cheques');
        await window.db.delete('expenses');
        await window.db.delete('accounts');
        await window.db.delete('account_transactions');
        await window.db.delete('suppliers');
        await window.db.delete('supplier_transactions');
        await window.db.delete('warehouses');
        await window.db.delete('branch_stocks');
        await window.db.delete('transfers');
        await window.db.delete('service_tickets');
        await window.db.delete('recipes');
        await window.db.delete('proposals');
        await window.db.delete('app_users');
        await window.db.delete('audit_logs');
        await window.db.delete('active_modules');
        await window.db.delete('current_count_records');
        alert("Sıfırlama başarılı. Program yeniden başlatılıyor.");
        window.location.reload();
    }
  };

  const handleBackup = async () => {
    const allData = {
        sales: await window.db.get('sales'),
        products: await window.db.get('products'),
        customers: await window.db.get('customers'),
        expenses: await window.db.get('expenses'),
        company: await window.db.get('company_info'),
        edoc: await window.db.get('e_doc_settings'),
        date: new Date().toLocaleString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Yedek_${new Date().toLocaleDateString('tr-TR')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm(`Yedek yüklensin mi? Tarih: ${data.date}`)) {
                if(data.sales) await window.db.set('sales', data.sales);
                if(data.products) await window.db.set('products', data.products);
                if(data.customers) await window.db.set('customers', data.customers);
                if(data.expenses) await window.db.set('expenses', data.expenses);
                if(data.company) await window.db.set('company_info', data.company);
                if(data.edoc) await window.db.set('e_doc_settings', data.edoc);
                alert("Yedek yüklendi!");
                window.location.reload();
            }
        } catch (error) { alert("Hatalı dosya!"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Ayarlar</h2>

        <div className="max-w-4xl space-y-6">
            
            {/* FİRMA BİLGİLERİ (AKTİF) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Save size={20}/></div>
                    <div>
                        <h3 className="font-bold text-gray-800">Fiş & Firma Ayarları</h3>
                        <p className="text-xs text-gray-400">Fiş üzerinde görünecek başlık ve adres</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500">İŞLETME ADI (Fiş Başlığı)</label>
                        <input className="w-full p-2 border rounded mt-1" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">ADRES / TELEFON</label>
                        <input className="w-full p-2 border rounded mt-1" value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})}/>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500">FİŞ ALT NOTU</label>
                        <input className="w-full p-2 border rounded mt-1" value={companyInfo.footer} onChange={e => setCompanyInfo({...companyInfo, footer: e.target.value})}/>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500">LOGO (PNG/JPG)
                        </label>
                        <div className="flex items-center gap-4 mt-1">
                          <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files && e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setCompanyInfo({...companyInfo, logo: String(ev.target.result||'')});
                            reader.readAsDataURL(file);
                          }}/>
                          {companyInfo.logo && (
                            <div className="flex items-center gap-2">
                              <img src={companyInfo.logo} alt="Logo" className="h-12 object-contain border rounded"/>
                              <button onClick={() => setCompanyInfo({...companyInfo, logo: ''})} className="px-2 py-1 text-xs border rounded">Temizle</button>
                            </div>
                          )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <button onClick={handleSaveSettings} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95">
                        Ayarları Kaydet
                    </button>
                </div>
            </div>

            {/* E-BELGE AYARLARI */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Database size={20}/></div>
                    <div>
                        <h3 className="font-bold text-gray-800">E-Belge Ayarları</h3>
                        <p className="text-xs text-gray-400">Seri ön eki ve profil/customization değerleri</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="font-bold text-sm text-gray-700 mb-2">E-Fatura</div>
                        <label className="text-xs font-bold text-gray-500">Seri Ön Ek</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.einvoice.seriesPrefix} onChange={e => setEDocSettings({...eDocSettings, einvoice: {...eDocSettings.einvoice, seriesPrefix: e.target.value}})}/>
                        <label className="text-xs font-bold text-gray-500 mt-2">ProfileID</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.einvoice.profileId} onChange={e => setEDocSettings({...eDocSettings, einvoice: {...eDocSettings.einvoice, profileId: e.target.value}})}/>
                        <label className="text-xs font-bold text-gray-500 mt-2">CustomizationID</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.einvoice.customizationId} onChange={e => setEDocSettings({...eDocSettings, einvoice: {...eDocSettings.einvoice, customizationId: e.target.value}})}/>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="font-bold text-sm text-gray-700 mb-2">E-Arşiv</div>
                        <label className="text-xs font-bold text-gray-500">Seri Ön Ek</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.earchive.seriesPrefix} onChange={e => setEDocSettings({...eDocSettings, earchive: {...eDocSettings.earchive, seriesPrefix: e.target.value}})}/>
                        <label className="text-xs font-bold text-gray-500 mt-2">ProfileID</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.earchive.profileId} onChange={e => setEDocSettings({...eDocSettings, earchive: {...eDocSettings.earchive, profileId: e.target.value}})}/>
                        <label className="text-xs font-bold text-gray-500 mt-2">CustomizationID</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.earchive.customizationId} onChange={e => setEDocSettings({...eDocSettings, earchive: {...eDocSettings.earchive, customizationId: e.target.value}})}/>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="font-bold text-sm text-gray-700 mb-2">E-İrsaliye</div>
                        <label className="text-xs font-bold text-gray-500">Seri Ön Ek</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.edispatch.seriesPrefix} onChange={e => setEDocSettings({...eDocSettings, edispatch: {...eDocSettings.edispatch, seriesPrefix: e.target.value}})}/>
                        <label className="text-xs font-bold text-gray-500 mt-2">ProfileID</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.edispatch.profileId} onChange={e => setEDocSettings({...eDocSettings, edispatch: {...eDocSettings.edispatch, profileId: e.target.value}})}/>
                        <label className="text-xs font-bold text-gray-500 mt-2">CustomizationID</label>
                        <input className="w-full p-2 border rounded mt-1" value={eDocSettings.edispatch.customizationId} onChange={e => setEDocSettings({...eDocSettings, edispatch: {...eDocSettings.edispatch, customizationId: e.target.value}})}/>
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <button onClick={handleSaveEDocSettings} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-bold shadow-md transition-all active:scale-95">
                        E-Belge Ayarlarını Kaydet
                    </button>
                </div>
            </div>

            {/* YEDEKLEME */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 grid grid-cols-2 gap-4">
                <div className="text-center">
                    <h4 className="font-bold text-blue-800 mb-2">Veri Yedekle</h4>
                    <button onClick={handleBackup} className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 w-full flex items-center justify-center gap-2">
                        <Download size={18}/> Yedek İndir
                    </button>
                </div>
                <div className="text-center">
                    <h4 className="font-bold text-green-800 mb-2">Yedek Yükle</h4>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                    <button onClick={() => fileInputRef.current.click()} className="bg-white border border-green-200 text-green-600 px-4 py-2 rounded hover:bg-green-100 w-full flex items-center justify-center gap-2">
                        <Upload size={18}/> Dosya Seç
                    </button>
                </div>
            </div>

            {/* SIFIRLAMA */}
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-red-700 flex items-center gap-2"><ShieldAlert size={20}/> Fabrika Ayarları</h4>
                    <p className="text-xs text-red-400">Tüm verileri siler.</p>
                </div>
                <button onClick={handleResetDatabase} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold flex items-center gap-2">
                    <Trash2 size={18}/> Sıfırla
                </button>
            </div>

        </div>
    </div>
  );
};

export default Settings;
