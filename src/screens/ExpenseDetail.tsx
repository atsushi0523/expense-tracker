import { useState } from 'react'
import type { Expense } from '../types'
import { deleteExpense } from '../db'

interface ExpenseDetailProps {
  expense: Expense
  onDeleted: () => void
  onBack: () => void
}

export function ExpenseDetail({ expense, onDeleted, onBack }: ExpenseDetailProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteExpense(expense.id)
    setDeleting(false)
    onDeleted()
  }

  return (
    <div className="screen">
      <h1 className="screen-title">支出の詳細</h1>

      <div className="detail-card">
        <div className="detail-row">
          <span className="detail-label">金額</span>
          <span className="detail-value detail-value--amount">¥{expense.amount.toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">日付</span>
          <span className="detail-value">{expense.date}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">カテゴリ</span>
          <span className="detail-value">{expense.category}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">メモ</span>
          <span className="detail-value">{expense.memo || '—'}</span>
        </div>
      </div>

      <button
        type="button"
        className="link-button link-button--danger"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? '削除中...' : 'この支出を削除'}
      </button>

      <button type="button" className="secondary-button" onClick={onBack}>
        ホームに戻る
      </button>
    </div>
  )
}
