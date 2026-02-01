
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

  useEffect(() => {
    // 處理重新導向後的登入結果
    const handleRedirectResult = async () => {
      try {
        // 由於 getRedirectResult 可能需要時間，顯示載入狀態
        const result = await getRedirectResult(auth);
        if (result) {
          setLoading(true);
          const fbUser = result.user;
          onLogin({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || undefined,
            photoURL: fbUser.photoURL || undefined,
          });
        }
      } catch (err: any) {
        console.error("Redirect Result Error:", err);
        if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
          setIsUnauthorizedDomain(true);
          setError('目前的網域未經 Firebase 授權。');
        } else {
          setError('Google 登入失敗：' + (err.message || err.code));
        }
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();

    // 強化網域偵測邏輯，解決在 Sandbox Iframe 內可能回傳空字串的問題
    const detectHostname = () => {
      try {
        // 優先嘗試直接讀取，若為空則嘗試從 href 解析
        const host = window.location.hostname || new URL(window.location.href).hostname;
        setCurrentHostname(host || '無法自動偵測，請在新分頁開啟');
      } catch (e) {
        setCurrentHostname('請在新分頁查看網址列');
      }
    };
    detectHostname();
  }, [onLogin]);

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
      } else if (err.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setError('目前的網域未經 Firebase 授權。');
      } else {
        setError('登入錯誤：' + (err.message || err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setIsUnauthorizedDomain(false);
    try {
      // 改用 signInWithRedirect 避免在某些環境下 Popup 被封鎖的問題
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Login Initiated Error:", err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        setIsUnauthorizedDomain(true);
        setError('目前的網域未經 Firebase 授權。');
      } else {
        setError('無法發起 Google 登入：' + err.message);
      }
      setLoading(false);
    }
  };

  const copyHostname = () => {
    if (currentHostname && !currentHostname.includes('無法')) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // 備案：如果還是抓不到，提示使用者手動從網址列複製
      alert('請直接從瀏覽器網址列複製網域（例如 xxxx.googleusercontent.com）');
    }
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
      setSuccess('重設密碼信件已寄出，請檢查您的信箱。');
    } catch (err: any) {
      setError('重設密碼失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-700">
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-soft text-primary rounded-2xl mb-6 shadow-lg shadow-primary/10">
          <span className="material-symbols-outlined !text-4xl">account_balance_wallet</span>
        </div>
        <h1 className="text-text-main tracking-tight text-3xl font-bold leading-tight px-4 text-center">極簡化記帳系統</h1>
        <p className="text-text-muted text-base font-medium leading-normal pt-2 px-6 text-center italic">讓每筆消費都簡單透明</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-8">
        <div className="flex flex-col gap-2">
          <label className="text-text-main text-sm font-semibold ml-1">電子郵件</label>
          <input 
            type="email" 
            autoComplete="email"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full rounded-2xl text-text-main border-border-light bg-white h-14 p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50" 
            placeholder="your@email.com" 
          />
        </div>
        <div className="flex flex-col gap-2 relative">
          <div className="flex justify-between items-center px-1">
            <label className="text-text-main text-sm font-semibold">密碼</label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-primary text-xs font-bold hover:underline"
              disabled={loading}
            >
              忘記密碼？
            </button>
          </div>
          <input 
            type="password" 
            autoComplete="current-password"
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input w-full rounded-2xl text-text-main border-border-light bg-white h-14 p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50" 
            placeholder="••••••••" 
          />
        </div>
        
        {error && !isUnauthorizedDomain && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5 shrink-0">error_outline</span>
            <p className="text-red-700 text-xs font-bold leading-relaxed">{error}</p>
          </div>
        )}

        {isUnauthorizedDomain && (
          <div className="bg-blue-50 border-2 border-primary/20 p-5 rounded-[28px] flex flex-col gap-4 animate-in zoom-in-95 duration-300 shadow-xl shadow-primary/5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[28px] mt-0.5 shrink-0">help</span>
              <div>
                <p className="text-primary text-sm font-black">解決 Firebase 授權問題</p>
                <p className="text-primary/70 text-[11px] mt-1 font-medium leading-relaxed">
                  請按照以下步驟完成設定，否則無法使用 Google 登入：
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button 
                type="button"
                onClick={handleOpenInNewTab}
                className="w-full bg-primary text-white py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                1. 在新分頁開啟 (取得正確網域)
              </button>
              
              <div className="bg-white border border-blue-100 rounded-xl p-3 flex items-center justify-between group">
                <div className="overflow-hidden">
                   <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">授權網域</p>
                   <code className="text-primary font-mono text-[11px] font-bold truncate block">
                    {currentHostname}
                  </code>
                </div>
                <button 
                  type="button"
                  onClick={copyHostname}
                  className="shrink-0 bg-blue-50 text-primary px-3 py-2 rounded-lg text-[10px] font-black hover:bg-blue-100 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? '已複製' : '2. 複製'}
                </button>
              </div>

              <a 
                href={firebaseConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white border border-primary/20 text-primary text-[11px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
              >
                <span className="material-symbols-outlined text-base">settings</span>
                3. 去 Firebase 貼上此網域
              </a>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <span className="material-symbols-outlined text-green-500 text-[20px] mt-0.5 shrink-0">check_circle</span>
            <p className="text-green-700 text-xs font-bold leading-relaxed">{success}</p>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl text-lg mt-4 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>登入 <span className="material-symbols-outlined text-[22px]">login</span></>
          )}
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">第三方登入</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-70"
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
            className="text-primary font-bold ml-2 hover:text-primary-dark transition-colors disabled:opacity-50 underline underline-offset-4"
          >
            立即註冊
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
