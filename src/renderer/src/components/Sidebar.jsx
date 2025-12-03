import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ShoppingCart, ShoppingBag, Package, FileText, Settings, ChevronRight, TrendingDown, Wallet, Truck, UserCheck, PieChart, ClipboardList, Shield, LogOut, Sun, Moon, Move, History, PackageCheck, Tag, Percent } from 'lucide-react';

const Sidebar = ({ activePage, onPageChange, userRole, userName, theme, toggleTheme, activeModules }) => {
  const [moduleRoles, setModuleRoles] = useState({});
  useEffect(() => {
    (async () => {
      const rolesMap = await window.db.get('module_roles') || {};
      setModuleRoles(rolesMap);
    })();
  }, []);

  const moduleRequirements = {
    transfer: 'transfer',
    production: 'production',
    service: 'service',
    personnel: 'personnel',
    audit_log: 'audit_log',
    reports: 'analytics',
    ai_assistant: 'ai_assistant',
    demand_forecast: 'demand_forecast',
    dynamic_pricing: 'dynamic_pricing',
    e_invoice: 'e_invoice',
    e_archive: 'e_archive',
    e_dispatch: 'e_dispatch',
    tax_reporting: 'tax_reporting',
    serial_lot: 'serial_lot'
  };
  
  const allMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Genel Bakış', roles: ['Admin'] },
    { id: 'reports', icon: PieChart, label: 'Raporlar', roles: ['Admin'] },
    { id: 'sales', icon: ShoppingCart, label: 'Satış İşlemleri', roles: ['Admin', 'Kasiyer'] },
    { id: 'stock', icon: Package, label: 'Stok & Depo', roles: ['Admin', 'Depocu'] },
    { id: 'stock_count', icon: PackageCheck, label: 'Stok Sayımı', roles: ['Admin', 'Depocu'] }, // YENİ: STOK SAYIM MODÜLÜ
    { id: 'stock_movements', icon: Move, label: 'Stok Hareketleri', roles: ['Admin', 'Depocu'] },
    { id: 'suppliers', icon: Truck, label: 'Tedarikçiler', roles: ['Admin', 'Depocu'] },
    { id: 'crm', icon: Users, label: 'Müşteriler & CRM', roles: ['Admin', 'Kasiyer'] },
    { id: 'cheques', icon: FileText, label: 'Çek & Senet', roles: ['Admin'] },
    { id: 'accounts', icon: Wallet, label: 'Kasa & Banka', roles: ['Admin'] },
    { id: 'invoices', icon: FileText, label: 'Faturalar', roles: ['Admin', 'Kasiyer'] },
    { id: 'e_invoice', icon: FileText, label: 'E-Fatura', roles: ['Admin', 'Kasiyer'] },
    { id: 'e_archive', icon: FileText, label: 'E-Arşiv', roles: ['Admin', 'Kasiyer'] },
    { id: 'e_dispatch', icon: FileText, label: 'E-İrsaliye', roles: ['Admin', 'Depocu'] },
    { id: 'expenses', icon: TrendingDown, label: 'Giderler', roles: ['Admin'] },
    { id: 'audit_log', icon: History, label: 'İşlem Geçmişi', roles: ['Admin'] },
    { id: 'marketplace', icon: ShoppingBag, label: 'Market', roles: ['Admin', 'Kasiyer', 'Depocu'] },
    { id: 'transfer', icon: Truck, label: 'Depo Transfer', roles: ['Admin', 'Depocu'] },
    { id: 'production', icon: ClipboardList, label: 'Üretim & Reçete', roles: ['Admin'] },
    { id: 'service', icon: UserCheck, label: 'Teknik Servis', roles: ['Admin'] },
    { id: 'ai_assistant', icon: PieChart, label: 'AI Asistan', roles: ['Admin'] },
    { id: 'demand_forecast', icon: ClipboardList, label: 'Talep Tahmini', roles: ['Admin'] },
    { id: 'dynamic_pricing', icon: Tag, label: 'Dinamik Fiyatlama', roles: ['Admin'] },
    { id: 'serial_lot', icon: Package, label: 'Seri/Lot Takibi', roles: ['Admin', 'Depocu'] },
    { id: 'campaigns', icon: Percent, label: 'Kampanya & Promosyon', roles: ['Admin'] },
    { id: 'tax_reporting', icon: FileText, label: 'Vergi Raporlama', roles: ['Admin'] }
  ];

  const allowedMenuItems = allMenuItems
    .filter(item => item.roles.includes(userRole || 'Admin'))
    .filter(item => {
      const req = moduleRequirements[item.id];
      if (!req) return true;
      const modActive = activeModules.includes(req);
      const roleAllowed = !moduleRoles[req] || (moduleRoles[req] || []).includes(userRole || 'Admin');
      return modActive && roleAllowed;
    });

  return (
    <div className="h-screen w-64 bg-sidebar-bg text-gray-400 flex flex-col border-r border-gray-800 shadow-2xl">
      <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-800 bg-sidebar-bg">
        <h1 className="text-white font-bold text-lg">ALFA<span className="text-accent">ERP</span></h1>
        <p className="text-xs text-gray-500 mt-1">{userName || 'Yönetici'}</p>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {allowedMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all 
              ${activePage === item.id ? 'bg-accent text-white shadow-md' : 'hover:bg-sidebar-hover hover:text-white'}`}
          >
            <div className="flex items-center space-x-3">
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            {activePage === item.id && <ChevronRight size={16} />}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 bg-sidebar-bg space-y-1">
        <button onClick={() => toggleTheme()} className="w-full flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            {theme === 'light' ? <Moon size={18}/> : <Sun size={18} className="text-yellow-400"/>}
            <span>{theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}</span>
        </button>
        
        {userRole === 'Admin' && (
            <button onClick={() => onPageChange('settings')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${activePage === 'settings' ? 'bg-blue-900 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Settings size={18}/> <span>Ayarlar</span>
            </button>
        )}

        <button onClick={() => window.location.reload()} className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-white hover:bg-red-900/20 rounded-md transition-colors">
            <LogOut size={18}/> <span>Çıkış Yap</span>
        </button>
      </div>

    </div>
  );
};
export default Sidebar;
