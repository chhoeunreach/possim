import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { FileUpload } from "@/components/shared/FileUpload"
import { useShift } from "@/contexts/ShiftContext"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { i18n } from "@/lib/i18n"
import { fmt, formatTime } from "@/lib/utils"
import { calcReportTotals } from "@/lib/report"
import type { ReportTotals as CloseTotals } from "@/lib/report"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/ui/toast"
import type { Transaction } from "@/types"
import {
  CheckCircle2,
  Receipt,
  TrendingUp,
  TrendingDown,
  Banknote,
  Building2,
  Clock,
  Calendar,
  User,
  Store,
  ArrowRight,
  Image,
  FileText,
} from "lucide-react"

export function CloseShiftPage() {
  const { currentShift, transactions, refresh } = useShift()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const [overridden, setOverridden] = useState(false)
  const [overrideUSD, setOverrideUSD] = useState("")
  const [overrideKHR, setOverrideKHR] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const totals = useMemo(() => {
    if (!currentShift) return null
    return calcReportTotals(currentShift, transactions)
  }, [currentShift, transactions])

  useEffect(() => {
    if (!currentShift) { navigate('/'); return }
    if (!totals) return
    setOverrideUSD(totals.autoUSD > 0 ? totals.autoUSD.toFixed(2) : '0')
    setOverrideKHR(totals.autoKHR > 0 ? String(Math.round(totals.autoKHR)) : '0')
  }, [totals])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShift || !totals) return

    let usd: number, khr: number
    if (overridden) {
      usd = parseFloat(overrideUSD)
      khr = parseFloat(overrideKHR)
      if (isNaN(usd) || usd < 0) { showToast(i18n.t('close.err.usd'), 'error'); return }
      if (isNaN(khr) || khr < 0) { showToast(i18n.t('close.err.khr'), 'error'); return }
    } else {
      usd = totals.autoUSD
      khr = totals.autoKHR
    }

    setLoading(true)
    try {
      await api.closeShift(currentShift.id, {
        closing_usd: usd,
        closing_khr: khr,
        closing_photo_url: photoUrl,
      })
      showToast(i18n.t('close.ok'), 'success')
      await refresh()
      navigate('/open-shift')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to close shift', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!currentShift || !totals) return null

  const startTime = new Date(currentShift.start_time)
  const durationMs = Date.now() - startTime.getTime()
  const hours = Math.floor(durationMs / 3600000)
  const minutes = Math.floor((durationMs % 3600000) / 60000)
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="text-white/70 hover:text-white transition-colors">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{i18n.t('close.title')}</h1>
            <p className="text-white/60 text-sm">{currentShift.branch_name} · {user?.username}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-4 pb-8">
        {/* Report Preview Card */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-4">
          {/* Report Header */}
          <div className="bg-slate-50 border-b px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Shift Summary Report</h2>
                <p className="text-xs text-muted-foreground">Preview before closing</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="h-3.5 w-3.5" />
                <span className="font-medium text-slate-700">{currentShift.branch_name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium text-slate-700">{user?.username}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{startTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {durationStr} elapsed</span>
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div className="px-5 py-3 border-b bg-gradient-to-r from-blue-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opening Balance</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-slate-800">{fmt(totals.openingUSD, 'USD')}</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="font-semibold text-slate-800">{fmt(totals.openingKHR, 'KHR')}</span>
              </div>
            </div>
          </div>

          {/* Transaction Summary Table */}
          {transactions.length > 0 && (
            <div className="px-5 py-3 border-b">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Transactions ({transactions.length})
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    {totals.inflowCount} in
                  </span>
                  <span className="text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                    {totals.outflowCount} out
                  </span>
                </div>
              </div>

              {/* Table Header (hidden on very small screens) */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                <span>Type / Method</span>
                <span>Amount</span>
                <span>Cost</span>
                <span>Time</span>
              </div>

              <div className="space-y-1.5">
                {transactions.slice(0, 100).map((t) => {
                  const isIn = t.type === 'inflow'
                  return (
                    <div
                      key={t.id}
                      className={`grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-3 py-2 rounded-xl text-sm ${
                        isIn ? 'bg-emerald-50/50' : 'bg-red-50/50'
                      }`}
                    >
                      {/* Type + Method */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isIn ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`text-xs font-medium capitalize ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>
                          {t.type}
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground/60">
                          {t.payment_method === 'Cash'
                            ? <Banknote className="h-3 w-3" />
                            : <Building2 className="h-3 w-3" />
                          }
                          <span className="text-[10px]">{t.payment_method}</span>
                        </div>
                        {t.invoice_url && <Image className="h-3 w-3 text-primary/60" />}
                      </div>

                      {/* Amount */}
                      <div className="text-right sm:text-left">
                        <span className={`text-xs font-bold ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>
                          {isIn ? '+' : '-'}{fmt(t.amount, t.currency as 'USD' | 'KHR')}
                        </span>
                      </div>

                      {/* Cost */}
                      <div className="text-right sm:text-left">
                        {t.cost > 0 ? (
                          <span className="text-[10px] text-muted-foreground/60">
                            {fmt(t.cost, t.currency as 'USD' | 'KHR')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/30">—</span>
                        )}
                      </div>

                      {/* Time (only on larger screens) */}
                      <div className="hidden sm:block text-right">
                        <span className="text-[10px] text-muted-foreground/50">{formatTime(t.timestamp)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="px-5 py-3 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              Financial Summary
            </span>

            <div className="space-y-3">
              {/* Inflow Detail */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Total Inflow</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-5">
                  <div className="text-xs">
                    <span className="text-muted-foreground">USD Cash: </span>
                    <span className="font-medium text-emerald-700">{fmt(totals.cashInUSD, 'USD')}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">USD Bank: </span>
                    <span className="font-medium text-emerald-700">{fmt(totals.bankInUSD, 'USD')}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">KHR Cash: </span>
                    <span className="font-medium text-emerald-700">{fmt(totals.cashInKHR, 'KHR')}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">KHR Bank: </span>
                    <span className="font-medium text-emerald-700">{fmt(totals.bankInKHR, 'KHR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 pl-5 text-xs font-semibold text-emerald-700 bg-emerald-50/50 rounded-lg py-1.5 px-3">
                  <span>USD: {fmt(totals.totalInUSD, 'USD')}</span>
                  <span>KHR: {fmt(totals.totalInKHR, 'KHR')}</span>
                </div>
              </div>

              <Separator />

              {/* Outflow Detail */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">Total Outflow</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-5">
                  <div className="text-xs">
                    <span className="text-muted-foreground">USD Cash: </span>
                    <span className="font-medium text-red-700">{fmt(totals.cashOutUSD, 'USD')}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">USD Bank: </span>
                    <span className="font-medium text-red-700">{fmt(totals.bankOutUSD, 'USD')}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">KHR Cash: </span>
                    <span className="font-medium text-red-700">{fmt(totals.cashOutKHR, 'KHR')}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">KHR Bank: </span>
                    <span className="font-medium text-red-700">{fmt(totals.bankOutKHR, 'KHR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 pl-5 text-xs font-semibold text-red-700 bg-red-50/50 rounded-lg py-1.5 px-3">
                  <span>USD: {fmt(totals.totalOutUSD, 'USD')}</span>
                  <span>KHR: {fmt(totals.totalOutKHR, 'KHR')}</span>
                </div>
              </div>

              {(totals.totalCostUSD > 0 || totals.totalCostKHR > 0) && (
                <>
                  <Separator />
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">Total Expenses/Cost:</span>
                    {totals.totalCostUSD > 0 && <span className="font-medium text-amber-700">{fmt(totals.totalCostUSD, 'USD')}</span>}
                    {totals.totalCostKHR > 0 && <span className="font-medium text-amber-700">{fmt(totals.totalCostKHR, 'KHR')}</span>}
                  </div>
                </>
              )}

              <Separator />

              {/* Expected Closing */}
              <div className="bg-blue-50/70 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">Expected Closing (Opening + Inflow - Outflow)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">USD:</span>
                      <span className="text-xs text-muted-foreground">{fmt(totals.openingUSD, 'USD')} + {fmt(totals.totalInUSD, 'USD')} - {fmt(totals.totalOutUSD, 'USD')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">KHR:</span>
                      <span className="text-xs text-muted-foreground">{fmt(totals.openingKHR, 'KHR')} + {fmt(totals.totalInKHR, 'KHR')} - {fmt(totals.totalOutKHR, 'KHR')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-blue-700">{fmt(totals.expectedUSD, 'USD')}</p>
                    <p className="text-sm font-bold text-blue-700">{fmt(totals.expectedKHR, 'KHR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Closing Form */}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <Separator />

            {/* Auto-calculated */}
            <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Auto-calculated Closing</span>
                </div>
                <Badge variant="success" className="text-[10px] px-1.5 py-0">Opening + Transactions</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Closing USD</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(totals.autoUSD, 'USD')}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Closing KHR</p>
                  <p className="text-lg font-bold text-emerald-700">{fmt(totals.autoKHR, 'KHR')}</p>
                </div>
              </div>
            </div>

            {/* Override Toggle */}
            <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{i18n.t('close.overrideLabel')}</span>
                {overridden && <Badge variant="warning" className="text-[10px]">Active</Badge>}
              </div>
              <button
                type="button"
                onClick={() => setOverridden(!overridden)}
                className={`text-xs font-semibold underline-offset-2 underline ${
                  overridden ? 'text-destructive hover:text-destructive/80' : 'text-primary hover:text-primary/80'
                }`}
              >
                {overridden ? i18n.t('close.useAuto') : i18n.t('close.overrideBtn')}
              </button>
            </div>

            {overridden && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {i18n.t('close.usd')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={overrideUSD}
                      onChange={(e) => setOverrideUSD(e.target.value)}
                      className="pl-7 h-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {i18n.t('close.khr')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">៛</span>
                    <Input
                      type="number"
                      step="100"
                      min="0"
                      value={overrideKHR}
                      onChange={(e) => setOverrideKHR(e.target.value)}
                      className="pl-7 h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photo */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {i18n.t('close.photo')}
                <span className="text-muted-foreground/60 font-normal"> ({i18n.t('open.photo.optional')})</span>
              </label>
              <FileUpload onUpload={(url) => setPhotoUrl(url)} hint={i18n.t('close.photo.hint')} />
            </div>

            {/* Difference Summary */}
            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200/30">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Closing Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">USD Expected:</span>
                  <span className="font-semibold ml-1">{fmt(totals.expectedUSD, 'USD')}</span>
                  <ArrowRight className="h-3 w-3 inline mx-1 text-muted-foreground/40" />
                  <span className="font-semibold text-emerald-700">
                    {fmt(overridden ? parseFloat(overrideUSD) || 0 : totals.autoUSD, 'USD')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">KHR Expected:</span>
                  <span className="font-semibold ml-1">{fmt(totals.expectedKHR, 'KHR')}</span>
                  <ArrowRight className="h-3 w-3 inline mx-1 text-muted-foreground/40" />
                  <span className="font-semibold text-emerald-700">
                    {fmt(overridden ? parseFloat(overrideKHR) || 0 : totals.autoKHR, 'KHR')}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {i18n.t('close.submit')}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
