import { useCallback, useEffect, useState } from 'react'
import type { FixedCost, Profile } from '../types'
import { addFixedCost, deleteFixedCost, listFixedCosts } from '../db'

interface FixedCostsProps {
  profile: Profile
  onDone: () => void
}

export function FixedCosts({ profile, onDone }: FixedCostsProps) {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [occurrenceDay, setOccurrenceDay] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const list = await listFixedCosts(profile.id)
    setFixedCosts(list)
    setLoading(false)
  }, [profile.id])

  useEffect(() => {
    load()
  }, [load])

  const amountValue = Number(amount)
  const isValid = name.trim() !== '' && amount.trim() !== '' && Number.isFinite(amountValue) && amountValue > 0

  async function handleAdd() {
    if (!isValid) return
    await addFixedCost({
      userId: profile.id,
      name: name.trim(),
      amount: amountValue,
      occurrenceDay: occurrenceDay.trim(),
    })
    setName('')
    setAmount('')
    setOccurrenceDay('')
    await load()
  }

  async function handleDelete(id: string) {
    await deleteFixedCost(id)
    await load()
  }

  return (
    <div className="screen">
      <h1 className="screen-title">固定費の設定</h1>
      <p className="screen-subtitle">登録した固定費は毎月自動的に今月の支出として計上されます。</p>

      {!loading && fixedCosts.length > 0 && (
        <ul className="fixed-cost-list">
          {fixedCosts.map((fc) => (
            <li key={fc.id} className="fixed-cost-item">
              <div>
                <div className="fixed-cost-name">{fc.name}</div>
                <div className="fixed-cost-amount">¥{fc.amount.toLocaleString()}</div>
              </div>
              <button type="button" className="link-button link-button--danger" onClick={() => handleDelete(fc.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed-cost-form">
        <label className="field">
          <span className="field-label">名前</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 家賃" />
        </label>
        <label className="field">
          <span className="field-label">金額(円)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額を入力"
          />
        </label>
        <label className="field">
          <span className="field-label">発生日(任意)</span>
          <input
            type="text"
            value={occurrenceDay}
            onChange={(e) => setOccurrenceDay(e.target.value)}
            placeholder="例: 毎月27日"
          />
        </label>
        <button type="button" className="primary-button" onClick={handleAdd} disabled={!isValid}>
          追加する
        </button>
      </div>

      <button type="button" className="link-button" onClick={onDone}>
        ホームに戻る
      </button>
    </div>
  )
}
