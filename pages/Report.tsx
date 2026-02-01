
import React, { useMemo, useState } from 'react';
import { Expense, ExpenseItem } from '../types';
import { ItemIcons, ItemLabels } from './Dashboard';

interface ReportProps {
  expenses: Expense[];
  budget: number;
  onUpdateBudget: (newBudget: number) => void;
}

const COLORS = [
  '#135bec', // primary
  '#3b82f6', 
  '#60a5fa', 
  '#93c5fd', 
  '#1E3A8A', 
  '#312E81', 
  '#1E40AF', 
  '#64748b'
];

const Report: React.FC<ReportProps> = ({ expenses, budget, onUpdateBudget }) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyData = useMemo(() => {
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const itemTotals: Record<string, number> = {};
    Object.values(ExpenseItem).forEach(type => itemTotals[type] = 0);
    
    monthExpenses.forEach(e => {
      itemTotals[e.item] += e.amount;
    });

    const breakdownData = Object.entries(itemTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ 
        name, 
        label: ItemLabels[name as ExpenseItem] || name, 
        value 
      }))
      .sort((a, b) => b.value - a.value);

    return { total, breakdownData };
  }, [expenses, currentMonth, currentYear]);

  const spentPercentageValue = Math.round((monthlyData.total / budget) * 100);
  const spentPercentageBar = Math.min(100, (monthlyData.total / budget) * 100);
  const isOverBudget = monthlyData.total > budget;

  const handleSaveBudget = () => {
    const newBudget = parseFloat(tempBudget);
    if (!isNaN(newBudget) && newBudget > 0) {
      onUpdateBudget(newBudget);
      setIsEditingBudget(false);
    } else {
      alert('請輸入有效的金額');
    }
  };

  return (
    <div className="flex flex-col px-6 pt-6 pb-24 animate-in fade-in duration-500 overflow-y-auto">
      {/* 每月總計摘要 - 至中對齊 */}
      <div className="relative overflow-hidden bg-white rounded-[32px] p-8 border border-blue-50 shadow-sm mb-6 flex flex-col items-center">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <span className="material-symbols-outlined text-[140px] text-primary rotate-12">receipt_long</span>
        </div>
        <div className="relative z-10 text-center">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">本月支出總計 ({currentMonth + 1}月)</p>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-text-main text-3xl font-bold">$</span>
            <h1 className="text-text-main text-6xl font-extrabold tracking-tighter italic">
              {monthlyData.total.toLocaleString()}
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] font-medium italic">最後更新: {new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* 預算與占比卡片 - 占比靠左對齊且字體稍小 */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-blue-50 mb-8">
        <div className="w-full mb-6">
          <p className="text-text-main text-xs font-black uppercase tracking-[0.2em] mb-2 text-left opacity-60">支出占比</p>
          <h2 className={`text-5xl font-black tracking-tighter italic text-left text-text-main`}>
            {spentPercentageValue}%
          </h2>
        </div>

        {/* 支出百分比進度條 */}
        <div className="flex items-center w-full h-5 gap-1.5 mb-8">
          <div 
            className={`h-full rounded-l-2xl transition-all duration-1000 ${isOverBudget ? 'bg-orange-500' : 'bg-primary'}`}
            style={{ width: `${spentPercentageBar}%` }}
          />
          <div 
            className="h-full rounded-r-2xl border-2 border-dashed border-slate-100 flex-1 transition-all duration-1000"
            style={{ width: `${100 - spentPercentageBar}%`, display: spentPercentageBar >= 100 ? 'none' : 'block' }}
          />
        </div>

        <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
          <div className="flex flex-col border-r border-slate-50">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">當月預算設定</p>
            {isEditingBudget ? (
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-20 border-b-2 border-primary bg-transparent text-lg font-bold text-primary outline-none focus:ring-0 p-0"
                  autoFocus
                />
                <button onClick={handleSaveBudget} className="text-primary hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">done</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-text-main/80">${budget.toLocaleString()}</span>
                <button onClick={() => { setTempBudget(budget.toString()); setIsEditingBudget(true); }} className="text-slate-300 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col pl-2">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">剩餘可用</p>
             <span className={`text-lg font-bold ${isOverBudget ? 'text-orange-400' : 'text-slate-600'}`}>
               {isOverBudget ? `超支 $${(monthlyData.total - budget).toLocaleString()}` : `$${(budget - monthlyData.total).toLocaleString()}`}
             </span>
          </div>
        </div>
      </div>

      {/* 放大版的分類支出總覽 */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-blue-50 mb-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-text-main text-2xl font-black tracking-tight">支出分類詳情</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">詳細列出各項目的消費金額與佔比</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl text-primary">
            <span className="material-symbols-outlined text-2xl">pie_chart</span>
          </div>
        </div>

        {monthlyData.breakdownData.length > 0 ? (
          <div className="space-y-8">
             {monthlyData.breakdownData.map((dataItem, idx) => {
               const percentage = ((dataItem.value / monthlyData.total) * 100).toFixed(1);
               return (
                 <div key={dataItem.name} className="flex items-center justify-between group">
                   <div className="flex items-center gap-5">
                     <div 
                       className="size-16 rounded-2xl flex items-center justify-center border border-blue-50 shadow-md transition-transform group-hover:scale-110"
                       style={{ backgroundColor: `${COLORS[idx % COLORS.length]}15`, color: COLORS[idx % COLORS.length] }}
                     >
                       <span className="material-symbols-outlined text-[32px] font-bold">
                         {ItemIcons[dataItem.name as ExpenseItem] || 'label'}
                       </span>
                     </div>
                     <div>
                       <span className="text-xl font-black text-text-main block leading-tight mb-1">{dataItem.label}</span>
                       <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">佔比 {percentage}%</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="flex items-baseline justify-end gap-1 mb-2">
                        <span className="text-text-main text-sm font-bold">$</span>
                        <span className="text-2xl font-black text-text-main leading-none">{dataItem.value.toLocaleString()}</span>
                     </div>
                     <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden ml-auto">
                       <div 
                         className="h-full rounded-full transition-all duration-1000"
                         style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                       />
                     </div>
                   </div>
                 </div>
               );
             })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
              <span className="material-symbols-outlined text-6xl">list_alt</span>
            </div>
            <p className="text-slate-400 text-xl font-bold tracking-tight">本月尚無消費紀錄</p>
            <p className="text-slate-300 text-sm mt-2 font-medium">請開始在首頁記錄您的第一筆開銷</p>
          </div>
        )}
      </div>

      {/* 理財建議卡片 */}
      <div className="bg-primary text-white rounded-[32px] p-8 shadow-2xl shadow-primary/20 flex items-start gap-5">
        <div className="bg-white/20 p-3 rounded-2xl shrink-0">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        </div>
        <div>
          <h4 className="font-black text-lg mb-2">智慧理財建議</h4>
          <p className="text-white/80 text-sm leading-relaxed font-medium">
            {isOverBudget ? (
              <>警告！您的支出已超過預算，建議減少非必要支出，以維持財務健康。</>
            ) : monthlyData.breakdownData.length > 0 ? (
              <>您目前掌握良好，{monthlyData.breakdownData[0].label} 是本月最大支出。繼續保持記帳，讓每一塊錢都發揮價值！</>
            ) : (
              <>養成良好的記帳習慣，是通往財富自由的第一步。今天就開始記錄您的每一筆消費吧！</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Report;
