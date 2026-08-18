import { useEffect, useState } from 'react'
import type { Expense, Profile } from './types'
import { listProfiles } from './db'
import { ProfileSelect } from './screens/ProfileSelect'
import { Home } from './screens/Home'
import { Capture } from './screens/Capture'
import { Confirm } from './screens/Confirm'
import { FixedCosts } from './screens/FixedCosts'
import { ExpenseDetail } from './screens/ExpenseDetail'

type Screen = 'home' | 'capture' | 'confirm' | 'fixedCosts' | 'expenseDetail'

const CURRENT_USER_KEY = 'expense-tracker:currentUserId'

interface CaptureResult {
  amount: number | null
  date: string
  memo: string
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checkingStoredProfile, setCheckingStoredProfile] = useState(true)
  const [screen, setScreen] = useState<Screen>('home')
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const storedId = localStorage.getItem(CURRENT_USER_KEY)
    if (!storedId) {
      setCheckingStoredProfile(false)
      return
    }
    listProfiles().then((profiles) => {
      const found = profiles.find((p) => p.id === storedId) ?? null
      setProfile(found)
      setCheckingStoredProfile(false)
    })
  }, [])

  function handleSelectProfile(selected: Profile) {
    localStorage.setItem(CURRENT_USER_KEY, selected.id)
    setProfile(selected)
    setScreen('home')
  }

  function handleSwitchProfile() {
    localStorage.removeItem(CURRENT_USER_KEY)
    setProfile(null)
  }

  if (checkingStoredProfile) {
    return <div className="screen screen--center">読み込み中...</div>
  }

  if (!profile) {
    return <ProfileSelect onSelect={handleSelectProfile} />
  }

  if (screen === 'capture') {
    return (
      <Capture
        onDone={(result) => {
          setCaptureResult(result)
          setScreen('confirm')
        }}
        onCancel={() => setScreen('home')}
      />
    )
  }

  if (screen === 'confirm') {
    return (
      <Confirm
        profile={profile}
        initialAmount={captureResult?.amount ?? null}
        initialDate={captureResult?.date ?? todayInputValue()}
        initialMemo={captureResult?.memo ?? ''}
        onSaved={() => {
          setCaptureResult(null)
          setRefreshKey((k) => k + 1)
          setScreen('home')
        }}
        onCancel={() => {
          setCaptureResult(null)
          setScreen('home')
        }}
      />
    )
  }

  if (screen === 'expenseDetail' && selectedExpense) {
    return (
      <ExpenseDetail
        expense={selectedExpense}
        onDeleted={() => {
          setSelectedExpense(null)
          setRefreshKey((k) => k + 1)
          setScreen('home')
        }}
        onBack={() => {
          setSelectedExpense(null)
          setScreen('home')
        }}
      />
    )
  }

  if (screen === 'fixedCosts') {
    return (
      <FixedCosts
        profile={profile}
        onDone={() => {
          setRefreshKey((k) => k + 1)
          setScreen('home')
        }}
      />
    )
  }

  return (
    <Home
      profile={profile}
      onCapture={() => setScreen('capture')}
      onFixedCosts={() => setScreen('fixedCosts')}
      onSwitchProfile={handleSwitchProfile}
      onSelectExpense={(expense) => {
        setSelectedExpense(expense)
        setScreen('expenseDetail')
      }}
      refreshKey={refreshKey}
    />
  )
}
