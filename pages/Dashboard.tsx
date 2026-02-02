
import React, { useMemo } from 'react';
import { Expense, ExpenseItem, User } from '../types';

interface DashboardProps {
  user: User | null;
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onNavigateToAdd: () => void;
}

// 項目中文名稱映射
export const ItemLabels: Record<ExpenseItem, string> = {
  [ExpenseItem.FOOD]: '餐飲',
  [ExpenseItem.TRANSPORT]: '交通',
  [ExpenseItem.HOUSING]: '居住',
  [ExpenseItem.SHOPPING]: '購物',
  [ExpenseItem.ENTERTAINMENT]: '娛樂',
  [ExpenseItem.CLOTHING]: '服飾',
  [ExpenseItem.HEALTH]: '健康',
  [ExpenseItem.OTHER]: '其他',
};

// 適當且美觀的圖示映射
export const ItemIcons: Record<ExpenseItem, string> = {
  [ExpenseItem.FOOD]: 'restaurant',
  [ExpenseItem.TRANSPORT]: 'directions_bus',
  [ExpenseItem.HOUSING]: 'home',
  [ExpenseItem.SHOPPING]: 'shopping_bag',
  [ExpenseItem.ENTERTAINMENT]: 'movie',
  [ExpenseItem.CLOTHING]: 'checkroom',
  [ExpenseItem.HEALTH]: 'health_and_safety',
  [ExpenseItem.OTHER]: 'category',
};

const Dashboard: React.FC<DashboardProps> = ({ user, expenses, onDelete, onEdit, onNavigateToAdd }) => {
  // 過濾並排序消費紀錄：從最近到最早 (降序排列)
  const sortedExpenses = useMemo(() => {
    // 雖然 Firebase 已經排序，但前端再次排序可確保資料一致性
    // 目前保留 7 天內的過濾，如果不足 5 筆則顯示全部，增加實用性
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const filtered = expenses.filter(expense => expense.timestamp >= oneWeekAgo);
    
    // 如果最近一週沒資料，就顯示全部紀錄中的前 20 筆
    const displayList = filtered.length > 0 ? filtered : expenses.slice(0, 20);
    
    return [...displayList].sort((a, b) => b.timestamp - a.timestamp);
  }, [expenses]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `今天, ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}, ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col px-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* 歡迎區塊 */}
      <div className="flex items-center gap-4 mb-8 bg-white p-5 rounded-[28px] shadow-sm border border-blue-50/50">
        <div className="size-14 rounded-2xl bg-primary-soft overflow-hidden border-2 border-white shadow-sm shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-text-main text-lg font-black italic tracking-tight">
            你好，{user?.displayName || user?.email.split('@')[0]}！
          </h2>
          <p className="text-slate-400 text-xs font-medium">今天想記錄點什麼呢？</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight italic">消費紀錄</h1>
          <p className="text-sm text-slate-400 mt-1">目前顯示最近 {sortedExpenses.length} 筆支出</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-black px-3 py-1 bg-primary text-white rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
            即時同步
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {sortedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-dashed border-slate-200">
            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
              <span className="material-symbols-outlined text-4xl">calendar_today</span>
            </div>
            <p className="text-slate-400 font-bold px-8 text-center">尚無消費紀錄</p>
            <button 
              onClick={onNavigateToAdd}
              className="mt-4 text-primary font-bold text-sm underline underline-offset-4"
            >
              立即新增第一筆
            </button>
          </div>
        ) : (
          sortedExpenses.map((expense) => (
            <div key={expense.id} className="group bg-white rounded-[24px] p-4 flex items-center justify-between shadow-sm border border-transparent transition-all hover:shadow-md hover:border-primary/10">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-2xl bg-primary-light text-primary size-12 shrink-0 transition-all group-hover:scale-110">
                  <span className="material-symbols-outlined text-xl">{ItemIcons[expense.item] || 'label'}</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-text-main text-xs font-bold">$</span>
                    <p className="text-text-main text-xl font-extrabold leading-none">{expense.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-slate-500 text-xs font-medium mt-1">
                    <span className="text-primary/70 font-bold">{ItemLabels[expense.item] || expense.item}</span>
                    <span className="mx-1.5 opacity-20">•</span>
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-slate-300 text-[10px] font-medium">{formatDate(expense.timestamp)}</p>
                    <p className="text-slate-200 text-[9px] font-mono tracking-tighter">ID: {expense.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(expense)}
                  className="text-slate-300 hover:text-primary p-2 transition-colors"
                  title="編輯"
                >
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </button>
                <button 
                  onClick={() => onDelete(expense.id)}
                  className="text-slate-300 hover:text-red-400 p-2 transition-colors"
                  title="刪除"
                >
                  <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-28 left-0 right-0 max-w-[480px] mx-auto px-6 flex justify-end pointer-events-none">
        <button 
          onClick={onNavigateToAdd}
          className="pointer-events-auto flex items-center justify-center bg-primary size-16 rounded-2xl text-white shadow-2xl shadow-primary/40 active:scale-90 transition-all hover:rotate-90"
        >
          <span className="material-symbols-outlined text-[32px] font-bold">add</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
