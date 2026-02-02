
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppView, 
  User, 
  Expense, 
  ExpenseItem 
} from './types';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc
} from 'firebase/firestore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import ExpenseForm from './pages/ExpenseForm';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number>(10000);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);

  // 穩定的導航函數
  const handleNavigate = useCallback((newView: AppView) => {
    if (newView !== 'EDIT_EXPENSE') {
      setEditingExpense(null);
    }
    setView(newView);
  }, []);

  // 監聽驗證狀態 (主要的登入狀態控制中心)
  useEffect(() => {
    console.log("[App] 初始化 Auth 監聽器...");
    
    // 檢查是否有重新導向結果
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("[App] 偵測到 Google 重新導向結果:", result.user.email);
      }
    }).catch(err => {
      console.error("[App] 重新導向處理失敗:", err.code, err.message);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[App] Auth 狀態變更:", fbUser ? `已登入 (${fbUser.email})` : "未登入");
      
      if (fbUser) {
        const currentUser: User = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || undefined,
          photoURL: fbUser.photoURL || undefined,
        };
        setUser(currentUser);
        
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            console.log("[App] 建立新使用者文件...");
            await setDoc(userDocRef, {
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              createdAt: Date.now(),
              lastLogin: Date.now(),
              monthlyBudget: 10000
            });
          } else {
            await updateDoc(userDocRef, { lastLogin: Date.now() });
          }
        } catch (e) {
          console.error("[App] Firestore 同步失敗:", e);
        }

        // 強制進入歡迎頁面 (如果還在登入相關頁面)
        setView(current => {
          if (current === 'LOGIN' || current === 'REGISTER') {
            console.log("[App] 視圖轉換: LOGIN -> WELCOME");
            return 'WELCOME';
          }
          return current;
        });
      } else {
        setUser(null);
        setExpenses([]);
        setView('LOGIN');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 監聽即時資料庫更新
  useEffect(() => {
    if (!user) return;

    setDbError(null);
    setIndexUrl(null);
    
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        if (userData.monthlyBudget !== undefined) {
          setBudget(userData.monthlyBudget);
        }
      }
    });

    const userExpensesRef = collection(db, 'users', user.uid, 'expenses');
    const q = query(userExpensesRef, orderBy('timestamp', 'desc'));

    const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
      const expenseData: Expense[] = snapshot.docs.map(fbDoc => {
        const data = fbDoc.data();
        let ts = data.timestamp;
        if (typeof ts === 'number') {
          ts = ts;
        } else if (ts && typeof ts === 'object' && 'seconds' in ts) {
          ts = ts.seconds * 1000;
        } else if (ts && typeof ts.toDate === 'function') {
          ts = ts.toDate().getTime();
        } else {
          ts = Date.now();
        }

        return {
          ...data,
          id: fbDoc.id,
          item: data.item || ExpenseItem.OTHER,
          timestamp: ts
        } as Expense;
      });
      setExpenses(expenseData);
    }, (error) => {
      console.error("[App] Firestore 報錯:", error);
      if (error.message.includes('https://console.firebase.google.com')) {
        const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
        if (urlMatch) {
          setIndexUrl(urlMatch[0]);
          setDbError("INDEX_REQUIRED");
          return;
        }
      }
      setDbError(error.code === 'permission-denied' ? "PERMISSION_DENIED" : error.message);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeUser();
    };
  }, [user]);

  const handleUpdateBudget = async (newBudget: number) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { monthlyBudget: newBudget });
      setBudget(newBudget);
    } catch (err: any) {
      console.error("Update Budget Error:", err);
    }
  };

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
    setView('WELCOME');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error("Logout Error:", err);
      setLoading(false);
    }
  }, []);

  const handleAddExpense = async (amount: number, item: ExpenseItem, description: string) => {
    if (!user) return;
    try {
      const userExpensesRef = collection(db, 'users', user.uid, 'expenses');
      const newExpenseRef = doc(userExpensesRef); 
      await setDoc(newExpenseRef, {
        id: newExpenseRef.id, 
        userId: user.uid,
        amount,
        item,
        description,
        timestamp: Date.now(),
      });
      setView('DASHBOARD');
    } catch (err: any) {
      alert('儲存失敗：' + err.message);
    }
  };

  const handleUpdateExpense = async (amount: number, item: ExpenseItem, description: string) => {
    if (!user || !editingExpense) return;
    try {
      const expenseRef = doc(db, 'users', user.uid, 'expenses', editingExpense.id);
      await updateDoc(expenseRef, {
        amount,
        item,
        description,
        userId: user.uid, 
      });
      setEditingExpense(null);
      setView('DASHBOARD');
    } catch (err: any) {
      alert('更新失敗：' + err.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    if (confirm('確定要刪除這筆消費紀錄嗎？')) {
      try {
        const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
        await deleteDoc(expenseRef);
      } catch (err: any) {
        alert('刪除失敗：' + err.message);
      }
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setView('EDIT_EXPENSE');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-10">
        <div className="relative mb-8">
           <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <span className="material-symbols-outlined text-primary text-3xl animate-pulse">account_balance_wallet</span>
           </div>
        </div>
        <p className="text-primary font-black tracking-widest uppercase text-xs animate-pulse text-center">正在同步帳戶狀態，請稍候...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (dbError === "INDEX_REQUIRED" && indexUrl && (view === 'DASHBOARD' || view === 'REPORT')) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white m-6 rounded-[32px] shadow-sm border border-blue-100">
          <div className="size-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-6 shrink-0">
            <span className="material-symbols-outlined text-4xl">database_off</span>
          </div>
          <h2 className="text-text-main font-bold text-xl mb-3">同步結構中</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed"> Firebase 正在優化資料排序結構 </p>
          <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-primary text-white font-bold py-4 rounded-2xl mb-4 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">settings</span> 開啟配置頁面
          </a>
          <button onClick={() => window.location.reload()} className="text-primary font-bold text-sm">重新整理</button>
        </div>
      );
    }

    switch (view) {
      case 'LOGIN': return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'REGISTER': return <Register onRegister={handleLogin} onNavigate={handleNavigate} />;
      case 'WELCOME': return <Welcome user={user} onConfirm={() => setView('DASHBOARD')} />;
      case 'DASHBOARD': return <Dashboard user={user} expenses={expenses} onDelete={handleDeleteExpense} onEdit={startEdit} onNavigateToAdd={() => setView('ADD_EXPENSE')} />;
      case 'REPORT': return <Report expenses={expenses} budget={budget} onUpdateBudget={handleUpdateBudget} />;
      case 'ADD_EXPENSE': return <ExpenseForm title="新增支出" onSave={handleAddExpense} />;
      case 'EDIT_EXPENSE': return editingExpense ? <ExpenseForm title="編輯支出" initialExpense={editingExpense} onSave={handleUpdateExpense} /> : null;
      default: return null;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'REPORT': return '支出分析';
      case 'ADD_EXPENSE': return '新增支出';
      case 'EDIT_EXPENSE': return '編輯支出';
      default: return undefined;
    }
  };

  return (
    <Layout 
      user={user} 
      currentView={view} 
      onNavigate={handleNavigate} 
      onLogout={handleLogout}
      title={getTitle()}
      showBack={view === 'ADD_EXPENSE' || view === 'EDIT_EXPENSE'}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
