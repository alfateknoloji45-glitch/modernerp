import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, FileSpreadsheet, RotateCcw, CheckCircle, XCircle, Trash2, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

const Invoices = ({ userRole, logActivity, mode }) => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyInfo, setCompanyInfo] = useState({}); // Firma bilgileri için
  const [eDocs, setEDocs] = useState([]); // e-belgeler
  const [eDocSettings, setEDocSettings] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const sales = await window.db.get('sales') || [];
    const storedCompany = await window.db.get('company_info');
    const settings = await window.db.get('e_doc_settings');
    const storageKey = mode === 'e_invoice' ? 'e_invoices' : mode === 'e_archive' ? 'e_archives' : null;
    const storedEDocs = storageKey ? await window.db.get(storageKey) || [] : [];
    setInvoices(sales);
    if(storedCompany) setCompanyInfo(storedCompany);
    if(settings) setEDocSettings(settings);
    setEDocs(storedEDocs);
  };

  // --- FATURA YAZDIRMA FONKSİYONU (DİNAMİK) ---
  const printInvoice = (invoice) => {
    const totalAmount = invoice.items.reduce((acc, item) => acc + item.total, 0);
    const taxRate = 0.18; // Varsayılan KDV %18
    const subtotal = totalAmount / (1 + taxRate);
    const taxAmount = totalAmount - subtotal;

    const printWindow = window.open('', 'Print Invoice', 'width=800,height=600');
    
    // Fatura Şablonu (Minimalist HTML)
    const invoiceHTML = `
      <html>
        <head>
          <title>Fatura - ${invoice.id}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .invoice-box { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; }
            .header h1 { color: #000; font-size: 24px; margin: 0; }
            .header p { font-size: 12px; color: #666; margin: 0; }
            .details { margin-top: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .details strong { font-weight: bold; display: block; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            .total-row td { border-top: 2px solid #333; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
            .status { color: ${invoice.status === 'İade' ? 'red' : 'green'}; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header" style="text-align: center; margin-bottom: 30px;">
              <h1>${companyInfo.name || 'ALFA TEKNOLOJİ (TASLAK)'}</h1>
              <p>${companyInfo.address || 'Adres bilgisi girilmedi.'}</p>
            </div>
            
            <div class="details">
              <div>
                <strong>MÜŞTERİ BİLGİSİ</strong>
                Müşteri Adı: ${invoice.customerName}<br>
                Belge Tipi: ${invoice.method}<br>
                Durum: <span class="status">${invoice.status || 'Satış'}</span>
              </div>
              <div style="text-align: right;">
                <strong>FATURA BİLGİSİ</strong>
                Fatura No: ${invoice.id}<br>
                Tarih: ${invoice.date} ${invoice.time}
              </div>
            </div>

            <table>
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th>Ürün Adı</th>
                  <th>Adet</th>
                  <th>Birim Fiyat</th>
                  <th>Tutar (KDV Hariç)</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₺${(item.price / (1 + taxRate)).toFixed(2)}</td>
                    <td>₺${(item.price * item.quantity / (1 + taxRate)).toFixed(2)}</td>
                  </tr>
                  ${(() => { const serials = (item.selectedSerials || []); const lots = (item.lotUsed || []); const s = serials.length>0 ? `Seri: ${serials.join(', ')}` : ''; const l = lots.length>0 ? `Lot: ${lots.map(x=>`${x.code} x${x.qty}`).join(', ')}` : ''; const txt = [s,l].filter(Boolean).join(' • '); return txt ? `<tr><td colspan="4" style="font-size:12px;color:#555;background:#fafafa">${txt}</td></tr>` : '' })()}
                `).join('')}
                <tr style="height: 10px;"><td colspan="4" style="border: none; padding: 0;"></td></tr>
                <tr>
                    <td colspan="3" style="text-align: right; border: none;">ARA TOPLAM (KDV Hariç):</td>
                    <td style="font-weight: bold;">₺${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right; border: none;">KDV (%18):</td>
                    <td style="font-weight: bold;">₺${taxAmount.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">GENEL TOPLAM:</td>
                    <td style="font-size: 16px;">₺${totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              ${companyInfo.footer || 'Bu bir proforma faturadır.'}
            </div>

          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
  };
  // ----------------------------------------------------

  // --- E-BELGE OLUŞTURMA/GÖNDERME ---
  const docLabel = mode === 'e_invoice' ? 'E-Fatura' : mode === 'e_archive' ? 'E-Arşiv' : mode === 'e_dispatch' ? 'E-İrsaliye' : null;
  const storageKey = mode === 'e_invoice' ? 'e_invoices' : mode === 'e_archive' ? 'e_archives' : mode === 'e_dispatch' ? 'e_dispatches' : null;

  const findEDoc = (saleId) => eDocs.find(d => d.saleId === saleId);

  const generateDocNo = () => {
    const year = new Date().getFullYear();
    const prefix = mode === 'e_invoice' ? (eDocSettings?.einvoice?.seriesPrefix || 'EINV') : mode === 'e_archive' ? (eDocSettings?.earchive?.seriesPrefix || 'EARC') : (eDocSettings?.edispatch?.seriesPrefix || 'EDESP');
    const seq = String(Math.floor(Math.random()*90000)+10000);
    return `${year}-${prefix}-${seq}`;
  };

  const buildUblXml = (invoice) => {
    const taxRate = 0.18;
    const subtotal = invoice.items.reduce((acc, item) => acc + (item.price * item.quantity) / (1 + taxRate), 0);
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    const customerName = invoice.customerName || 'Müşteri';
    const sellerName = companyInfo.name || 'ALFA TEKNOLOJİ';
    const currency = 'TRY';
    const itemNote = (item) => {
      const serials = (item.selectedSerials || []);
      const lots = (item.lotUsed || []);
      const s = serials.length > 0 ? `Seri: ${serials.join(', ')}` : '';
      const l = lots.length > 0 ? `Lot: ${lots.map(x => `${x.code} x${x.qty}`).join(', ')}` : '';
      const text = [s,l].filter(Boolean).join(' • ');
      return text ? `<cbc:Note>${text}</cbc:Note>` : '';
    };
    if (mode === 'e_dispatch') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${eDocSettings?.edispatch?.customizationId || 'TR1.2-DESPATCH'}</cbc:CustomizationID>
  <cbc:ProfileID>${eDocSettings?.edispatch?.profileId || 'EDESPATCH'}</cbc:ProfileID>
  <cbc:ID>${invoice.id}</cbc:ID>
  <cbc:IssueDate>${invoice.date}</cbc:IssueDate>
  <cac:DespatchSupplierParty>
    <cac:Party><cac:PartyName><cbc:Name>${sellerName}</cbc:Name></cac:PartyName></cac:Party>
  </cac:DespatchSupplierParty>
  <cac:DeliveryCustomerParty>
    <cac:Party><cac:PartyName><cbc:Name>${customerName}</cbc:Name></cac:PartyName></cac:Party>
  </cac:DeliveryCustomerParty>
  ${invoice.items.map(item => `
  <cac:DespatchLine>
    <cbc:ID>${item.id}</cbc:ID>
    <cbc:DeliveredQuantity unitCode="NIU">${item.quantity}</cbc:DeliveredQuantity>
    <cac:Item><cbc:Name>${item.name}</cbc:Name>${itemNote(item)}</cac:Item>
  </cac:DespatchLine>`).join('')}
</DespatchAdvice>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${mode === 'e_invoice' ? (eDocSettings?.einvoice?.customizationId || 'TR1.2') : (eDocSettings?.earchive?.customizationId || 'TR1.2-ARCHIVE')}</cbc:CustomizationID>
  <cbc:ProfileID>${mode === 'e_invoice' ? (eDocSettings?.einvoice?.profileId || 'EINVOICE') : (eDocSettings?.earchive?.profileId || 'EARCHIVE')}</cbc:ProfileID>
  <cbc:ID>${invoice.id}</cbc:ID>
  <cbc:IssueDate>${invoice.date}</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party><cac:PartyName><cbc:Name>${sellerName}</cbc:Name></cac:PartyName></cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party><cac:PartyName><cbc:Name>${customerName}</cbc:Name></cac:PartyName></cac:Party>
  </cac:AccountingCustomerParty>
  ${invoice.items.map(item => `
  <cac:InvoiceLine>
    <cbc:ID>${item.id}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${((item.price * item.quantity)/(1+taxRate)).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>${item.name}</cbc:Name>${itemNote(item)}</cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="${currency}">${(item.price/(1+taxRate)).toFixed(2)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`).join('')}
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
  };

  const createEDocument = async (invoice) => {
    if (!storageKey) return;
    const exists = findEDoc(invoice.id);
    if (exists) return alert(`${docLabel} zaten oluşturulmuş: ${exists.docNo}`);
    const docNo = generateDocNo();
    const xml = buildUblXml(invoice);
    const doc = { id: Date.now(), saleId: invoice.id, docNo, xml, status: 'Hazır', createdAt: new Date().toISOString() };
    const updated = [doc, ...eDocs];
    await window.db.set(storageKey, updated);
    setEDocs(updated);
    logActivity && logActivity('CREATE', `${docLabel} oluşturuldu: ${docNo}`);
  };

  const sendEDocument = async (invoice) => {
    if (!storageKey) return;
    const doc = findEDoc(invoice.id);
    if (!doc) return alert(`Önce ${docLabel} oluşturun!`);
    if (doc.status === 'Gönderildi') return alert(`${docLabel} zaten gönderildi.`);
    if (!confirm(`${docLabel} GİB'e gönderilsin mi?`)) return;
    const isError = false; // Simülasyon: gerçek entegrasyonda API sonucu kontrol edilir
    let updated;
    if (isError) {
      const reason = prompt('Hata açıklaması girin:', 'Bağlantı hatası');
      updated = eDocs.map(d => d.saleId === invoice.id ? { ...d, status: 'Hata', error: reason || 'Bilinmiyor', sentAt: new Date().toISOString() } : d);
    } else {
      updated = eDocs.map(d => d.saleId === invoice.id ? { ...d, status: 'Gönderildi', sentAt: new Date().toISOString() } : d);
    }
    await window.db.set(storageKey, updated);
    setEDocs(updated);
    logActivity && logActivity(isError ? 'ERROR' : 'SEND', `${docLabel} ${isError ? 'hata' : 'gönderildi'}: ${doc.docNo}`);
  };

  const downloadXml = (invoice) => {
    const doc = findEDoc(invoice.id);
    if (!doc) return alert(`Önce ${docLabel} oluşturun!`);
    const blob = new Blob([doc.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.docNo}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReturn = async (invoice) => {
    if (userRole !== 'Admin') return alert("Bu işlem için Admin yetkisi gereklidir.");
    if (invoice.status === 'İade') return alert("Bu fatura zaten iade alınmış!");
    if (!confirm(`DİKKAT! İade alınacak. Onaylıyor musun?`)) return;

    const products = await window.db.get('products') || [];
    let accounts = await window.db.get('accounts') || [];
    const accountTrans = await window.db.get('account_transactions') || [];
    let customers = await window.db.get('customers') || [];
    let installments = await window.db.get('installments') || [];

    // Finansal ters kayıtları uygula
    if (invoice.method === 'Nakit' || invoice.method === 'Kart') {
      const targetAccId = invoice.method === 'Nakit' ? 'acc_cash' : 'acc_pos';
      accounts = accounts.length > 0 ? accounts : [
        { id: 'acc_cash', name: 'Merkez Kasa', type: 'Kasa', balance: 0 },
        { id: 'acc_pos', name: 'POS / Banka', type: 'Banka', balance: 0 }
      ];
      const updatedAcc = accounts.map(a => a.id === targetAccId ? { ...a, balance: Math.max(0, (a.balance || 0) - invoice.total) } : a);
      await window.db.set('accounts', updatedAcc);
      accountTrans.unshift({
        id: `AT-${Date.now()}`,
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR'),
        accountId: targetAccId,
        type: 'expense',
        amount: invoice.total,
        description: 'Satış iade'
      });
      await window.db.set('account_transactions', accountTrans);
    } else if (invoice.method === 'Veresiye') {
      if (invoice.customerId) {
        customers = customers.map(c => c.id === invoice.customerId ? { ...c, balance: Math.max(0, (c.balance || 0) - invoice.total) } : c);
        await window.db.set('customers', customers);
      }
    } else if (invoice.method === 'Taksitli') {
      const saleInstallments = installments.filter(ins => ins.saleId === invoice.id);
      const remaining = saleInstallments.filter(ins => ins.status === 'Bekliyor').reduce((a,b)=>a+Number(b.amount||0),0);
      installments = installments.map(ins => ins.saleId === invoice.id ? { ...ins, status: 'İptal' } : ins);
      await window.db.set('installments', installments);
      if (invoice.customerId) {
        customers = customers.map(c => c.id === invoice.customerId ? { ...c, balance: Math.max(0, (c.balance || 0) - remaining) } : c);
        await window.db.set('customers', customers);
      }
      const dp = Number(invoice.downPayment || 0);
      if (dp > 0) {
        accounts = accounts.length > 0 ? accounts : [
          { id: 'acc_cash', name: 'Merkez Kasa', type: 'Kasa', balance: 0 },
          { id: 'acc_pos', name: 'POS / Banka', type: 'Banka', balance: 0 }
        ];
        const updatedAcc = accounts.map(a => a.id === 'acc_cash' ? { ...a, balance: Math.max(0, (a.balance || 0) - dp) } : a);
        await window.db.set('accounts', updatedAcc);
        accountTrans.unshift({
          id: `AT-${Date.now()}`,
          date: new Date().toLocaleDateString('tr-TR'),
          time: new Date().toLocaleTimeString('tr-TR'),
          accountId: 'acc_cash',
          type: 'expense',
          amount: dp,
          description: 'Taksit peşinat iade'
        });
        await window.db.set('account_transactions', accountTrans);
      }
    }

    // Stok ve seri/lot geri dönüşleri
    const updatedProds = products.map(p => {
      const saleItem = (invoice.items || []).find(i => i.id === p.id);
      if (!saleItem) return p;
      const next = Number(p.stock || 0) + Number(saleItem.quantity || 0);
      let updated = { ...p, stock: next, status: next < 5 ? 'Kritik' : 'Yeterli' };
      if (p.serialTracked && saleItem.selectedSerials && saleItem.selectedSerials.length > 0) {
        const backSerials = (p.serials || []).map(s => (saleItem.selectedSerials || []).includes(s.code) ? { ...s, status: 'available' } : s);
        updated = { ...updated, serials: backSerials };
      }
      if (p.lotTracked && saleItem.lotUsed && saleItem.lotUsed.length > 0) {
        const lotMap = {};
        (saleItem.lotUsed || []).forEach(u => { lotMap[u.code] = (lotMap[u.code]||0) + Number(u.qty||0); });
        const backLots = (p.lots || []).map(l => ({ ...l, qty: Number(l.qty||0) + (lotMap[l.code]||0) }));
        updated = { ...updated, lots: backLots };
      }
      return updated;
    });
    await window.db.set('products', updatedProds);

    // Stok hareket logu: İade Girişi
    const productLogs = await window.db.get('product_logs') || [];
    (invoice.items || []).forEach(ci => {
      const s = (ci.selectedSerials || []).length > 0 ? `Seri: ${(ci.selectedSerials || []).join(', ')}` : '';
      const l = (ci.lotUsed || []).length > 0 ? `Lot: ${(ci.lotUsed || []).map(x => `${x.code} x${x.qty}`).join(', ')}` : '';
      const info = [s,l].filter(Boolean).join(' • ');
      productLogs.push({
        id: Date.now() + ci.id,
        productId: ci.id,
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR'),
        type: 'İade Girişi',
        amount: ci.quantity,
        reason: info ? `Satış iade • ${info}` : 'Satış iade',
        user: userRole
      });
    });
    await window.db.set('product_logs', productLogs);

    // Satışı 'İade' olarak işaretle
    const sales = await window.db.get('sales') || [];
    const updatedSales = sales.map(s => s.id === invoice.id ? { ...s, status: 'İade' } : s);
    await window.db.set('sales', updatedSales);
    setInvoices(updatedSales);

    logActivity && logActivity('UPDATE/RETURN', `Satış iade alındı: ${invoice.id} (${invoice.total} TL)`);
  };

  const handleDelete = async (id) => { /* ... */ }; // Silme kodu aynı
  const exportToExcel = () => { /* ... */ }; // Excel kodu aynı

  const filteredInvoices = invoices
    .filter(inv => inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || inv.date.includes(searchTerm))
    .filter(inv => !mode ? true : inv.status !== 'İade');

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-bold text-gray-800">{docLabel ? `${docLabel} İşlemleri` : 'Satış Geçmişi & Faturalar'}</h2></div>
        <div className="flex gap-3">
            <input className="pl-4 pr-4 py-2 border rounded-lg w-64 focus:outline-blue-500" placeholder="Belge No veya Tarih Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            <button onClick={exportToExcel} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all active:scale-95"><FileSpreadsheet size={18}/> Excel İndir</button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">DURUM</th>
              <th className="px-6 py-4">BELGE NO</th>
              <th className="px-6 py-4">TARİH</th>
              <th className="px-6 py-4">TUTAR</th>
              <th className="px-6 py-4">ÖDEME</th>
              <th className="px-6 py-4 text-right">İŞLEMLER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className={`hover:bg-gray-50 group ${inv.status === 'İade' ? 'bg-red-50/50' : ''}`}>
                <td className="px-6 py-4">
                    {docLabel ? (
                      findEDoc(inv.id) ? 
                        <div className="text-xs">
                          <span className="font-bold text-indigo-700">{docLabel}</span> • <span className={`text-${findEDoc(inv.id).status==='Hata'?'red':'gray'}-600`}>{findEDoc(inv.id).status}</span>
                          <div className="text-[11px] text-gray-400">No: {findEDoc(inv.id).docNo}</div>
                          {findEDoc(inv.id).error && <div className="text-[11px] text-red-500">Hata: {findEDoc(inv.id).error}</div>}
                        </div>
                      : <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-xs border border-yellow-200">Henüz oluşturulmadı</span>
                    ) : (
                      inv.status === 'İade' ? <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><XCircle size={14}/> İADE</span> : <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><CheckCircle size={14}/> SATIŞ</span>
                    )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 text-sm">{inv.id}<div className="text-xs text-gray-400">{inv.method}</div></td>
                <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                <td className={`px-6 py-4 font-bold ${inv.status === 'İade' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>₺{inv.total}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs border ${inv.method === 'Nakit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{inv.method}</span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  
                  {!docLabel && (
                    <button onClick={() => printInvoice(inv)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors" title="Fatura Yazdır">
                      <Printer size={16}/>
                    </button>
                  )}

                  {docLabel && (
                    <>
                      <button onClick={() => createEDocument(inv)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors" title={`${docLabel} Oluştur`}>
                        <FileText size={16}/>
                      </button>
                      <button onClick={() => sendEDocument(inv)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors" title={`${docLabel} Gönder`}>
                        <CheckCircle size={16}/>
                      </button>
                      <button onClick={() => downloadXml(inv)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors" title="XML İndir">
                        <Download size={16}/>
                      </button>
                    </>
                  )}

                  {/* İADE ET BUTONU (SADECE ADMIN) */}
                  {inv.status !== 'İade' && userRole === 'Admin' && (
                      <button onClick={() => handleReturn(inv)} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors" title="İade Al">
                        <RotateCcw size={14}/> İADE ET
                      </button>
                  )}
                  
                  {/* SİL BUTONU (SADECE ADMIN) */}
                  {userRole === 'Admin' && <button onClick={() => handleDelete(inv.id)} className="text-gray-300 hover:text-red-500 p-1.5"><Trash2 size={16}/></button>}
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-gray-400">Kayıt bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
