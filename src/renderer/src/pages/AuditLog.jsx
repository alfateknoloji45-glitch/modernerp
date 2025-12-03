import React, { useState, useEffect } from 'react';
import { Search, History, User } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    // Audit Logları en yeniden eskiye çek
    const storedLogs = await window.db.get('audit_logs') || [];
    setLogs(storedLogs.reverse());
  };

  const filteredLogs = logs.filter(log => 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Duruma göre renk
  const getColor = (type) => {
      if (type === 'DELETE' || type === 'ERROR') return 'bg-red-100 text-red-700';
      if (type === 'CREATE' || type === 'SALE') return 'bg-green-100 text-green-700';
      if (type === 'UPDATE') return 'bg-blue-100 text-blue-700';
      return 'bg-gray-100 text-gray-600';
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">İşlem Geçmişi (Audit Log)</h2>
            <p className="text-gray-500 text-sm">Tüm kullanıcıların sistemdeki kritik hareketleri.</p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input className="pl-10 pr-4 py-2 border rounded-lg w-64" placeholder="Kullanıcı veya işlem ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">TARİH & SAAT</th>
              <th className="px-6 py-4">KULLANICI</th>
              <th className="px-6 py-4">İŞLEM</th>
              <th className="px-6 py-4">DETAY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-400">Henüz kritik işlem kaydı yok.</td></tr>
            ) : (
                filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-700">
                        {log.date} <span className="text-xs text-gray-500 block">{log.time}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                        <User size={16}/> {log.user}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${getColor(log.type)}`}>
                            {log.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{log.activity}</td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;