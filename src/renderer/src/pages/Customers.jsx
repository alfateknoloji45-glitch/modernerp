import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Search, Plus, Trash2, Eye, ArrowLeft, FileText, Wallet, CalendarClock, CheckCircle, X, Printer } from 'lucide-react';

const Customers = ({ userRole, logActivity }) => {
  const [viewMode, setViewMode] = useState('list'); 
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [installments, setInstallments] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', phone: '', balance: 0 });
  const [newTrans, setNewTrans] = useState({ type: 'payment', amount: '', description: '', date: '' });

  const [detailTab, setDetailTab] = useState('movements'); 
  const [stmtStartDate, setStmtStartDate] = useState('');
  const [stmtEndDate, setStmtEndDate] = useState('');
  const [stmtTypeFilter, setStmtTypeFilter] = useState('ALL');
  const [stmtSearch, setStmtSearch] = useState('');
  const [stmtMinAmount, setStmtMinAmount] = useState('');
  const [stmtMaxAmount, setStmtMaxAmount] = useState('');
  const [stmtPage, setStmtPage] = useState(1);
  const [stmtPageSize, setStmtPageSize] = useState(50);
  const [stmtSortDesc, setStmtSortDesc] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: '', address: '', footer: '', logo: '' });

  // --- GÜVENLİ TARİH PARSE FONKSİYONU ---
  const parseTRDate = (str) => {
    if (!str || str.indexOf('.') === -1) return new Date(0);
    const [day, month, year] = str.split('.');
    if (!day || !month || !year || isNaN(Number(month)) || isNaN(Number(day)) || isNaN(Number(year))) return new Date(0);
    return new Date(`${year}-${month}-${day}`);
  };

  useEffect(() => { loadData(); }, [viewMode]);

  const exportExcelShortcut = async () => {
    const custId = selectedCustomer?.id;
    if (!custId || detailTab !== 'statement') return;
    const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
      const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
      return { Tarih: s.date, Islem: 'BORÇ', Belge: s.id, Aciklama: `Satış (${s.method}) ${s.id}`, Tutar: debt };
    });
    const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
      if (s.method === 'Veresiye') return { Tarih: s.date, Islem: 'ÖDEME', Belge: s.id, Aciklama: `İade (Veresiye) ${s.id}`, Tutar: Number(s.total||0) };
      const related = installments.filter(ins => ins.saleId === s.id);
      const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
      return { Tarih: s.date, Islem: 'ÖDEME', Belge: s.id, Aciklama: `İade (Taksitli) ${s.id}`, Tutar: cancelled };
    });
    const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ Tarih: t.date, Islem: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', Belge: t.id, Aciklama: t.description || '-', Tutar: Number(t.amount||0) }));
    const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.Tarih) - parseTRDate(b.Tarih));
    const start = stmtStartDate ? new Date(stmtStartDate) : null;
    const end = stmtEndDate ? new Date(stmtEndDate) : null;
    const filtered = rowsAll.filter(r => { const d = parseTRDate(r.Tarih); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.Islem === 'BORÇ') || (stmtTypeFilter === 'payment' && r.Islem === 'ÖDEME'); const searchOk = stmtSearch ? String(r.Aciklama||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.Belge||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.Tutar||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.Tutar||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
    const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.Tarih) < start).reduce((acc, r) => acc + (r.Islem === 'BORÇ' ? Number(r.Tutar||0) : -Number(r.Tutar||0)), 0) : 0;
    let run = openingBalance;
    const enriched = filtered.map(r => { run += r.Islem === 'BORÇ' ? Number(r.Tutar||0) : -Number(r.Tutar||0); return { ...r, Bakiye: run }; });
    const enrichedSorted = stmtSortDesc ? [...enriched].reverse() : enriched;
    const wsData = [ { Tarih: (stmtStartDate||'-'), Islem: 'AÇILIŞ', Belge: '-', Aciklama: 'Dönem Açılış Bakiyesi', Tutar: '-', Bakiye: openingBalance }, ...enrichedSorted.map(r => ({ Tarih: r.Tarih, Islem: r.Islem, Belge: r.Belge || r['Belge'] || undefined, Aciklama: r.Aciklama, Tutar: r.Tutar, Bakiye: r.Bakiye })) ];
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws['!cols'] = [ { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 40 }, { wch: 14 }, { wch: 14 } ];
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const addrAmount = XLSX.utils.encode_cell({ r: R, c: 4 });
        const addrBalance = XLSX.utils.encode_cell({ r: R, c: 5 });
        if (ws[addrAmount] && typeof ws[addrAmount].v === 'number') ws[addrAmount].z = '#,##0.00';
        if (ws[addrBalance] && typeof ws[addrBalance].v === 'number') ws[addrBalance].z = '#,##0.00';
      }
      ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.e.c } }) };
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ekstre');
    const periodDebt = filtered.filter(r => r.Islem === 'BORÇ').reduce((acc, r) => acc + Number(r.Tutar||0), 0);
    const periodPayment = filtered.filter(r => r.Islem === 'ÖDEME').reduce((acc, r) => acc + Number(r.Tutar||0), 0);
    const periodNet = periodDebt - periodPayment;
    const closingBalance = openingBalance + periodNet;
    const wsSummary = XLSX.utils.json_to_sheet([
      { 'Firma': companyInfo.name||'' },
      { 'Adres': companyInfo.address||'' },
      { 'Müşteri': selectedCustomer.name||'' },
      { 'Müşteri Telefonu': selectedCustomer.phone||'' },
      { 'Aralık': `${(stmtStartDate||'-')} — ${(stmtEndDate||'-')}` },
      { 'Açılış Bakiyesi': openingBalance },
      { 'Dönem Borç Toplamı': periodDebt },
      { 'Dönem Ödeme Toplamı': periodPayment },
      { 'Dönem Net': periodNet },
      { 'Kapanış Bakiyesi': closingBalance }
    ]);
    wsSummary['!cols'] = [ { wch: 24 }, { wch: 20 } ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');
    const safe = (s) => String(s||'').replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(wb, `Ekstre_${safe(selectedCustomer.name)}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPdfShortcut = async () => {
    const custId = selectedCustomer?.id;
    if (!custId || detailTab !== 'statement') return;
    const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
      const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
      return { date: s.date, type: 'BORÇ', id: s.id, description: `Satış (${s.method})`, amount: debt };
    });
    const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
      if (s.method === 'Veresiye') return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Veresiye)', amount: Number(s.total||0) };
      const related = installments.filter(ins => ins.saleId === s.id);
      const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
      return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Taksitli bekleyen taksitler)', amount: cancelled };
    });
    const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', id: t.id, description: t.description || '-', amount: Number(t.amount||0) }));
    const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
    const start = stmtStartDate ? new Date(stmtStartDate) : null;
    const end = stmtEndDate ? new Date(stmtEndDate) : null;
    const filtered = rowsAll.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'BORÇ') || (stmtTypeFilter === 'payment' && r.type === 'ÖDEME'); const searchOk = stmtSearch ? String(r.description||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.id||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.amount||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.amount||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
    const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
    const periodDebt = filtered.filter(r => r.type === 'BORÇ').reduce((acc, r) => acc + Number(r.amount||0), 0);
    const periodPayment = filtered.filter(r => r.type === 'ÖDEME').reduce((acc, r) => acc + Number(r.amount||0), 0);
    const periodNet = periodDebt - periodPayment;
    const closingBalance = openingBalance + periodNet;
    let runBal = openingBalance;
    const rowsHtml = [
      `<tr><td>${stmtStartDate||'-'}</td><td>AÇILIŞ</td><td>-</td><td>Dönem Açılış Bakiyesi</td><td style=\"text-align:right\">-</td><td style=\"text-align:right\">₺${openingBalance.toLocaleString()}</td></tr>`,
      ...filtered.map(r => { runBal += r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0); const balStyle = runBal < 0 ? 'color:#b91c1c' : 'color:#064e3b'; return `<tr><td>${r.date}</td><td>${r.type}</td><td>${r.id||''}</td><td>${r.description}</td><td style=\"text-align:right\">₺${Number(r.amount||0).toLocaleString()}</td><td style=\"text-align:right;${balStyle}\">₺${runBal.toLocaleString()}</td></tr>`; })
    ].join('');
    const html = `
      <html><head><meta charset=\"utf-8\" /><title>Cari Ekstre</title></head><body>
        <div class=\"header\"><h2>Cari Ekstre</h2></div>
        <div class=\"summary\"><div>Açılış Bakiyesi: ₺${openingBalance.toLocaleString()}</div><div>Dönem BORÇ: ₺${periodDebt.toLocaleString()} — Dönem ÖDEME: ₺${periodPayment.toLocaleString()} — Net: ₺${periodNet.toLocaleString()}</div><div>Kapanış Bakiyesi: ₺${closingBalance.toLocaleString()}</div></div>
        <table><thead><tr><th>Tarih</th><th>İşlem</th><th>Belge</th><th>Açıklama</th><th>Tutar</th><th>Bakiye</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`;
    if (window.print && typeof window.print.toPDF === 'function') {
      const safe = (s) => String(s||'').replace(/[\\/:*?"<>|]/g, '_');
      const fname = `Ekstre_${safe(companyInfo.name)}_${safe(selectedCustomer.name)}_${new Date().toISOString().slice(0,10)}.pdf`;
      window.print.toPDF(html, fname).catch(() => {});
    }
  };

  const printShortcut = () => {
    const el = document.querySelector('button:has(svg)');
    window.print();
  };

  useEffect(() => {
    const handler = (e) => {
      if (!selectedCustomer || detailTab !== 'statement') return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'e') { e.preventDefault(); exportExcelShortcut(); }
      if (e.ctrlKey && key === 'd') { e.preventDefault(); exportPdfShortcut(); }
      if (e.ctrlKey && key === 'p') { e.preventDefault(); printShortcut(); }
      if (e.ctrlKey && (key === 'arrowright' || key === 'arrowleft')) {
        e.preventDefault();
        if (key === 'arrowright') setStmtPage(p => p + 1);
        else setStmtPage(p => Math.max(1, p - 1));
      }
      if (e.ctrlKey && e.shiftKey && (key === 'arrowright' || key === 'arrowleft')) {
        e.preventDefault();
        if (key === 'arrowright') setStmtPage(999999);
        else setStmtPage(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCustomer, detailTab, stmtStartDate, stmtEndDate, stmtTypeFilter, stmtSearch, stmtMinAmount, stmtMaxAmount, sales, transactions, installments, companyInfo]);

  const loadData = async () => {
    const storedCustomers = await window.db.get('customers') || [];
    const storedTransactions = await window.db.get('transactions') || [];
    const storedSales = await window.db.get('sales') || [];
    let storedInstallments = await window.db.get('installments') || [];
    const storedCompany = await window.db.get('company_info');
    
    // --- TAKSİT GECİKME KONTROLÜ (OTOMASYON) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedInstallments = storedInstallments.map(ins => {
        if (ins.status === 'Bekliyor') {
            const dueDate = parseTRDate(ins.date);
            // Vade tarihi geçmiş ve hala ödenmemişse
            if (dueDate < today && dueDate.getTime() !== 0) {
                logActivity('UPDATE', `Taksit gecikti: ${ins.customerName} - ${ins.id} - ${ins.amount} TL.`);
                return { ...ins, status: 'Gecikmiş' };
            }
        }
        return ins;
    });

    if (JSON.stringify(storedInstallments) !== JSON.stringify(updatedInstallments)) {
        await window.db.set('installments', updatedInstallments);
    }
    
    setCustomers(storedCustomers);
    setTransactions(storedTransactions);
    setSales(storedSales);
    setInstallments(updatedInstallments);
    if (storedCompany) setCompanyInfo(storedCompany);
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.name) return alert("İsim giriniz!");
    const customerToAdd = { ...newCustomer, id: Date.now(), balance: Number(newCustomer.balance) || 0 };
    const updatedList = [...customers, customerToAdd];
    await window.db.set('customers', updatedList);
    setCustomers(updatedList);
    logActivity('CREATE', `Yeni müşteri eklendi: ${newCustomer.name}`);
    setShowCustomerModal(false);
    setNewCustomer({ name: '', company: '', phone: '', balance: 0 });
  };

  const deleteCustomer = async (id) => {
    if(confirm("Müşteriyi silmek istiyor musun?")) {
        const customer = customers.find(c => c.id === id);
        const updatedList = customers.filter(c => c.id !== id);
        await window.db.set('customers', updatedList);
        setCustomers(updatedList);
        logActivity('DELETE', `Müşteri silindi: ${customer.name}`);
    }
  };

  const openCustomerDetail = (customer) => {
    setSelectedCustomer(customer);
    setViewMode('detail');
    setDetailTab('movements');
  };

  useEffect(() => {
    const loadFilters = async () => {
      if (!selectedCustomer || detailTab !== 'statement') return;
      const saved = await window.db.get(`statement_filters_${selectedCustomer.id}`);
      if (saved) {
        setStmtStartDate(saved.start || '');
        setStmtEndDate(saved.end || '');
        setStmtTypeFilter(saved.type || 'ALL');
        setStmtSearch(saved.search || '');
        setStmtMinAmount(saved.min != null ? String(saved.min) : '');
        setStmtMaxAmount(saved.max != null ? String(saved.max) : '');
        setStmtSortDesc(Boolean(saved.sortDesc));
        setStmtPageSize(saved.pageSize ? Number(saved.pageSize) : 50);
      }
    };
    loadFilters();
  }, [selectedCustomer, detailTab]);

  useEffect(() => {
    const saveFilters = async () => {
      if (!selectedCustomer || detailTab !== 'statement') return;
      const payload = {
        start: stmtStartDate || '',
        end: stmtEndDate || '',
        type: stmtTypeFilter || 'ALL',
        search: stmtSearch || '',
        min: stmtMinAmount !== '' ? Number(stmtMinAmount) : null,
        max: stmtMaxAmount !== '' ? Number(stmtMaxAmount) : null,
        sortDesc: Boolean(stmtSortDesc),
        pageSize: Number(stmtPageSize||50)
      };
      await window.db.set(`statement_filters_${selectedCustomer.id}`, payload);
    };
    saveFilters();
  }, [selectedCustomer, detailTab, stmtStartDate, stmtEndDate, stmtTypeFilter, stmtSearch, stmtMinAmount, stmtMaxAmount, stmtSortDesc, stmtPageSize]);

  // --- TAKSİT ÖDEME AL ---
  const payInstallment = async (installment) => {
      if(installment.status === 'Gecikmiş' && userRole !== 'Admin' && !confirm("Bu taksit gecikmiştir. Ödeme almak için Admin'e danışınız.")) return;

      const paidDate = new Date().toLocaleDateString('tr-TR');

      const updatedInstallments = installments.map(ins => {
          if (ins.id === installment.id) return { ...ins, status: 'Ödendi', paidDate };
          return ins;
      });
      await window.db.set('installments', updatedInstallments);

      const updatedCustomers = customers.map(c => {
          if (c.id === selectedCustomer.id) return { ...c, balance: c.balance - installment.amount };
          return c;
      });
      await window.db.set('customers', updatedCustomers);

      const accounts = await window.db.get('accounts') || [];
      const updatedAccounts = accounts.map(acc => {
          if (acc.id === 'acc_cash') return { ...acc, balance: acc.balance + installment.amount };
          return acc;
      });
      await window.db.set('accounts', updatedAccounts);

      const newTrans = {
          id: `TR-${Date.now()}`, customerId: selectedCustomer.id, date: paidDate, type: 'payment', amount: installment.amount,
          description: `Taksit Tahsilatı (${installment.no}. Taksit)`
      };
      const updatedTrans = await window.db.get('transactions') || [];
      await window.db.set('transactions', [...updatedTrans, newTrans]);

      // Log kaydı
      logActivity('PAYMENT', `Taksit tahsil edildi: ${selectedCustomer.name} (${installment.amount} TL)`);

      setInstallments(updatedInstallments);
      setCustomers(updatedCustomers);
      setSelectedCustomer(updatedCustomers.find(c => c.id === selectedCustomer.id));
      alert("Taksit tahsil edildi!");
  };

  const handleSaveTransaction = async () => {
    if (!newTrans.amount) return alert("Tutar giriniz!");
    const transactionToAdd = {
        id: `TR-${Date.now()}`,
        customerId: selectedCustomer.id,
        date: newTrans.date || new Date().toLocaleDateString('tr-TR'),
        type: newTrans.type,
        amount: Number(newTrans.amount),
        description: newTrans.description
    };
    const currentTrans = await window.db.get('transactions') || [];
    const updatedTransactions = [...currentTrans, transactionToAdd];
    await window.db.set('transactions', updatedTransactions);

    const updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomer.id) {
            const change = newTrans.type === 'debt' ? Number(newTrans.amount) : -Number(newTrans.amount);
            return { ...c, balance: (c.balance || 0) + change };
        }
        return c;
    });
    await window.db.set('customers', updatedCustomers);
    
    // Log kaydı
    logActivity('UPDATE/BALANCE', `${selectedCustomer.name} hesabı manuel güncellendi (${newTrans.type === 'debt' ? '+' : '-'}${newTrans.amount})`);

    setTransactions(updatedTransactions);
    setCustomers(updatedCustomers);
    const currentC = updatedCustomers.find(c => c.id === selectedCustomer.id);
    setSelectedCustomer(currentC);
    setShowTransactionModal(false);
    setNewTrans({ type: 'payment', amount: '', description: '', date: '' });
  };

  // --- EKRAN 1: LİSTE ---
  if (viewMode === 'list') {
    return (
      <div className="p-8 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Müşteriler</h2>
          <div className="flex gap-3">
            <input className="pl-4 pr-4 py-2 border rounded-lg w-64" placeholder="Müşteri Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            <button onClick={() => setShowCustomerModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
              <Plus size={18}/> <span>Yeni Cari</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">ÜNVAN</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">TELEFON</th>
                {userRole === 'Admin' && <th className="px-6 py-4 text-xs font-bold text-gray-500">BAKİYE</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">İŞLEM</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCustomerDetail(customer)}>
                  <td className="px-6 py-4 font-bold text-gray-800">{customer.name}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                  {userRole === 'Admin' && <td className="px-6 py-4"><span className={`font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₺{customer.balance.toLocaleString()}</span></td>}
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={(e) => {e.stopPropagation(); openCustomerDetail(customer)}} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Eye size={18}/></button>
                    {userRole === 'Admin' && <button onClick={(e) => {e.stopPropagation(); deleteCustomer(customer.id)}} className="text-red-400 hover:text-red-600 p-2 rounded"><Trash2 size={18}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showCustomerModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                    <h3 className="font-bold text-lg mb-4">Yeni Cari Kart</h3>
                    <div className="space-y-3">
                        <input autoFocus placeholder="Ad Soyad" className="w-full p-2 border rounded" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}/>
                        <input placeholder="Firma Adı" className="w-full p-2 border rounded" value={newCustomer.company} onChange={e => setNewCustomer({...newCustomer, company: e.target.value})}/>
                        <input placeholder="Telefon" className="w-full p-2 border rounded" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}/>
                        {userRole === 'Admin' && <input type="number" placeholder="Devir Bakiyesi" className="w-full p-2 border rounded" value={newCustomer.balance} onChange={e => setNewCustomer({...newCustomer, balance: e.target.value})}/>}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setShowCustomerModal(false)} className="px-4 py-2 text-gray-500">İptal</button>
                        <button onClick={handleSaveCustomer} className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- EKRAN 2: DETAY ---
  if (viewMode === 'detail' && selectedCustomer) {
    const customerTrans = transactions.filter(t => t.customerId === selectedCustomer.id).reverse();
    const customerInstalls = installments.filter(i => i.customerId === selectedCustomer.id).sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
    const totalDueInstallments = customerInstalls.filter(i => i.status === 'Bekliyor' || i.status === 'Gecikmiş').length;

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewMode('list')} className="p-2 bg-white border rounded-full hover:bg-gray-100"><ArrowLeft size={20}/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedCustomer.phone}</p>
                </div>
                {userRole === 'Admin' && <div className="ml-auto text-right"><p className="text-xs text-gray-500 font-bold">GÜNCEL BAKİYE</p><p className={`text-3xl font-bold ${selectedCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₺{selectedCustomer.balance.toLocaleString()}</p></div>}
            </div>

            <div className="flex gap-4 mb-6 border-b">
                <button onClick={() => setDetailTab('movements')} className={`pb-2 font-bold ${detailTab === 'movements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Hesap Hareketleri</button>
                <button onClick={() => setDetailTab('installments')} className={`pb-2 font-bold ${detailTab === 'installments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Taksit Planı ({totalDueInstallments})</button>
                <button onClick={() => setDetailTab('statement')} className={`pb-2 font-bold ${detailTab === 'statement' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>Ekstre</button>
            </div>

            {detailTab === 'movements' && (
                <>
                    {userRole === 'Admin' && (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button onClick={() => { setNewTrans({...newTrans, type: 'payment'}); setShowTransactionModal(true); }} className="bg-green-600 text-white p-4 rounded-xl shadow-sm hover:bg-green-700 flex items-center justify-center gap-2 font-bold"><Wallet size={24}/> TAHSİLAT EKLE</button>
                            <button onClick={() => { setNewTrans({...newTrans, type: 'debt'}); setShowTransactionModal(true); }} className="bg-red-600 text-white p-4 rounded-xl shadow-sm hover:bg-red-700 flex items-center justify-center gap-2 font-bold"><FileText size={24}/> BORÇ EKLE</button>
                        </div>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase"><tr><th className="px-6 py-3">TARİH</th><th className="px-6 py-3">İŞLEM</th><th className="px-6 py-3">AÇIKLAMA</th>{userRole === 'Admin' && <th className="px-6 py-3 text-right">TUTAR</th>}</tr></thead>
                            <tbody className="divide-y">{customerTrans.map((t) => (<tr key={t.id} className="hover:bg-gray-50"><td className="px-6 py-3 text-gray-600">{t.date}</td><td className="px-6 py-3">{t.type === 'debt' ? 'Satış/Borç' : 'Ödeme'}</td><td className="px-6 py-3 font-medium text-gray-800">{t.description}</td>{userRole === 'Admin' && <td className={`px-6 py-3 text-right font-bold ${t.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>₺{t.amount.toLocaleString()}</td>}</tr>))}</tbody>
                        </table>
                    </div>
                </>
            )}

            {detailTab === 'installments' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                            <tr><th className="px-6 py-3">NO</th><th className="px-6 py-3">VADE TARİHİ</th><th className="px-6 py-3">DURUM</th><th className="px-6 py-3">TUTAR</th><th className="px-6 py-3 text-right">İŞLEM</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {customerInstalls.map((ins) => (
                                <tr key={ins.id} className={`hover:bg-gray-50 ${ins.status === 'Gecikmiş' ? 'bg-red-50/50' : ins.status === 'Ödendi' ? 'bg-green-50/50' : ''}`}>
                                    <td className="px-6 py-3 font-bold">{ins.no}</td>
                                    <td className="px-6 py-3 text-gray-700">{ins.date}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ins.status === 'Ödendi' ? 'bg-green-100 text-green-700' : ins.status === 'Gecikmiş' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {ins.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-bold text-gray-800">₺{ins.amount}</td>
                                    <td className="px-6 py-3 text-right">
                                        {ins.status !== 'Ödendi' && (
                                            <button onClick={() => payInstallment(ins)} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">TAHSİL ET</button>
                                        )}
                                        {ins.status === 'Ödendi' && <span className="text-green-600 text-xs flex items-center justify-end gap-1"><CheckCircle size={14}/> Ödendi ({ins.paidDate})</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {detailTab === 'statement' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                        <div className="font-bold text-gray-700 text-sm">Cari Ekstre — {selectedCustomer.name}</div>
                        <div className="flex items-center gap-2">
                            <input type="date" value={stmtStartDate} onChange={e => setStmtStartDate(e.target.value)} className="px-2 py-1 border rounded text-xs"/>
                            <span className="text-xs text-gray-500">—</span>
                            <input type="date" value={stmtEndDate} onChange={e => setStmtEndDate(e.target.value)} className="px-2 py-1 border rounded text-xs"/>
                            <select value={stmtTypeFilter} onChange={e => setStmtTypeFilter(e.target.value)} className="px-2 py-1 border rounded text-xs">
                              <option value="ALL">Tümü</option>
                              <option value="debt">BORÇ</option>
                              <option value="payment">ÖDEME</option>
                            </select>
                            <input value={stmtSearch} onChange={e => setStmtSearch(e.target.value)} placeholder="Belge/Açıklama" className="px-2 py-1 border rounded text-xs w-40"/>
                            <input type="number" value={stmtMinAmount} onChange={e => setStmtMinAmount(e.target.value)} placeholder="Min ₺" className="px-2 py-1 border rounded text-xs w-24"/>
                            <input type="number" value={stmtMaxAmount} onChange={e => setStmtMaxAmount(e.target.value)} placeholder="Max ₺" className="px-2 py-1 border rounded text-xs w-24"/>
                            <div className="flex items-center gap-1">
                              <button className="px-2 py-1 border rounded text-xs" onClick={() => {
                                const d = new Date();
                                const iso = d.toISOString().slice(0,10);
                                setStmtStartDate(iso); setStmtEndDate(iso);
                              }}>Bugün</button>
                              <button className="px-2 py-1 border rounded text-xs" onClick={() => {
                                const d = new Date();
                                const dow = (d.getDay()+6)%7; // Pazartesi=0
                                const start = new Date(d); start.setDate(d.getDate()-dow);
                                const end = new Date(start); end.setDate(start.getDate()+6);
                                const isoS = new Date(start.getTime()-start.getTimezoneOffset()*60000).toISOString().slice(0,10);
                                const isoE = new Date(end.getTime()-end.getTimezoneOffset()*60000).toISOString().slice(0,10);
                                setStmtStartDate(isoS); setStmtEndDate(isoE);
                              }}>Bu Hafta</button>
                              <button className="px-2 py-1 border rounded text-xs" onClick={() => {
                                const d = new Date();
                                const s = new Date(d.getFullYear(), d.getMonth(), 1);
                                const e = new Date(d.getFullYear(), d.getMonth()+1, 0);
                                const isoS = new Date(s.getTime()-s.getTimezoneOffset()*60000).toISOString().slice(0,10);
                                const isoE = new Date(e.getTime()-e.getTimezoneOffset()*60000).toISOString().slice(0,10);
                                setStmtStartDate(isoS); setStmtEndDate(isoE);
                              }}>Bu Ay</button>
                              <button className="px-2 py-1 border rounded text-xs" onClick={() => {
                                const d = new Date();
                                const s = new Date(d.getFullYear(), 0, 1);
                                const isoS = new Date(s.getTime()-s.getTimezoneOffset()*60000).toISOString().slice(0,10);
                                const isoE = d.toISOString().slice(0,10);
                                setStmtStartDate(isoS); setStmtEndDate(isoE);
                              }}>YBG</button>
                              <button className="px-2 py-1 border rounded text-xs" onClick={() => {
                                const d = new Date();
                                const e = new Date(d.getTime()-d.getTimezoneOffset()*60000);
                                const isoE = e.toISOString().slice(0,10);
                                const s = new Date(e); s.setDate(e.getDate()-30);
                                const isoS = s.toISOString().slice(0,10);
                                setStmtStartDate(isoS); setStmtEndDate(isoE);
                              }}>30g</button>
                              <button className="px-2 py-1 border rounded text-xs" onClick={() => { setStmtStartDate(''); setStmtEndDate(''); }}>Temizle</button>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600">Sayfa Boyutu</label>
                              <select value={stmtPageSize} onChange={e => { setStmtPageSize(Number(e.target.value)||50); setStmtPage(1); }} className="px-2 py-1 border rounded text-xs">
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                              </select>
                              <div className="flex items-center gap-1">
                                <button className="px-2 py-1 border rounded text-xs" onClick={() => setStmtPage(1)}>{'<<'}</button>
                                <button className="px-2 py-1 border rounded text-xs" onClick={() => setStmtPage(p => Math.max(1, p-1))}>{'<'}</button>
                                <span className="text-xs text-gray-600">{stmtPage}</span>
                                <button className="px-2 py-1 border rounded text-xs" onClick={() => setStmtPage(p => p+1)}>{'>'}</button>
                                {(() => {
                                  const custId = selectedCustomer.id;
                                  const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                                    const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                                    return { date: s.date, type: 'debt', amount: debt, description: `Satış (${s.method})`, id: s.id };
                                  });
                                  const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                                    if (s.method === 'Veresiye') return { date: s.date, type: 'payment', amount: Number(s.total||0), description: 'İade (Veresiye)', id: s.id+':RET' };
                                    const related = installments.filter(ins => ins.saleId === s.id);
                                    const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                                    return { date: s.date, type: 'payment', amount: cancelled, description: 'İade (Taksitli bekleyen taksitler)', id: s.id+':RET' };
                                  });
                                  const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type, amount: Number(t.amount||0), description: t.description || '-', id: t.id }));
                                  const allRows = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
                                  const start = stmtStartDate ? new Date(stmtStartDate) : null;
                                  const end = stmtEndDate ? new Date(stmtEndDate) : null;
                                  const rows = allRows.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'debt') || (stmtTypeFilter === 'payment' && r.type === 'payment'); const searchOk = stmtSearch ? String(r.description||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.id||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.amount||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.amount||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
                                  const openingBalance = start ? allRows.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'debt' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
                                  let run = openingBalance;
                                  const enriched = rows.map(r => { run += r.type === 'debt' ? Number(r.amount||0) : -Number(r.amount||0); return { ...r, balance: run }; });
                                  const enrichedSorted = stmtSortDesc ? [...enriched].reverse() : enriched;
                                  const totalRows = enrichedSorted.length;
                                  const totalPages = Math.max(1, Math.ceil(totalRows / (stmtPageSize||50)));
                                  return (
                                    <>
                                      <span className="text-xs text-gray-600">/ {totalPages}</span>
                                      <button className="px-2 py-1 border rounded text-xs" onClick={() => setStmtPage(totalPages)}>{'>>'}</button>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-xs text-gray-600">Tarih Sırası</label>
                                <button className="px-2 py-1 border rounded text-xs" onClick={() => { setStmtSortDesc(v => !v); setStmtPage(1); }}>{stmtSortDesc ? 'Azalan' : 'Artan'}</button>
                              </div>
                            </div>
                            <button onClick={() => {
                              const custId = selectedCustomer.id;
                              const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                                const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                                return { Tarih: s.date, Islem: 'BORÇ', Belge: s.id, Aciklama: `Satış (${s.method}) ${s.id}`, Tutar: debt };
                              });
                              const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                                if (s.method === 'Veresiye') return { Tarih: s.date, Islem: 'ÖDEME', Belge: s.id, Aciklama: `İade (Veresiye) ${s.id}`, Tutar: Number(s.total||0) };
                                const related = installments.filter(ins => ins.saleId === s.id);
                                const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                                return { Tarih: s.date, Islem: 'ÖDEME', Belge: s.id, Aciklama: `İade (Taksitli) ${s.id}`, Tutar: cancelled };
                              });
                              const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ Tarih: t.date, Islem: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', Belge: t.id, Aciklama: t.description || '-', Tutar: Number(t.amount||0) }));
                              const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.Tarih) - parseTRDate(b.Tarih));
                              const start = stmtStartDate ? new Date(stmtStartDate) : null;
                              const end = stmtEndDate ? new Date(stmtEndDate) : null;
                              const filtered = rowsAll.filter(r => { const d = parseTRDate(r.Tarih); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.Islem === 'BORÇ') || (stmtTypeFilter === 'payment' && r.Islem === 'ÖDEME'); const searchOk = stmtSearch ? String(r.Aciklama||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.Belge||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.Tutar||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.Tutar||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
                              const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.Tarih) < start).reduce((acc, r) => acc + (r.Islem === 'BORÇ' ? Number(r.Tutar||0) : -Number(r.Tutar||0)), 0) : 0;
                              const periodDebt = filtered.filter(r => r.Islem === 'BORÇ').reduce((acc, r) => acc + Number(r.Tutar||0), 0);
                              const periodPayment = filtered.filter(r => r.Islem === 'ÖDEME').reduce((acc, r) => acc + Number(r.Tutar||0), 0);
                              const periodNet = periodDebt - periodPayment;
                              const closingBalance = openingBalance + periodNet;
                              let run = openingBalance;
                              const enriched = filtered.map(r => { run += r.Islem === 'BORÇ' ? Number(r.Tutar||0) : -Number(r.Tutar||0); return { ...r, Bakiye: run }; });
                              const enrichedSorted = stmtSortDesc ? [...enriched].reverse() : enriched;
                              const wsData = [
                                { Tarih: (stmtStartDate||'-'), Islem: 'AÇILIŞ', Belge: '-', Aciklama: 'Dönem Açılış Bakiyesi', Tutar: '-', Bakiye: openingBalance },
                                ...enrichedSorted.map(r => ({ Tarih: r.Tarih, Islem: r.Islem, Belge: r.Belge || r['Belge'] || undefined, Aciklama: r.Aciklama, Tutar: r.Tutar, Bakiye: r.Bakiye }))
                              ];
                              const ws = XLSX.utils.json_to_sheet(wsData);
                              ws['!cols'] = [
                                { wch: 12 },
                                { wch: 10 },
                                { wch: 16 },
                                { wch: 40 },
                                { wch: 14 },
                                { wch: 14 },
                              ];
                              if (ws['!ref']) {
                                const range = XLSX.utils.decode_range(ws['!ref']);
                                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                                  const addrAmount = XLSX.utils.encode_cell({ r: R, c: 4 });
                                  const addrBalance = XLSX.utils.encode_cell({ r: R, c: 5 });
                                  if (ws[addrAmount] && typeof ws[addrAmount].v === 'number') ws[addrAmount].z = '#,##0.00';
                                  if (ws[addrBalance] && typeof ws[addrBalance].v === 'number') ws[addrBalance].z = '#,##0.00';
                                }
                                ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.e.c } }) };
                              }
                              const wb = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(wb, ws, 'Ekstre');
                              const wsSummary = XLSX.utils.json_to_sheet([
                                { 'Firma': companyInfo.name||'' },
                                { 'Adres': companyInfo.address||'' },
                                { 'Müşteri': selectedCustomer.name||'' },
                                { 'Müşteri Telefonu': selectedCustomer.phone||'' },
                                { 'Aralık': `${(stmtStartDate||'-')} — ${(stmtEndDate||'-')}` },
                                { 'Açılış Bakiyesi': openingBalance },
                                { 'Dönem Borç Toplamı': periodDebt },
                                { 'Dönem Ödeme Toplamı': periodPayment },
                                { 'Dönem Net': periodNet },
                                { 'Kapanış Bakiyesi': closingBalance }
                              ]);
                              wsSummary['!cols'] = [ { wch: 24 }, { wch: 20 } ];
                              XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');
                              const safe = (s) => String(s||'').replace(/[\\/:*?"<>|]/g, '_');
                              XLSX.writeFile(wb, `Ekstre_${safe(selectedCustomer.name)}_${new Date().toISOString().slice(0,10)}.xlsx`);
                            }} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-bold">Excel</button>
                            <button onClick={() => {
                              const custId = selectedCustomer.id;
                              const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                                const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                                return { date: s.date, type: 'BORÇ', id: s.id, description: `Satış (${s.method})`, amount: debt };
                              });
                              const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                                if (s.method === 'Veresiye') return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Veresiye)', amount: Number(s.total||0) };
                                const related = installments.filter(ins => ins.saleId === s.id);
                                const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                                return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Taksitli bekleyen taksitler)', amount: cancelled };
                              });
                              const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', description: t.description || '-', amount: Number(t.amount||0) }));
                              const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
                              const start = stmtStartDate ? new Date(stmtStartDate) : null;
                              const end = stmtEndDate ? new Date(stmtEndDate) : null;
                              const filtered = rowsAll.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'BORÇ') || (stmtTypeFilter === 'payment' && r.type === 'ÖDEME'); const searchOk = stmtSearch ? String(r.description||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.id||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.amount||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.amount||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
                              const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
                              const periodDebt = filtered.filter(r => r.type === 'BORÇ').reduce((acc, r) => acc + Number(r.amount||0), 0);
                              const periodPayment = filtered.filter(r => r.type === 'ÖDEME').reduce((acc, r) => acc + Number(r.amount||0), 0);
                              const periodNet = periodDebt - periodPayment;
                              const closingBalance = openingBalance + periodNet;
                              const printWindow = window.open('', '', 'width=800,height=900');
    let runBal = openingBalance;
    const enriched = filtered.map(r => { runBal += r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0); return { ...r, balance: runBal }; });
    const displayRows = stmtSortDesc ? [...enriched].reverse() : enriched;
    const rowsHtml = [
      `<tr><td>${stmtStartDate||'-'}</td><td>AÇILIŞ</td><td>-</td><td>Dönem Açılış Bakiyesi</td><td style="text-align:right">-</td><td style="text-align:right">₺${openingBalance.toLocaleString()}</td></tr>`,
      ...displayRows.map(r => { const balStyle = Number(r.balance||0) < 0 ? 'color:#b91c1c' : 'color:#064e3b'; return `<tr><td>${r.date}</td><td>${r.type}</td><td>${r.id||''}</td><td>${r.description}</td><td style=\"text-align:right\">₺${Number(r.amount||0).toLocaleString()}</td><td style=\"text-align:right;${balStyle}\">₺${Number(r.balance||0).toLocaleString()}</td></tr>`; })
    ].join('');
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <meta charset="utf-8" />
                                    <title>Cari Ekstre</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; color: #000; }
                                      h2 { margin: 0 0 8px; }
                                      table { width: 100%; border-collapse: collapse; font-size: 12px; }
                                      th, td { border: 1px solid #000; padding: 6px; }
                                      th { background: #eee; }
                                      .header { display:flex; justify-content:space-between; margin-bottom:8px; }
                                      .meta { font-size: 12px; }
                                       .summary { margin: 8px 0; font-size: 12px; }
                                       .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
                                       .sig { text-align: center; font-size: 12px; }
                                       .sig .line { margin-top: 36px; border-top: 1px solid #000; }
                                      tr { page-break-inside: avoid; }
                                      .signatures { page-break-inside: avoid; }
                                      @media print {
                                        thead { display: table-header-group; }
                                      }
                                      .company { margin-bottom: 8px; }
                                      .company .big { font-weight: bold; font-size: 14px; }
                                      .footer-note { margin-top: 12px; font-size: 11px; text-align: center; }
                                      .logo { max-height: 50px; }
                                      .page-footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 11px; color: #333; display:flex; justify-content: space-between; padding: 6px 0; }
                                      .page-footer .pagenum:after { content: counter(page) " / " counter(pages); }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="header">
                                      <h2>Cari Ekstre</h2>
                                      <div class="meta">
                                        <div>Müşteri: ${selectedCustomer.name}</div>
                                        <div>Firma: ${selectedCustomer.company||'-'}</div>
                                        <div>Telefon: ${selectedCustomer.phone||'-'}</div>
                                        <div>Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</div>
                                        <div>Aralık: ${(stmtStartDate||'-')} — ${(stmtEndDate||'-')}</div>
                                        <div>Filtre: ${(stmtTypeFilter==='ALL'?'Tümü':stmtTypeFilter==='debt'?'BORÇ':'ÖDEME')}</div>
                                      </div>
                                    </div>
                                    ${companyInfo.logo ? `<img class=\"logo\" src=\"${companyInfo.logo}\" alt=\"Logo\"/>` : ''}
                                    <div class="company">
                                      <div class="big">${companyInfo.name||''}</div>
                                      <div>${companyInfo.address||''}</div>
                                    </div>
                                    <div class=\"summary\">
                                      <div>Açılış Bakiyesi: ₺${openingBalance.toLocaleString()}</div>
                                      <div>Dönem BORÇ: ₺${periodDebt.toLocaleString()} — Dönem ÖDEME: ₺${periodPayment.toLocaleString()} — Net: ₺${periodNet.toLocaleString()}</div>
                                      <div>Kapanış Bakiyesi: ₺${closingBalance.toLocaleString()}</div>
                                    </div>
                                    <table>
                                      <thead><tr><th>Tarih</th><th>İşlem</th><th>Belge</th><th>Açıklama</th><th>Tutar</th><th>Bakiye</th></tr></thead>
                                      <tbody>${rowsHtml}</tbody>
                                    </table>
                                    <div class="signatures">
                                      <div class="sig"><div>Düzenleyen</div><div class="line"></div></div>
                                      <div class="sig"><div>Muhasebe</div><div class="line"></div></div>
                                      <div class="sig"><div>Yetkili</div><div class="line"></div></div>
                                    </div>
                                    <div class="footer-note">${companyInfo.footer||''}</div>
                                    <div class="page-footer">
                                      <div>${companyInfo.name||''}</div>
                                      <div class="pagenum"></div>
                                      <div>${new Date().toLocaleDateString('tr-TR')}</div>
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.focus();
                              setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
                            }} className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-bold flex items-center gap-1"><Printer size={14}/> Yazdır</button>
                            <button onClick={() => {
                              const custId = selectedCustomer.id;
                              const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                                const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                                return { date: s.date, type: 'BORÇ', id: s.id, description: `Satış (${s.method})`, amount: debt };
                              });
                              const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                                if (s.method === 'Veresiye') return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Veresiye)', amount: Number(s.total||0) };
                                const related = installments.filter(ins => ins.saleId === s.id);
                                const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                                return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Taksitli bekleyen taksitler)', amount: cancelled };
                              });
                              const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', description: t.description || '-', amount: Number(t.amount||0) }));
                              const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
                              const start = stmtStartDate ? new Date(stmtStartDate) : null;
                              const end = stmtEndDate ? new Date(stmtEndDate) : null;
                              const filtered = rowsAll.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'BORÇ') || (stmtTypeFilter === 'payment' && r.type === 'ÖDEME'); return (!start || d >= start) && (!end || d <= end) && typeOk; });
                              const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
                              const periodDebt = filtered.filter(r => r.type === 'BORÇ').reduce((acc, r) => acc + Number(r.amount||0), 0);
                              const periodPayment = filtered.filter(r => r.type === 'ÖDEME').reduce((acc, r) => acc + Number(r.amount||0), 0);
                              const periodNet = periodDebt - periodPayment;
                              const closingBalance = openingBalance + periodNet;
                              let runBal = openingBalance;
                              const enriched = filtered.map(r => { runBal += r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0); return { ...r, balance: runBal }; });
                              const displayRows = stmtSortDesc ? [...enriched].reverse() : enriched;
                              const rowsHtml = [
                                `<tr><td>${stmtStartDate||'-'}</td><td>AÇILIŞ</td><td>-</td><td>Dönem Açılış Bakiyesi</td><td style="text-align:right">-</td><td style="text-align:right">₺${openingBalance.toLocaleString()}</td></tr>`,
                                ...displayRows.map(r => { return `<tr><td>${r.date}</td><td>${r.type}</td><td>${r.id||''}</td><td>${r.description}</td><td style=\"text-align:right\">₺${Number(r.amount||0).toLocaleString()}</td><td style=\"text-align:right\">₺${Number(r.balance||0).toLocaleString()}</td></tr>`; })
                              ].join('');
                              const html = `
                                <html>
                                  <head>
                                    <meta charset=\"utf-8\" />
                                    <title>Cari Ekstre</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; color: #000; }
                                      h2 { margin: 0 0 8px; }
                                      table { width: 100%; border-collapse: collapse; font-size: 12px; }
                                      th, td { border: 1px solid #000; padding: 6px; }
                                      th { background: #eee; }
                                      .header { display:flex; justify-content:space-between; margin-bottom:8px; }
                                      .meta { font-size: 12px; }
                                      .summary { margin: 8px 0; font-size: 12px; }
                                      .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
                                      .sig { text-align: center; font-size: 12px; }
                                      .sig .line { margin-top: 36px; border-top: 1px solid #000; }
                                      tr { page-break-inside: avoid; }
                                      .signatures { page-break-inside: avoid; }
                                      @media print { thead { display: table-header-group; } }
                                      .company { margin-bottom: 8px; }
                                      .company .big { font-weight: bold; font-size: 14px; }
                                       .footer-note { margin-top: 12px; font-size: 11px; text-align: center; }
                                       .logo { max-height: 50px; }
                                      .page-footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 11px; color: #333; display:flex; justify-content: space-between; padding: 6px 0; }
                                      .page-footer .pagenum:after { content: counter(page) " / " counter(pages); }
                                    </style>
                                  </head>
                                  <body>
                                    <div class=\"header\">
                                      <h2>Cari Ekstre</h2>
                                      <div class=\"meta\">
                                        <div>Müşteri: ${selectedCustomer.name}</div>
                                        <div>Firma: ${selectedCustomer.company||'-'}</div>
                                        <div>Telefon: ${selectedCustomer.phone||'-'}</div>
                                        <div>Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</div>
                                        <div>Aralık: ${(stmtStartDate||'-')} — ${(stmtEndDate||'-')}</div>
                                        <div>Filtre: ${(stmtTypeFilter==='ALL'?'Tümü':stmtTypeFilter==='debt'?'BORÇ':'ÖDEME')}</div>
                                      </div>
                                    </div>
                                    ${companyInfo.logo ? `<img class=\"logo\" src=\"${companyInfo.logo}\" alt=\"Logo\"/>` : ''}
                                    <div class=\"company\">
                                      <div class=\"big\">${companyInfo.name||''}</div>
                                      <div>${companyInfo.address||''}</div>
                                    </div>
                                    <div class=\"summary\">
                                      <div>Açılış Bakiyesi: ₺${openingBalance.toLocaleString()}</div>
                                      <div>Dönem BORÇ: ₺${periodDebt.toLocaleString()} — Dönem ÖDEME: ₺${periodPayment.toLocaleString()} — Net: ₺${periodNet.toLocaleString()}</div>
                                      <div>Kapanış Bakiyesi: ₺${closingBalance.toLocaleString()}</div>
                                    </div>
                                    <table>
                                      <thead><tr><th>Tarih</th><th>İşlem</th><th>Belge</th><th>Açıklama</th><th>Tutar</th><th>Bakiye</th></tr></thead>
                                      <tbody>${rowsHtml}</tbody>
                                    </table>
                                    <div class=\"signatures\">
                                      <div class=\"sig\"><div>Düzenleyen</div><div class=\"line\"></div></div>
                                      <div class=\"sig\"><div>Muhasebe</div><div class=\"line\"></div></div>
                                      <div class=\"sig\"><div>Yetkili</div><div class=\"line\"></div></div>
                                    </div>
                                    <div class=\"footer-note\">${companyInfo.footer||''}</div>
                                    <div class=\"page-footer\">
                                      <div>${companyInfo.name||''}</div>
                                      <div class=\"pagenum\"></div>
                                      <div>${new Date().toLocaleDateString('tr-TR')}</div>
                                    </div>
                                  </body>
                                </html>
                              `;
                              if (window.print && typeof window.print.toPDF === 'function') {
                                const safe = (s) => String(s||'').replace(/[\\/:*?"<>|]/g, '_');
                                const fname = `Ekstre_${safe(companyInfo.name)}_${safe(selectedCustomer.name)}_${new Date().toISOString().slice(0,10)}.pdf`;
                                window.print.toPDF(html, fname).catch(() => {});
                              }
                            }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold">PDF</button>
                        </div>
                    </div>
                    <div className="px-6 py-2 bg-gray-50 border-b text-xs text-gray-700">
                      {(() => {
                        const custId = selectedCustomer.id;
                        const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                          const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                          return { date: s.date, type: 'BORÇ', amount: debt };
                        });
                        const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                          if (s.method === 'Veresiye') return { date: s.date, type: 'ÖDEME', amount: Number(s.total||0) };
                          const related = installments.filter(ins => ins.saleId === s.id);
                          const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                          return { date: s.date, type: 'ÖDEME', amount: cancelled };
                        });
                        const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', amount: Number(t.amount||0) }));
                        const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
                        const start = stmtStartDate ? new Date(stmtStartDate) : null;
                        const end = stmtEndDate ? new Date(stmtEndDate) : null;
                        const filtered = rowsAll.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'BORÇ') || (stmtTypeFilter === 'payment' && r.type === 'ÖDEME'); return (!start || d >= start) && (!end || d <= end) && typeOk; });
                        const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
                        const periodDebt = filtered.filter(r => r.type === 'BORÇ').reduce((acc, r) => acc + Number(r.amount||0), 0);
                        const periodPayment = filtered.filter(r => r.type === 'ÖDEME').reduce((acc, r) => acc + Number(r.amount||0), 0);
                        const periodNet = periodDebt - periodPayment;
                        const closingBalance = openingBalance + periodNet;
                        return (
                          <div className="flex gap-6">
                            <div>Açılış: <span className="font-bold">₺{openingBalance.toLocaleString()}</span></div>
                            <div>Dönem BORÇ: <span className="font-bold text-red-600">₺{periodDebt.toLocaleString()}</span></div>
                            <div>Dönem ÖDEME: <span className="font-bold text-green-600">₺{periodPayment.toLocaleString()}</span></div>
                            <div>Net: <span className="font-bold">₺{periodNet.toLocaleString()}</span></div>
                            <div>Kapanış: <span className="font-bold">₺{closingBalance.toLocaleString()}</span></div>
                          </div>
                        );
                      })()}
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">TARİH</th>
                                <th className="px-6 py-3">İŞLEM</th>
                                <th className="px-6 py-3">BELGE</th>
                                <th className="px-6 py-3">AÇIKLAMA</th>
                                <th className="px-6 py-3 text-right">TUTAR</th>
                                <th className="px-6 py-3 text-right">BAKİYE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {(() => {
                              const custId = selectedCustomer.id;
                              const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                                const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                                return { date: s.date, type: 'debt', amount: debt, description: `Satış (${s.method})`, id: s.id };
                              });
                              const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                                if (s.method === 'Veresiye') return { date: s.date, type: 'payment', amount: Number(s.total||0), description: 'İade (Veresiye)', id: s.id+':RET' };
                                const related = installments.filter(ins => ins.saleId === s.id);
                                const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                                return { date: s.date, type: 'payment', amount: cancelled, description: 'İade (Taksitli bekleyen taksitler)', id: s.id+':RET' };
                              });
                              const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type, amount: Number(t.amount||0), description: t.description || '-', id: t.id }));
                              const allRows = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
                              const start = stmtStartDate ? new Date(stmtStartDate) : null;
                              const end = stmtEndDate ? new Date(stmtEndDate) : null;
                              const rows = allRows.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'debt') || (stmtTypeFilter === 'payment' && r.type === 'payment'); const searchOk = stmtSearch ? String(r.description||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.id||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.amount||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.amount||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
                              const openingBalance = start ? allRows.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'debt' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
                              let run = openingBalance;
                              const enriched = rows.map(r => { run += r.type === 'debt' ? Number(r.amount||0) : -Number(r.amount||0); return { ...r, balance: run }; });
                              const enrichedSorted = stmtSortDesc ? [...enriched].reverse() : enriched;
                              const totalRows = enrichedSorted.length;
                              const totalPages = Math.max(1, Math.ceil(totalRows / (stmtPageSize||50)));
                              const curPage = Math.min(stmtPage, totalPages);
                              const startIdx = (curPage - 1) * (stmtPageSize||50);
                              const pageRows = enrichedSorted.slice(startIdx, startIdx + (stmtPageSize||50));
                              const periodDebt = enrichedSorted.filter(r => r.type === 'debt').reduce((acc, r) => acc + Number(r.amount||0), 0);
                              const periodPayment = enrichedSorted.filter(r => r.type !== 'debt').reduce((acc, r) => acc + Number(r.amount||0), 0);
                              const periodNet = periodDebt - periodPayment;
                              const closingBalance = openingBalance + periodNet;
                              return [
                                (
                                  <tr key="opening" className="bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{stmtStartDate || '-'}</td>
                                    <td className="px-6 py-3">AÇILIŞ</td>
                                    <td className="px-6 py-3 text-gray-700">-</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">Dönem Açılış Bakiyesi</td>
                                    <td className="px-6 py-3 text-right font-bold">-</td>
                                    <td className="px-6 py-3 text-right font-bold">₺{Number(openingBalance||0).toLocaleString()}</td>
                                  </tr>
                                ),
                                ...(curPage === 1 ? pageRows.slice(0, pageRows.length).map(r => (
                                  <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{r.date}</td>
                                    <td className="px-6 py-3">{r.type === 'debt' ? 'BORÇ' : 'ÖDEME'}</td>
                                    <td className="px-6 py-3 text-gray-700">{r.id}</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">{r.description}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${r.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>₺{r.amount.toLocaleString()}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${Number(r.balance||0) < 0 ? 'text-red-600' : 'text-green-700'}`}>₺{Number(r.balance||0).toLocaleString()}</td>
                                  </tr>
                                )) : pageRows.map(r => (
                                  <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{r.date}</td>
                                    <td className="px-6 py-3">{r.type === 'debt' ? 'BORÇ' : 'ÖDEME'}</td>
                                    <td className="px-6 py-3 text-gray-700">{r.id}</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">{r.description}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${r.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>₺{r.amount.toLocaleString()}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${Number(r.balance||0) < 0 ? 'text-red-600' : 'text-green-700'}`}>₺{Number(r.balance||0).toLocaleString()}</td>
                                  </tr>
                                ))),
                                (curPage === totalPages ?
                                  <tr key="summary" className="bg-gray-100">
                                    <td className="px-6 py-3 text-gray-600">{stmtEndDate || '-'}</td>
                                    <td className="px-6 py-3">ÖZET</td>
                                    <td className="px-6 py-3 text-gray-700">-</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">BORÇ: ₺{periodDebt.toLocaleString()} — ÖDEME: ₺{periodPayment.toLocaleString()} — NET: ₺{periodNet.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-right font-bold">₺{periodNet.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-right font-bold">₺{closingBalance.toLocaleString()}</td>
                                  </tr> : null)
                              ];
                            })()}
                        </tbody>
                    </table>
                </div>
            )}
            
            {showTransactionModal && userRole === 'Admin' && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 text-gray-800">İşlem Ekle</h3>
                        <div className="space-y-3">
                            <input className="w-full p-2 border rounded" placeholder="Açıklama" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})}/>
                            <input type="number" className="w-full p-2 border rounded" placeholder="Tutar" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})}/>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowTransactionModal(false)} className="px-4 py-2 text-gray-500">İptal</button>
                            <button onClick={handleSaveTransaction} className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button>
                            </div>
                        </div>
                        <div className="mt-3 px-6 w-full">
                          {(() => {
                            const custId = selectedCustomer.id;
                            const saleRows = sales.filter(s => s.customerId === custId && (s.method === 'Veresiye' || s.method === 'Taksitli')).map(s => {
                              const debt = s.method === 'Veresiye' ? Number(s.total||0) : Math.max(0, Number(s.total||0) - Number(s.downPayment||0));
                              return { date: s.date, type: 'BORÇ', id: s.id, description: `Satış (${s.method})`, amount: debt };
                            });
                            const refundRows = sales.filter(s => s.customerId === custId && s.status === 'İade').map(s => {
                              if (s.method === 'Veresiye') return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Veresiye)', amount: Number(s.total||0) };
                              const related = installments.filter(ins => ins.saleId === s.id);
                              const cancelled = related.filter(ins => ins.status === 'İptal').reduce((a,b)=>a+Number(b.amount||0),0);
                              return { date: s.date, type: 'ÖDEME', id: s.id, description: 'İade (Taksitli bekleyen taksitler)', amount: cancelled };
                            });
                            const txnRows = (transactions || []).filter(t => t.customerId === custId).map(t => ({ date: t.date, type: t.type === 'debt' ? 'BORÇ' : 'ÖDEME', id: t.id, description: t.description || '-', amount: Number(t.amount||0) }));
                            const rowsAll = [...saleRows, ...refundRows, ...txnRows].sort((a,b) => parseTRDate(a.date) - parseTRDate(b.date));
                            const start = stmtStartDate ? new Date(stmtStartDate) : null;
                            const end = stmtEndDate ? new Date(stmtEndDate) : null;
                            const filtered = rowsAll.filter(r => { const d = parseTRDate(r.date); const typeOk = (stmtTypeFilter === 'ALL') || (stmtTypeFilter === 'debt' && r.type === 'BORÇ') || (stmtTypeFilter === 'payment' && r.type === 'ÖDEME'); const searchOk = stmtSearch ? String(r.description||'').toLowerCase().includes(stmtSearch.toLowerCase()) || String(r.id||'').toLowerCase().includes(stmtSearch.toLowerCase()) : true; const minOk = stmtMinAmount !== '' ? Number(r.amount||0) >= Number(stmtMinAmount) : true; const maxOk = stmtMaxAmount !== '' ? Number(r.amount||0) <= Number(stmtMaxAmount) : true; return (!start || d >= start) && (!end || d <= end) && typeOk && searchOk && minOk && maxOk; });
                            const openingBalance = start ? rowsAll.filter(r => parseTRDate(r.date) < start).reduce((acc, r) => acc + (r.type === 'BORÇ' ? Number(r.amount||0) : -Number(r.amount||0)), 0) : 0;
                            const periodDebt = filtered.filter(r => r.type === 'BORÇ').reduce((acc, r) => acc + Number(r.amount||0), 0);
                            const periodPayment = filtered.filter(r => r.type === 'ÖDEME').reduce((acc, r) => acc + Number(r.amount||0), 0);
                            const periodNet = periodDebt - periodPayment;
                            const closingBalance = openingBalance + periodNet;
                            return (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2 py-1 text-xs border rounded bg-gray-100">Açılış: ₺{openingBalance.toLocaleString()}</span>
                                <span className="px-2 py-1 text-xs border rounded bg-red-100">BORÇ: ₺{periodDebt.toLocaleString()}</span>
                                <span className="px-2 py-1 text-xs border rounded bg-green-100">ÖDEME: ₺{periodPayment.toLocaleString()}</span>
                                <span className="px-2 py-1 text-xs border rounded bg-indigo-100">Net: ₺{periodNet.toLocaleString()}</span>
                                <span className="px-2 py-1 text-xs border rounded bg-yellow-100">Kapanış: ₺{closingBalance.toLocaleString()}</span>
                              </div>
                            );
                          })()}
                        </div>
                    </div>
            )}
        </div>
    );
  }
  
  return null;
};

export default Customers;
