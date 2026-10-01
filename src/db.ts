import { supabase } from './supabase'
import type { Category, Expense, FixedCost, FixedCostMonthlyRecord, Profile } from './types'
import { CATEGORIES, CATEGORY_SLUGS } from './types'

// Rows come back from Postgres in snake_case; the app's types keep their
// existing camelCase shape, with `userId` meaning the profile id.

interface ProfileRow {
  id: string
  name: string
  created_at: string
}

interface ExpenseRow {
  id: string
  profile_id: string
  amount: number | string
  date: string
  category: Category
  memo: string
  created_at: string
}

interface FixedCostRow {
  id: string
  profile_id: string
  name: string
  amount: number | string
  occurrence_day: string
  created_at: string
}

interface MonthlyRecordRow {
  id: string
  profile_id: string
  fixed_cost_id: string | null
  name: string
  amount: number | string
  year_month: string
  created_at: string
}

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.profile_id,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    memo: row.memo,
    createdAt: row.created_at,
  }
}

function toFixedCost(row: FixedCostRow): FixedCost {
  return {
    id: row.id,
    userId: row.profile_id,
    name: row.name,
    amount: Number(row.amount),
    occurrenceDay: row.occurrence_day,
    createdAt: row.created_at,
  }
}

function toMonthlyRecord(row: MonthlyRecordRow): FixedCostMonthlyRecord {
  return {
    id: row.id,
    userId: row.profile_id,
    fixedCostId: row.fixed_cost_id,
    name: row.name,
    amount: Number(row.amount),
    yearMonth: row.year_month,
    createdAt: row.created_at,
  }
}

export function getYearMonth(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

// --- Profiles ---

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return (data as ProfileRow[]).map(toProfile)
}

export async function createProfile(name: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').insert({ name }).select().single()
  if (error) throw error
  return toProfile(data as ProfileRow)
}

// --- Expenses ---

export async function addExpense(input: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      profile_id: input.userId,
      amount: input.amount,
      date: input.date,
      category: input.category,
      memo: input.memo,
    })
    .select()
    .single()
  if (error) throw error
  return toExpense(data as ExpenseRow)
}

export async function listExpensesForUser(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').eq('profile_id', userId)
  if (error) throw error
  return (data as ExpenseRow[]).map(toExpense)
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// --- Fixed costs ---

export async function listFixedCosts(userId: string): Promise<FixedCost[]> {
  const { data, error } = await supabase
    .from('fixed_costs')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at')
  if (error) throw error
  return (data as FixedCostRow[]).map(toFixedCost)
}

export async function addFixedCost(input: Omit<FixedCost, 'id' | 'createdAt'>): Promise<FixedCost> {
  const { data, error } = await supabase
    .from('fixed_costs')
    .insert({
      profile_id: input.userId,
      name: input.name,
      amount: input.amount,
      occurrence_day: input.occurrenceDay,
    })
    .select()
    .single()
  if (error) throw error
  const fixedCost = toFixedCost(data as FixedCostRow)
  await generateMonthlyRecords([fixedCost], getYearMonth())
  return fixedCost
}

export async function deleteFixedCost(id: string): Promise<void> {
  const { error } = await supabase.from('fixed_costs').delete().eq('id', id)
  if (error) throw error
}

// --- Fixed cost monthly records ---

export async function listMonthlyRecordsForUser(userId: string): Promise<FixedCostMonthlyRecord[]> {
  const { data, error } = await supabase.from('fixed_cost_monthly_records').select('*').eq('profile_id', userId)
  if (error) throw error
  return (data as MonthlyRecordRow[]).map(toMonthlyRecord)
}

// The unique (fixed_cost_id, year_month) constraint makes this idempotent, so
// concurrent calls (e.g. from two open devices) never create duplicates.
async function generateMonthlyRecords(fixedCosts: FixedCost[], yearMonth: string): Promise<void> {
  if (fixedCosts.length === 0) return
  const { error } = await supabase.from('fixed_cost_monthly_records').upsert(
    fixedCosts.map((fixedCost) => ({
      profile_id: fixedCost.userId,
      fixed_cost_id: fixedCost.id,
      name: fixedCost.name,
      amount: fixedCost.amount,
      year_month: yearMonth,
    })),
    { onConflict: 'fixed_cost_id,year_month', ignoreDuplicates: true },
  )
  if (error) throw error
}

export async function ensureMonthlyRecordsForCurrentMonth(userId: string): Promise<void> {
  const fixedCosts = await listFixedCosts(userId)
  await generateMonthlyRecords(fixedCosts, getYearMonth())
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
