import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fmt, formatTime } from "@/lib/utils"
import { i18n } from "@/lib/i18n"
import { calcReportTotals } from "@/lib/report"
import type { ReportTotals } from "@/lib/report"
import type { Shift, Transaction } from "@/types"
import {
  TrendingUp, TrendingDown, Banknote, Building2,
  Clock, Calendar, User, Store, Receipt, Image, ArrowRight,
  CheckCircle2, FileText,
} from "lucide-react"

export { calcReportTotals }
export type { ReportTotals }

interface ShiftReportProps {
  shift: Shift
  transactions: Transaction[]
  showActions?: boolean
  onBack?: () => void
  username?: string
}

export function ShiftReport({ shift, transactions, username, onBack }: ShiftReportProps) {
  const totals = calcReportTotals(shift, transactions)
  const startTime = new Date(shift.start_time)
  const endTime = shift.end_time ? new Date(shift.end_time) : new Date()
  const durationMs = endTime.getTime() - startTime.getTime()
  const hours = Math.floor(durationMs / 3600000)
  const minutes = Math.floor((durationMs % 3600000) / 60000)
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const isClosed = shift.status === 'closed'

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Report Header */}
      <div className="bg-slate-50 border-b px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl ${isClosed ? 'bg-emerald-100' : 'bg-primary/10'}`}>
            {isClosed
              ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              : <FileText className="h-5 w-5 text-primary" />
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Shift Summary Report</h2>
              {isClosed && <Badge variant="success" className="text-[10px]">Closed</Badge>}
              {!isClosed && <Badge variant="info" className="text-[10px]">Open</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {isClosed ? 'Final report' : 'Preview before closing'}
            </p>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-xs text-primary hover:underline">Back</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-slate-700">{shift.branch_name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-slate-700">{username || `User #${shift.user_id}`}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{startTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isClosed && endTime && ` — ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              <span className="text-muted-foreground/50 ml-1">({durationStr})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Opening */}
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

      {/* Transactions */}
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
          <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            <span>Type / Method</span><span>Amount</span><span>Cost</span><span>Time</span>
          </div>
          <div className="space-y-1.5">
            {transactions.slice(0, 100).map((t) => {
              const isIn = t.type === 'inflow'
              return (
                <div key={t.id} className={`grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-3 py-2 rounded-xl text-sm ${
                  isIn ? 'bg-emerald-50/50' : 'bg-red-50/50'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isIn ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`text-xs font-medium capitalize ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>{t.type}</span>
                    <div className="flex items-center gap-1 text-muted-foreground/60">
                      {t.payment_method === 'Cash' ? <Banknote className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      <span className="text-[10px]">{t.payment_method}</span>
                    </div>
                    {t.invoice_url && <Image className="h-3 w-3 text-primary/60" />}
                  </div>
                  <div className="text-right sm:text-left">
                    <span className={`text-xs font-bold ${isIn ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isIn ? '+' : '-'}{fmt(t.amount, t.currency as 'USD' | 'KHR')}
                    </span>
                  </div>
                  <div className="text-right sm:text-left">
                    {t.cost > 0 ? (
                      <span className="text-[10px] text-muted-foreground/60">{fmt(t.cost, t.currency as 'USD' | 'KHR')}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30">—</span>
                    )}
                  </div>
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
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Financial Summary</span>
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Total Inflow</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 text-xs">
              <div><span className="text-muted-foreground">USD Cash: </span><span className="font-medium text-emerald-700">{fmt(totals.cashInUSD, 'USD')}</span></div>
              <div><span className="text-muted-foreground">USD Bank: </span><span className="font-medium text-emerald-700">{fmt(totals.bankInUSD, 'USD')}</span></div>
              <div><span className="text-muted-foreground">KHR Cash: </span><span className="font-medium text-emerald-700">{fmt(totals.cashInKHR, 'KHR')}</span></div>
              <div><span className="text-muted-foreground">KHR Bank: </span><span className="font-medium text-emerald-700">{fmt(totals.bankInKHR, 'KHR')}</span></div>
            </div>
            <div className="flex items-center gap-4 mt-1 pl-5 text-xs font-semibold text-emerald-700 bg-emerald-50/50 rounded-lg py-1.5 px-3">
              <span>USD: {fmt(totals.totalInUSD, 'USD')}</span>
              <span>KHR: {fmt(totals.totalInKHR, 'KHR')}</span>
            </div>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-700">Total Outflow</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 text-xs">
              <div><span className="text-muted-foreground">USD Cash: </span><span className="font-medium text-red-700">{fmt(totals.cashOutUSD, 'USD')}</span></div>
              <div><span className="text-muted-foreground">USD Bank: </span><span className="font-medium text-red-700">{fmt(totals.bankOutUSD, 'USD')}</span></div>
              <div><span className="text-muted-foreground">KHR Cash: </span><span className="font-medium text-red-700">{fmt(totals.cashOutKHR, 'KHR')}</span></div>
              <div><span className="text-muted-foreground">KHR Bank: </span><span className="font-medium text-red-700">{fmt(totals.bankOutKHR, 'KHR')}</span></div>
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

      {/* Profit Report */}
      {(totals.revenueCostUSD > 0 || totals.revenueCostKHR > 0) && (
        <div className="px-5 py-3 border-b bg-gradient-to-r from-amber-50/30 to-transparent">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
            Profit Report
          </span>
          <div className="space-y-3">
            {/* USD */}
            {totals.totalInUSD > 0 && (
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-800">USD</span>
                  <Badge variant="info" className="text-[10px]">
                    {totals.grossMarginUSD.toFixed(1)}% margin
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-slate-800">{fmt(totals.totalInUSD, 'USD')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">COGS</p>
                    <p className="font-semibold text-red-600">{fmt(totals.revenueCostUSD, 'USD')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gross Profit</p>
                    <p className="font-bold text-emerald-600">{fmt(totals.grossProfitUSD, 'USD')}</p>
                  </div>
                </div>
                {/* Cash vs Bank breakdown */}
                {(totals.cashInUSD > 0 || totals.bankInUSD > 0) && (
                  <div className="mt-2 pt-2 border-t border-amber-100 grid grid-cols-2 gap-2">
                    {totals.cashInUSD > 0 && (
                      <div className="bg-amber-50/50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Banknote className="h-3 w-3 text-amber-600" />
                          <span className="text-[10px] font-semibold text-amber-700">Cash</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Rev: {fmt(totals.cashInUSD, 'USD')}</p>
                        <p className="text-[10px] text-muted-foreground">Cost: {fmt(totals.cashCostUSD, 'USD')}</p>
                        <p className="text-[10px] font-semibold text-emerald-600">Profit: {fmt(totals.cashProfitUSD, 'USD')}</p>
                        <p className="text-[9px] text-muted-foreground/60">Margin: {totals.cashMarginUSD.toFixed(1)}%</p>
                      </div>
                    )}
                    {totals.bankInUSD > 0 && (
                      <div className="bg-amber-50/50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Building2 className="h-3 w-3 text-amber-600" />
                          <span className="text-[10px] font-semibold text-amber-700">Bank</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Rev: {fmt(totals.bankInUSD, 'USD')}</p>
                        <p className="text-[10px] text-muted-foreground">Cost: {fmt(totals.bankCostUSD, 'USD')}</p>
                        <p className="text-[10px] font-semibold text-emerald-600">Profit: {fmt(totals.bankProfitUSD, 'USD')}</p>
                        <p className="text-[9px] text-muted-foreground/60">Margin: {totals.bankMarginUSD.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* KHR */}
            {totals.totalInKHR > 0 && (
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-800">KHR</span>
                  <Badge variant="info" className="text-[10px]">
                    {totals.grossMarginKHR.toFixed(1)}% margin
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-slate-800">{fmt(totals.totalInKHR, 'KHR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">COGS</p>
                    <p className="font-semibold text-red-600">{fmt(totals.revenueCostKHR, 'KHR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gross Profit</p>
                    <p className="font-bold text-emerald-600">{fmt(totals.grossProfitKHR, 'KHR')}</p>
                  </div>
                </div>
                {/* Cash vs Bank breakdown */}
                {(totals.cashInKHR > 0 || totals.bankInKHR > 0) && (
                  <div className="mt-2 pt-2 border-t border-amber-100 grid grid-cols-2 gap-2">
                    {totals.cashInKHR > 0 && (
                      <div className="bg-amber-50/50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Banknote className="h-3 w-3 text-amber-600" />
                          <span className="text-[10px] font-semibold text-amber-700">Cash</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Rev: {fmt(totals.cashInKHR, 'KHR')}</p>
                        <p className="text-[10px] text-muted-foreground">Cost: {fmt(totals.cashCostKHR, 'KHR')}</p>
                        <p className="text-[10px] font-semibold text-emerald-600">Profit: {fmt(totals.cashProfitKHR, 'KHR')}</p>
                        <p className="text-[9px] text-muted-foreground/60">Margin: {totals.cashMarginKHR.toFixed(1)}%</p>
                      </div>
                    )}
                    {totals.bankInKHR > 0 && (
                      <div className="bg-amber-50/50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Building2 className="h-3 w-3 text-amber-600" />
                          <span className="text-[10px] font-semibold text-amber-700">Bank</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Rev: {fmt(totals.bankInKHR, 'KHR')}</p>
                        <p className="text-[10px] text-muted-foreground">Cost: {fmt(totals.bankCostKHR, 'KHR')}</p>
                        <p className="text-[10px] font-semibold text-emerald-600">Profit: {fmt(totals.bankProfitKHR, 'KHR')}</p>
                        <p className="text-[9px] text-muted-foreground/60">Margin: {totals.bankMarginKHR.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Combined total profit */}
            <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-xs">
              <span className="font-semibold text-amber-800">Total Profit</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-emerald-600">{fmt(totals.grossProfitUSD, 'USD')}</span>
                <span className="text-muted-foreground/40">+</span>
                <span className="font-bold text-emerald-600">{fmt(totals.grossProfitKHR, 'KHR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closing Summary */}
      {isClosed && (
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50/80 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Closing Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-sm">
              <p className="text-[10px] text-muted-foreground mb-1">Expected USD</p>
              <p className="text-xs text-muted-foreground">{fmt(totals.expectedUSD, 'USD')}</p>
              <ArrowRight className="h-3 w-3 my-1 text-muted-foreground/40" />
              <p className="text-sm font-bold text-emerald-700">{fmt(totals.closingUSD, 'USD')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totals.closingUSD >= totals.expectedUSD ? 'Surplus' : 'Shortage'}
                <span className={`ml-1 font-medium ${totals.closingUSD >= totals.expectedUSD ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totals.closingUSD >= totals.expectedUSD ? '+' : ''}{fmt(Math.abs(totals.closingUSD - totals.expectedUSD), 'USD')}
                </span>
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-sm">
              <p className="text-[10px] text-muted-foreground mb-1">Expected KHR</p>
              <p className="text-xs text-muted-foreground">{fmt(totals.expectedKHR, 'KHR')}</p>
              <ArrowRight className="h-3 w-3 my-1 text-muted-foreground/40" />
              <p className="text-sm font-bold text-emerald-700">{fmt(totals.closingKHR, 'KHR')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totals.closingKHR >= totals.expectedKHR ? 'Surplus' : 'Shortage'}
                <span className={`ml-1 font-medium ${totals.closingKHR >= totals.expectedKHR ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totals.closingKHR >= totals.expectedKHR ? '+' : ''}{fmt(Math.abs(totals.closingKHR - totals.expectedKHR), 'KHR')}
                </span>
              </p>
            </div>
          </div>
          {(shift.closing_photo_url || shift.opening_photo_url) && (
            <div className="mt-3 flex gap-2">
              {shift.opening_photo_url && (
                <a href={shift.opening_photo_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Image className="h-3 w-3" /> Opening Photo
                </a>
              )}
              {shift.closing_photo_url && (
                <a href={shift.closing_photo_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Image className="h-3 w-3" /> Closing Photo
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
