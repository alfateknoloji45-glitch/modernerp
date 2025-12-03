import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, Lock, Monitor, PenTool, Truck, Wrench, ClipboardList, Package, Percent, Tag, Barcode, Scan, Cloud, FileSpreadsheet, FileText, Shield, Users, Settings, Database, Printer, ShoppingCart, Building, PieChart, Wallet, Search, Star } from 'lucide-react';

const Marketplace = ({ logActivity, activeModules, setActiveModules, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tümü');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [moduleRoles, setModuleRoles] = useState({});
  const [detailModule, setDetailModule] = useState(null);
  const [banner, setBanner] = useState(null);
  const [actionModule, setActionModule] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ name: '', card: '', expiry: '', cvv: '' });
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFav, setShowOnlyFav] = useState(false);
  const [pinFavorites, setPinFavorites] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [showOnlyAudit, setShowOnlyAudit] = useState(false);
  const [auditIds, setAuditIds] = useState([]);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [auditStart, setAuditStart] = useState('');
  const [auditEnd, setAuditEnd] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['MODULE','MODULE_ROLE','MODULE_ERROR','PURCHASE','CONFLICT_RULE']);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchRegex, setSearchRegex] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [regexError, setRegexError] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [historyFull, setHistoryFull] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [bulkPreset, setBulkPreset] = useState('ALL');
  const [openDepsId, setOpenDepsId] = useState(null);
  const [openConfId, setOpenConfId] = useState(null);
  const [openDependentsId, setOpenDependentsId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [openHealthId, setOpenHealthId] = useState(null);
  const [compareProfileName, setCompareProfileName] = useState('');
  const [compareOpen, setCompareOpen] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [openPreviewId, setOpenPreviewId] = useState(null);
  const [previewAction, setPreviewAction] = useState('activate');
  const [importProfilesOpen, setImportProfilesOpen] = useState(false);
  const [importProfilesText, setImportProfilesText] = useState('');
  const [simOpen, setSimOpen] = useState(false);
  const [simType, setSimType] = useState('activate');
  const [openResolveId, setOpenResolveId] = useState(null);
  const [openConfMgr, setOpenConfMgr] = useState(false);
  const [openSummary, setOpenSummary] = useState(false);
  const [moduleQuickFilter, setModuleQuickFilter] = useState('');
  const [roleQuickFilter, setRoleQuickFilter] = useState('');
  const [openCycles, setOpenCycles] = useState(false);
  const [auditDays, setAuditDays] = useState(7);
  const [auditTypesForChart, setAuditTypesForChart] = useState(['MODULE','MODULE_ERROR','PURCHASE']);
  const [conflictRules, setConflictRules] = useState([]);
  const [openRulesMgr, setOpenRulesMgr] = useState(false);
  const [newRuleA, setNewRuleA] = useState('');
  const [newRuleB, setNewRuleB] = useState('');
  const [rulesImportOpen, setRulesImportOpen] = useState(false);
  const [rulesImportText, setRulesImportText] = useState('');

  // Tüm Modüllerin Listesi
  const allModules = [
    { id: 'production', category: 'Operasyon', name: 'Üretim & Reçete', desc: 'Ürün reçeteleri, imalat takibi ve hammadde yönetimi.', price: '1.500 ₺', icon: PenTool },
    { id: 'service', category: 'Operasyon', name: 'Teknik Servis', desc: 'Cihaz kabul, tamir takibi, yedek parça ve servis fişi.', price: '2.000 ₺', icon: Wrench },
    { id: 'transfer', category: 'Stok/Depo', name: 'Depo Transfer', desc: 'Şubeler arası mal transferi ve depo yönetimi.', price: '1.000 ₺', icon: Truck },
    { id: 'personnel', category: 'İK', name: 'İnsan Kaynakları', desc: 'Personel maaş, avans ve izin takibi.', price: 'Ücretsiz', icon: Users },
    { id: 'po', category: 'Satınalma', name: 'Satınalma (PO)', desc: 'Tedarik talep, sipariş, kabul ve iade süreçleri.', price: '1.250 ₺', icon: ClipboardList },
    { id: 'warehouse_adv', category: 'Stok/Depo', name: 'Çok Depo & Lokasyon', desc: 'Raf adresleme, sayım ve lokasyon bazlı stok.', price: '1.000 ₺', icon: Building },
    { id: 'price_lists', category: 'Fiyat', name: 'Fiyat Listeleri', desc: 'Müşteri/tip bazlı fiyatlandırma yönetimi.', price: '800 ₺', icon: Tag },
    { id: 'campaigns', category: 'Pazarlama', name: 'Kampanya & Promosyon', desc: 'İndirim kuralları, çoklu kampanya yönetimi.', price: '900 ₺', icon: Percent },
    { id: 'serial_lot', category: 'Stok/Depo', name: 'Seri/Lot Takibi', desc: 'Parti ve seri numarası bazlı izlenebilirlik.', price: '1.100 ₺', icon: Package },
    { id: 'pos_screen', category: 'Satış', name: 'Müşteri Ekranı', desc: 'Kasa arkasına müşteri bilgilendirme ekranı.', price: '750 ₺', icon: Monitor },
    { id: 'barcode_scale', category: 'Satış', name: 'Barkod & Terazi', desc: 'Barkod ve terazi barkodu ile hızlı satış.', price: '600 ₺', icon: Barcode },
    { id: 'qr_scanner', category: 'Satış', name: 'QR Kod Okuma', desc: 'QR ile ürün ve belge erişimi.', price: '450 ₺', icon: Scan },
    { id: 'e_invoice', category: 'E-Belge', name: 'E-Fatura', desc: 'Temel e-fatura oluşturma ve gönderim.', price: '1.400 ₺', icon: FileText },
    { id: 'e_archive', category: 'E-Belge', name: 'E-Arşiv', desc: 'E-arşiv belge üretimi ve saklama.', price: '1.000 ₺', icon: FileText },
    { id: 'e_dispatch', category: 'E-Belge', name: 'E-İrsaliye', desc: 'Sevkiyat irsaliyesi elektronik süreç.', price: '1.000 ₺', icon: FileText },
    { id: 'excel_io', category: 'Altyapı', name: 'Excel İçe/Dışa Aktarım', desc: 'Toplu veri aktarımı ve rapor eksport.', price: 'Ücretsiz', icon: FileSpreadsheet },
    { id: 'cloud_backup', category: 'Altyapı', name: 'Bulut Yedekleme', desc: 'Otomatik yedek ve geri yükleme.', price: '700 ₺', icon: Cloud },
    { id: 'audit_log', category: 'Altyapı', name: 'İşlem Geçmişi', desc: 'Detaylı olay ve değişiklik kaydı.', price: 'Ücretsiz', icon: Database },
    { id: 'role_permissions', category: 'Altyapı', name: 'Yetki & Rol', desc: 'İnce taneli izin ve rol yönetimi.', price: 'Ücretsiz', icon: Shield },
    { id: 'ecom_trendyol', category: 'Entegrasyon', name: 'Trendyol Entegrasyonu', desc: 'Ürün, stok ve sipariş senkronizasyonu.', price: '1.200 ₺', icon: ShoppingCart },
    { id: 'ecom_hepsiburada', category: 'Entegrasyon', name: 'Hepsiburada Entegrasyonu', desc: 'Çok kanal sipariş ve fiyat eşitleme.', price: '1.200 ₺', icon: ShoppingCart },
    { id: 'receipt_print', category: 'Satış', name: 'Fiş/Yazıcı Yönetimi', desc: 'USB/Bluetooth printer ve fiş tasarımı.', price: '500 ₺', icon: Printer },
    { id: 'analytics', category: 'Analitik', name: 'Analitik & Raporlar', desc: 'Kârlılık ve trend analizleri.', price: 'Ücretsiz', icon: PieChart },
    { id: 'multi_currency', category: 'Finans', name: 'Çok Para Birimi', desc: 'Kur ve çoklu para birimi işlemleri.', price: '600 ₺', icon: Wallet },
    { id: 'settings_plus', category: 'Altyapı', name: 'Gelişmiş Ayarlar', desc: 'Parametrik sistem ayarları.', price: 'Ücretsiz', icon: Settings },
    { id: 'ai_assistant', category: 'Analitik', name: 'Yapay Zeka Asistan', desc: 'Sohbet asistanı, akıllı öneriler ve komutlar.', price: '1.500 ₺', icon: PieChart },
    { id: 'demand_forecast', category: 'Analitik', name: 'Talep Tahmini (AI)', desc: 'Satış verisine göre stok talep tahmini.', price: '1.400 ₺', icon: PieChart },
    { id: 'anomaly_detection', category: 'Analitik', name: 'Anomali Tespiti', desc: 'Şüpheli işlem ve stok sapmalarının analizi.', price: '1.000 ₺', icon: Shield },
    { id: 'dynamic_pricing', category: 'Fiyat', name: 'Dinamik Fiyatlama', desc: 'Pazar ve maliyetlere göre fiyat optimizasyonu.', price: '1.300 ₺', icon: Tag },
    { id: 'fraud_detection', category: 'Analitik', name: 'Dolandırıcılık Koruma', desc: 'Riskli hareketleri otomatik bloklama.', price: '1.600 ₺', icon: Shield },
    { id: 'ocr_invoice', category: 'E-Belge', name: 'OCR Fatura/Fiş', desc: 'Belge tarama ve otomatik veri çıkarımı.', price: '1.200 ₺', icon: FileText },
    { id: 'nlp_search', category: 'Altyapı', name: 'Doğal Dil Arama', desc: 'Doğal dille arama ve filtreleme.', price: '900 ₺', icon: Search },
    { id: 'vision_scanner', category: 'Satış', name: 'Gelişmiş Barkod/QR', desc: 'Kamera tabanlı hızlı okuma ve doğrulama.', price: '800 ₺', icon: Barcode },
    { id: 'voice_pos', category: 'Satış', name: 'Sesli POS', desc: 'Satışta sesle ürün bul ve işlem yap.', price: '750 ₺', icon: Users },
    { id: 'bank_sync', category: 'Finans', name: 'Banka Entegrasyonu', desc: 'Hesap hareketlerini otomatik senkronize et.', price: '1.000 ₺', icon: Wallet },
    { id: 'api_access', category: 'Entegrasyon', name: 'API Erişimi', desc: 'Harici sistemlerle REST API entegrasyonu.', price: 'Ücretsiz', icon: Settings },
    { id: 'webhooks', category: 'Entegrasyon', name: 'Webhook Olayları', desc: 'Gerçek zamanlı olay tetikleme.', price: 'Ücretsiz', icon: Settings },
    { id: 'sso', category: 'Altyapı', name: 'Tek Oturum (SSO)', desc: 'Kurumsal tek oturum sistemleri.', price: '1.100 ₺', icon: Shield },
    { id: 'push_notifications', category: 'Altyapı', name: 'Bildirimler', desc: 'Mobil ve masaüstü push bildirimleri.', price: 'Ücretsiz', icon: Cloud },
    { id: 'mobile_app', category: 'Entegrasyon', name: 'Mobil Uygulama', desc: 'Saha satış ve stok uygulaması.', price: '1.800 ₺', icon: Monitor },
    { id: 'self_checkout', category: 'Satış', name: 'Self Checkout', desc: 'Müşteri self servis ödeme.', price: '1.300 ₺', icon: ShoppingCart },
    { id: 'kiosk_mode', category: 'Satış', name: 'Kiosk Modu', desc: 'Tek ekranda kısıtlı kullanım.', price: '500 ₺', icon: Monitor },
    { id: 'tax_reporting', category: 'Finans', name: 'Vergi Raporlama', desc: 'Yerel mevzuata uygun raporlama.', price: '900 ₺', icon: FileText },
    { id: 'kkm_compliance', category: 'Uyum', name: 'KKM Uyum', desc: 'KKM mevzuatına uyum kontrolleri.', price: '700 ₺', icon: Shield }
  ];

  const dependencies = {
    e_invoice: ['settings_plus'],
    e_archive: ['settings_plus'],
    e_dispatch: ['settings_plus'],
    campaigns: ['price_lists'],
    ai_assistant: ['analytics'],
    demand_forecast: ['analytics'],
    dynamic_pricing: ['price_lists'],
    ecom_trendyol: ['api_access'],
    ecom_hepsiburada: ['api_access'],
    multi_currency: ['settings_plus']
  };
  const conflicts = {
    dynamic_pricing: ['campaigns'],
    campaigns: ['dynamic_pricing']
  };

  const depGraph = (rootId) => {
    const visited = new Set();
    const result = [];
    const walk = (id, depth) => {
      if (visited.has(id)) return;
      visited.add(id);
      const deps = dependencies[id] || [];
      deps.forEach(d => {
        result.push({ id: d, depth });
        walk(d, depth + 1);
      });
    };
    walk(rootId, 1);
    return result;
  };
  const revDepsMap = Object.entries(dependencies).reduce((acc,[mod, deps]) => {
    deps.forEach(d => { acc[d] = Array.isArray(acc[d]) ? [...acc[d], mod] : [mod]; });
    return acc;
  }, {});
  const hasCycleFrom = (start) => {
    const stack = new Set();
    const visited = new Set();
    const dfs = (id) => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      stack.add(id);
      for (const d of (dependencies[id] || [])) {
        if (dfs(d)) return true;
      }
      stack.delete(id);
      return false;
    };
    return dfs(start);
  };

  const getModule = (id) => allModules.find(m => m.id === id);
  const getModuleByName = (name) => allModules.find(m => m.name === name);
  const isFree = (id) => (getModule(id)?.price || '').includes('Ücretsiz');
  const missingDeps = (moduleId, actives) => (dependencies[moduleId] || []).filter(d => !actives.includes(d));
  const hasConflict = (moduleId, actives) => {
    if ((conflicts[moduleId] || []).some(c => actives.includes(c))) return true;
    return (conflictRules || []).some(r => Array.isArray(r) && r.length===2 && r.includes(moduleId) && actives.includes(r[0]===moduleId ? r[1] : r[0]));
  };
  const requireAdmin = () => {
    if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Bu işlem için Admin yetkisi gerekli' }); return false; }
    return true;
  };
  const toggleFavorite = async (id) => {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(next);
    if (window.db && typeof window.db.set === 'function') {
      await window.db.set('marketplace_favorites', next);
    }
  };
  const bulkActivateFiltered = async () => {
    if (!requireAdmin()) return;
    setHistoryStack(stack => [...stack, activeModules]);
    setRedoStack([]);
    let updated = [...activeModules];
    const filtered = allModules
      .filter(m => category==='Tümü' || m.category===category)
      .filter(m => !showOnlyActive || activeModules.includes(m.id))
      .filter(m => !showOnlyFav || favorites.includes(m.id))
      .filter(m => !searchTerm || (m.name + ' ' + m.desc).toLowerCase().includes(searchTerm.toLowerCase()));
    let activated = 0;
    let skipped = 0;
    for (const m of filtered) {
      if (updated.includes(m.id)) continue;
      if (!isFree(m.id)) { skipped++; continue; }
      const nextTry = [...updated, m.id];
      if (hasConflict(m.id, nextTry)) { skipped++; continue; }
      const miss = missingDeps(m.id, nextTry);
      const paidMiss = miss.filter(d => !isFree(d));
      if (paidMiss.length > 0) { skipped++; continue; }
      const freeMiss = miss.filter(d => isFree(d));
      updated = Array.from(new Set([...nextTry, ...freeMiss]));
      activated++;
    }
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    if (typeof logActivity === 'function') {
      logActivity('MODULE', `Toplu aktivasyon: ${activated}, atlanan: ${skipped}`);
    }
    setBanner({ type: 'success', message: `Toplu aktivasyon tamamlandı: ${activated}` });
  };
  const bulkDeactivateFiltered = async () => {
    if (!requireAdmin()) return;
    setHistoryStack(stack => [...stack, activeModules]);
    setRedoStack([]);
    const reverseDeps = Object.entries(dependencies).reduce((acc,[mod, deps]) => {
      deps.forEach(d => { acc[d] = Array.isArray(acc[d]) ? [...acc[d], mod] : [mod]; });
      return acc;
    }, {});
    const filtered = allModules
      .filter(m => category==='Tümü' || m.category===category)
      .filter(m => !showOnlyActive || activeModules.includes(m.id))
      .filter(m => !showOnlyFav || favorites.includes(m.id))
      .filter(m => !searchTerm || (m.name + ' ' + m.desc).toLowerCase().includes(searchTerm.toLowerCase()));
    let updated = [...activeModules];
    let removed = 0;
    let skipped = 0;
    for (const m of filtered) {
      if (!updated.includes(m.id)) continue;
      const dependents = reverseDeps[m.id] || [];
      const hasActiveDependent = dependents.some(dep => updated.includes(dep));
      if (hasActiveDependent) { skipped++; continue; }
      updated = updated.filter(x => x !== m.id);
      removed++;
    }
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    if (typeof logActivity === 'function') {
      logActivity('MODULE', `Toplu pasifleştirme: ${removed}, atlanan: ${skipped}`);
    }
    setBanner({ type: 'info', message: `Toplu pasifleştirme tamamlandı: ${removed}` });
  };
  const fillMissingFreeDeps = async () => {
    if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Bu işlem için Admin yetkisi gerekli' }); return; }
    setHistoryStack(stack => [...stack, activeModules]);
    setRedoStack([]);
    let updated = [...activeModules];
    let added = 0;
    let changed = true;
    while (changed) {
      changed = false;
      for (const mId of [...updated]) {
        const miss = missingDeps(mId, updated);
        const freeMiss = miss.filter(d => isFree(d));
        for (const d of freeMiss) {
          const nextTry = [...updated, d];
          if (hasConflict(d, nextTry)) continue;
          const missDeps = missingDeps(d, nextTry);
          const hasPaid = missDeps.some(x => !isFree(x));
          if (hasPaid) continue;
          const freeDepsOfD = missDeps.filter(x => isFree(x));
          updated = Array.from(new Set([...nextTry, ...freeDepsOfD]));
          added++;
          changed = true;
        }
      }
    }
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    setBanner({ type: 'success', message: `Eksik ücretsiz bağımlılıklar tamamlandı: ${added}` });
  };
  const priceValue = (p) => {
    if (!p) return 0;
    if ((p + '').includes('Ücretsiz')) return 0;
    const num = Number((p + '').replace(/\D/g, ''));
    return isNaN(num) ? 0 : num;
  };
  const moduleMatchesQuick = (m) => {
    switch (moduleQuickFilter) {
      case 'PAID':
        return !isFree(m.id);
      case 'FREE':
        return isFree(m.id);
      case 'HAS_DEPS':
        return (dependencies[m.id] || []).length > 0;
      case 'HAS_ACTIVE_CONFLICT':
        return (conflicts[m.id] || []).some(c => activeModules.includes(c));
      case 'MISSING_FREE_DEPS': {
        const miss = missingDeps(m.id, [...activeModules, m.id]);
        return miss.some(d => isFree(d));
      }
      case 'MISSING_PAID_DEPS': {
        const miss = missingDeps(m.id, [...activeModules, m.id]);
        return miss.some(d => !isFree(d));
      }
      default:
        return true;
    }
  };
  const moduleMatchesRole = (m) => {
    if (!roleQuickFilter) return true;
    const roles = moduleRoles[m.id] || [];
    if (roleQuickFilter === 'NONE') return roles.length === 0;
    return roles.includes(roleQuickFilter);
  };
  const compareMods = (a, b) => {
    let va, vb;
    switch (sortKey) {
      case 'name':
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
        break;
      case 'price':
        va = priceValue(a.price); vb = priceValue(b.price);
        break;
      case 'status':
        va = activeModules.includes(a.id) ? 1 : 0;
        vb = activeModules.includes(b.id) ? 1 : 0;
        break;
      default:
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
    }
    const diff = va < vb ? -1 : va > vb ? 1 : 0;
    return sortOrder === 'asc' ? diff : -diff;
  };
  const saveModuleRoles = async (next) => {
    setModuleRoles(next);
    if (window.db && typeof window.db.set === 'function') {
      await window.db.set('module_roles', next);
    }
    if (typeof logActivity === 'function') {
      const modId = Object.keys(next).pop();
      const roles = next[modId] || [];
      logActivity('MODULE_ROLE', `Modül ${modId} roller: ${roles.join(', ')}`);
    }
  };
  const saveProfile = async () => {
    const name = (profileName || '').trim();
    if (name.length < 2) { setBanner({ type: 'error', message: 'Profil adı en az 2 karakter' }); return; }
    const next = [...profiles.filter(p => p.name !== name), { name, modules: activeModules }];
    await window.db.set('module_profiles', next);
    setProfiles(next);
    setBanner({ type: 'success', message: `Profil kaydedildi: ${name}` });
    if (typeof logActivity === 'function') {
      logActivity('MODULE', `Profil kaydedildi: ${name}`);
    }
  };
  const applyProfile = async (name) => {
    const p = profiles.find(x => x.name === name);
    if (!p) { setBanner({ type: 'error', message: 'Profil bulunamadı' }); return; }
    if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Profil uygulamak için Admin yetkisi gerekli' }); return; }
    await window.db.set('active_modules', p.modules);
    setActiveModules(p.modules);
    setBanner({ type: 'info', message: `Profil uygulandı: ${name}` });
    if (typeof logActivity === 'function') {
      logActivity('MODULE', `Profil uygulandı: ${name}`);
    }
  };
  const deleteProfile = async (name) => {
    const next = profiles.filter(p => p.name !== name);
    await window.db.set('module_profiles', next);
    setProfiles(next);
    setBanner({ type: 'info', message: `Profil silindi: ${name}` });
  };
  const applyProfileAdds = async (name) => {
    const p = profiles.find(x => x.name === name);
    if (!p) { setBanner({ type: 'error', message: 'Profil bulunamadı' }); return; }
    if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Profil uygulamak için Admin yetkisi gerekli' }); return; }
    let updated = [...activeModules];
    let activated = 0;
    let skipped = 0;
    for (const mId of p.modules) {
      if (updated.includes(mId)) continue;
      const nextTry = [...updated, mId];
      if (hasConflict(mId, nextTry)) { skipped++; continue; }
      const miss = missingDeps(mId, nextTry);
      const paidMiss = miss.filter(d => !isFree(d));
      if (paidMiss.length > 0) { skipped++; continue; }
      const freeMiss = miss.filter(d => isFree(d));
      updated = Array.from(new Set([...nextTry, ...freeMiss]));
      activated++;
    }
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    setBanner({ type: 'success', message: `Profil eklemeleri uygulandı: ${activated}, atlanan: ${skipped}` });
  };
  const applyProfileRemoves = async (name) => {
    const p = profiles.find(x => x.name === name);
    if (!p) { setBanner({ type: 'error', message: 'Profil bulunamadı' }); return; }
    if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Profil uygulamak için Admin yetkisi gerekli' }); return; }
    let updated = [...activeModules];
    let removed = 0;
    let skipped = 0;
    for (const mId of activeModules) {
      if (p.modules.includes(mId)) continue;
      const dependents = revDepsMap[mId] || [];
      const hasActiveDependent = dependents.some(dep => updated.includes(dep));
      if (hasActiveDependent) { skipped++; continue; }
      updated = updated.filter(x => x !== mId);
      removed++;
    }
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    setBanner({ type: 'info', message: `Profil kaldırmaları uygulandı: ${removed}, atlanan: ${skipped}` });
  };
  const applyProfileMerge = async (name) => {
    const p = profiles.find(x => x.name === name);
    if (!p) { setBanner({ type: 'error', message: 'Profil bulunamadı' }); return; }
    if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Profil uygulamak için Admin yetkisi gerekli' }); return; }
    let updated = [...activeModules];
    let activated = 0;
    let removed = 0;
    let skipped = 0;
    for (const mId of p.modules) {
      if (updated.includes(mId)) continue;
      const nextTry = [...updated, mId];
      if (hasConflict(mId, nextTry)) { skipped++; continue; }
      const miss = missingDeps(mId, nextTry);
      const paidMiss = miss.filter(d => !isFree(d));
      if (paidMiss.length > 0) { skipped++; continue; }
      const freeMiss = miss.filter(d => isFree(d));
      updated = Array.from(new Set([...nextTry, ...freeMiss]));
      activated++;
    }
    for (const mId of [...updated]) {
      if (p.modules.includes(mId)) continue;
      const dependents = revDepsMap[mId] || [];
      const hasActiveDependent = dependents.some(dep => updated.includes(dep));
      if (hasActiveDependent) { skipped++; continue; }
      updated = updated.filter(x => x !== mId);
      removed++;
    }
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    setBanner({ type: 'success', message: `Profil birleştirildi. +${activated} -${removed}, atlanan: ${skipped}` });
  };

  useEffect(() => {
    (async () => {
      const filters = await window.db.get('marketplace_filters') || {};
      setSearchTerm(filters.searchTerm || '');
      setCategory(filters.category || 'Tümü');
      setShowOnlyActive(Boolean(filters.showOnlyActive));
      setSortKey(filters.sortKey || 'name');
      setSortOrder(filters.sortOrder || 'asc');
      setShowOnlyFav(Boolean(filters.showOnlyFav));
      setPinFavorites(filters.pinFavorites !== false);
      setMinPrice(filters.minPrice || '');
      setMaxPrice(filters.maxPrice || '');
      setSelectedCategories(Array.isArray(filters.selectedCategories) ? filters.selectedCategories : []);
      setSearchRegex(Boolean(filters.searchRegex));
      setFreeOnly(Boolean(filters.freeOnly));
      setModuleQuickFilter(filters.moduleQuickFilter || '');
      setRoleQuickFilter(filters.roleQuickFilter || '');
      if (typeof filters.pinFavorites === 'boolean') setPinFavorites(filters.pinFavorites);
      const rolesMap = await window.db.get('module_roles') || {};
      setModuleRoles(rolesMap);
      const favs = await window.db.get('marketplace_favorites') || [];
      setFavorites(Array.isArray(favs) ? favs : []);
      const logs = await window.db.get('audit_logs') || [];
      setRecentLogs(Array.isArray(logs) ? logs.slice(-100).reverse() : []);
      const profs = await window.db.get('module_profiles') || [];
      setProfiles(Array.isArray(profs) ? profs : []);
      const rules = await window.db.get('conflict_rules') || [];
      setConflictRules(Array.isArray(rules) ? rules.filter(r => Array.isArray(r) && r.length===2) : []);
    })();
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLast();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoLast();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        (async () => {
          try {
            const res = await (window.system && window.system.clearCache ? window.system.clearCache() : Promise.resolve({ ok: false }));
            if (res && res.ok) setBanner({ type: 'success', message: 'Önbellek temizlendi' });
            else setBanner({ type: 'error', message: 'Önbellek temizlenemedi' });
          } catch { setBanner({ type: 'error', message: 'Önbellek temizleme hatası' }); }
        })();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSimType('activate');
        setSimOpen(true);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setSimType('deactivate');
        setSimOpen(true);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAuditOpen(v => !v);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setOpenSummary(true);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setOpenConfMgr(true);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        setOpenCycles(true);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenRulesMgr(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!auditOpen) return;
    (async () => {
      const logs = await window.db.get('audit_logs') || [];
      const filtered = logs.filter(l => ['MODULE','MODULE_ROLE','MODULE_ERROR','PURCHASE','CONFLICT_RULE'].includes(l.type));
      setAuditLogs(filtered.slice(0, 10));
    })();
  }, [auditOpen]);

  useEffect(() => {
    (async () => {
      if (!showOnlyAudit) { setAuditIds([]); return; }
      const logs = await window.db.get('audit_logs') || [];
      const filtered = logs.filter(l => ['MODULE','MODULE_ROLE','MODULE_ERROR','PURCHASE','CONFLICT_RULE'].includes(l.type));
      const ids = new Set();
      filtered.forEach(l => {
        const mIdMatch = (l.activity || '').match(/Modül\s([a-zA-Z0-9_\-]+)/);
        if (mIdMatch && mIdMatch[1]) ids.add(mIdMatch[1]);
        const nameMatch = (l.activity || '').match(/Satın alındı:\s(.+)\s\(/);
        if (nameMatch && nameMatch[1]) {
          const mod = getModuleByName(nameMatch[1]);
          if (mod) ids.add(mod.id);
        }
      });
      setAuditIds(Array.from(ids));
    })();
  }, [showOnlyAudit]);
  useEffect(() => {
    if (window.db && typeof window.db.set === 'function') {
      window.db.set('marketplace_filters', { searchTerm, category, showOnlyActive, sortKey, sortOrder, showOnlyFav, pinFavorites, minPrice, maxPrice, selectedCategories, searchRegex, freeOnly, moduleQuickFilter, roleQuickFilter });
    }
  }, [searchTerm, category, showOnlyActive, sortKey, sortOrder, showOnlyFav, pinFavorites, minPrice, maxPrice, selectedCategories, searchRegex, freeOnly, moduleQuickFilter, roleQuickFilter]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const toggleModule = async (moduleId) => {
    setHistoryStack(stack => [...stack, activeModules]);
    setRedoStack([]);
    let updated;
    if (activeModules.includes(moduleId)) {
        updated = activeModules.filter(id => id !== moduleId);
    } else {
        updated = [...activeModules, moduleId];
        if (hasConflict(moduleId, updated)) {
          const builtIn = (conflicts[moduleId] || []).filter(c => updated.includes(c));
          const custom = (conflictRules || [])
            .filter(r => Array.isArray(r) && r.length===2 && (r[0]===moduleId || r[1]===moduleId))
            .map(pair => (pair[0]===moduleId ? pair[1] : pair[0]))
            .filter(c => updated.includes(c));
          const list = Array.from(new Set([...builtIn, ...custom])).join(', ');
          setBanner({ type: 'error', message: `Çakışan modüller aktif: ${list}` });
          if (typeof logActivity === 'function') {
            logActivity('MODULE_ERROR', `Çakışma: ${moduleId} ↔ ${list}`);
          }
          return;
        }
        const miss = missingDeps(moduleId, updated);
        const paidMiss = miss.filter(d => !isFree(d));
        if (paidMiss.length > 0) {
          setBanner({ type: 'error', message: `Önce bağımlı modülleri etkinleştirin: ${paidMiss.join(', ')}` });
          if (typeof logActivity === 'function') {
            logActivity('MODULE_ERROR', `Eksik ücretli bağımlılıklar: ${moduleId} → ${paidMiss.join(', ')}`);
          }
          return;
        }
        const freeMiss = miss.filter(d => isFree(d));
        if (freeMiss.length > 0) {
          updated = Array.from(new Set([...updated, ...freeMiss]));
          if (typeof logActivity === 'function') {
            logActivity('MODULE', `Bağımlılıklar etkinleştirildi: ${freeMiss.join(', ')}`);
          }
          setBanner({ type: 'success', message: `Bağımlılıklar etkinleştirildi: ${freeMiss.join(', ')}` });
        }
    }
    
    await window.db.set('active_modules', updated);
    setActiveModules(updated);
    if (typeof logActivity === 'function') {
      const nowActive = updated.includes(moduleId);
      logActivity('MODULE', `Modül ${moduleId} ${nowActive ? 'AKTİF' : 'PASİF'}`);
      if (nowActive) {
        const m = getModule(moduleId);
        if (m && m.price) logActivity('PURCHASE', `Satın alındı: ${m.name} (${m.price})`);
      }
    }
    const nowActive = updated.includes(moduleId);
    setBanner({ type: 'info', message: `Modül ${moduleId} ${nowActive ? 'aktif' : 'pasif'} yapıldı` });
    setActionModule(null);
    setActionType(null);
    setPaymentForm({ name: '', card: '', expiry: '', cvv: '' });
  };
  const undoLast = async () => {
    setRedoStack(stack => [...stack, activeModules]);
    const prev = historyStack[historyStack.length - 1];
    if (!prev) { setBanner({ type: 'error', message: 'Geri alınacak değişiklik yok' }); return; }
    const nextHist = historyStack.slice(0, -1);
    setHistoryStack(nextHist);
    await window.db.set('active_modules', prev);
    setActiveModules(prev);
    setBanner({ type: 'info', message: 'Son değişiklik geri alındı' });
  };
  const redoLast = async () => {
    const next = redoStack[redoStack.length - 1];
    if (!next) { setBanner({ type: 'error', message: 'Yineleme yok' }); return; }
    const nextRedo = redoStack.slice(0, -1);
    setRedoStack(nextRedo);
    setHistoryStack(stack => [...stack, activeModules]);
    await window.db.set('active_modules', next);
    setActiveModules(next);
    setBanner({ type: 'info', message: 'Son geri almayı yineledin' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Alfa Market</h2>
            <p className="text-gray-500 text-sm">İşletmenize güç katacak ek modüller</p>
        </div>
        <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20}/> Modül Mağazası
            <span className="ml-2 text-xs bg-white/70 text-purple-700 px-2 py-1 rounded">Aktif: {activeModules.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        {banner && (
          <div className={`flex-1 px-3 py-2 rounded text-sm ${banner.type === 'error' ? 'bg-red-100 text-red-700' : banner.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {banner.message}
          </div>
        )}
        <div className="flex items-center gap-2 border rounded px-3 py-2 bg-white">
          <Search size={16} className="text-gray-500"/>
          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="outline-none text-sm" placeholder="Modül ara..." />
        </div>
        {searchRegex && regexError && (
          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Geçersiz regex</span>
        )}
        <select value={category} onChange={e=>setCategory(e.target.value)} className="px-3 py-2 border rounded text-sm bg-white">
          {['Tümü', ...Array.from(new Set(allModules.map(m=>m.category)))].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-xs">
          {(Array.from(new Set(allModules.map(m=>m.category)))).map(cat => (
            <label key={cat} className="flex items-center gap-1">
              <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={e=>{
                setSelectedCategories(prev => e.target.checked ? Array.from(new Set([...prev, cat])) : prev.filter(x=>x!==cat));
              }} />
              <span>{cat}</span>
            </label>
          ))}
          <button onClick={()=>setSelectedCategories([])} className="px-2 py-1 rounded border bg-white">Hepsi</button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showOnlyActive} onChange={e=>setShowOnlyActive(e.target.checked)} />
          Sadece aktif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showOnlyFav} onChange={e=>setShowOnlyFav(e.target.checked)} />
          Sadece favoriler
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={freeOnly} onChange={e=>setFreeOnly(e.target.checked)} />
          Sadece ücretsiz
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={searchRegex} onChange={e=>setSearchRegex(e.target.checked)} />
          Regex arama
        </label>
        <div className="flex items-center gap-2 text-sm">
          <input value={minPrice} onChange={e=>setMinPrice(e.target.value.replace(/\D/g,''))} className="w-20 px-2 py-2 border rounded" placeholder="Min ₺" />
          <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value.replace(/\D/g,''))} className="w-20 px-2 py-2 border rounded" placeholder="Max ₺" />
        </div>
        <select value={sortKey} onChange={e=>setSortKey(e.target.value)} className="px-3 py-2 border rounded text-sm bg-white">
          <option value="name">Ada göre</option>
          <option value="price">Fiyata göre</option>
          <option value="status">Duruma göre</option>
        </select>
        <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} className="px-3 py-2 border rounded text-sm bg-white">
          <option value="asc">Artan</option>
          <option value="desc">Azalan</option>
        </select>
        <select value={roleQuickFilter} onChange={e=>setRoleQuickFilter(e.target.value)} className="px-3 py-2 border rounded text-sm bg-white">
          <option value="">Role göre</option>
          <option value="Admin">Admin</option>
          <option value="Kasiyer">Kasiyer</option>
          <option value="Depocu">Depocu</option>
          <option value="NONE">Rol atanmadı</option>
        </select>
        <select value={roleQuickFilter} onChange={e=>setRoleQuickFilter(e.target.value)} className="px-3 py-2 border rounded text-sm bg-white">
          <option value="">Role göre</option>
          <option value="Admin">Admin</option>
          <option value="Kasiyer">Kasiyer</option>
          <option value="Depocu">Depocu</option>
          <option value="NONE">Rol atanmadı</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <select value={bulkPreset} onChange={e=>setBulkPreset(e.target.value)} className="px-2 py-2 border rounded text-sm bg-white">
            <option value="ALL">Tümü</option>
            <option value="ADMIN">Sadece Admin</option>
            <option value="ADMIN_CASHIER">Admin + Kasiyer</option>
            <option value="ADMIN_STOCK">Admin + Depocu</option>
          </select>
          <button onClick={() => {
            const map = {
              ALL: [],
              ADMIN: ['Admin'],
              ADMIN_CASHIER: ['Admin','Kasiyer'],
              ADMIN_STOCK: ['Admin','Depocu']
            };
            const targetRoles = map[bulkPreset] || [];
            const filtered = allModules
              .filter(m => category==='Tümü' || m.category===category)
              .filter(m => !showOnlyActive || activeModules.includes(m.id))
              .filter(m => !showOnlyFav || favorites.includes(m.id))
              .filter(m => !searchTerm || (m.name + ' ' + m.desc).toLowerCase().includes(searchTerm.toLowerCase()));
            const next = { ...moduleRoles };
            filtered.forEach(m => { next[m.id] = targetRoles; });
            saveModuleRoles(next);
            setBanner({ type: 'success', message: `Rol preset uygulandı: ${bulkPreset} → ${filtered.length} modül` });
          }} className="px-3 py-2 text-sm rounded bg-indigo-600 text-white">Preset Uygula</button>
          <button onClick={bulkActivateFiltered} className="px-3 py-2 text-sm rounded bg-green-600 text-white">Toplu Aktif Et</button>
          <button onClick={bulkDeactivateFiltered} className="px-3 py-2 text-sm rounded bg-red-600 text-white">Toplu Pasif Yap</button>
          <button onClick={async () => {
            const payload = JSON.stringify({
              activeModules,
              moduleRoles,
              filters: { searchTerm, category, showOnlyActive, sortKey, sortOrder, showOnlyFav, pinFavorites },
              conflictRules,
              favorites
            }, null, 2);
            try {
              await navigator.clipboard.writeText(payload);
              setBanner({ type: 'success', message: 'Ayarlar panoya kopyalandı' });
            } catch {
              setBanner({ type: 'error', message: 'Panoya kopyalama başarısız' });
            }
          }} className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-800">Dışa Aktar</button>
          <button onClick={() => setImportOpen(true)} className="px-3 py-2 text-sm rounded bg-gray-900 text-white">İçe Aktar</button>
          <button onClick={() => { setSearchTerm(''); setCategory('Tümü'); setShowOnlyActive(false); setSortKey('name'); setSortOrder('asc'); setShowOnlyFav(false); setPinFavorites(true); setBanner({ type: 'info', message: 'Filtreler sıfırlandı' }); }} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Filtreleri Sıfırla</button>
          <button onClick={() => setAuditOpen(v => !v)} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Audit</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showOnlyAudit} onChange={e=>setShowOnlyAudit(e.target.checked)} />
            Sadece audit geçenler
          </label>
          <select value={moduleQuickFilter} onChange={e=>setModuleQuickFilter(e.target.value)} className="px-2 py-1 border rounded text-sm bg-white">
            <option value="">Modül Hızlı Filtre</option>
            <option value="FREE">Ücretsiz</option>
            <option value="PAID">Ücretli</option>
            <option value="HAS_DEPS">Bağımlılığı Olan</option>
            <option value="HAS_ACTIVE_CONFLICT">Aktif Çakışmalı</option>
            <option value="MISSING_FREE_DEPS">Eksik Ücretsiz Bağımlılık</option>
            <option value="MISSING_PAID_DEPS">Eksik Ücretli Bağımlılık</option>
          </select>
          <select onChange={(e) => {
            const v = e.target.value;
            const now = Date.now();
            if (v==='LAST24_ERRORS') {
              setAuditStart(new Date(now - 24*60*60*1000).toISOString().slice(0,10));
              setAuditEnd(new Date(now).toISOString().slice(0,10));
              setSelectedTypes(['MODULE_ERROR']);
              setShowOnlyErrors(true);
              setAuditSearch('');
            } else if (v==='PURCHASES') {
              setSelectedTypes(['PURCHASE']);
              setShowOnlyErrors(false);
              setAuditSearch('');
              setAuditStart('');
              setAuditEnd('');
            } else if (v==='MODULE_EVENTS') {
              setSelectedTypes(['MODULE','MODULE_ROLE']);
              setShowOnlyErrors(false);
              setAuditSearch('');
              setAuditStart('');
              setAuditEnd('');
            } else if (v==='CONFLICT_RULES') {
              setSelectedTypes(['CONFLICT_RULE']);
              setShowOnlyErrors(false);
              setAuditSearch('');
              setAuditStart('');
              setAuditEnd('');
            }
          }} className="px-2 py-1 border rounded text-sm bg-white">
            <option value="">Hızlı Filtre</option>
            <option value="LAST24_ERRORS">Son 24 saat • Hatalar</option>
            <option value="PURCHASES">Satın Almalar</option>
            <option value="MODULE_EVENTS">Modül Olayları</option>
            <option value="CONFLICT_RULES">Çakışma Kuralları</option>
          </select>
          <button onClick={async () => {
            try {
              const logs = auditLogs
                .filter(l => {
                  if (!auditStart && !auditEnd) return true;
                  const t = new Date(l.time).getTime();
                  const s = auditStart ? new Date(auditStart).getTime() : -Infinity;
                  const e = auditEnd ? new Date(auditEnd).getTime() + 24*60*60*1000 - 1 : Infinity;
                  return t>=s && t<=e;
                })
                .filter(l => selectedTypes.includes(l.type))
                .filter(l => !showOnlyErrors || l.type === 'MODULE_ERROR')
                .filter(l => (l.activity || '').toLowerCase().includes(auditSearch.toLowerCase()));
              const esc = (v) => String(v||'').replace(/"/g,'""').replace(/\r?\n/g, ' ');
              const header = 'time,type,activity';
              const body = logs.map(l => `"${esc(l.time)}","${esc(l.type)}","${esc(l.activity)}"`).join('\n');
              const csv = header + '\n' + body;
              const res = await (window.system && window.system.saveText ? window.system.saveText(csv, 'audit.csv', [{ name: 'CSV', extensions: ['csv'] }]) : Promise.resolve({ ok: false }));
              if (res && res.ok) setBanner({ type: 'success', message: 'Audit CSV olarak kaydedildi' });
              else setBanner({ type: 'error', message: 'CSV kaydetme başarısız' });
            } catch { setBanner({ type: 'error', message: 'CSV oluşturma hatası' }); }
          }} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Audit CSV</button>
          <button onClick={async () => {
            try {
              const res = await (window.system && window.system.clearCache ? window.system.clearCache() : Promise.resolve({ ok: false }));
              if (res && res.ok) setBanner({ type: 'success', message: 'Önbellek temizlendi' });
              else setBanner({ type: 'error', message: 'Önbellek temizlenemedi' });
            } catch { setBanner({ type: 'error', message: 'Önbellek temizleme hatası' }); }
          }} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Önbelleği Temizle</button>
          <div className="flex items-center gap-2 text-sm border rounded px-2 py-1 bg-white">
            <input value={profileName} onChange={e=>setProfileName(e.target.value)} className="outline-none text-sm" placeholder="Profil adı" />
            <button onClick={saveProfile} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs">Profili Kaydet</button>
            <select className="px-2 py-1 border rounded text-xs bg-white" onChange={e=>applyProfile(e.target.value)}>
              <option value="">Profil uygula...</option>
              {profiles.map(p => (<option key={p.name} value={p.name}>{p.name}</option>))}
            </select>
            {profiles.length>0 && (
              <button onClick={() => { const n = (profileName||'').trim(); if (!n) { setBanner({ type: 'error', message: 'Silmek için profil adı girin' }); return; } deleteProfile(n); }} className="px-2 py-1 rounded bg-white text-gray-800 border text-xs">Sil</button>
            )}
            <select value={compareProfileName} onChange={e=>setCompareProfileName(e.target.value)} className="px-2 py-1 border rounded text-xs bg-white">
              <option value="">Karşılaştır...</option>
              {profiles.map(p => (<option key={p.name} value={p.name}>{p.name}</option>))}
            </select>
            <button onClick={() => { if (!compareProfileName) { setBanner({ type: 'error', message: 'Önce profil seçin' }); return; } setCompareOpen(true); }} className="px-2 py-1 rounded bg-white text-gray-800 border text-xs">Karşılaştır</button>
            <button onClick={() => { if (!compareProfileName) { setBanner({ type: 'error', message: 'Önce profil seçin' }); return; } applyProfileMerge(compareProfileName); }} className="px-2 py-1 rounded bg-green-600 text-white text-xs">Birleştir Uygula</button>
            <button onClick={() => { const json = JSON.stringify(profiles, null, 2); navigator.clipboard.writeText(json).then(()=> setBanner({ type: 'success', message: 'Profiller JSON panoya kopyalandı' })).catch(()=> setBanner({ type: 'error', message: 'Profiller kopyalanamadı' })); }} className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">Profil Dışa Aktar</button>
            <button onClick={() => setImportProfilesOpen(true)} className="px-2 py-1 rounded bg-gray-900 text-white text-xs">Profil İçe Aktar</button>
          </div>
          <button onClick={undoLast} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Geri Al</button>
          <button onClick={redoLast} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Yinele</button>
          <button onClick={() => { setSimType('activate'); setSimOpen(true); }} className="px-3 py-2 text-sm rounded bg-indigo-600 text-white">Aktivasyon Simülasyonu</button>
          <button onClick={() => { setSimType('deactivate'); setSimOpen(true); }} className="px-3 py-2 text-sm rounded bg-red-600 text-white">Pasifleştirme Simülasyonu</button>
          <button onClick={() => setOpenConfMgr(true)} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Çakışma Yönetimi</button>
          <button onClick={() => setOpenRulesMgr(true)} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Çakışma Kuralları</button>
          <button onClick={() => setOpenSummary(true)} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Sistem Özeti</button>
          <button onClick={() => setOpenCycles(true)} className="px-3 py-2 text-sm rounded bg-white text-gray-800 border">Döngü Tarama</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pinFavorites} onChange={e=>setPinFavorites(e.target.checked)} />
            Favorileri üste al
          </label>
          <button onClick={fillMissingFreeDeps} className="px-3 py-2 text-sm rounded bg-green-50 text-green-700 border">Eksik Ücretsizleri Tamamla</button>
          <button onClick={async () => {
            const filtered = allModules
              .filter(m => category==='Tümü' || m.category===category)
              .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
              .filter(m => !showOnlyActive || activeModules.includes(m.id))
              .filter(m => !showOnlyFav || favorites.includes(m.id))
              .filter(m => !freeOnly || isFree(m.id))
              .filter(m => moduleMatchesQuick(m))
              .filter(m => moduleMatchesRole(m))
              .filter(m => !showOnlyAudit || auditIds.includes(m.id))
              .filter(m => {
                if (!searchTerm) return true;
                const text = (m.name + ' ' + m.desc);
                if (searchRegex) {
                  try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                }
                return text.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .sort(compareMods);
            const payload = filtered.map(m => ({
              id: m.id,
              name: m.name,
              price: m.price,
              isFree: isFree(m.id),
              isActive: activeModules.includes(m.id),
              depsCount: (dependencies[m.id]||[]).length,
              conflictsCount: (conflicts[m.id]||[]).length,
              activeConflicts: (conflicts[m.id]||[]).filter(c => activeModules.includes(c))
            }));
            const json = JSON.stringify(payload, null, 2);
            const res = await (window.system && window.system.saveText ? window.system.saveText(json, 'modules.json', [{ name: 'JSON', extensions: ['json'] }]) : Promise.resolve({ ok: false }));
            if (res && res.ok) setBanner({ type: 'success', message: 'Modül listesi JSON kaydedildi' });
            else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
          }} className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-800">Modül Kaydet JSON</button>
          <button onClick={async () => {
            const filtered = allModules
              .filter(m => category==='Tümü' || m.category===category)
              .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
              .filter(m => !showOnlyActive || activeModules.includes(m.id))
              .filter(m => !showOnlyFav || favorites.includes(m.id))
              .filter(m => !freeOnly || isFree(m.id))
              .filter(m => moduleMatchesQuick(m))
              .filter(m => moduleMatchesRole(m))
              .filter(m => !showOnlyAudit || auditIds.includes(m.id))
              .filter(m => {
                if (!searchTerm) return true;
                const text = (m.name + ' ' + m.desc);
                if (searchRegex) {
                  try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                }
                return text.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .sort(compareMods);
            const header = 'id,name,price,isFree,isActive,depsCount,conflictsCount,activeConflicts\n';
            const rows = filtered.map(m => {
              const id = m.id;
              const name = (m.name||'').replace(/"/g,'\"');
              const price = (m.price||'').replace(/"/g,'\"');
              const isF = isFree(id) ? '1' : '0';
              const isA = activeModules.includes(id) ? '1' : '0';
              const dC = (dependencies[id]||[]).length;
              const cC = (conflicts[id]||[]).length;
              const aConf = (conflicts[id]||[]).filter(c => activeModules.includes(c)).join('|').replace(/"/g,'\"');
              return `${id},"${name}","${price}",${isF},${isA},${dC},${cC},"${aConf}"`;
            }).join("\n");
            const csv = header + rows;
            const res = await (window.system && window.system.saveText ? window.system.saveText(csv, 'modules.csv', [{ name: 'CSV', extensions: ['csv'] }]) : Promise.resolve({ ok: false }));
            if (res && res.ok) setBanner({ type: 'success', message: 'Modül listesi CSV kaydedildi' });
            else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
          }} className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-800">Modül Kaydet CSV</button>
          <button onClick={async () => {
            const filtered = allModules
              .filter(m => category==='Tümü' || m.category===category)
              .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
              .filter(m => !showOnlyActive || activeModules.includes(m.id))
              .filter(m => !showOnlyFav || favorites.includes(m.id))
              .filter(m => !freeOnly || isFree(m.id))
              .filter(m => moduleMatchesQuick(m))
              .filter(m => moduleMatchesRole(m))
              .filter(m => !showOnlyAudit || auditIds.includes(m.id))
              .filter(m => {
                if (!searchTerm) return true;
                const text = (m.name + ' ' + m.desc);
                if (searchRegex) {
                  try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                }
                return text.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .sort(compareMods);
            const payload = filtered.map(m => ({ id: m.id, name: m.name, roles: moduleRoles[m.id] || [] }));
            const json = JSON.stringify(payload, null, 2);
            const res = await (window.system && window.system.saveText ? window.system.saveText(json, 'roles.json', [{ name: 'JSON', extensions: ['json'] }]) : Promise.resolve({ ok: false }));
            if (res && res.ok) setBanner({ type: 'success', message: 'Roller JSON kaydedildi' });
            else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
          }} className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-800">Rol Kaydet JSON</button>
          <button onClick={async () => {
            const filtered = allModules
              .filter(m => category==='Tümü' || m.category===category)
              .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
              .filter(m => !showOnlyActive || activeModules.includes(m.id))
              .filter(m => !showOnlyFav || favorites.includes(m.id))
              .filter(m => !freeOnly || isFree(m.id))
              .filter(m => moduleMatchesQuick(m))
              .filter(m => moduleMatchesRole(m))
              .filter(m => !showOnlyAudit || auditIds.includes(m.id))
              .filter(m => {
                if (!searchTerm) return true;
                const text = (m.name + ' ' + m.desc);
                if (searchRegex) {
                  try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                }
                return text.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .sort(compareMods);
            const header = 'id,name,roles\n';
            const rows = filtered.map(m => {
              const id = m.id;
              const name = (m.name||'').replace(/"/g,'\"');
              const roles = (moduleRoles[id]||[]).join('|').replace(/"/g,'\"');
              return `${id},"${name}","${roles}"`;
            }).join("\n");
            const csv = header + rows;
            const res = await (window.system && window.system.saveText ? window.system.saveText(csv, 'roles.csv', [{ name: 'CSV', extensions: ['csv'] }]) : Promise.resolve({ ok: false }));
            if (res && res.ok) setBanner({ type: 'success', message: 'Roller CSV kaydedildi' });
            else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
          }} className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-800">Rol Kaydet CSV</button>
        </div>
      </div>

      {auditOpen && (
        <div className="mb-4 bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-800 text-sm">Son Modül İşlemleri</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showOnlyErrors} onChange={e=>setShowOnlyErrors(e.target.checked)} />
                  Yalnız hatalar
                </label>
                <input type="date" onChange={e=>setAuditStart(e.target.value)} className="px-2 py-1 border rounded text-sm" />
                <input type="date" onChange={e=>setAuditEnd(e.target.value)} className="px-2 py-1 border rounded text-sm" />
                <div className="flex items-center gap-1 text-xs">
                  {['MODULE','MODULE_ROLE','MODULE_ERROR','PURCHASE','CONFLICT_RULE'].map(t => (
                    <label key={t} className="flex items-center gap-1">
                      <input type="checkbox" checked={selectedTypes.includes(t)} onChange={e=>{
                        setSelectedTypes(prev => e.target.checked ? Array.from(new Set([...prev, t])) : prev.filter(x=>x!==t));
                      }} />
                      <span>{t}</span>
                    </label>
                  ))}
                  <button onClick={()=>setSelectedTypes(['MODULE','MODULE_ROLE','MODULE_ERROR','PURCHASE','CONFLICT_RULE'])} className="px-2 py-1 rounded border bg-white">Hepsi</button>
                </div>
                <button onClick={() => {
                  const json = JSON.stringify(
                    auditLogs
                      .filter(l => {
                        if (!auditStart && !auditEnd) return true;
                        const t = new Date(l.time).getTime();
                        const s = auditStart ? new Date(auditStart).getTime() : -Infinity;
                        const e = auditEnd ? new Date(auditEnd).getTime() + 24*60*60*1000 - 1 : Infinity;
                        return t>=s && t<=e;
                      })
                      .filter(l => selectedTypes.includes(l.type))
                      .filter(l => !showOnlyErrors || l.type==='MODULE_ERROR')
                      .filter(l => (l.activity || '').toLowerCase().includes(auditSearch.toLowerCase())),
                    null,
                    2
                  );
                  navigator.clipboard.writeText(json).then(()=>{
                    setBanner({ type: 'success', message: 'Audit JSON panoya kopyalandı' });
                  }).catch(()=> setBanner({ type: 'error', message: 'JSON kopyalama başarısız' }));
                }} className="px-2 py-1 text-xs rounded bg-gray-200">JSON</button>
                <button onClick={async () => {
                  const json = JSON.stringify(
                    auditLogs
                      .filter(l => {
                        if (!auditStart && !auditEnd) return true;
                        const t = new Date(l.time).getTime();
                        const s = auditStart ? new Date(auditStart).getTime() : -Infinity;
                        const e = auditEnd ? new Date(auditEnd).getTime() + 24*60*60*1000 - 1 : Infinity;
                        return t>=s && t<=e;
                      })
                      .filter(l => selectedTypes.includes(l.type))
                      .filter(l => !showOnlyErrors || l.type==='MODULE_ERROR')
                      .filter(l => (l.activity || '').toLowerCase().includes(auditSearch.toLowerCase())),
                    null,
                    2
                  );
                  const res = await (window.system && window.system.saveText ? window.system.saveText(json, 'audit.json', [{ name: 'JSON', extensions: ['json'] }]) : Promise.resolve({ ok: false }));
                  if (res && res.ok) setBanner({ type: 'success', message: 'Audit JSON dosyaya kaydedildi' });
                  else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
                }} className="px-2 py-1 text-xs rounded bg-gray-200">Kaydet JSON</button>
                <button onClick={() => {
                  const rows = auditLogs
                    .filter(l => !showOnlyErrors || l.type==='MODULE_ERROR')
                    .filter(l => selectedTypes.includes(l.type))
                    .filter(l => (l.activity || '').toLowerCase().includes(auditSearch.toLowerCase()))
                    .map(l => `${l.type},"${(l.activity||'').replace(/"/g,'\"')}",${l.time}`)
                    .join("\n");
                  const header = 'type,activity,time\n';
                  const csv = header + rows;
                  navigator.clipboard.writeText(csv).then(()=>{
                    setBanner({ type: 'success', message: 'Audit CSV panoya kopyalandı' });
                  }).catch(()=> setBanner({ type: 'error', message: 'CSV kopyalama başarısız' }));
                }} className="px-2 py-1 text-xs rounded bg-gray-200">CSV</button>
                <button onClick={async () => {
                  const rows = auditLogs
                    .filter(l => !showOnlyErrors || l.type==='MODULE_ERROR')
                    .filter(l => selectedTypes.includes(l.type))
                    .filter(l => (l.activity || '').toLowerCase().includes(auditSearch.toLowerCase()))
                    .map(l => `${l.type},"${(l.activity||'').replace(/"/g,'\"')}",${l.time}`)
                    .join("\n");
                  const header = 'type,activity,time\n';
                  const csv = header + rows;
                  const res = await (window.system && window.system.saveText ? window.system.saveText(csv, 'audit.csv', [{ name: 'CSV', extensions: ['csv'] }]) : Promise.resolve({ ok: false }));
                  if (res && res.ok) setBanner({ type: 'success', message: 'Audit CSV dosyaya kaydedildi' });
                  else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
                }} className="px-2 py-1 text-xs rounded bg-gray-200">Kaydet CSV</button>
                <input value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} className="px-2 py-1 border rounded text-sm" placeholder="Ara" />
              </div>
          </div>
          {(() => {
            const days = Array.from({ length: auditDays }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (auditDays - 1 - i));
              return d.toISOString().slice(0,10);
            });
            const types = auditTypesForChart;
            const series = types.map(t => {
              const counts = days.map(day => auditLogs.filter(l => (l.type===t) && (new Date(l.time).toISOString().slice(0,10)===day)).length);
              const max = Math.max(1, ...counts);
              return { t, counts, max };
            });
            const label = (t) => (t==='MODULE' ? 'Olay' : t==='MODULE_ERROR' ? 'Hata' : t==='PURCHASE' ? 'Satın alma' : t==='CONFLICT_RULE' ? 'Çakışma Kuralı' : t);
            return (
              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <select value={auditDays} onChange={e=>setAuditDays(Number(e.target.value))} className="px-2 py-1 border rounded text-xs bg-white">
                    {[7,14,30].map(d => (<option key={d} value={d}>{d} gün</option>))}
                  </select>
                  <div className="flex items-center gap-1 text-xs">
                    {['MODULE','MODULE_ERROR','PURCHASE','CONFLICT_RULE'].map(t => (
                      <label key={t} className="flex items-center gap-1">
                        <input type="checkbox" checked={auditTypesForChart.includes(t)} onChange={e=>{
                          setAuditTypesForChart(prev => e.target.checked ? Array.from(new Set([...prev, t])) : prev.filter(x=>x!==t));
                        }} />
                        <span>{label(t)}</span>
                      </label>
                    ))}
                    <button onClick={()=>setAuditTypesForChart(['MODULE','MODULE_ERROR','PURCHASE','CONFLICT_RULE'])} className="px-2 py-1 rounded border bg-white">Hepsi</button>
                  </div>
                </div>
                {series.map(s => (
                  <div key={s.t} className="flex items-center gap-2">
                    <span className="w-24 text-xs text-gray-600">{label(s.t)}</span>
                    <div className="flex-1 flex items-end gap-1">
                      {s.counts.map((c, idx) => (
                        <div key={idx} className={`${s.t==='MODULE_ERROR' ? 'bg-red-400' : s.t==='PURCHASE' ? 'bg-yellow-400' : 'bg-blue-400'}`} style={{ height: `${6 + Math.round(24 * (c / s.max))}px`, width: '12px', borderRadius: '2px' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {auditLogs
              .filter(l => {
                if (!auditStart && !auditEnd) return true;
                const t = new Date(l.time).getTime();
                const s = auditStart ? new Date(auditStart).getTime() : -Infinity;
                const e = auditEnd ? new Date(auditEnd).getTime() + 24*60*60*1000 - 1 : Infinity;
                return t>=s && t<=e;
              })
              .filter(l => selectedTypes.includes(l.type))
              .filter(l => !showOnlyErrors || l.type === 'MODULE_ERROR')
              .filter(l => (l.activity || '').toLowerCase().includes(auditSearch.toLowerCase()))
              .map(l => (
                <div key={l.id} className={`px-3 py-2 rounded border text-xs cursor-pointer ${l.type==='MODULE_ERROR' ? 'bg-red-50 text-red-700 border-red-200' : l.type==='PURCHASE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : l.type==='CONFLICT_RULE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                  onClick={() => {
                    const mIdMatch = (l.activity || '').match(/Modül\s([a-zA-Z0-9_\-]+)/);
                    const nameMatch = (l.activity || '').match(/Satın alındı:\s(.+)\s\(/);
                    let target = null;
                    if (mIdMatch && mIdMatch[1]) target = mIdMatch[1];
                    else if (nameMatch && nameMatch[1]) target = getModuleByName(nameMatch[1])?.id || null;
                    if (target) {
                      setSearchTerm(target);
                      setHighlightId(target);
                      setTimeout(() => {
                        const el = document.getElementById('mod-card-' + target);
                        el && el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 50);
                      setTimeout(() => setHighlightId(null), 2500);
                    }
                  }}
                >
                  <span className="font-bold mr-2">{l.type}</span>{l.activity}
                  <span className="ml-2 text-gray-500">{l.time}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(allModules
          .filter(m => category==='Tümü' || m.category===category)
          .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
          .filter(m => !showOnlyActive || activeModules.includes(m.id))
          .filter(m => !showOnlyFav || favorites.includes(m.id))
          .filter(m => !freeOnly || isFree(m.id))
          .filter(m => moduleMatchesQuick(m))
          .filter(m => !showOnlyAudit || auditIds.includes(m.id))
          .filter(m => {
            if (!searchTerm) return true;
            const text = (m.name + ' ' + m.desc);
            if (searchRegex) {
              try { const re = new RegExp(searchTerm, 'i'); setRegexError(false); return re.test(text); } catch { setRegexError(true); return text.toLowerCase().includes(searchTerm.toLowerCase()); }
            }
            return text.toLowerCase().includes(searchTerm.toLowerCase());
          })
          .filter(m => {
            const pv = priceValue(m.price);
            const minOk = !minPrice || pv >= Number(minPrice);
            const maxOk = !maxPrice || pv <= Number(maxPrice);
            return minOk && maxOk;
          })
          .sort((a,b) => {
            if (pinFavorites && favorites.length > 0) {
              const fa = favorites.includes(a.id); const fb = favorites.includes(b.id);
              if (fa !== fb) return fa ? -1 : 1;
            }
            return compareMods(a,b);
          })
        ).map((mod) => {
            const isActive = activeModules.includes(mod.id);
            const deps = dependencies[mod.id] || [];
            const miss = missingDeps(mod.id, activeModules);
            const conf = conflicts[mod.id] || [];
            const activeConf = conf.filter(c => activeModules.includes(c));
            return (
                <div id={`mod-card-${mod.id}`} key={mod.id} className={`p-6 rounded-2xl border-2 transition-all ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-blue-300'} ${highlightId===mod.id ? 'ring-2 ring-blue-400' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${isActive ? 'bg-green-200 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                            <mod.icon size={32}/>
                        </div>
                        <button onClick={() => toggleFavorite(mod.id)} className={`p-2 rounded ${favorites.includes(mod.id) ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}><Star size={18}/></button>
                        {isActive ? (
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle size={12}/> AKTİF
                            </span>
                        ) : (
                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Lock size={12}/> SATIN AL
                            </span>
                        )}
                        {(activeConf.length > 0) && (
                          <span className="ml-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Çakışma</span>
                        )}
                        {miss.some(m => !isFree(m)) && (
                          <span className="ml-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Ücretli Bağımlılık</span>
                        )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{mod.name}</h3>
                    <p className="text-gray-500 text-sm mb-2 h-10">{mod.desc}</p>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">Bağımlılık: {deps.length}</span>
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Eksik: {miss.length}</span>
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">Çakışma: {conf.length}</span>
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">Aktif Çakışma: {activeConf.length}</span>
                    </div>
                    {deps.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                        {deps.map(d => (
                          <span key={d} className={`px-2 py-1 rounded border ${activeModules.includes(d) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{getModule(d)?.name || d}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setOpenDepsId(v => v===mod.id ? null : mod.id)} className="text-xs px-2 py-1 rounded border bg-white">Bağımlılıklar</button>
                      <button onClick={() => setOpenConfId(v => v===mod.id ? null : mod.id)} className="text-xs px-2 py-1 rounded border bg-white">Çakışmalar</button>
                      <button onClick={() => setOpenDependentsId(v => v===mod.id ? null : mod.id)} className="text-xs px-2 py-1 rounded border bg-white">Bağımlılar</button>
                      <button onClick={() => setOpenHealthId(v => v===mod.id ? null : mod.id)} className="text-xs px-2 py-1 rounded border bg-white">Durum</button>
                      <button onClick={() => setOpenResolveId(mod.id)} className="text-xs px-2 py-1 rounded border bg-white">Çakışmayı Çöz</button>
                    </div>
                    {openDepsId===mod.id && (
                      <div className="mb-4 text-xs bg-gray-50 border rounded p-2">
                        <div className="mb-2 font-bold text-gray-700">Bağımlılıklar</div>
                        <div className="space-y-1">
                          {depGraph(mod.id).map((n, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-gray-400">{Array(n.depth).fill('•').join('')}</span>
                              <span className={`px-2 py-1 rounded border ${activeModules.includes(n.id) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{getModule(n.id)?.name || n.id}</span>
                              {!isFree(n.id) && (<span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Ücretli</span>)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {openConfId===mod.id && (
                      <div className="mb-4 text-xs bg-gray-50 border rounded p-2">
                    <div className="mb-2 font-bold text-gray-700">Çakışma Detayı</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {Array.from(new Set([
                        ...((conflicts[mod.id]||[])),
                        ...((conflictRules||[])
                          .filter(r => Array.isArray(r) && r.length===2 && (r[0]===mod.id || r[1]===mod.id))
                          .map(pair => (pair[0]===mod.id ? pair[1] : pair[0]))
                        )
                      ])).map((c, idx) => (
                        <span key={idx} className={`px-2 py-1 rounded border ${activeModules.includes(c) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{getModule(c)?.name || c}</span>
                      ))}
                    </div>
                  </div>
                )}
                    {openDependentsId===mod.id && (
                      <div className="mb-4 text-xs bg-gray-50 border rounded p-2">
                        <div className="mb-2 font-bold text-gray-700">Bağımlılar</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {(revDepsMap[mod.id]||[]).map((d, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded border ${activeModules.includes(d) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{getModule(d)?.name || d}</span>
                          ))}
                          {(revDepsMap[mod.id]||[]).length===0 && (
                            <span className="text-gray-500">Bu modüle bağımlı modül yok</span>
                          )}
                        </div>
                      </div>
                    )}
                    {openHealthId===mod.id && (
                      <div className="mb-4 text-xs bg-gray-50 border rounded p-2">
                        <div className="mb-2 font-bold text-gray-700">Sağlık/Durum</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded border bg-white text-gray-700">Eksik ücretsiz bağımlılıklar: {missingDeps(mod.id, activeModules).filter(d=>isFree(d)).join(', ') || 'Yok'}</span>
                            <button onClick={async () => {
                              if (!requireAdmin()) return;
                              let updated = [...activeModules];
                              const freeMiss = missingDeps(mod.id, updated).filter(d => isFree(d));
                              if (freeMiss.length === 0) { setBanner({ type: 'info', message: 'Eksik ücretsiz bağımlılık yok' }); return; }
                              updated = Array.from(new Set([...updated, ...freeMiss]));
                              await window.db.set('active_modules', updated);
                              setActiveModules(updated);
                              setBanner({ type: 'success', message: `Aktifleştirildi: ${freeMiss.join(', ')}` });
                            }} className="px-2 py-1 rounded bg-green-600 text-white">Ücretsizleri Aktif Et</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded border bg-white text-gray-700">Aktif çakışmalar: {(conflicts[mod.id]||[]).filter(c => activeModules.includes(c)).join(', ') || 'Yok'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded border bg-white text-gray-700">Ücretli bağımlılıklar: {missingDeps(mod.id, activeModules).filter(d=>!isFree(d)).join(', ') || 'Yok'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {conf.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                        {conf.map(c => (
                          <span key={c} className={`px-2 py-1 rounded border ${activeModules.includes(c) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{getModule(c)?.name || c}</span>
                        ))}
                      </div>
                    )}
                    {(() => { const last = (recentLogs||[]).find(l => (l.activity||'').includes('Modül '+mod.id) || (l.activity||'').includes(mod.name));
                      return last ? (
                        <div className="mb-4 text-xs text-gray-600">Son işlem: <span className="font-bold">{last.type}</span> <span className="ml-1">{last.time}</span></div>
                      ) : null; })()}
                    <button onClick={() => { setOpenHistoryId(v => v===mod.id ? null : mod.id); setHistoryFull(false); }} className="mb-2 text-xs px-2 py-1 rounded border bg-white">Geçmiş</button>
                    {openHistoryId===mod.id && (
                      <div className="mb-4 text-xs bg-gray-50 border rounded p-2 space-y-1">
                        {(recentLogs||[])
                          .filter(l => (l.activity||'').includes('Modül '+mod.id) || (l.activity||'').includes(mod.name))
                          .slice(0, historyFull ? 50 : 3)
                          .map((l,i) => (
                            <div key={i} className={`${l.type==='MODULE_ERROR' ? 'text-red-700' : l.type==='PURCHASE' ? 'text-yellow-700' : 'text-gray-700'}`}>{l.type} • {l.time}</div>
                          ))}
                        <div className="pt-1">
                          <button onClick={()=>setHistoryFull(f=>!f)} className="px-2 py-1 rounded border bg-white">{historyFull ? 'Azalt' : 'Tümünü göster'}</button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Roller:</span>
                      {['Admin','Kasiyer','Depocu'].map(role => {
                        const current = moduleRoles[mod.id] || [];
                        const checked = current.includes(role);
                        return (
                          <label key={role} className={`text-xs px-2 py-1 rounded border ${checked ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                const next = { ...moduleRoles };
                                const list = Array.isArray(next[mod.id]) ? next[mod.id] : [];
                                if (e.target.checked) next[mod.id] = Array.from(new Set([...list, role]));
                                else next[mod.id] = list.filter(r => r !== role);
                                saveModuleRoles(next);
                              }}
                            />
                            <span className="ml-1">{role}</span>
                          </label>
                        );
                      })}
                      <select
                        value={(moduleRoles[mod.id] || []).join(',') || 'ALL'}
                        onChange={e => {
                          const v = e.target.value;
                          const map = {
                            ALL: [],
                            ADMIN: ['Admin'],
                            ADMIN_CASHIER: ['Admin','Kasiyer'],
                            ADMIN_STOCK: ['Admin','Depocu']
                          };
                          const next = { ...moduleRoles, [mod.id]: map[v] };
                          saveModuleRoles(next);
                        }}
                        className="ml-2 text-xs px-2 py-1 border rounded bg-white"
                      >
                        <option value="ALL">Tümü</option>
                        <option value="ADMIN">Sadece Admin</option>
                        <option value="ADMIN_CASHIER">Admin + Kasiyer</option>
                        <option value="ADMIN_STOCK">Admin + Depocu</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-xs">
                      <span className="text-gray-500">Görünürlük:</span>
                      {((moduleRoles[mod.id] || []).length === 0) ? (
                        <span className="px-2 py-1 rounded border bg-gray-50 text-gray-600 border-gray-200">Tümü</span>
                      ) : (
                        (moduleRoles[mod.id] || []).map(r => (
                          <span key={r} className="px-2 py-1 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">{r}</span>
                        ))
                      )}
                    </div>
                    
                     <div className="flex items-center justify-between mt-auto">
                         <span className="text-lg font-black text-gray-900">{mod.price}</span>
                         <button 
                              onClick={() => { 
                                if (!requireAdmin()) return; 
                                setActionModule(mod); setActionType(isActive ? 'remove' : 'buy'); 
                              }}
                              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-900 text-white hover:bg-black'} ${(miss.some(m => !isFree(m)) || activeConf.length>0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                              disabled={miss.some(m => !isFree(m)) || activeConf.length>0}
                           >
                              {isActive ? 'İptal Et / Kaldır' : 'Satın Al'}
                           </button>
                         <button 
                           onClick={() => { setOpenPreviewId(mod.id); setPreviewAction(isActive ? 'remove' : 'activate'); }}
                           className="px-3 py-2 rounded-lg font-bold text-sm bg-white text-gray-700 border hover:bg-gray-50"
                         >
                           Önizleme
                         </button>
                         <button 
                           onClick={() => setDetailModule(mod)}
                           className="px-3 py-2 rounded-lg font-bold text-sm bg-white text-gray-700 border hover:bg-gray-50"
                         >
                           Detay
                         </button>
                    </div>
                 </div>
             );
         })}
      </div>
      {detailModule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify中心 z-50">
          <div className="bg-white p-6 rounded-xl w-[560px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">{detailModule.name}</h3>
              <button onClick={() => setDetailModule(null)} className="text-gray-500">×</button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Kategori: <span className="font-medium">{detailModule.category}</span></div>
              <div className="text-sm text-gray-600">Açıklama: <span className="font-medium">{detailModule.desc}</span></div>
              <div className="text-sm text-gray-600">Fiyat: <span className="font-bold">{detailModule.price}</span></div>
              <div className="text-sm text-gray-600">Durum: <span className={`font-bold ${activeModules.includes(detailModule.id) ? 'text-green-600' : 'text-gray-600'}`}>{activeModules.includes(detailModule.id) ? 'Aktif' : 'Pasif'}</span></div>
              <div className="text-sm text-gray-600">
                Roller:
                <span className="ml-1">
                  {((moduleRoles[detailModule.id] || []).length === 0) ? 'Tümü' : (moduleRoles[detailModule.id] || []).join(', ')}
                </span>
              </div>
              {Boolean((dependencies[detailModule.id]||[]).length) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Bağımlılıklar</div>
                  <div className="flex flex-wrap gap-2">
                    {(dependencies[detailModule.id]||[]).map(d => (
                      <span key={d} className={`px-2 py-1 rounded border text-xs ${activeModules.includes(d) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{getModule(d)?.name || d}</span>
                    ))}
                  </div>
                </div>
              )}
              {Boolean((conflicts[detailModule.id]||[]).length) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Çakışmalar</div>
                  <div className="flex flex-wrap gap-2">
                    {(conflicts[detailModule.id]||[]).map(c => (
                      <span key={c} className={`px-2 py-1 rounded border text-xs ${activeModules.includes(c) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{getModule(c)?.name || c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDetailModule(null)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              <button onClick={() => { setDetailModule(null); toggleModule(detailModule.id); }} className="px-4 py-2 bg-gray-900 text-white rounded">{activeModules.includes(detailModule.id) ? 'Kaldır' : 'Satın Al'}</button>
            </div>
          </div>
        </div>
      )}
      {openPreviewId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[560px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">İşlem Önizleme</h3>
              <button onClick={() => setOpenPreviewId(null)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const mod = getModule(openPreviewId);
              const isActive = activeModules.includes(openPreviewId);
              const nextTry = isActive ? activeModules.filter(x => x !== openPreviewId) : [...activeModules, openPreviewId];
              const freeMiss = isActive ? [] : missingDeps(openPreviewId, nextTry).filter(d => isFree(d));
              const paidMiss = isActive ? [] : missingDeps(openPreviewId, nextTry).filter(d => !isFree(d));
              const activeConf = isActive ? [] : (conflicts[openPreviewId] || []).filter(c => nextTry.includes(c));
              const dependents = revDepsMap[openPreviewId] || [];
              const blocks = isActive ? dependents.filter(dep => activeModules.includes(dep)) : [];
              const cyc = hasCycleFrom(openPreviewId);
              return (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="font-medium">Modül: {mod?.name || openPreviewId}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded border text-xs ${isActive ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{isActive ? 'Pasif önizleme' : 'Aktif önizleme'}</span>
                    {cyc && (<span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">Bağımlılık döngüsü olası</span>)}
                  </div>
                  {!isActive && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Ücretsiz bağımlılıklar</div>
                      <div className="flex flex-wrap gap-2">
                        {freeMiss.length === 0 ? (<span className="text-gray-600">Yok</span>) : freeMiss.map(d => (
                          <span key={d} className="px-2 py-1 rounded border text-xs bg-green-50 text-green-700 border-green-200">{getModule(d)?.name || d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isActive && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Ücretli bağımlılıklar</div>
                      <div className="flex flex-wrap gap-2">
                        {paidMiss.length === 0 ? (<span className="text-gray-600">Yok</span>) : paidMiss.map(d => (
                          <span key={d} className="px-2 py-1 rounded border text-xs bg-yellow-50 text-yellow-700 border-yellow-200">{getModule(d)?.name || d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isActive && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Aktif çakışmalar</div>
                      <div className="flex flex-wrap gap-2">
                        {activeConf.length === 0 ? (<span className="text-gray-600">Yok</span>) : activeConf.map(c => (
                          <span key={c} className="px-2 py-1 rounded border text-xs bg-red-50 text-red-700 border-red-200">{getModule(c)?.name || c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {isActive && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Aktif bağımlılar (kaldırmayı engeller)</div>
                      <div className="flex flex-wrap gap-2">
                        {blocks.length === 0 ? (<span className="text-gray-600">Yok</span>) : blocks.map(d => (
                          <span key={d} className="px-2 py-1 rounded border text-xs bg-indigo-50 text-indigo-700 border-indigo-200">{getModule(d)?.name || d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenPreviewId(null)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              <button onClick={() => { setOpenPreviewId(null); const modId = openPreviewId; if (!modId) return; toggleModule(modId); }} className="px-4 py-2 bg-gray-900 text-white rounded">Uygula</button>
            </div>
          </div>
        </div>
      )}
      {openResolveId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[600px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Çakışma Çözümleme</h3>
              <button onClick={() => setOpenResolveId(null)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const id = openResolveId;
              const conflictsActive = (conflicts[id]||[]).filter(c => activeModules.includes(c));
              const safeDeactivate = conflictsActive.filter(c => {
                const dependents = revDepsMap[c] || [];
                return !dependents.some(dep => activeModules.includes(dep));
              });
              return (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded border bg-red-50 text-red-700">Aktif çakışan: {conflictsActive.length}</span>
                    <span className="px-2 py-1 rounded border bg-blue-50 text-blue-700">Güvenle devre dışı bırakılabilir: {safeDeactivate.length}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Önerilen devre dışı bırak</div>
                    <div className="flex flex-wrap gap-2">
                      {safeDeactivate.length===0 ? (<span className="text-gray-600">Yok</span>) : safeDeactivate.map(x => (
                        <span key={x} className="px-2 py-1 rounded border text-xs bg-gray-50 text-gray-700 border-gray-200">{getModule(x)?.name || x}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenResolveId(null)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              <button onClick={async () => {
                const id = openResolveId;
                const conflictsActive = (conflicts[id]||[]).filter(c => activeModules.includes(c));
                const safeDeactivate = conflictsActive.filter(c => {
                  const dependents = revDepsMap[c] || [];
                  return !dependents.some(dep => activeModules.includes(dep));
                });
                if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Bu işlem için Admin yetkisi gerekli' }); return; }
                let updated = [...activeModules];
                safeDeactivate.forEach(x => { updated = updated.filter(m => m !== x); });
                await window.db.set('active_modules', updated);
                setActiveModules(updated);
                setBanner({ type: 'success', message: `Devre dışı bırakıldı: ${safeDeactivate.length}` });
                setOpenResolveId(null);
              }} className="px-4 py-2 bg-gray-900 text-white rounded">Güvenli Devre Dışı Bırak</button>
            </div>
          </div>
        </div>
      )}
      {openConfMgr && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[720px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Çakışma Yönetimi</h3>
              <button onClick={() => setOpenConfMgr(false)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const activeSet = new Set(activeModules);
              const itemsBuiltIn = activeModules.flatMap(m => (conflicts[m]||[]).filter(x => activeSet.has(x)).map(x => ({ a: m, b: x })));
              const itemsCustom = (conflictRules||[])
                .filter(r => Array.isArray(r) && r.length===2)
                .filter(([a,b]) => activeSet.has(a) && activeSet.has(b))
                .map(([a,b]) => ({ a, b }));
              const items = [...itemsBuiltIn, ...itemsCustom];
              const uniq = [];
              const seen = new Set();
              items.forEach(it => { const key = [it.a,it.b].sort().join('|'); if (!seen.has(key)) { seen.add(key); uniq.push(it); } });
              const safeCandidates = Array.from(new Set(uniq.map(it => it.b))).filter(c => {
                const dependents = revDepsMap[c] || [];
                return !dependents.some(dep => activeSet.has(dep));
              });
              return (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded border bg-red-50 text-red-700">Toplam aktif çakışma: {uniq.length}</span>
                    <span className="px-2 py-1 rounded border bg-blue-50 text-blue-700">Güvenle devre dışı bırakılabilir modüller: {safeCandidates.length}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Adaylar</div>
                    <div className="flex flex-wrap gap-2">
                      {safeCandidates.length===0 ? (<span className="text-gray-600">Yok</span>) : safeCandidates.map(x => (
                        <span key={x} className="px-2 py-1 rounded border text-xs bg-gray-50 text-gray-700 border-gray-200">{getModule(x)?.name || x}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenConfMgr(false)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              <button onClick={async () => {
                const activeSet = new Set(activeModules);
                const items = activeModules.flatMap(m => (conflicts[m]||[]).filter(x => activeSet.has(x)).map(x => ({ a: m, b: x })));
                const uniq = [];
                const seen = new Set();
                items.forEach(it => { const key = [it.a,it.b].sort().join('|'); if (!seen.has(key)) { seen.add(key); uniq.push(it); } });
                const safeCandidates = Array.from(new Set(uniq.map(it => it.b))).filter(c => {
                  const dependents = revDepsMap[c] || [];
                  return !dependents.some(dep => activeSet.has(dep));
                });
                if (userRole !== 'Admin') { setBanner({ type: 'error', message: 'Bu işlem için Admin yetkisi gerekli' }); return; }
                let updated = [...activeModules];
                safeCandidates.forEach(x => { updated = updated.filter(m => m !== x); });
                await window.db.set('active_modules', updated);
                setActiveModules(updated);
                if (typeof logActivity === 'function') {
                  const names = safeCandidates.map(x => getModule(x)?.name || x).join(', ');
                  logActivity('MODULE', `Güvenli devre dışı: ${safeCandidates.length} → ${names}`);
                }
                setBanner({ type: 'success', message: `Güvenli devre dışı: ${safeCandidates.length}` });
                setOpenConfMgr(false);
              }} className="px-4 py-2 bg-gray-900 text-white rounded">Tüm Güvenlileri Devre Dışı</button>
              <button onClick={async () => {
                try {
                  const activeSet = new Set(activeModules);
                  const itemsBuiltIn = activeModules.flatMap(m => (conflicts[m]||[]).filter(x => activeSet.has(x)).map(x => ({ a: m, b: x })));
                  const itemsCustom = (conflictRules||[])
                    .filter(r => Array.isArray(r) && r.length===2)
                    .filter(([a,b]) => activeSet.has(a) && activeSet.has(b))
                    .map(([a,b]) => ({ a, b }));
                  const items = [...itemsBuiltIn, ...itemsCustom];
                  const uniq = []; const seen = new Set();
                  items.forEach(it => { const key = [it.a,it.b].sort().join('|'); if (!seen.has(key)) { seen.add(key); uniq.push(it); } });
                  const safeCandidates = Array.from(new Set(uniq.map(it => it.b))).filter(c => {
                    const dependents = revDepsMap[c] || [];
                    return !dependents.some(dep => activeSet.has(dep));
                  });
                  const rows = uniq.map(it => `<tr><td style='padding:6px;border:1px solid #ddd'>${getModule(it.a)?.name || it.a}</td><td style='padding:6px;border:1px solid #ddd'>${getModule(it.b)?.name || it.b}</td></tr>`).join('');
                  const safeRows = safeCandidates.map(x => `<li>${getModule(x)?.name || x}</li>`).join('');
                  const html = `<!doctype html><html><head><meta charset='utf-8'><title>Çakışma Raporu</title></head><body style='font-family:Arial,sans-serif'>
                    <h1 style='font-size:16px'>Aktif Çakışmalar</h1>
                    <table style='border-collapse:collapse'>
                      <thead><tr><th style='padding:6px;border:1px solid #ddd'>Modül</th><th style='padding:6px;border:1px solid #ddd'>Çakışan</th></tr></thead>
                      <tbody>${rows || ''}</tbody>
                    </table>
                    <h2 style='font-size:14px;margin-top:12px'>Güvenli Devre Dışı Adayları (${safeCandidates.length})</h2>
                    <ul>${safeRows || ''}</ul>
                  </body></html>`;
                  const res = await (window.print && window.print.toPDF ? window.print.toPDF(html, 'conflict-report.pdf') : Promise.resolve({ ok: false }));
                  if (res && res.ok) setBanner({ type: 'success', message: 'Rapor PDF olarak kaydedildi' });
                  else setBanner({ type: 'error', message: 'PDF kaydetme başarısız' });
                } catch { setBanner({ type: 'error', message: 'PDF oluşturma hatası' }); }
              }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">PDF Rapor</button>
            </div>
          </div>
        </div>
      )}
      {openRulesMgr && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[720px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Çakışma Kuralları</h3>
              <button onClick={() => setOpenRulesMgr(false)} className="text-gray-500">×</button>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <select value={newRuleA} onChange={e=>setNewRuleA(e.target.value)} className="px-2 py-1 border rounded text-xs bg-white">
                  <option value="">Modül A</option>
                  {allModules.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
                <span className="text-gray-500">↔</span>
                <select value={newRuleB} onChange={e=>setNewRuleB(e.target.value)} className="px-2 py-1 border rounded text-xs bg-white">
                  <option value="">Modül B</option>
                  {allModules.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
                <button onClick={async () => {
                  const a = String(newRuleA||'').trim();
                  const b = String(newRuleB||'').trim();
                  if (!a || !b || a===b) { setBanner({ type: 'error', message: 'Geçersiz kural' }); return; }
                  const existsA = !!getModule(a);
                  const existsB = !!getModule(b);
                  if (!existsA || !existsB) { setBanner({ type: 'error', message: 'Modül bulunamadı' }); return; }
                  const key = [a,b].sort().join('|');
                  const seen = new Set((conflictRules||[]).map(r => [r[0],r[1]].sort().join('|')));
                  if (seen.has(key)) { setBanner({ type: 'info', message: 'Kural zaten mevcut' }); return; }
                const next = [...(conflictRules||[]), [a,b]];
                await window.db.set('conflict_rules', next);
                setConflictRules(next);
                setNewRuleA(''); setNewRuleB('');
                if (typeof logActivity === 'function') {
                  const an = getModule(a)?.name || a; const bn = getModule(b)?.name || b;
                  logActivity('CONFLICT_RULE', `Kural eklendi: ${an} ↔ ${bn}`);
                }
                setBanner({ type: 'success', message: 'Kural eklendi' });
              }} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs">Ekle</button>
                <button onClick={() => {
                  const json = JSON.stringify(conflictRules||[], null, 2);
                  navigator.clipboard.writeText(json).then(()=> setBanner({ type: 'success', message: 'Kurallar JSON panoya kopyalandı' })).catch(()=> setBanner({ type: 'error', message: 'Kopyalama başarısız' }));
                }} className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">JSON</button>
              <button onClick={async () => {
                const json = JSON.stringify(conflictRules||[], null, 2);
                const res = await (window.system && window.system.saveText ? window.system.saveText(json, 'conflict-rules.json', [{ name: 'JSON', extensions: ['json'] }]) : Promise.resolve({ ok: false }));
                if (res && res.ok) setBanner({ type: 'success', message: 'Kurallar dosyaya kaydedildi' });
                else setBanner({ type: 'error', message: 'Kaydetme başarısız' });
              }} className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">Kaydet JSON</button>
              <button onClick={async () => {
                try {
                  const rows = (conflictRules||[]).map(([a,b]) => `<tr><td style='padding:6px;border:1px solid #ddd'>${getModule(a)?.name || a}</td><td style='padding:6px;border:1px solid #ddd'>${getModule(b)?.name || b}</td></tr>`).join('');
                  const html = `<!doctype html><html><head><meta charset='utf-8'><title>Çakışma Kuralları</title></head><body style='font-family:Arial,sans-serif'>
                    <h1 style='font-size:16px'>Çakışma Kuralları</h1>
                    <table style='border-collapse:collapse'>
                      <thead><tr><th style='padding:6px;border:1px solid #ddd'>Modül A</th><th style='padding:6px;border:1px solid #ddd'>Modül B</th></tr></thead>
                      <tbody>${rows || ''}</tbody>
                    </table>
                  </body></html>`;
                  const res = await (window.print && window.print.toPDF ? window.print.toPDF(html, 'conflict-rules.pdf') : Promise.resolve({ ok: false }));
                  if (res && res.ok) setBanner({ type: 'success', message: 'Kurallar PDF olarak kaydedildi' });
                  else setBanner({ type: 'error', message: 'PDF kaydetme başarısız' });
                } catch { setBanner({ type: 'error', message: 'PDF oluşturma hatası' }); }
              }} className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs">PDF</button>
              <button onClick={() => setRulesImportOpen(v=>!v)} className="px-2 py-1 rounded bg-white text-gray-800 border text-xs">İçe Aktar</button>
              <button onClick={async () => {
                try {
                  const res = await (window.system && window.system.openText ? window.system.openText([{ name: 'JSON', extensions: ['json'] }]) : Promise.resolve({ ok: false }));
                  if (res && res.ok) {
                    setRulesImportOpen(true);
                    setRulesImportText(String(res.content||''));
                    setBanner({ type: 'success', message: 'Dosya yüklendi' });
                  } else {
                    setBanner({ type: 'error', message: 'Dosya açılamadı' });
                  }
                } catch { setBanner({ type: 'error', message: 'Dosya açma hatası' }); }
              }} className="px-2 py-1 rounded bg-white text-gray-800 border text-xs">Dosyadan Al</button>
              </div>
              {rulesImportOpen && (
                <div className="space-y-2">
                  <textarea value={rulesImportText} onChange={e=>setRulesImportText(e.target.value)} className="w-full h-28 border rounded p-2 text-xs" placeholder="JSON yapıştır (array: [ [modA, modB], ... ])"></textarea>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setRulesImportOpen(false); setRulesImportText(''); }} className="px-3 py-1 text-xs text-gray-600 border rounded">İptal</button>
                    <button onClick={async () => {
                      try {
                        const arr = JSON.parse(rulesImportText || '[]');
                        if (!Array.isArray(arr)) { setBanner({ type: 'error', message: 'Geçersiz JSON' }); return; }
                        const norm = arr
                          .filter(r => Array.isArray(r) && r.length===2)
                          .map(([a,b]) => [String(a||'').trim(), String(b||'').trim()])
                          .filter(([a,b]) => a && b && a!==b && getModule(a) && getModule(b));
                        const seen = new Set((conflictRules||[]).map(r => [r[0],r[1]].sort().join('|')));
                        const added = [];
                        norm.forEach(([a,b]) => { const k = [a,b].sort().join('|'); if (!seen.has(k)) { seen.add(k); added.push([a,b]); } });
                        const next = [...(conflictRules||[]), ...added];
                        await window.db.set('conflict_rules', next);
                        setConflictRules(next);
                        setRulesImportOpen(false);
                        setRulesImportText('');
                        if (typeof logActivity === 'function') {
                          logActivity('CONFLICT_RULE', `Kurallar içe aktarıldı: ${added.length}`);
                        }
                        setBanner({ type: 'success', message: `İçe aktarıldı: ${added.length}` });
                      } catch {
                        setBanner({ type: 'error', message: 'Geçersiz JSON' });
                      }
                    }} className="px-3 py-1 text-xs bg-gray-900 text-white rounded">Uygula</button>
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500">Mevcut kurallar</div>
              <div className="flex flex-wrap gap-2">
                {(conflictRules||[]).length===0 ? (<span className="text-gray-600">Kurulmuş kural yok</span>) : (conflictRules||[]).map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded border bg-gray-50 text-gray-700 border-gray-200">
                    <span>{getModule(r[0])?.name || r[0]}</span>
                    <span className="text-gray-400">↔</span>
                    <span>{getModule(r[1])?.name || r[1]}</span>
                    <button onClick={async () => {
                      const next = (conflictRules||[]).filter((_,i)=>i!==idx);
                      await window.db.set('conflict_rules', next);
                      setConflictRules(next);
                      if (typeof logActivity === 'function') {
                        const an = getModule(r[0])?.name || r[0]; const bn = getModule(r[1])?.name || r[1];
                        logActivity('CONFLICT_RULE', `Kural silindi: ${an} ↔ ${bn}`);
                      }
                      setBanner({ type: 'success', message: 'Kural kaldırıldı' });
                    }} className="text-xs px-2 py-1 rounded bg-white text-gray-800 border">Sil</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenRulesMgr(false)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
            </div>
          </div>
        </div>
      )}
      {openSummary && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[720px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Sistem Özeti</h3>
              <button onClick={() => setOpenSummary(false)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const activeSet = new Set(activeModules);
              const activePaid = activeModules.filter(id => !isFree(id));
              const activeFree = activeModules.filter(id => isFree(id));
              const cost = activePaid.reduce((sum,id)=> sum + priceValue(getModule(id)?.price), 0);
              const conflictsActivePairs = activeModules.flatMap(m => (conflicts[m]||[]).filter(x => activeSet.has(x)).map(x => ({ a: m, b: x })));
              const seen = new Set();
              const uniqPairs = conflictsActivePairs.filter(it => { const key = [it.a,it.b].sort().join('|'); if (seen.has(key)) return false; seen.add(key); return true; });
              const filtered = (allModules
                .filter(m => category==='Tümü' || m.category===category)
                .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
                .filter(m => !showOnlyActive || activeModules.includes(m.id))
                .filter(m => !showOnlyFav || favorites.includes(m.id))
                .filter(m => !freeOnly || isFree(m.id))
                .filter(m => !showOnlyAudit || auditIds.includes(m.id))
                .filter(m => {
                  if (!searchTerm) return true;
                  const text = (m.name + ' ' + m.desc);
                  if (searchRegex) {
                    try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                  }
                  return text.toLowerCase().includes(searchTerm.toLowerCase());
                })
              );
              const candidates = filtered.filter(m => !activeModules.includes(m.id));
              let safeFreeCount = 0;
              candidates.forEach(m => {
                const nextTry = [...activeModules, m.id];
                const miss = missingDeps(m.id, nextTry);
                const paidMiss = miss.filter(d => !isFree(d));
                const hasC = hasConflict(m.id, nextTry);
                if (!hasC && paidMiss.length===0 && isFree(m.id)) safeFreeCount++;
              });
              return (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded border bg-gray-50 text-gray-700">Aktif modül: {activeModules.length}</span>
                    <span className="px-2 py-1 rounded border bg-green-50 text-green-700">Ücretsiz aktif: {activeFree.length}</span>
                    <span className="px-2 py-1 rounded border bg-yellow-50 text-yellow-700">Ücretli aktif: {activePaid.length}</span>
                    <span className="px-2 py-1 rounded border bg-yellow-50 text-yellow-700">Tahmini aktif ücret: ₺{cost}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded border bg-red-50 text-red-700">Aktif çakışma çiftleri: {uniqPairs.length}</span>
                    <span className="px-2 py-1 rounded border bg-green-50 text-green-700">Güvenli ücretsiz eklenebilir (filtreli): {safeFreeCount}</span>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenSummary(false)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              <button onClick={() => { setOpenSummary(false); bulkActivateFiltered(); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Güvenli Ücretsizleri Aktifleştir</button>
              <button onClick={() => { setOpenSummary(false); setOpenConfMgr(true); }} className="px-4 py-2 bg-white text-gray-800 border rounded">Çakışma Yönetimini Aç</button>
              <button onClick={async () => {
                try {
                  const activeSet = new Set(activeModules);
                  const activePaid = activeModules.filter(id => !isFree(id));
                  const activeFree = activeModules.filter(id => isFree(id));
                  const cost = activePaid.reduce((sum,id)=> sum + priceValue(getModule(id)?.price), 0);
                  const conflictsActivePairs = activeModules.flatMap(m => (conflicts[m]||[]).filter(x => activeSet.has(x)).map(x => ({ a: m, b: x })));
                  const seen = new Set();
                  const uniqPairs = conflictsActivePairs.filter(it => { const key = [it.a,it.b].sort().join('|'); if (seen.has(key)) return false; seen.add(key); return true; });
                  const filtered = (allModules
                    .filter(m => category==='Tümü' || m.category===category)
                    .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
                    .filter(m => !showOnlyActive || activeModules.includes(m.id))
                    .filter(m => !showOnlyFav || favorites.includes(m.id))
                    .filter(m => !freeOnly || isFree(m.id))
                    .filter(m => !showOnlyAudit || auditIds.includes(m.id))
                    .filter(m => {
                      if (!searchTerm) return true;
                      const text = (m.name + ' ' + m.desc);
                      if (searchRegex) {
                        try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                      }
                      return text.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                  );
                  const candidates = filtered.filter(m => !activeModules.includes(m.id));
                  let safeFreeCount = 0;
                  candidates.forEach(m => {
                    const nextTry = [...activeModules, m.id];
                    const miss = missingDeps(m.id, nextTry);
                    const paidMiss = miss.filter(d => !isFree(d));
                    const hasC = hasConflict(m.id, nextTry);
                    if (!hasC && paidMiss.length===0 && isFree(m.id)) safeFreeCount++;
                  });
                  const rows = uniqPairs.map(it => `<tr><td style='padding:6px;border:1px solid #ddd'>${getModule(it.a)?.name || it.a}</td><td style='padding:6px;border:1px solid #ddd'>${getModule(it.b)?.name || it.b}</td></tr>`).join('');
                  const html = `<!doctype html><html><head><meta charset='utf-8'><title>Sistem Özeti</title></head><body style='font-family:Arial,sans-serif'>
                    <h1 style='font-size:16px'>Sistem Özeti</h1>
                    <p>Aktif modül: ${activeModules.length} • Ücretsiz aktif: ${activeFree.length} • Ücretli aktif: ${activePaid.length} • Tahmini aktif ücret: ₺${cost}</p>
                    <h2 style='font-size:14px;margin-top:12px'>Aktif Çakışma Çiftleri (${uniqPairs.length})</h2>
                    <table style='border-collapse:collapse'>
                      <thead><tr><th style='padding:6px;border:1px solid #ddd'>Modül</th><th style='padding:6px;border:1px solid #ddd'>Çakışan</th></tr></thead>
                      <tbody>${rows || ''}</tbody>
                    </table>
                    <h2 style='font-size:14px;margin-top:12px'>Güvenli Ücretsiz Eklenebilir (Filtreli)</h2>
                    <p>Sayısı: ${safeFreeCount}</p>
                  </body></html>`;
                  const res = await (window.print && window.print.toPDF ? window.print.toPDF(html, 'system-summary.pdf') : Promise.resolve({ ok: false }));
                  if (res && res.ok) setBanner({ type: 'success', message: 'Özet PDF olarak kaydedildi' });
                  else setBanner({ type: 'error', message: 'PDF kaydetme başarısız' });
                } catch { setBanner({ type: 'error', message: 'PDF oluşturma hatası' }); }
              }} className="px-4 py-2 bg-gray-200 text-gray-800 border rounded">PDF Özeti</button>
            </div>
          </div>
        </div>
      )}
      {openCycles && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[720px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Döngü Tarama</h3>
              <button onClick={() => setOpenCycles(false)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const cyc = allModules.filter(m => hasCycleFrom(m.id));
              return (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded border bg-red-50 text-red-700">Döngü içeren modül: {cyc.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cyc.length===0 ? (<span className="text-gray-600">Yok</span>) : cyc.map(m => (
                      <span key={m.id} className="px-2 py-1 rounded border text-xs bg-gray-50 text-gray-700 border-gray-200">{m.name}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenCycles(false)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
            </div>
          </div>
        </div>
      )}
      {simOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[720px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">{simType==='activate' ? 'Aktivasyon Simülasyonu' : 'Pasifleştirme Simülasyonu'}</h3>
              <button onClick={() => setSimOpen(false)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const filtered = (allModules
                .filter(m => category==='Tümü' || m.category===category)
                .filter(m => selectedCategories.length===0 || selectedCategories.includes(m.category))
                .filter(m => !showOnlyActive || activeModules.includes(m.id))
                .filter(m => !showOnlyFav || favorites.includes(m.id))
                .filter(m => !freeOnly || isFree(m.id))
                .filter(m => !showOnlyAudit || auditIds.includes(m.id))
                .filter(m => {
                  if (!searchTerm) return true;
                  const text = (m.name + ' ' + m.desc);
                  if (searchRegex) {
                    try { const re = new RegExp(searchTerm, 'i'); return re.test(text); } catch { return text.toLowerCase().includes(searchTerm.toLowerCase()); }
                  }
                  return text.toLowerCase().includes(searchTerm.toLowerCase());
                })
              );
              if (simType==='activate') {
                const candidates = filtered.filter(m => !activeModules.includes(m.id));
                let safeFree = [];
                let needsPaid = [];
                let blockedConf = [];
                candidates.forEach(m => {
                  const nextTry = [...activeModules, m.id];
                  const miss = missingDeps(m.id, nextTry);
                  const paidMiss = miss.filter(d => !isFree(d));
                  const hasC = hasConflict(m.id, nextTry);
                  if (hasC) blockedConf.push(m.id);
                  else if (paidMiss.length>0 || !isFree(m.id)) needsPaid.push(m.id);
                  else safeFree.push(m.id);
                });
                return (
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded border bg-green-50 text-green-700">Güvenli ücretsiz eklenebilir: {safeFree.length}</span>
                      <span className="px-2 py-1 rounded border bg-yellow-50 text-yellow-700">Ücret gerektiren: {needsPaid.length}</span>
                      <span className="px-2 py-1 rounded border bg-red-50 text-red-700">Çakışma nedeniyle atlanan: {blockedConf.length}</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Güvenli ücretsizler</div>
                      <div className="flex flex-wrap gap-2">
                        {safeFree.length===0 ? (<span className="text-gray-600">Yok</span>) : safeFree.map(id => (
                          <span key={id} className="px-2 py-1 rounded border text-xs bg-green-50 text-green-700 border-green-200">{getModule(id)?.name || id}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              } else {
                const candidates = filtered.filter(m => activeModules.includes(m.id));
                let safeRemove = [];
                let blockedDep = [];
                candidates.forEach(m => {
                  const dependents = revDepsMap[m.id] || [];
                  const hasActiveDependent = dependents.some(dep => activeModules.includes(dep));
                  if (hasActiveDependent) blockedDep.push(m.id);
                  else safeRemove.push(m.id);
                });
                return (
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded border bg-blue-50 text-blue-700">Güvenli kaldırılabilir: {safeRemove.length}</span>
                      <span className="px-2 py-1 rounded border bg-red-50 text-red-700">Bağımlı engeli: {blockedDep.length}</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Güvenli kaldırılabilirler</div>
                      <div className="flex flex-wrap gap-2">
                        {safeRemove.length===0 ? (<span className="text-gray-600">Yok</span>) : safeRemove.map(id => (
                          <span key={id} className="px-2 py-1 rounded border text-xs bg-gray-50 text-gray-700 border-gray-200">{getModule(id)?.name || id}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setSimOpen(false)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              {simType==='activate' ? (
                <button onClick={() => { setSimOpen(false); bulkActivateFiltered(); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Güvenli Aktifleştir</button>
              ) : (
                <button onClick={() => { setSimOpen(false); bulkDeactivateFiltered(); }} className="px-4 py-2 bg-red-600 text-white rounded">Güvenli Pasifleştir</button>
              )}
            </div>
          </div>
        </div>
      )}
      {compareOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[640px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Profil Karşılaştırma</h3>
              <button onClick={() => setCompareOpen(false)} className="text-gray-500">×</button>
            </div>
            {(() => {
              const p = profiles.find(x => x.name === compareProfileName) || { modules: [] };
              const toAdd = p.modules.filter(id => !activeModules.includes(id));
              const toRemove = activeModules.filter(id => !p.modules.includes(id));
              const addCost = toAdd.filter(id => !isFree(id)).reduce((sum,id)=> sum + priceValue(getModule(id)?.price), 0);
              const paidMiss = toAdd.flatMap(id => missingDeps(id, [...activeModules, ...toAdd])).filter(d => !isFree(d));
              return (
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <div className="font-medium">Eklenecek Modüller ({toAdd.length})</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {toAdd.map(id => (
                        <span key={id} className={`px-2 py-1 rounded border text-xs ${isFree(id) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{getModule(id)?.name || id}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Kaldırılacak Modüller ({toRemove.length})</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {toRemove.map(id => (
                        <span key={id} className="px-2 py-1 rounded border text-xs bg-gray-50 text-gray-700 border-gray-200">{getModule(id)?.name || id}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded border bg-white text-gray-700">Tahmini ek ücret: ₺{addCost}</span>
                    <span className="px-2 py-1 rounded border bg-white text-gray-700">Ücretli eksik bağımlılıklar: {Array.from(new Set(paidMiss)).join(', ') || 'Yok'}</span>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCompareOpen(false)} className="px-4 py-2 text-gray-600 border rounded">Kapat</button>
              <button onClick={() => {
                const p = profiles.find(x => x.name === compareProfileName) || { modules: [] };
                const toAdd = p.modules.filter(id => !activeModules.includes(id));
                const toRemove = activeModules.filter(id => !p.modules.includes(id));
                const payload = JSON.stringify({ profile: compareProfileName, toAdd, toRemove }, null, 2);
                navigator.clipboard.writeText(payload).then(()=> setBanner({ type: 'success', message: 'Karşılaştırma JSON panoya kopyalandı' })).catch(()=> setBanner({ type: 'error', message: 'Kopyalama başarısız' }));
              }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Panoya Kopyala</button>
              <button onClick={() => { if (!compareProfileName) return; applyProfileAdds(compareProfileName); }} className="px-4 py-2 bg-green-600 text-white rounded">Sadece Ekle</button>
              <button onClick={() => { if (!compareProfileName) return; applyProfileRemoves(compareProfileName); }} className="px-4 py-2 bg-red-600 text-white rounded">Sadece Kaldır</button>
              <button onClick={() => { if (!compareProfileName) return; applyProfileMerge(compareProfileName); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Birleştir</button>
            </div>
          </div>
        </div>
      )}
      {actionModule && actionType === 'buy' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[520px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Satın Alma Onayı</h3>
              <button onClick={() => { setActionModule(null); setActionType(null); }} className="text-gray-500">×</button>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div><span className="font-medium">Modül:</span> {actionModule.name}</div>
              <div><span className="font-medium">Fiyat:</span> {actionModule.price}</div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <input value={paymentForm.name} onChange={e=>setPaymentForm(p=>({ ...p, name: e.target.value }))} className="px-3 py-2 border rounded" placeholder="Kart üzerindeki isim" />
                <input value={paymentForm.card} onChange={e=>setPaymentForm(p=>({ ...p, card: e.target.value.replace(/\D/g,'') }))} className="px-3 py-2 border rounded" placeholder="Kart numarası (16 hane)" maxLength={16} />
                <input value={paymentForm.expiry} onChange={e=>setPaymentForm(p=>({ ...p, expiry: e.target.value }))} className="px-3 py-2 border rounded" placeholder="Son kullanma (MM/YY)" />
                <input value={paymentForm.cvv} onChange={e=>setPaymentForm(p=>({ ...p, cvv: e.target.value.replace(/\D/g,'') }))} className="px-3 py-2 border rounded" placeholder="CVV (3 hane)" maxLength={3} />
              </div>
              {Boolean((dependencies[actionModule.id]||[]).length) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Bağımlılıklar</div>
                  <div className="flex flex-wrap gap-2">
                    {(dependencies[actionModule.id]||[]).map(d => (
                      <span key={d} className={`px-2 py-1 rounded border text-xs ${activeModules.includes(d) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{getModule(d)?.name || d}</span>
                    ))}
                  </div>
                </div>
              )}
              {Boolean((conflicts[actionModule.id]||[]).length) && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Çakışmalar</div>
                  <div className="flex flex-wrap gap-2">
                    {(conflicts[actionModule.id]||[]).map(c => (
                      <span key={c} className={`px-2 py-1 rounded border text-xs ${activeModules.includes(c) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{getModule(c)?.name || c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setActionModule(null); setActionType(null); }} className="px-4 py-2 text-gray-600 border rounded">İptal</button>
              <button onClick={() => {
                const n = (paymentForm.name || '').trim().length >= 2;
                const c = (paymentForm.card || '').length === 16;
                const v = (paymentForm.cvv || '').length === 3;
                const e = /^\d{2}\/\d{2}$/.test(paymentForm.expiry || '');
                if (!n || !c || !v || !e) {
                  setBanner({ type: 'error', message: 'Ödeme bilgilerini kontrol et' });
                  return;
                }
                toggleModule(actionModule.id);
              }} className="px-4 py-2 bg-gray-900 text-white rounded">Satın Al ve Aktif Et</button>
            </div>
          </div>
        </div>
      )}
      {actionModule && actionType === 'remove' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[480px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Kaldırma Onayı</h3>
              <button onClick={() => { setActionModule(null); setActionType(null); }} className="text-gray-500">×</button>
            </div>
            <p className="text-sm text-gray-700">{actionModule.name} modülünü pasif yapmak istediğinden emin misin?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setActionModule(null); setActionType(null); }} className="px-4 py-2 text-gray-600 border rounded">İptal</button>
              <button onClick={() => toggleModule(actionModule.id)} className="px-4 py-2 bg-red-600 text-white rounded">Evet, Kaldır</button>
            </div>
          </div>
        </div>
      )}
      {importOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[720px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Ayarları İçe Aktar</h3>
              <button onClick={() => { setImportOpen(false); setImportText(''); }} className="text-gray-500">×</button>
            </div>
            <textarea value={importText} onChange={e=>setImportText(e.target.value)} className="w-full h-48 border rounded p-3 text-sm" placeholder="JSON yapıştır"></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setImportOpen(false); setImportText(''); }} className="px-4 py-2 text-gray-600 border rounded">İptal</button>
              <button onClick={async () => {
                try {
                  const obj = JSON.parse(importText || '{}');
                  const am = Array.isArray(obj.activeModules) ? obj.activeModules : activeModules;
                  const mr = typeof obj.moduleRoles === 'object' && obj.moduleRoles ? obj.moduleRoles : moduleRoles;
                  const flt = obj.filters || {};
                  const fav = Array.isArray(obj.favorites) ? obj.favorites : favorites;
                  const rules = Array.isArray(obj.conflictRules) ? obj.conflictRules.filter(r => Array.isArray(r) && r.length===2) : (conflictRules||[]);
                  await window.db.set('active_modules', am);
                  await window.db.set('module_roles', mr);
                  await window.db.set('marketplace_favorites', fav);
                  await window.db.set('marketplace_filters', {
                    searchTerm: flt.searchTerm || '',
                    category: flt.category || 'Tümü',
                    showOnlyActive: Boolean(flt.showOnlyActive),
                    sortKey: flt.sortKey || 'name',
                    sortOrder: flt.sortOrder || 'asc',
                    showOnlyFav: Boolean(flt.showOnlyFav),
                    pinFavorites: flt.pinFavorites !== false
                  });
                  await window.db.set('conflict_rules', rules);
                  setActiveModules(am);
                  setModuleRoles(mr);
                  setFavorites(fav);
                  setSearchTerm(flt.searchTerm || '');
                  setCategory(flt.category || 'Tümü');
                  setShowOnlyActive(Boolean(flt.showOnlyActive));
                  setSortKey(flt.sortKey || 'name');
                  setSortOrder(flt.sortOrder || 'asc');
                  setShowOnlyFav(Boolean(flt.showOnlyFav));
                  setPinFavorites(flt.pinFavorites !== false);
                  setConflictRules(rules);
                  setBanner({ type: 'success', message: 'Ayarlar içe aktarıldı' });
                  setImportOpen(false);
                  setImportText('');
                } catch {
                  setBanner({ type: 'error', message: 'Geçersiz JSON' });
                }
              }} className="px-4 py-2 bg-gray-900 text-white rounded">Uygula</button>
            </div>
          </div>
        </div>
      )}
      {importProfilesOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[640px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Profilleri İçe Aktar</h3>
              <button onClick={() => { setImportProfilesOpen(false); setImportProfilesText(''); }} className="text-gray-500">×</button>
            </div>
            <textarea value={importProfilesText} onChange={e=>setImportProfilesText(e.target.value)} className="w-full h-48 border rounded p-3 text-sm" placeholder="JSON yapıştır (array: { name, modules[] })"></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setImportProfilesOpen(false); setImportProfilesText(''); }} className="px-4 py-2 text-gray-600 border rounded">İptal</button>
              <button onClick={async () => {
                try {
                  const arr = JSON.parse(importProfilesText || '[]');
                  if (!Array.isArray(arr)) { setBanner({ type: 'error', message: 'Geçersiz JSON' }); return; }
                  const norm = arr.map(p => ({ name: String(p.name||'').trim(), modules: Array.isArray(p.modules) ? p.modules : [] })).filter(p => p.name.length>=2);
                  await window.db.set('module_profiles', norm);
                  setProfiles(norm);
                  setBanner({ type: 'success', message: 'Profiller içe aktarıldı' });
                  setImportProfilesOpen(false);
                  setImportProfilesText('');
                } catch {
                  setBanner({ type: 'error', message: 'Geçersiz JSON' });
                }
              }} className="px-4 py-2 bg-gray-900 text-white rounded">Uygula</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
