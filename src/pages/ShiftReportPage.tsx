import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { api } from "@/lib/api"
import { ShiftReport } from "@/components/shift/ShiftReport"
import type { Shift, Transaction } from "@/types"
import { ArrowLeft } from "lucide-react"

export function ShiftReportPage() {
  const { shiftId } = useParams()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()
  const [shift, setShift] = useState<Shift | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shiftId) return
    setLoading(true)
    Promise.all([
      api.getShift(parseInt(shiftId)),
      api.getTransactions(parseInt(shiftId)),
    ])
      .then(([s, txns]) => {
        setShift(s)
        setTransactions(txns)
      })
      .catch((err) => {
        showToast('Failed to load shift report', 'error')
        navigate('/shift-history')
      })
      .finally(() => setLoading(false))
  }, [shiftId])

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {loading ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      ) : shift ? (
        <div>
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
            <div className="flex items-center gap-3 px-4 h-14">
              <button
                onClick={() => navigate('/shift-history')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-semibold">Shift Report</h1>
                <p className="text-[10px] text-muted-foreground">{shift.branch_name}</p>
              </div>
            </div>
          </div>
          <div className="px-4 pt-4 pb-8">
            <ShiftReport
              shift={shift}
              transactions={transactions}
              onBack={() => navigate('/shift-history')}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
