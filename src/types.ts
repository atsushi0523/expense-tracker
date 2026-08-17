export const CATEGORIES = ['食費', '日用品', '交通費', '交際費', 'その他'] as const

export type Category = (typeof CATEGORIES)[number]

export interface Profile {
  id: string
  name: string
  createdAt: string
}

export interface Expense {
  id: string
  userId: string
  amount: number
  date: string // YYYY-MM-DD
  category: Category
  memo: string
  createdAt: string
}

export interface FixedCost {
  id: string
  userId: string
  name: string
  amount: number
  occurrenceDay: string
  createdAt: string
}

export interface FixedCostMonthlyRecord {
  id: string
  userId: string
  fixedCostId: string
  name: string
  amount: number
  yearMonth: string // YYYY-MM
  createdAt: string
}
