import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Accounts from './pages/Accounts';
import Suppliers from './pages/Suppliers';
import Personnel from './pages/Personnel';
import Reports from './pages/Reports';
import Proposals from './pages/Proposals';
import UsersPage from './pages/Users';
import Marketplace from './pages/Marketplace';
import AiAssistant from './pages/AiAssistant';
import DemandForecast from './pages/DemandForecast';
import DynamicPricing from './pages/DynamicPricing';
import TaxReporting from './pages/TaxReporting';
import Campaigns from './pages/Campaigns';
import SerialLot from './pages/SerialLot';
import Cheques from './pages/Cheques';
import Transfer from './pages/Transfer';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AuditLog from './pages/AuditLog'; 
import Production from './pages/Production';
import Service from './pages/Service';
import StockCount from './pages/StockCount'; // YENİ: STOK SAYIM MODÜLÜ
import StockMovements from './pages/StockMovements';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [activeModules, setActiveModules] = useState([]);

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  // --- LOGLAMA FONKSİYONU ---
  const logActivity = async (type, activity) => {
    const logs = await window.db.get('audit_logs') || [];
    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleDateString('tr-TR'),
      time: new Date().toLocaleTimeString('tr-TR'),
      user: currentUser ? currentUser.username : 'Sistem',
      type, // CREATE, UPDATE, DELETE, SALE, ERROR
      activity, // Detay
    };
    await window.db.set('audit_logs', [newLog, ...logs]);
  };
  // ------------------------------------

  React.useEffect(() => {
    (async () => {
      const defaultFree = ['personnel','analytics','audit_log','excel_io','role_permissions','settings_plus'];
      if (window.db && typeof window.db.get === 'function') {
        const stored = await window.db.get('active_modules');
        setActiveModules(stored && Array.isArray(stored) && stored.length > 0 ? stored : defaultFree);
      } else {
        setActiveModules(defaultFree);
      }
    })();
  }, [currentUser]);

  if (!currentUser) {
    return <Login onLogin={(user) => { 
        setCurrentUser(user); 
        logActivity('LOGIN', `Kullanıcı giriş yaptı: ${user.username} (${user.role})`);
        if(user.role === 'Kasiyer') setCurrentPage('sales');
        else if(user.role === 'Depocu') setCurrentPage('stock');
        else setCurrentPage('dashboard');
    }} />;
  }

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-bg-light text-slate-800'}`}>
      
      <Sidebar 
        activePage={currentPage} 
        onPageChange={setCurrentPage} 
        userRole={currentUser.role} 
        userName={currentUser.name}
        theme={theme}
        toggleTheme={toggleTheme}
        activeModules={activeModules}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden overflow-y-auto">
        
        {/* Tüm Modüller */}
        {currentPage === 'marketplace' && <Marketplace userRole={currentUser.role} logActivity={logActivity} activeModules={activeModules} setActiveModules={setActiveModules} />}
        {currentPage === 'sales' && <Sales userRole={currentUser.role} logActivity={logActivity} activeModules={activeModules} />}
        {currentPage === 'proposals' && <Proposals userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'stock' && <Products userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'stock_count' && <StockCount userRole={currentUser.role} />} {/* YENİ SAYFA */}
        {currentPage === 'suppliers' && <Suppliers userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'crm' && <Customers userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'invoices' && <Invoices userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'cheques' && <Cheques userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'stock_movements' && <StockMovements userRole={currentUser.role} logActivity={logActivity} />}
        {currentPage === 'e_invoice' && activeModules.includes('e_invoice') && <Invoices userRole={currentUser.role} logActivity={logActivity} mode="e_invoice" />}
        {currentPage === 'e_archive' && activeModules.includes('e_archive') && <Invoices userRole={currentUser.role} logActivity={logActivity} mode="e_archive" />}
        {currentPage === 'e_dispatch' && activeModules.includes('e_dispatch') && <Invoices userRole={currentUser.role} logActivity={logActivity} mode="e_dispatch" />}

        {/* ADMIN SAYFALARI */}
        {currentUser.role === 'Admin' && (
            <>
                {currentPage === 'dashboard' && <Dashboard userRole={currentUser.role} />}
                {currentPage === 'reports' && <Reports userRole={currentUser.role} />}
                {currentPage === 'expenses' && <Expenses userRole={currentUser.role} />}
                {currentPage === 'personnel' && <Personnel userRole={currentUser.role} />}
                {currentPage === 'accounts' && <Accounts userRole={currentUser.role} />}
                {currentPage === 'users' && <UsersPage userRole={currentUser.role} />}
                {currentPage === 'marketplace' && <Marketplace userRole={currentUser.role} logActivity={logActivity} activeModules={activeModules} setActiveModules={setActiveModules} />}
                {currentPage === 'transfer' && activeModules.includes('transfer') && <Transfer userRole={currentUser.role} />}
                {currentPage === 'production' && activeModules.includes('production') && <Production userRole={currentUser.role} />}
                {currentPage === 'service' && activeModules.includes('service') && <Service userRole={currentUser.role} />}
                {currentPage === 'ai_assistant' && activeModules.includes('ai_assistant') && <AiAssistant />}
                {currentPage === 'demand_forecast' && activeModules.includes('demand_forecast') && <DemandForecast />}
                {currentPage === 'dynamic_pricing' && activeModules.includes('dynamic_pricing') && <DynamicPricing />}
                {currentPage === 'campaigns' && activeModules.includes('campaigns') && <Campaigns />}
                {currentPage === 'tax_reporting' && activeModules.includes('tax_reporting') && <TaxReporting />}
                {currentPage === 'serial_lot' && activeModules.includes('serial_lot') && <SerialLot />}
                {currentPage === 'settings' && <Settings userRole={currentUser.role} logActivity={logActivity} />} 
                {currentPage === 'audit_log' && activeModules.includes('audit_log') && <AuditLog />} 
            </>
        )}

      </main>
    </div>
  );
}

export default App;
