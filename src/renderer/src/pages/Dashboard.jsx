import React, { useState, useEffect } from 'react'; 
import { TrendingUp, Users, AlertCircle, Wallet, TrendingDown, PiggyBank, Bell, CalendarClock, ScrollText } from 'lucide-react';
import { AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ userRole }) => {
  // --- 1. STATE VE İLK TANIMLAMALAR ---
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    totalExpense: 0, 
    netProfit: 0, 
    activeCustomers: 0, 
    criticalStock: 0 
  });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [upcomingCheques, setUpcomingCheques] = useState([]);
  const [dueInstallments, setDueInstallments] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => { loadData(); }, []);

  // --- 2. VERİ TOPLAMA VE HESAPLAMA (UZUNLUĞUN ANA KAYNAĞI) ---
  const loadData = async () => {
    // 2.1. TÜM VERİLERİ ÇEK
    const sales = await window.db.get('sales') || [];
    const expenses = await window.db.get('expenses') || [];
    const products = await window.db.get('products') || [];
    const customers = await window.db.get('customers') || [];
    const cheques = await window.db.get('cheques') || [];
    const installments = await window.db.get('installments') || [];

    // 2.2. FİNANSAL HESAPLAMALAR
    const revenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
    const expenseTotal = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const profit = revenue - expenseTotal;
    const critical = products.filter(p => p.stock < 5).length;
    setStats({ totalRevenue: revenue, totalExpense: expenseTotal, netProfit: profit, activeCustomers: customers.length, criticalStock: critical });

    // 2.3. TARİH PARSE FONKSİYONU (GÜVENLİ)
    const parseTRDate = (str) => {
        if (!str || str.indexOf('.') === -1) return new Date(0);
        const [day, month, year] = str.split('.');
        if (!day || !month || !year) return new Date(0);
        return new Date(`${year}-${month}-${day}`);
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // 2.4. AJANDA/UYARILARIN HESAPLANMASI
    const filteredCheques = cheques.filter(c => {
        if (c.status !== 'Portföyde' && c.status !== 'Ödenecek') return false;
        const dueDate = new Date(c.dueDate);
        return dueDate <= nextWeek;
    });
    setUpcomingCheques(filteredCheques);

    const filteredInstallments = installments.filter(ins => {
        if (ins.status === 'Ödendi') return false;
        const insDate = parseTRDate(ins.date);
        return insDate <= nextWeek;
    });
    setDueInstallments(filteredInstallments);
    setLowStockProducts(products.filter(p => p.stock < 5).slice(0, 5));

    // 2.5. GRAFİK VERİLERİNİN HAZIRLANMASI
    const salesMap = {};
    sales.forEach(sale => {
        const date = sale.date.slice(0, 5); 
        salesMap[date] = (salesMap[date] || 0) + sale.total;
    });
    const formattedChartData = Object.keys(salesMap).map(date => ({ name: date, satis: salesMap[date] })).slice(-7);
    setChartData(formattedChartData);

    const categoryMap = {};
    products.forEach(p => {
        const cat = p.category || "Diğer";
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const formattedPieData = Object.keys(categoryMap).map(cat => ({ name: cat, value: categoryMap[cat] }));
    setPieData(formattedPieData);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // --- 3. ARAYÜZ (GÖSTERİM) KISMI ---
  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
        <header className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Yönetim Paneli</h2>
        </header>

        {/* UYARI KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-xs font-bold uppercase">Net Kar</p>
                <h3 className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{stats.netProfit.toLocaleString()}
                </h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-xs font-bold uppercase">Toplam Ciro</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">₺{stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-xs font-bold uppercase">Kritik Stok</p>
                <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.criticalStock} Ürün</h3>
            </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-xs font-bold uppercase">Kayıtlı Müşteri</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.activeCustomers} Kişi</h3>
            </div>
        </div>

        {/* GRAFİKLER VE AJANDA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-6">Haftalık Satış Trendi</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/><XAxis dataKey="name" axisLine={false} tickLine={false} dy={10}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="satis" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSatis)" /></AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-y-auto max-h-[400px]">
                <h3 className="font-bold text-gray-700 mb-4">Ajanda ve Hatırlatıcılar</h3>
                
                <div className="space-y-3">
                    {lowStockProducts.map(p => (<div key={p.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"><div className="p-2 bg-white rounded-lg text-red-500 shadow-sm"><AlertCircle size={16}/></div><div className="flex-1"><p className="text-sm font-bold text-gray-800">{p.name}</p><p className="text-xs text-red-500">Stok: {p.stock} adet kaldı!</p></div></div>))}
                    {dueInstallments.map(i => (<div key={i.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100"><div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm"><CalendarClock size={16}/></div><div className="flex-1"><p className="text-sm font-bold text-gray-800">{i.customerName}</p><p className="text-xs text-orange-600">Taksit: {i.date} - ₺{i.amount}</p></div></div>))}
                    {upcomingCheques.map(c => (<div key={c.id} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100"><div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><ScrollText size={16}/></div><div className="flex-1"><p className="text-sm font-bold text-gray-800">{c.contactName}</p><p className="text-xs text-indigo-600">Çek Vadesi: {c.dueDate} - ₺{c.amount}</p></div></div>))}
                </div>
            </div>
        </div>
    </div>
  );
};
export default Dashboard;