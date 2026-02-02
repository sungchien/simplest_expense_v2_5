
import React, { useState, useEffect } from 'react';
import { AppView, User } from '../types';
import { auth, googleProvider, firebaseConfig } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithRedirect, 
  getRedirectResult,
  sendPasswordResetEmail 
} from 'firebase/auth';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (view: AppView) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [currentHostname, setCurrentHostname] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // 偵測當前主機名稱
    setCurrentHostname(window.location.hostname);

    const checkRedirect = async () => {
      try {
        console.log("[Login] 檢查 Redirect 結果...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("[Login] 成功取得 Redirect 使用者:", result.user.email);
          setLoading(true);
          // App.tsx 的 onAuthStateChanged 會接手
        } else {
          console.log("[Login] 無 Redirect 結果，等待使用者操作");
        }
      } catch (err: any) {
        console.error("[Login] Redirect 報錯:", err.code);
        if (err.code === 'auth/unauthorized-domain') {
          setIsUnauthorizedDomain(true);
          setError('登入失敗：此網域未經 Firebase 授權。');
        } else {
          setError('Google 登入出錯：' + err.message);
        }
      }
    };
    checkRedirect();
  }, []);

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('請輸入電子郵件和密碼');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setIsUnauthorizedDomain(false);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      onLogin({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || undefined,
        photoURL: fbUser.photoURL || undefined,
      });
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('帳號或密碼不正確。');
      } else {
        setError('登入錯誤：' + (err.message || err.code));
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setIsUnauthorizedDomain(false);
    try {
      console.log("[Login] 啟動 Google Redirect...");
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setError('此網域未經 Firebase 授權。');
      } else {
        setError('無法啟動 Google 登入：' + err.message);
      }
      setLoading(false);
    }
  };

  const copyHostname = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('請先輸入您的電子郵件地址。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('重設密碼信件已寄出。');
    } catch (err: any) {
      setError('重設密碼失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-primary font-bold">同步登入狀態...</p>
        </div>
      )}

      <div className="flex flex-col items-center pt-16 pb-8">
        <div 
          className="inline-flex items-center justify-center w-16 h-16 bg-primary-soft text-primary rounded-2xl mb-6 shadow-lg cursor-pointer active:scale-90 transition-transform"
          onClick={() => setShowDebug(!showDebug)}
          title="連點 5 次開啟診斷 (開發用)"
        >
          <span className="material-symbols-outlined !text-4xl">account_balance_wallet</span>
        </div>
        <h1 className="text-text-main tracking-tight text-3xl font-bold px-4 text-center">極簡化記帳系統</h1>
        <p className="text-text-muted text-base pt-2 px-6 text-center italic">讓每筆消費都簡單透明</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-8">
        {/* Debug 區塊 (僅在問題診斷時顯示) */}
        {showDebug && (
          <div className="bg-slate-900 text-green-400 p-4 rounded-2xl font-mono text-[10px] space-y-2 mb-4 border-2 border-green-500/30">
            <div className="flex justify-between border-b border-green-900 pb-1 mb-1">
              <span>[診斷工具]</span>
              <button onClick={() => setShowDebug(false)} className="text-white">✕</button>
            </div>
            <p>● 當前主機: {currentHostname}</p>
            <p>● AuthDomain: {firebaseConfig.authDomain}</p>
            <p>● 目前使用者: {auth.currentUser ? auth.currentUser.email : '無'}</p>
            <p>● 最後錯誤: {error || '無'}</p>
            <p className="text-white bg-blue-600 px-2 py-0.5 rounded inline-block">提示: 若已登入卻沒跳轉，請重整頁面</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-text-main text-sm font-semibold ml-1">電子郵件</label>
          <input 
            type="email" 
            autoComplete="email"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full rounded-2xl border-border-light bg-white h-14 p-4 focus:ring-2 focus:ring-primary/20 outline-none" 
            placeholder="your@email.com" 
          />
        </div>
        <div className="flex flex-col gap-2 relative">
          <div className="flex justify-between items-center px-1">
            <label className="text-text-main text-sm font-semibold">密碼</label>
            <button type="button" onClick={handleForgotPassword} className="text-primary text-xs font-bold hover:underline">忘記密碼？</button>
          </div>
          <input 
            type="password" 
            autoComplete="current-password"
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input w-full rounded-2xl border-border-light bg-white h-14 p-4 focus:ring-2 focus:ring-primary/20 outline-none" 
            placeholder="••••••••" 
          />
        </div>
        
        {(error || isUnauthorizedDomain) && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">error_outline</span>
              <p className="text-red-700 text-xs font-bold leading-relaxed">{error}</p>
            </div>
            
            {isUnauthorizedDomain && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-[10px] text-red-600 font-medium">請將此網域加入 Firebase 的授權清單：</p>
                <div className="bg-white border border-red-200 rounded-xl p-2 flex items-center justify-between">
                  <code className="text-[10px] font-mono text-red-800 truncate block mr-2">{currentHostname}</code>
                  <button type="button" onClick={copyHostname} className="shrink-0 bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold">
                    {copied ? '已複製' : '複製'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleOpenInNewTab} className="flex-1 bg-red-600 text-white text-[10px] font-bold py-2 rounded-lg">在新分頁開啟</button>
                  <a href={firebaseConsoleUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg text-center">前往後台</a>
                </div>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <p className="text-green-700 text-xs font-bold">{success}</p>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-lg mt-4 shadow-xl active:scale-[0.98] disabled:opacity-70"
        >
          登入 <span className="material-symbols-outlined">login</span>
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase">第三方登入</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          使用 Google 帳號登入
        </button>
      </form>

      <div className="mt-auto pb-12 pt-10 text-center">
        <p className="text-text-main/70 text-base">
          還沒有帳號？
          <button 
            disabled={loading}
            onClick={() => onNavigate('REGISTER')}
            className="text-primary font-bold ml-2 hover:text-primary-dark underline underline-offset-4"
          >
            立即註冊
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
