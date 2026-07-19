import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { ToastContainer } from "@/components/ui/toast"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { fmt } from "@/lib/utils"
import { i18n } from "@/lib/i18n"
import { useToast } from "@/hooks/useToast"
import type { Shift } from "@/types"
import {
  History, Store, Clock, Calendar, DollarSign, ArrowRight, FileText,
  CheckCircle2, ChevronRight, Banknote,
} from "lucide-react"

export function ShiftHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShifts()
  }, [])

  const loadShifts = async () => {
    setLoading(true)
    try {
      const data = await api.getShifts()
      setShifts(data.filter(s => s.status === 'closed'))
    } catch (err) {
      showToast('Failed to load shift history', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader
        title="Shift History"
        subtitle={user?.username}
        onBack={() => navigate('/')}
      />
      <PageContainer>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <History className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">No closed shifts yet</p>
            <p className="text-xs text-muted-foreground/60">Your completed shifts will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{shifts.length} closed shift{shifts.length !== 1 ? 's' : ''}</span>
            </div>
            {shifts.map((s) => {
              const start = new Date(s.start_time)
              const end = s.end_time ? new Date(s.end_time) : null
              const durMs = end ? end.getTime() - start.getTime() : 0
              const durH = Math.floor(durMs / 3600000)
              const durM = Math.floor((durMs % 3600000) / 60000)
              const durStr = durH > 0 ? `${durH}h ${durM}m` : `${durM}m`

              return (
                <Card key={s.id} className="overflow-hidden border-0 shadow-sm">
                  <CardContent className="p-0">
                    <button
                      onClick={() => navigate(`/shift-report/${s.id}`)}
                      className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-emerald-100">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="font-semibold text-sm text-slate-800 truncate">{s.branch_name}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Closed</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{start.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{durStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3 w-3 shrink-0" />
                              <span className="font-medium text-slate-700">{fmt(s.opening_usd, 'USD')}</span>
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                              <span className="font-medium text-emerald-700">{fmt(s.closing_usd || 0, 'USD')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Banknote className="h-3 w-3 shrink-0" />
                              <span className="font-medium text-slate-700">{fmt(s.opening_khr, 'KHR')}</span>
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                              <span className="font-medium text-emerald-700">{fmt(s.closing_khr || 0, 'KHR')}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 mt-1" />
                      </div>
                    </button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
