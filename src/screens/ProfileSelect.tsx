import { useEffect, useState } from 'react'
import type { Profile } from '../types'
import { createProfile, listProfiles } from '../db'

interface ProfileSelectProps {
  onSelect: (profile: Profile) => void
  onSignOut: () => void
}

export function ProfileSelect({ onSelect, onSignOut }: ProfileSelectProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(() => setError('プロフィールの読み込みに失敗しました'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    try {
      const profile = await createProfile(trimmed)
      onSelect(profile)
    } catch {
      setError('プロフィールの作成に失敗しました')
    }
  }

  if (loading) {
    return <div className="screen screen--center">読み込み中...</div>
  }

  return (
    <div className="screen">
      <h1 className="screen-title">支出管理</h1>
      <p className="screen-subtitle">使う人を選んでください</p>

      {profiles.length > 0 && (
        <div className="profile-list">
          {profiles.map((profile) => (
            <button key={profile.id} type="button" className="profile-button" onClick={() => onSelect(profile)}>
              {profile.name}
            </button>
          ))}
        </div>
      )}

      <div className="profile-create">
        <label className="field" htmlFor="new-profile-name">
          <span className="field-label">新しいプロフィールを作成</span>
          <input
            id="new-profile-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="名前を入力"
          />
        </label>
        <button type="button" className="primary-button" onClick={handleCreate} disabled={!newName.trim()}>
          作成してはじめる
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="button" className="link-button" onClick={onSignOut}>
        ログアウト
      </button>
    </div>
  )
}
