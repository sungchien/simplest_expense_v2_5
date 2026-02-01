
export enum ExpenseItem {
  FOOD = 'food',
  TRANSPORT = 'transport',
  HOUSING = 'housing',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment',
  CLOTHING = 'clothing',
  HEALTH = 'health',
  OTHER = 'other'
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Expense {
  id: string; // 獨一無二的編號
  userId: string;
  amount: number;
  item: ExpenseItem; // 支出項目 (存儲英文代碼)
  description: string;
  timestamp: number; // 統一為數字格式
}

export type AppView = 'LOGIN' | 'REGISTER' | 'WELCOME' | 'DASHBOARD' | 'REPORT' | 'ADD_EXPENSE' | 'EDIT_EXPENSE';
