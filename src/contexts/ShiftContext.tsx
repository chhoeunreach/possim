import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Shift, Transaction } from '@/types'
import { api } from '@/lib/api'
import { useAuth } from './AuthContext'

interface ShiftContextType {
  currentShift: Shift | null
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setCurrentShift: (shift: Shift | null) => void
  setTransactions: (txns: Transaction[]) => void
}

const ShiftContext = createContext<ShiftContextType | null>(null)

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const shift = await api.getCurrentShift()
      setCurrentShift(shift)
      if (shift) {
        const txns = await api.getTransactions(shift.id)
        setTransactions(txns)
      } else {
        setTransactions([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shift data')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        transactions,
        loading,
        error,
        refresh,
        setCurrentShift,
        setTransactions,
      }}
    >
      {children}
    </ShiftContext.Provider>
  )
}

export function useShift() {
  const ctx = useContext(ShiftContext)
  if (!ctx) throw new Error('useShift must be used within ShiftProvider')
  return ctx
}
