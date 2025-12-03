import React, { useState } from 'react';
import { Search, Calendar, FileSpreadsheet, TrendingUp, TrendingDown, PiggyBank, Printer, FileText, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  
  // Z-Raporu State'i
  const [showZReport, setShowZReport] = useState(false);
  const [zData, setZData] = useState(null);

  // --- Z-RAPORU (GÜN SONU) HAZIRLA ---
  const handleZReport = async () => {
    const today = new Date().toLocaleDateString('tr-TR');
    
    const sales = await window.db.get('sales') || [];
    const expenses = await window.db.get('expenses') || [];

    // Sadece BUGÜNÜN verileri
    const todaysSales = sales.filter(s => s.date === today);
    const todaysExpenses = expenses.filter(e => e.date === today);

    // Ürün Bazlı Toplamları Hesapla (Z-Raporu İçin)
    const productStats = {};
    todaysSales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productStats[item.name]) {
                productStats[item.name] = { count: 0, total: 0 };
            }
            productStats[item.name].count += item.quantity;
            productStats[item.name].total += item.total;
        });
    });
    // Objeyi Diziye Çevir
    const soldProductsList = Object.keys(productStats).map(key => ({
        name: key,
        count: productStats[key].count,
        total: productStats[key].total
    }));

    // Finansal Hesaplamalar
    const totalCash = todaysSales.filter(s => s.method === 'Nakit').reduce((acc, s) => acc + s.total, 0);
    const totalCard = todaysSales.filter(s => s.method === 'Kart').reduce((acc, s) => acc + s.total, 0);
    const totalVeresiye = todaysSales.filter(s => s.method === 'Veresiye').reduce((acc, s) => acc + s.total, 0);
    const totalRevenue = todaysSales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenseAmount = todaysExpenses.reduce((acc, e) => acc + e.amount, 0);
    const cashInDrawer = totalCash - totalExpenseAmount;

    setZData({
        date: today,
        time: new Date().toLocaleTimeString('tr-TR'),
        totalSales: todaysSales.length,
        totalRevenue,
        totalCash,
        totalCard,
        totalVeresiye,
        totalExpenseAmount,
        cashInDrawer,
        soldProducts: soldProductsList // Ürün Listesi Eklendi
    });
    
    setShowZReport(true);
  };

  const printZReport = () => {
      const printWindow = window.open('', '', 'width=400,height=800');
      
      // Ürün Listesi HTML'i
      const productsHtml = zData.soldProducts.map(p => 
        `<div class="row"><span>${p.name} (x${p.count})</span> <span>${p.total} TL</span></div>`
      ).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Z-Raporu</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; color: #000; }
              .header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .section { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
              .title { font-weight: bold; font-size: 12px; text-align: left; margin: 5px 0; text-decoration: underline; }
              .bold { font-weight: bold; font-size: 14px; }
              .big { font-size: 16px; font-weight: bold; }
              .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
                <h2>Z-RAPORU (GÜN SONU)</h2>
                <p>Tarih: ${zData.date} - ${zData.time}</p>
                <p>ALFA ERP SİSTEMLERİ</p>
            </div>
            
            <div class="section">
                <div class="row"><span>Toplam Fiş:</span> <span>${zData.totalSales} Adet</span></div>
                <div class="row"><span>NAKİT Ciro:</span> <span>${zData.totalCash.toLocaleString()} TL</span></div>
                <div class="row"><span>KARTLI Ciro:</span> <span>${zData.totalCard.toLocaleString()} TL</span></div>
                <div class="row"><span>VERESİYE:</span> <span>${zData.totalVeresiye.toLocaleString()} TL</span></div>
            </div>

            <div class="section">
                <div class="title">SATILAN ÜRÜNLER DÖKÜMÜ</div>
                ${productsHtml || '<p style="font-size:10px">Satış yok.</p>'}
            </div>
            
            <div class="row bold" style="margin-top:10px"><span>TOPLAM CİRO:</span> <span>${zData.totalRevenue.toLocaleString()} TL</span></div>
            <div class="row"><span>GÜNLÜK GİDER:</span> <span>-${zData.totalExpenseAmount.toLocaleString()} TL</span></div>
            
            <div class="header" style="margin-top:10px"></div>
            
            <div class="row big"><span>KASADAKİ NET:</span> <span>${zData.cashInDrawer.toLocaleString()} TL</span></div>
            
            <div class="footer">
                <p>Bu rapor mali değer taşımaz.<br/>Bilgi amaçlıdır.</p>
                <p>Teslim Eden: ....................  Teslim Alan: ....................</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // --- ÜRÜN BAZLI DETAYLI EXCEL RAPORU ---
  const exportProductReport = async () => {
    if (!startDate || !endDate) return alert("Tarih aralığı seçiniz!");
    
    const sales = await window.db.get('sales') || [];
    const parseDate = (d) => { const [dd, mm, yyyy] = d.split('.'); return new Date(`${yyyy}-${mm}-${dd}`); };
    const start = new Date(startDate); const end = new Date(endDate);

    const filteredSales = sales.filter(s => { const d = parseDate(s.date); return d >= start && d <= end; });

    // Ürünleri Topla
    const productStats = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productStats[item.name]) productStats[item.name] = { count: 0, revenue: 0 };
            productStats[item.name].count += item.quantity;
            productStats[item.name].revenue += item.total;
        });
    });

    const dataToExport = Object.keys(productStats).map(key => ({
        'Ürün Adı': key,
        'Satılan Adet': productStats[key].count,
        'Toplam Ciro': productStats[key].revenue
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Urun_Satis_Raporu");
    XLSX.writeFile(wb, `Urun_Raporu_${startDate}_${endDate}.xlsx`);
  };

  // --- GENEL RAPORLAMA ---
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return alert("Lütfen tarih seçin!");
    const parseDate = (d) => { const [dd, mm, yyyy] = d.split('.'); return new Date(`${yyyy}-${mm}-${dd}`); };
    const start = new Date(startDate); const end = new Date(endDate);
    
    const sales = await window.db.get('sales') || [];
    const expenses = await window.db.get('expenses') || [];

    const filteredSales = sales.filter(s => { const d = parseDate(s.date); return d >= start && d <= end; });
    const filteredExpenses = expenses.filter(e => { const d = parseDate(e.date); return d >= start && d <= end; });

    const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    setReportData({ sales: filteredSales, expenses: filteredExpenses, totalSales, totalExpenses, netProfit });
  };

  const exportMainExcel = () => {
    if (!reportData) return;
    const salesSheet = reportData.sales.map(s => ({ Tarih: s.date, Saat: s.time, Tutar: s.total, Ödeme: s.method }));
    const expenseSheet = reportData.expenses.map(e => ({ Tarih: e.date, Açıklama: e.title, Kategori: e.category, Tutar: e.amount }));
    const summarySheet = [{ 'Başlangıç': startDate, 'Bitiş': endDate, 'Ciro': reportData.totalSales, 'Gider': reportData.totalExpenses, 'NET KAR': reportData.netProfit }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), "Ozet");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesSheet), "Satislar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseSheet), "Giderler");
    XLSX.writeFile(wb, `Genel_Rapor_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Raporlar & Analiz</h2>
            <p className="text-gray-500 text-sm">Finansal durum, ürün analizi ve gün sonu</p>
        </div>
        
        <button 
            onClick={handleZReport} 
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-black transition-all hover:-translate-y-1 active:scale-95 font-bold"
        >
            <Printer size={20}/> GÜN SONU (Z-RAPORU)
        </button>
      </div>
      
      {/* FİLTRE ALANI */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex items-end gap-4">
            <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">BAŞLANGIÇ</label>
                <input type="date" className="w-full p-2 border rounded-lg" value={startDate} onChange={e => setStartDate(e.target.value)}/>
            </div>
            <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">BİTİŞ</label>
                <input type="date" className="w-full p-2 border rounded-lg" value={endDate} onChange={e => setEndDate(e.target.value)}/>
            </div>
            <div className="flex gap-2">
                <button onClick={handleGenerateReport} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Search size={18}/> Rapor Getir
                </button>
            </div>
        </div>
        
        {/* EKSTRA RAPOR BUTONLARI */}
        <div className="mt-4 pt-4 border-t flex gap-3">
            <button onClick={exportProductReport} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold hover:bg-purple-200 border border-purple-200 text-sm">
                <Package size={16}/> Ürün Satış Raporu (Excel)
            </button>
        </div>
      </div>

      {/* RAPOR SONUÇLARI */}
      {reportData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">DÖNEM CİROSU</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
                        <span className="text-2xl font-bold text-gray-800">₺{reportData.totalSales.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">DÖNEM GİDERİ</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={20}/></div>
                        <span className="text-2xl font-bold text-red-600">-₺{reportData.totalExpenses.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">NET KAR / ZARAR</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`p-2 rounded-lg ${reportData.netProfit >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                            <PiggyBank size={20}/>
                        </div>
                        <span className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            ₺{reportData.netProfit.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end mb-4">
                <button onClick={exportMainExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-bold">
                    <FileSpreadsheet size={16}/> Genel Raporu İndir (Excel)
                </button>
            </div>
        </div>
      )}

      {/* --- Z-RAPORU MODAL --- */}
      {showZReport && zData && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
              <div className="bg-white p-0 rounded-xl w-96 shadow-2xl overflow-hidden">
                  <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><FileText size={20}/> Z-RAPORU ÖNİZLEME</h3>
                      <button onClick={() => setShowZReport(false)} className="text-gray-400 hover:text-white">Kapat</button>
                  </div>
                  <div className="p-6 space-y-3 text-sm overflow-y-auto max-h-[60vh]">
                      <div className="flex justify-between border-b pb-2"><span>Tarih:</span> <strong>{zData.date}</strong></div>
                      <div className="flex justify-between"><span>Toplam İşlem:</span> <span>{zData.totalSales} Adet</span></div>
                      
                      {/* Ürün Listesi */}
                      <div className="bg-gray-50 p-2 rounded border border-gray-200 my-2">
                          <p className="text-xs font-bold text-gray-500 mb-1 border-b pb-1">SATILAN ÜRÜNLER</p>
                          {zData.soldProducts.map((p, i) => (
                              <div key={i} className="flex justify-between text-xs mb-1">
                                  <span>{p.name} (x{p.count})</span>
                                  <span>{p.total} ₺</span>
                              </div>
                          ))}
                          {zData.soldProducts.length === 0 && <span className="text-xs text-gray-400">Satış yok.</span>}
                      </div>

                      <div className="flex justify-between text-green-600"><span>NAKİT SATIŞ:</span> <strong>+{zData.totalCash.toLocaleString()} ₺</strong></div>
                      <div className="flex justify-between text-blue-600"><span>KARTLI SATIŞ:</span> <strong>+{zData.totalCard.toLocaleString()} ₺</strong></div>
                      <div className="flex justify-between text-orange-600"><span>VERESİYE:</span> <strong>+{zData.totalVeresiye.toLocaleString()} ₺</strong></div>
                      <div className="flex justify-between text-red-600 border-t pt-2"><span>GÜNLÜK GİDER:</span> <strong>-{zData.totalExpenseAmount.toLocaleString()} ₺</strong></div>
                      <div className="bg-gray-100 p-3 rounded-lg mt-4 text-center">
                          <p className="text-xs text-gray-500 font-bold mb-1">KASADAKİ NET NAKİT</p>
                          <p className="text-2xl font-black text-gray-800">{zData.cashInDrawer.toLocaleString()} ₺</p>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t">
                      <button onClick={printZReport} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black flex items-center justify-center gap-2">
                          <Printer size={18}/> Yazdır (Fiş)
                      </button>
                      <button onClick={async () => {
                          try {
                              const productsHtml = zData.soldProducts.map(p => 
                                `<div class=\"row\"><span>${p.name} (x${p.count})</span> <span>${p.total} TL</span></div>`
                              ).join('');
                              const html = `<!doctype html><html><head><meta charset=\"utf-8\" /><title>Z-Raporu</title><style>
                                body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; color: #000; }
                                .header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                                .section { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                                .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
                                .title { font-weight: bold; font-size: 12px; text-align: left; margin: 5px 0; text-decoration: underline; }
                                .bold { font-weight: bold; font-size: 14px; }
                                .big { font-size: 16px; font-weight: bold; }
                                .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 10px; }
                              </style></head><body>
                                <div class=\"header\">
                                  <h2>Z-RAPORU (GÜN SONU)</h2>
                                  <p>Tarih: ${zData.date} - ${zData.time}</p>
                                  <p>ALFA ERP SİSTEMLERİ</p>
                                </div>
                                <div class=\"section\">
                                  <div class=\"row\"><span>Toplam Fiş:</span> <span>${zData.totalSales} Adet</span></div>
                                  <div class=\"row\"><span>NAKİT Ciro:</span> <span>${zData.totalCash.toLocaleString()} TL</span></div>
                                  <div class=\"row\"><span>KARTLI Ciro:</span> <span>${zData.totalCard.toLocaleString()} TL</span></div>
                                  <div class=\"row\"><span>VERESİYE:</span> <span>${zData.totalVeresiye.toLocaleString()} TL</span></div>
                                </div>
                                <div class=\"section\">
                                  <div class=\"title\">SATILAN ÜRÜNLER DÖKÜMÜ</div>
                                  ${productsHtml || '<p style=\"font-size:10px\">Satış yok.</p>'}
                                </div>
                                <div class=\"row bold\" style=\"margin-top:10px\"><span>TOPLAM CİRO:</span> <span>${zData.totalRevenue.toLocaleString()} TL</span></div>
                                <div class=\"row\"><span>GÜNLÜK GİDER:</span> <span>-${zData.totalExpenseAmount.toLocaleString()} TL</span></div>
                                <div class=\"header\" style=\"margin-top:10px\"></div>
                                <div class=\"row big\"><span>KASADAKİ NET:</span> <span>${zData.cashInDrawer.toLocaleString()} TL</span></div>
                                <div class=\"footer\">
                                  <p>Bu rapor mali değer taşımaz.<br/>Bilgi amaçlıdır.</p>
                                  <p>Teslim Eden: ....................  Teslim Alan: ....................</p>
                                </div>
                              </body></html>`;
                              const res = await (window.print && window.print.toPDF ? window.print.toPDF(html, 'z-report.pdf') : Promise.resolve({ ok: false }));
                              if (res && res.ok) alert('Z-raporu PDF olarak kaydedildi');
                              else alert('PDF kaydetme başarısız');
                          } catch { alert('PDF oluşturma hatası'); }
                      }} className="w-full mt-2 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                          <FileText size={18}/> PDF Kaydet
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Reports;
