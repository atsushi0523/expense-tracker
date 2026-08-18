import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Category, Expense, FixedCost, FixedCostMonthlyRecord, Profile } from './types'
import { CATEGORIES, CATEGORY_SLUGS } from './types'

interface ExpenseTrackerDB extends DBSchema {
  profiles: {
    key: string
    value: Profile
  }
  expenses: {
    key: string
    value: Expense
    indexes: { userId: string }
  }
  fixedCosts: {
    key: string
    value: FixedCost
    indexes: { userId: string }
  }
  fixedCostMonthlyRecords: {
    key: string
    value: FixedCostMonthlyRecord
    indexes: { userId: string }
  }
}

const DB_NAME = 'expense-tracker-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ExpenseTrackerDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ExpenseTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('profiles', { keyPath: 'id' })

        const expenses = db.createObjectStore('expenses', { keyPath: 'id' })
        expenses.createIndex('userId', 'userId')

        const fixedCosts = db.createObjectStore('fixedCosts', { keyPath: 'id' })
        fixedCosts.createIndex('userId', 'userId')

        const records = db.createObjectStore('fixedCostMonthlyRecords', { keyPath: 'id' })
        records.createIndex('userId', 'userId')
      },
    })
  }
  return dbPromise
}

export function getYearMonth(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

// --- Profiles ---

export async function listProfiles(): Promise<Profile[]> {
  const db = await getDb()
  return db.getAll('profiles')
}

export async function createProfile(name: string): Promise<Profile> {
  const db = await getDb()
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  }
  await db.put('profiles', profile)
  return profile
}

// --- Expenses ---

export async function addExpense(input: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const db = await getDb()
  const expense: Expense = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  await db.put('expenses', expense)
  return expense
}

export async function listExpensesForUser(userId: string): Promise<Expense[]> {
  const db = await getDb()
  return db.getAllFromIndex('expenses', 'userId', userId)
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('expenses', id)
}

// --- Fixed costs ---

export async function listFixedCosts(userId: string): Promise<FixedCost[]> {
  const db = await getDb()
  return db.getAllFromIndex('fixedCosts', 'userId', userId)
}

export async function addFixedCost(input: Omit<FixedCost, 'id' | 'createdAt'>): Promise<FixedCost> {
  const db = await getDb()
  const fixedCost: FixedCost = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  await db.put('fixedCosts', fixedCost)
  await generateMonthlyRecordForFixedCost(fixedCost, getYearMonth())
  return fixedCost
}

export async function deleteFixedCost(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('fixedCosts', id)
}

// --- Fixed cost monthly records ---

export async function listMonthlyRecordsForUser(userId: string): Promise<FixedCostMonthlyRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('fixedCostMonthlyRecords', 'userId', userId)
}

async function generateMonthlyRecordForFixedCost(fixedCost: FixedCost, yearMonth: string): Promise<void> {
  const db = await getDb()
  const existing = await db.getAllFromIndex('fixedCostMonthlyRecords', 'userId', fixedCost.userId)
  const already = existing.some((r) => r.fixedCostId === fixedCost.id && r.yearMonth === yearMonth)
  if (already) return

  const record: FixedCostMonthlyRecord = {
    id: crypto.randomUUID(),
    userId: fixedCost.userId,
    fixedCostId: fixedCost.id,
    name: fixedCost.name,
    amount: fixedCost.amount,
    yearMonth,
    createdAt: new Date().toISOString(),
  }
  await db.put('fixedCostMonthlyRecords', record)
}

export async function ensureMonthlyRecordsForCurrentMonth(userId: string): Promise<void> {
  const yearMonth = getYearMonth()
  const fixedCosts = await listFixedCosts(userId)
  for (const fixedCost of fixedCosts) {
    await generateMonthlyRecordForFixedCost(fixedCost, yearMonth)
  }
}

// --- Derived totals ---

export function sumExpensesForMonth(expenses: Expense[], yearMonth: string): number {
  return expenses.filter((e) => e.date.startsWith(yearMonth)).reduce((sum, e) => sum + e.amount, 0)
}

export function sumRecordsForMonth(records: FixedCostMonthlyRecord[], yearMonth: string): number {
  return records.filter((r) => r.yearMonth === yearMonth).reduce((sum, r) => sum + r.amount, 0)
}

export interface CategoryBreakdownSlice {
  key: string
  label: string
  amount: number
}

// Fixed category order (never re-sorted by amount) so a slice's color always
// identifies the same category from month to month.
export function categoryBreakdownForMonth(
  expenses: Expense[],
  records: FixedCostMonthlyRecord[],
  yearMonth: string,
): CategoryBreakdownSlice[] {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth))

  const byCategory: Record<Category, number> = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    Category,
    number
  >
  for (const expense of monthExpenses) {
    byCategory[expense.category] += expense.amount
  }

  const slices: CategoryBreakdownSlice[] = CATEGORIES.map((category) => ({
    key: CATEGORY_SLUGS[category],
    label: category,
    amount: byCategory[category],
  }))

  slices.push({
    key: 'fixed',
    label: '固定費',
    amount: sumRecordsForMonth(records, yearMonth),
  })

  return slices
}
