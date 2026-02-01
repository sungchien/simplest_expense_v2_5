
import React from 'react';
import { User, AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  currentView, 
  onNavigate, 
  onLogout, 
  title, 
  showBack 
}) => {
  const isAuthPage = currentView === 'LOGIN' || currentView === 'REGISTER' || currentView === 'WELCOME';

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[480px] mx-auto bg-background shadow-2xl">
      {/* Header */}
      {!isAuthPage && (
        <header className="sticky top-0 z-30 bg-white/80 ios-blur border-b border-blue-50">
          <div className="flex items-center p-4 px-6 justify-between">
            {showBack ? (
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="text-primary flex size-10 items-center justify-start"
              >
                <span className="material-symbols-outlined text-2xl font-bold">arrow_back_ios_new</span>
              </button>
            ) : (
              <div className="flex flex-col">
                <p className="text-[9px] text-primary/50 font-black uppercase tracking-[0.2em] mb-1">極簡化記帳系統</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full size-8 bg-primary-light text-primary border border-primary-soft overflow-hidden shadow-sm">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLImageElement).src = ''; // Clear source on error
                      }} />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">person</span>
                    )}
                  </div>
                  <h2 className="text-text-main text-[11px] font-bold leading-tight truncate max-w-[120px]">
                    {user?.displayName || user?.email.split('@')[0]}
                  </h2>
                </div>
              </div>
            )}
            
            {title && <h2 className="text-text-main text-lg font-bold leading-tight absolute left-1/2 -translate-x-1/2">{title}</h2>}

            {!showBack && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-primary hover:bg-blue-100 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span className="text-xs font-bold">登出</span>
              </button>
            )}
            {showBack && <div className="size-10"></div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${!isAuthPage ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Footer Navigation */}
      {!isAuthPage && currentView !== 'ADD_EXPENSE' && currentView !== 'EDIT_EXPENSE' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto ios-blur bg-white/90 border-t border-blue-50 px-12 pt-3 pb-8 flex items-center justify-around z-40">
          <button 
            onClick={() => onNavigate('DASHBOARD')}
            className={`flex flex-col items-center gap-1 w-20 transition-colors ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-slate-300'}`}
          >
            <span className={`material-symbols-outlined`} style={{ fontVariationSettings: currentView === 'DASHBOARD' ? "'FILL' 1" : "" }}>history</span>
            <span className="text-[10px] font-bold">紀錄</span>
          </button>
          <button 
            onClick={() => onNavigate('REPORT')}
            className={`flex flex-col items-center gap-1 w-20 transition-colors ${currentView === 'REPORT' ? 'text-primary' : 'text-slate-300'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentView === 'REPORT' ? "'FILL' 1" : "" }}>bar_chart</span>
            <span className="text-[10px] font-bold">報表</span>
          </button>
        </nav>
      )}

      {/* Background Orbs */}
      <div className="fixed -z-10 top-[-5%] right-[-10%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed -z-10 bottom-[10%] left-[-15%] w-[200px] h-[200px] bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
    </div>
  );
};

export default Layout;
