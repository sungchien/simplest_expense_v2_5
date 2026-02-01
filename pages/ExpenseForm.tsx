
import React, { useState } from 'react';
import { Expense, ExpenseItem } from '../types';
import { ItemLabels } from './Dashboard';

interface ExpenseFormProps {
  initialExpense?: Expense;
  onSave: (amount: number, item: ExpenseItem, description: string) => void;
  title: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialExpense, onSave, title }) => {
  const [amount, setAmount] = useState<string>(initialExpense?.amount.toString() || '');
  const [item, setItem] = useState<ExpenseItem>(initialExpense?.item || ExpenseItem.FOOD);
  const [description, setDescription] = useState<string>(initialExpense?.description || '');

  const availableItems = Object.values(ExpenseItem);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && description) {
      onSave(numAmount, item, description);
    } else {
      alert('請填寫完整正確的資訊');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col items-center justify-center py-10 px-6">
        <p className="text-primary font-bold tracking-[0.2em] mb-3 text-xs uppercase">金額 (NT$)</p>
        <div className="flex items-center justify-center w-full">
          <span className="text-text-main tracking-tighter text-6xl font-extrabold mr-1">$</span>
          <input 
            autoFocus
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent border-none p-0 text-text-main tracking-tighter text-6xl font-extrabold w-48 text-left focus:ring-0 placeholder:text-blue-100" 
            placeholder="0" 
          />
        </div>
        <div className="flex items-center gap-1.5 mt-5 text-primary bg-primary-light px-5 py-2 rounded-full border border-primary-soft shadow-sm">
          <span className="material-symbols-outlined text-base">calendar_today</span>
          <p className="text-sm font-bold tracking-tight">
            {initialExpense ? new Date(initialExpense.timestamp).toLocaleString() : `今天, ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        {initialExpense && (
          <p className="mt-2 text-[10px] text-slate-300 font-mono">編號: {initialExpense.id}</p>
        )}
      </div>

      <div className="bg-white rounded-t-[40px] flex-1 p-8 border-t border-blue-50 shadow-inner">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-text-main text-base font-bold tracking-tight">支出項目</h3>
            <span className="text-primary text-xs font-bold px-4 py-1.5 bg-primary-light rounded-full border border-primary-soft">選擇項目</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined">label</span>
            </div>
            <select 
              value={item}
              onChange={(e) => setItem(e.target.value as ExpenseItem)}
              className="w-full bg-primary-light/30 border border-primary-soft rounded-2xl py-4 pl-12 pr-10 text-text-main font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white appearance-none transition-all outline-none cursor-pointer"
            >
              {availableItems.map(itemKey => (
                <option key={itemKey} value={itemKey}>{ItemLabels[itemKey as ExpenseItem]}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-text-main text-base font-bold tracking-tight mb-4">說明 (備註)</h3>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-primary-light/30 border border-primary-soft rounded-2xl p-4 text-text-main placeholder:text-blue-300 focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white h-28 resize-none transition-all outline-none" 
            placeholder="這筆錢花在哪裡？"
          />
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-white border-t border-blue-50 pb-8 px-8 pt-6">
        <button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2 text-lg active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined font-bold text-2xl">check_circle</span>
          確認儲存
        </button>
      </div>
    </div>
  );
};

export default ExpenseForm;
