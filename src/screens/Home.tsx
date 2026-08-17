import { useCallback, useEffect, useState } from 'react'
import type { Expense, FixedCostMonthlyRecord, Profile } from '../types'
import {
  ensureMonthlyRecordsForCurrentMonth,
  getYearMonth,
  listExpensesForUser,
  listMonthlyRecordsForUser,
  sumExpensesForMonth,
  sumRecordsForMonth,
} from '../db'

interface HomeProps {
  profile: Profile
  onCapture: () => void
  onFixedCosts: () => void
  onSwitchProfile: () => void
  refreshKey: number
}

export function Home({ profile, onCapture, onFixedCosts, onSwitchProfile, refreshKey }: HomeProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [records, setRecords] = useState<FixedCostMonthlyRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    await ensureMonthlyRecordsForCurrentMonth(profile.id)
    const [expenseList, recordList] = await Promise.all([
      listExpensesForUser(profile.id),
      listMonthlyRecordsForUser(profile.id),
    ])
    setExpenses(expenseList)
    setRecords(recordList)
    setLoading(false)
  }, [profile.id])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const yearMonth = getYearMonth()
  const total = sumExpensesForMonth(expenses, yearMonth) + sumRecordsForMonth(records, yearMonth)
  const recentExpenses = [...expenses]
    .filter((e) => e.date.startsWith(yearMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="screen">
      <header className="home-header">
        <span className="home-profile">{profile.name} さん</span>
        <button type="button" className="link-button" onClick={onSwitchProfile}>
          切替
        </button>
      </header>

      <div className="home-total-card">
        <div className="home-total-label">今月の合計</div>
        <div className="home-total-amount">{loading ? '—' : `¥${total.toLocaleString()}`}</div>
      </div>

      <button type="button" className="primary-button primary-button--large" onClick={onCapture}>
        レシートを撮る
      </button>

      <button type="button" className="secondary-button" onClick={onFixedCosts}>
        固定費の設定
      </button>

      {recentExpenses.length > 0 && (
        <div className="recent-list">
          <h2 className="recent-list-title">最近の支出</h2>
          <ul>
            {recentExpenses.map((expense) => (
              <li key={expense.id} className="recent-list-item">
                <span className="recent-list-category">{expense.category}</span>
                <span className="recent-list-date">{expense.date}</span>
                <span className="recent-list-amount">¥{expense.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
