
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

  const handleNavigate = useCallback((newView: AppView) => {
    if (newView !== 'EDIT_EXPENSE') setEditingExpense(null);
    setView(newView);
  }, []);

  useEffect(() => {
    console.log("[App] 初始化 Auth 監聽器...");
    
    // 雖然主推 Popup，但仍檢查是否有 Redirect 遺留結果
    getRedirectResult(auth).catch(() => {});

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      console.log("[App] Auth 狀態:", fbUser ? `已登入 (${fbUser.email})` : "未登入");
      
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

        setView(current => (current === 'LOGIN' || current === 'REGISTER' ? 'WELCOME' : current));
      } else {
        setUser(null);
        setExpenses([]);
        setView('LOGIN');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setDbError(null);
    
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        if (userData.monthlyBudget !== undefined) setBudget(userData.monthlyBudget);
      }
    });

    const userExpensesRef = collection(db, 'users', user.uid, 'expenses');
    const q = query(userExpensesRef, orderBy('timestamp', 'desc'));

    const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
      const expenseData: Expense[] = snapshot.docs.map(fbDoc => {
        const data = fbDoc.data();
        let ts = data.timestamp;
        if (ts && typeof ts === 'object' && 'seconds' in ts) ts = ts.seconds * 1000;
        return { ...data, id: fbDoc.id, timestamp: ts || Date.now() } as Expense;
      });
      setExpenses(expenseData);
    }, (error) => {
      console.error("[App] Firestore 報錯:", error);
      if (error.message.includes('https://console.firebase.google.com')) {
        const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
        if (urlMatch) { setIndexUrl(urlMatch[0]); setDbError("INDEX_REQUIRED"); }
      }
    });

    return () => { unsubscribeExpenses(); unsubscribeUser(); };
  }, [user]);

  const handleUpdateBudget = async (newBudget: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { monthlyBudget: newBudget });
      setBudget(newBudget);
    } catch (err) { console.error(err); }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('WELCOME');
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddExpense = async (amount: number, item: ExpenseItem, description: string) => {
    if (!user) return;
    try {
      const userExpensesRef = collection(db, 'users', user.uid, 'expenses');
      const newRef = doc(userExpensesRef);
      await setDoc(newRef, { id: newRef.id, userId: user.uid, amount, item, description, timestamp: Date.now() });
      setView('DASHBOARD');
    } catch (err: any) { alert('儲存失敗：' + err.message); }
  };

  const handleUpdateExpense = async (amount: number, item: ExpenseItem, description: string) => {
    if (!user || !editingExpense) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'expenses', editingExpense.id), { amount, item, description });
      setEditingExpense(null);
      setView('DASHBOARD');
    } catch (err: any) { alert('更新失敗：' + err.message); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user || !confirm('確定刪除？')) return;
    try { await deleteDoc(doc(db, 'users', user.uid, 'expenses', id)); } 
    catch (err: any) { alert('刪除失敗'); }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-10">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-primary font-bold animate-pulse">正在同步帳戶狀態...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (dbError === "INDEX_REQUIRED" && indexUrl) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white m-6 rounded-[32px]">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">settings</span>
          <h2 className="font-bold text-xl mb-2">需要建立資料庫索引</h2>
          <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="bg-primary text-white p-4 rounded-xl">前往設定</a>
        </div>
      );
    }
    switch (view) {
      case 'LOGIN': return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'REGISTER': return <Register onRegister={handleLogin} onNavigate={handleNavigate} />;
      case 'WELCOME': return <Welcome user={user} onConfirm={() => setView('DASHBOARD')} />;
      case 'DASHBOARD': return <Dashboard user={user} expenses={expenses} onDelete={handleDeleteExpense} onEdit={(ex) => {setEditingExpense(ex); setView('EDIT_EXPENSE');}} onNavigateToAdd={() => setView('ADD_EXPENSE')} />;
      case 'REPORT': return <Report expenses={expenses} budget={budget} onUpdateBudget={handleUpdateBudget} />;
      case 'ADD_EXPENSE': return <ExpenseForm title="新增支出" onSave={handleAddExpense} />;
      case 'EDIT_EXPENSE': return editingExpense ? <ExpenseForm title="編輯支出" initialExpense={editingExpense} onSave={handleUpdateExpense} /> : null;
      default: return null;
    }
  };

  return (
    <Layout user={user} currentView={view} onNavigate={handleNavigate} onLogout={handleLogout} title={view.includes('EXPENSE') ? '編輯支出' : view === 'REPORT' ? '支出分析' : undefined} showBack={view.includes('EXPENSE')}>
      {renderContent()}
    </Layout>
  );
};

export default App;
