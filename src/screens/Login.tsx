import { useState } from 'react'
import { supabase } from '../supabase'

type Mode = 'signIn' | 'signUp'

export function Login() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isValid = email.trim() !== '' && password.length >= 6

  async function handleSubmit() {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    setMessage(null)

    if (mode === 'signIn') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) {
        setError(`登録に失敗しました: ${error.message}`)
      } else if (!data.session) {
        // Email confirmation is enabled on the Supabase project.
        setMessage('確認メールを送信しました。メール内のリンクを開いてから、ログインしてください。')
        setMode('signIn')
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="screen">
      <h1 className="screen-title">支出管理</h1>
      <p className="screen-subtitle">{mode === 'signIn' ? 'ログインしてください' : '新しいアカウントを作成'}</p>

      <label className="field">
        <span className="field-label">メールアドレス</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label className="field">
        <span className="field-label">パスワード（6文字以上）</span>
        <input
          type="password"
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="screen-subtitle">{message}</p>}

      <button type="button" className="primary-button" onClick={handleSubmit} disabled={!isValid || submitting}>
        {submitting ? '処理中...' : mode === 'signIn' ? 'ログイン' : '登録する'}
      </button>

      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn')
          setError(null)
          setMessage(null)
        }}
      >
        {mode === 'signIn' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
      </button>
    </div>
  )
}
