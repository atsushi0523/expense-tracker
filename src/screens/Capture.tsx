import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { recognizeReceiptAmount } from '../ocr'

interface CaptureResult {
  amount: number | null
  date: string
  memo: string
}

interface CaptureProps {
  onDone: (result: CaptureResult) => void
  onCancel: () => void
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDateInputValue(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d
}

export function Capture({ onDone, onCancel }: CaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setError(null)
    const fallbackDate = toDateInputValue(file.lastModified ? new Date(file.lastModified) : new Date())

    try {
      const result = await recognizeReceiptAmount(file)
      const date = result.date && isValidDateInputValue(result.date) ? result.date : fallbackDate
      const memo = result.storeName?.trim() ?? ''
      onDone({ amount: result.amount, date, memo })
    } catch (err) {
      console.error(err)
      setError('読み取りに失敗しました。手入力に切り替えてください。')
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleManualEntry() {
    onDone({ amount: null, date: toDateInputValue(new Date()), memo: '' })
  }

  return (
    <div className="screen screen--center">
      <h1 className="screen-title">レシートを撮影</h1>

      {processing ? (
        <div className="ocr-loading">
          <div className="spinner" />
          <p>レシートを読み取っています...</p>
        </div>
      ) : (
        <>
          <label className="primary-button primary-button--large capture-button">
            カメラを起動 / 画像を選択
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="capture-input"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="button" className="link-button" onClick={handleManualEntry}>
            手入力に切り替える
          </button>
          <button type="button" className="link-button" onClick={onCancel}>
            ホームに戻る
          </button>
        </>
      )}
    </div>
  )
}
