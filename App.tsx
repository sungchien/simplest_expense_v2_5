
import React, { useState, useEffect } from 'react';
import { 
  AppView, 
  User, 
  Expense, 
  ExpenseItem 
} from './types';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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

  // 監聽驗證狀態
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const currentUser: User = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || undefined,
          photoURL: fbUser.photoURL || undefined,
        };
        setUser(currentUser);
        
        // 確保使用者文件存在於 Firestore (特別是 Google 登入時)
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            monthlyBudget: 10000
          });
        }

        setView('DASHBOARD');
      } else {
        setUser(null);
        setExpenses([]);
        setView('LOGIN');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 監聽即時資料庫更新 (消費紀錄 + 預算設定)
  useEffect(() => {
    if (!user) return;

    setDbError(null);
    setIndexUrl(null);
    
    // 監聽預算
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        if (userData.monthlyBudget !== undefined) {
          setBudget(userData.monthlyBudget);
        }
      }
    });

    // 監聽消費紀錄
    const userExpensesRef = collection(db, 'users', user.uid, 'expenses');
    const q = query(userExpensesRef, orderBy('timestamp', 'desc'));

    const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
      const expenseData: Expense[] = snapshot.docs.map(fbDoc => {
        const data = fbDoc.data();
        let ts = data.timestamp;

        // 日期格式轉換邏輯保持不變
        if (typeof ts === 'number') {
          ts = ts;
        } else if (ts && typeof ts === 'object' && 'seconds' in ts) {
          ts = ts.seconds * 1000;
        } else if (ts && typeof ts.toDate === 'function') {
          ts = ts.toDate().getTime();
        } else if (typeof ts === 'string') {
          let normalized = ts
            .replace(/年|月/g, '-')
            .replace(/日/g, '')
            .replace(/晚上|下午/g, ' PM ')
            .replace(/早上|上午/g, ' AM ')
            .split('[')[0].trim();
          
          const parsed = new Date(normalized).getTime();
          ts = isNaN(parsed) ? Date.now() : parsed;
        } else {
          ts = Date.now();
        }

        const itemValue = data.item || ExpenseItem.OTHER;

        return {
          ...data,
          id: fbDoc.id,
          item: itemValue,
          timestamp: ts
        } as Expense;
      });

      const sortedData = [...expenseData].sort((a, b) => b.timestamp - a.timestamp);
      setExpenses(sortedData);
    }, (error) => {
      console.error("Firestore Error:", error);
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
      await updateDoc(userDocRef, {
        monthlyBudget: newBudget
      });
      setBudget(newBudget);
    } catch (err: any) {
      console.error("Update Budget Error:", err);
      if (err.code === 'not-found') {
        await setDoc(doc(db, 'users', user.uid), {
          monthlyBudget: newBudget,
          email: user.email
        }, { merge: true });
      }
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('DASHBOARD');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setExpenses([]);
      setView('LOGIN');
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const handleNavigate = (newView: AppView) => {
    if (newView !== 'EDIT_EXPENSE') {
      setEditingExpense(null);
    }
    setView(newView);
  };

  const handleAddExpense = async (amount: number, item: ExpenseItem, description: string) => {
    if (!user) return;
    try {
      const userExpensesRef = collection(db, 'users', user.uid, 'expenses');
      const newExpenseRef = doc(userExpensesRef); 
      const uniqueId = newExpenseRef.id;

      await setDoc(newExpenseRef, {
        id: uniqueId, 
        userId: user.uid,
        amount,
        item,
        description,
        timestamp: Date.now(),
      });
      setView('DASHBOARD');
    } catch (err: any) {
      console.error("Add Expense Error:", err);
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
      console.error("Update Expense Error:", err);
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
        console.error("Delete Expense Error:", err);
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-bold">同步中...</p>
        </div>
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
          <p className="text-slate-500 text-sm mb-8 leading-relaxed"> Firebase 正在優化資料排序結構，請點擊下方按鈕完成配置。 </p>
          <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-primary text-white font-bold py-4 rounded-2xl mb-4 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">settings</span> 開啟配置頁面
          </a>
          <button onClick={() => window.location.reload()} className="text-primary font-bold text-sm">我已完成，重整畫面</button>
        </div>
      );
    }

    switch (view) {
      case 'LOGIN': return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'REGISTER': return <Register onRegister={handleLogin} onNavigate={handleNavigate} />;
      case 'DASHBOARD': return <Dashboard user={user} expenses={expenses} onDelete={handleDeleteExpense} onEdit={startEdit} onNavigateToAdd={() => setView('ADD_EXPENSE')} />;
      case 'REPORT': return <Report expenses={expenses} budget={budget} onUpdateBudget={handleUpdateBudget} />;
      case 'ADD_EXPENSE': return <ExpenseForm title="新增消費" onSave={handleAddExpense} />;
      case 'EDIT_EXPENSE': return <ExpenseForm title="修改消費" initialExpense={editingExpense || undefined} onSave={handleUpdateExpense} />;
      default: return null;
    }
  };

  return (
    <Layout user={user} currentView={view} onNavigate={handleNavigate} onLogout={handleLogout} title={view === 'ADD_EXPENSE' ? '新增消費' : view === 'EDIT_EXPENSE' ? '修改消費' : undefined} showBack={view === 'ADD_EXPENSE' || view === 'EDIT_EXPENSE'}>
      {renderContent()}
    </Layout>
  );
};

export default App;
