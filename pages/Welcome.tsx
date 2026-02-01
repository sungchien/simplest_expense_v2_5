
import React from 'react';
import { User } from '../types';

interface WelcomeProps {
  user: User | null;
  onConfirm: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ user, onConfirm }) => {
  if (!user) return null;

  return (
    <div className="flex flex-col h-full items-center justify-center px-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col items-center w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl shadow-primary/10 border border-blue-50">
        <div className="relative mb-8">
          <div className="size-32 rounded-[38px] bg-primary-soft overflow-hidden border-4 border-white shadow-xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-6xl">person</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white size-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
            <span className="material-symbols-outlined text-xl font-bold">check</span>
          </div>
        </div>

        <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2 opacity-60">驗證成功</p>
        <h1 className="text-text-main text-3xl font-black italic tracking-tight text-center mb-2">
          歡迎回來！
        </h1>
        <p className="text-slate-500 font-bold text-lg mb-8 text-center truncate w-full px-4">
          {user.displayName || user.email.split('@')[0]}
        </p>

        <div className="w-full space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">登入帳號</p>
            <p className="text-text-main text-sm font-medium truncate w-full text-center">{user.email}</p>
          </div>
          
          <button 
            onClick={onConfirm}
            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-[24px] text-xl shadow-xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            確認並進入系統
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
      
      <p className="mt-12 text-slate-400 text-xs font-medium italic">大學生極簡記帳系統 v2.5</p>
    </div>
  );
};

export default Welcome;
