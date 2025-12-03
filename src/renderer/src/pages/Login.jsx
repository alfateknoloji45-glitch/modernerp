import React, { useState } from 'react';
import { Lock, User, Shield, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Veritabanındaki kullanıcıları çek
    let users = await window.db.get('app_users');
    
    // Eğer veritabanı boşsa (ilk kurulum), varsayılan admin oluştur
    if (!users || users.length === 0) {
        users = [{ id: 1, name: 'Yönetici', username: 'admin', password: '123', role: 'Admin' }];
        await window.db.set('app_users', users);
    }

    // Gecikme efekti (Gerçekçilik için)
    setTimeout(() => {
        const foundUser = users.find(u => u.username === username && u.password === password);

        if (foundUser) {
            onLogin(foundUser); // Kullanıcı objesini App.jsx'e gönder
        } else {
            setError('Kullanıcı adı veya şifre hatalı!');
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-96 relative z-10">
        <div className="text-center mb-8">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
                <Shield size={32} className="text-white"/>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">ALFA<span className="text-blue-400">ERP</span></h1>
            <p className="text-slate-400 text-sm mt-1">Personel Girişi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                    type="text" placeholder="Kullanıcı Adı" 
                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                    type="password" placeholder="Şifre" 
                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-xs text-center font-medium">{error}</div>}
            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? 'Kontrol Ediliyor...' : <>Giriş Yap <ArrowRight size={18}/></>}
            </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
