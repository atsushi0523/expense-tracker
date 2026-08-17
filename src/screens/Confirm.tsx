import { useState } from 'react'
import type { Category, Profile } from '../types'
import { CategoryPicker } from '../components/CategoryPicker'
import { addExpense } from '../db'

interface ConfirmProps {
  profile: Profile
  initialAmount: number | null
  initialDate: string
  initialMemo: string
  onSaved: () => void
  onCancel: () => void
}

export function Confirm({ profile, initialAmount, initialDate, initialMemo, onSaved, onCancel }: ConfirmProps) {
  const [amount, setAmount] = useState<string>(initialAmount !== null ? String(initialAmount) : '')
  const [date, setDate] = useState(initialDate)
  const [category, setCategory] = useState<Category | null>(null)
  const [memo, setMemo] = useState(initialMemo)
  const [saving, setSaving] = useState(false)

  const amountValue = Number(amount)
  const isValid =
    amount.trim() !== '' && Number.isFinite(amountValue) && amountValue > 0 && category !== null && date !== ''

  async function handleSave() {
    if (!isValid || !category) return
    setSaving(true)
    await addExpense({
      userId: profile.id,
      amount: amountValue,
      date,
      category,
      memo: memo.trim(),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="screen">
      <h1 className="screen-title">内容の確認</h1>
      <p className="screen-subtitle">OCRの結果は誤っている場合があります。内容を確認してください。</p>

      <label className="field">
        <span className="field-label">金額(円)</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額を入力"
          className="amount-input"
        />
      </label>

      <label className="field">
        <span className="field-label">日付</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="field">
        <span className="field-label">カテゴリ</span>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>

      <label className="field">
        <span className="field-label">メモ(任意)</span>
        <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ" />
      </label>

      <button
        type="button"
        className="primary-button primary-button--large"
        onClick={handleSave}
        disabled={!isValid || saving}
      >
        {saving ? '保存中...' : '保存する'}
      </button>
      <button type="button" className="link-button" onClick={onCancel}>
        キャンセル
      </button>
    </div>
  )
}
