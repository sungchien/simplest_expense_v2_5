
import React, { useState } from 'react';
import { AppView, User } from '../types';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface RegisterProps {
  onRegister: (user: User) => void;
  onNavigate: (view: AppView) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('請填寫所有欄位');
      return;
    }
    if (password !== confirmPassword) {
      setError('密碼不一致');
      return;
    }
    if (password.length < 6) {
      setError('密碼長度至少需 6 個字元');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // 重要：建立 users/{uid} 文件
      await setDoc(doc(db, 'users', fbUser.uid), {
        email: fbUser.email,
        createdAt: Date.now(),
        lastLogin: Date.now()
      });

      onRegister({
        uid: fbUser.uid,
        email: fbUser.email || '',
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('此電子郵件已被註冊');
      } else if (err.code === 'auth/invalid-email') {
        setError('無效的電子郵件格式');
      } else {
        setError('註冊失敗：' + err.code);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex items-center px-4 pt-6 pb-2">
        <button 
          onClick={() => onNavigate('LOGIN')}
          disabled={loading}
          className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined !text-[24px]">arrow_back_ios_new</span>
        </button>
      </nav>

      <div className="px-8 pt-8 pb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-soft text-primary rounded-2xl mb-6 shadow-sm">
          <span className="material-symbols-outlined !text-3xl">account_balance_wallet</span>
        </div>
        <h1 className="text-text-main tracking-tight text-3xl font-bold leading-tight pb-2">註冊新帳號</h1>
        <p className="text-text-muted text-base font-normal leading-relaxed">
          加入專為大學生設計的理財系統，<br/>掌握你的每一筆開銷。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8">
        <div className="flex flex-col gap-2">
          <label className="text-primary font-bold text-xs uppercase tracking-wider ml-1">電子郵件</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 material-symbols-outlined">mail</span>
            <input 
              type="email" 
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input block w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-primary-light/30 text-text-main focus:ring-2 focus:ring-primary focus:bg-white placeholder:text-slate-400 text-base transition-all disabled:opacity-50" 
              placeholder="student@university.edu.tw" 
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-primary font-bold text-xs uppercase tracking-wider ml-1">密碼</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 material-symbols-outlined">lock</span>
            <input 
              type="password" 
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input block w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-primary-light/30 text-text-main focus:ring-2 focus:ring-primary focus:bg-white placeholder:text-slate-400 text-base transition-all disabled:opacity-50" 
              placeholder="至少 6 個字元" 
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-primary font-bold text-xs uppercase tracking-wider ml-1">確認密碼</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 material-symbols-outlined">verified_user</span>
            <input 
              type="password" 
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input block w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-primary-light/30 text-text-main focus:ring-2 focus:ring-primary focus:bg-white placeholder:text-slate-400 text-base transition-all disabled:opacity-50" 
              placeholder="再次輸入密碼" 
            />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
            <p className="text-red-600 text-xs font-bold">{error}</p>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl text-lg mt-4 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? '註冊中...' : '建立帳號'}
        </button>
      </form>

      <div className="mt-auto px-8 pb-12 pt-4 text-center">
        <p className="text-text-muted text-base">
          已有帳號？ 
          <button 
            disabled={loading}
            onClick={() => onNavigate('LOGIN')}
            className="text-primary font-bold ml-2 hover:text-primary-dark transition-colors disabled:opacity-50 underline underline-offset-4"
          >
            立即登入
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
