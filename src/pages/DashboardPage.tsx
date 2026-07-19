import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { useAuth } from "@/contexts/AuthContext"
import { useShift } from "@/contexts/ShiftContext"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/ui/toast"
import { i18n } from "@/lib/i18n"
import { fmt, formatTime, formatDuration } from "@/lib/utils"
import type { Transaction } from "@/types"
import {
  Plus, Play, Shield, History, Clock, DollarSign,
  Receipt, TrendingUp, TrendingDown, Wallet, Banknote, Building2,
  LayoutDashboard, ArrowRightLeft, FileBarChart, Menu,
  ArrowUpRight, ArrowDownRight, Image,
} from "lucide-react"

interface Summary {
  inflowUSD: number; inflowKHR: number
  outflowUSD: number; outflowKHR: number
  inflowCount: number; outflowCount: number
  costUSD: number; costKHR: number
  profitUSD: number; profitKHR: number
  cashRevenueUSD: number; bankRevenueUSD: number
  cashRevenueKHR: number; bankRevenueKHR: number
  cashCostUSD: number; bankCostUSD: number
  cashCostKHR: number; bankCostKHR: number
  cashProfitUSD: number; bankProfitUSD: number
  cashProfitKHR: number; bankProfitKHR: number
}

function calcSummary(txns: Transaction[]) {
  return txns.reduce(
    (acc, t) => {
      if (t.type === 'inflow') {
        if (t.currency === 'USD') {
          acc.inflowUSD += t.amount
          if (t.payment_method === 'Cash') {
            acc.cashRevenueUSD += t.amount
            acc.cashCostUSD += t.cost || 0
          } else {
            acc.bankRevenueUSD += t.amount
            acc.bankCostUSD += t.cost || 0
          }
        } else {
          acc.inflowKHR += t.amount
          if (t.payment_method === 'Cash') {
            acc.cashRevenueKHR += t.amount
            acc.cashCostKHR += t.cost || 0
          } else {
            acc.bankRevenueKHR += t.amount
            acc.bankCostKHR += t.cost || 0
          }
        }
        acc.inflowCount++
      } else {
        if (t.currency === 'USD') acc.outflowUSD += t.amount
        else acc.outflowKHR += t.amount
        acc.outflowCount++
      }
      return acc
    },
    {
      inflowUSD: 0, inflowKHR: 0,
      outflowUSD: 0, outflowKHR: 0,
      inflowCount: 0, outflowCount: 0,
      costUSD: 0, costKHR: 0,
      profitUSD: 0, profitKHR: 0,
      cashRevenueUSD: 0, bankRevenueUSD: 0,
      cashRevenueKHR: 0, bankRevenueKHR: 0,
      cashCostUSD: 0, bankCostUSD: 0,
      cashCostKHR: 0, bankCostKHR: 0,
      cashProfitUSD: 0, bankProfitUSD: 0,
      cashProfitKHR: 0, bankProfitKHR: 0,
    }
  )
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Transaction', icon: ArrowRightLeft, path: '/transaction' },
  { label: 'History', icon: History, path: '/shift-history' },
  { label: 'Close Shift', icon: FileBarChart, path: '/close-shift' },
  { label: 'More', icon: Menu, path: 'more' },
]

export function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { currentShift, transactions, loading, refresh } = useShift()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    refresh()
  }, [])

  const summary = useMemo(() => {
    if (!currentShift) return null
    const s = calcSummary(transactions)
    s.costUSD = s.cashCostUSD + s.bankCostUSD
    s.costKHR = s.cashCostKHR + s.bankCostKHR
    s.profitUSD = s.inflowUSD - s.costUSD
    s.profitKHR = s.inflowKHR - s.costKHR
    s.cashProfitUSD = s.cashRevenueUSD - s.cashCostUSD
    s.bankProfitUSD = s.bankRevenueUSD - s.bankCostUSD
    s.cashProfitKHR = s.cashRevenueKHR - s.cashCostKHR
    s.bankProfitKHR = s.bankRevenueKHR - s.bankCostKHR
    return {
      ...s,
      netUSD: currentShift.opening_usd + s.inflowUSD - s.outflowUSD,
      netKHR: currentShift.opening_khr + s.inflowKHR - s.outflowKHR,
    }
  }, [transactions, currentShift])

  if (loading && !currentShift) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title={i18n.t('dash.title')} subtitle="Loading..." />
        <PageContainer>
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-20 w-full mb-3" />
          <Skeleton className="h-20 w-full" />
        </PageContainer>
      </div>
    )
  }

  if (!currentShift || !summary) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title={i18n.t('dash.title')} subtitle={`${user?.username || ''}`} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-4 rounded-2xl bg-muted/30">
              <Receipt className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">No shift is currently open</p>
            <Button onClick={() => navigate('/open-shift')}>
              <Play className="h-4 w-4 mr-1.5" />
              Open Shift
            </Button>
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <PageHeader
        title={currentShift.branch_name}
        subtitle={`${user?.username || ''}`}
        action={
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-white/60" />
            <span className="text-xs text-white/70">{formatDuration(currentShift.start_time)}</span>
            <Badge variant="success" className="text-[10px] px-1.5 py-0">{i18n.t('dash.status.open')}</Badge>
          </div>
        }
      />

      <PageContainer>
        {/* Opening + Net summary card */}
        <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>{i18n.t('dash.opening')}</span>
                <span className="font-semibold text-foreground">{fmt(currentShift.opening_usd, 'USD')}</span>
                <span className="text-muted-foreground/50">|</span>
                <span className="font-semibold text-foreground">{fmt(currentShift.opening_khr, 'KHR')}</span>
              </div>
              <Badge variant="info" className="text-[10px]">{summary.inflowCount} in / {summary.outflowCount} out</Badge>
            </div>
            <div className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Balance</span>
              <div className="text-right">
                <p className="text-base font-bold text-blue-700">{fmt(summary.netUSD, 'USD')}</p>
                <p className="text-xs font-semibold text-blue-600/70">{fmt(summary.netKHR, 'KHR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 mb-1" />
              <p className="text-sm font-bold text-emerald-700">{fmt(summary.inflowUSD, 'USD')}</p>
              <p className="text-[11px] text-emerald-600/70">{fmt(summary.inflowKHR, 'KHR')}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-3">
              <TrendingDown className="h-3.5 w-3.5 text-red-600 mb-1" />
              <p className="text-sm font-bold text-red-700">{fmt(summary.outflowUSD, 'USD')}</p>
              <p className="text-[11px] text-red-600/70">{fmt(summary.outflowKHR, 'KHR')}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3">
              <Wallet className="h-3.5 w-3.5 text-blue-600 mb-1" />
              <p className="text-sm font-bold text-blue-700">{fmt(summary.netUSD, 'USD')}</p>
              <p className="text-[11px] text-blue-600/70">{fmt(summary.netKHR, 'KHR')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => navigate('/transaction')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 active:scale-95 transition-transform"
          >
            <div className="p-2 rounded-xl bg-emerald-100">
              <Plus className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">New</span>
          </button>
          <button
            onClick={() => navigate('/shift-history')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50 border border-blue-200 active:scale-95 transition-transform"
          >
            <div className="p-2 rounded-xl bg-blue-100">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-semibold text-blue-700">History</span>
          </button>
          <button
            onClick={() => navigate('/close-shift')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-red-50 border border-red-200 active:scale-95 transition-transform"
          >
            <div className="p-2 rounded-xl bg-red-100">
              <FileBarChart className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-[10px] font-semibold text-red-700">Close</span>
          </button>
          {isAdmin ? (
            <button
              onClick={() => navigate('/admin')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-purple-50 border border-purple-200 active:scale-95 transition-transform"
            >
              <div className="p-2 rounded-xl bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-semibold text-purple-700">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/password')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 active:scale-95 transition-transform"
            >
              <div className="p-2 rounded-xl bg-slate-100">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700">Settings</span>
            </button>
          )}
        </div>

        {/* Profit card */}
        {(summary.costUSD > 0 || summary.costKHR > 0) ? (
          <Card className="mb-4 border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Profit</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600">{fmt(summary.profitUSD, 'USD')}</span>
                  <span className="text-muted-foreground/30">+</span>
                  <span className="text-sm font-bold text-emerald-600">{fmt(summary.profitKHR, 'KHR')}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white/60 rounded-lg p-2">
                  <span className="text-muted-foreground">Cash</span>
                  <p className="font-semibold text-emerald-600">+{fmt(summary.cashProfitUSD + summary.cashProfitKHR, 'USD')}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <span className="text-muted-foreground">Bank</span>
                  <p className="font-semibold text-emerald-600">+{fmt(summary.bankProfitUSD + summary.bankProfitKHR, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              {i18n.t('dash.recent')}
              {transactions.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground/60 normal-case">
                  ({transactions.length})
                </span>
              )}
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/transaction')}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-muted-foreground text-xs mb-3">{i18n.t('dash.empty')}</p>
              <Button size="sm" onClick={() => navigate('/transaction')}>
                <Plus className="h-4 w-4 mr-1" />
                {i18n.t('dash.newTxn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 mb-20">
              {transactions.slice(0, 50).map((t, i) => {
                const isInflow = t.type === 'inflow'
                const isPrevSameDay = i > 0 &&
                  new Date(transactions[i - 1].timestamp).toDateString() === new Date(t.timestamp).toDateString()
                const showDate = !isPrevSameDay

                return (
                  <div key={t.id}>
                    {showDate && (
                      <div className="flex items-center gap-2 pt-3 pb-1">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          {formatDateGroup(t.timestamp)}
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card hover:bg-muted/30 transition-colors">
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                        isInflow ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {isInflow
                          ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                          : <ArrowDownRight className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isInflow ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isInflow ? '+' : '-'}{fmt(t.amount, t.currency as 'USD' | 'KHR')}
                          </span>
                          {t.cost > 0 && (
                            <span className="text-[10px] text-muted-foreground/50">
                              cost {fmt(t.cost, t.currency as 'USD' | 'KHR')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {t.payment_method === 'Cash'
                            ? <Banknote className="h-3 w-3 text-muted-foreground/40" />
                            : <Building2 className="h-3 w-3 text-muted-foreground/40" />
                          }
                          <span className="text-[10px] text-muted-foreground/60 capitalize">{t.payment_method}</span>
                          <span className="text-[10px] text-muted-foreground/30">·</span>
                          <span className="text-[10px] text-muted-foreground/50">{formatTime(t.timestamp)}</span>
                          {t.invoice_url && (
                            <>
                              <span className="text-[10px] text-muted-foreground/30">·</span>
                              <a href={t.invoice_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                                <Image className="h-2.5 w-2.5" /> Invoice
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/60 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/'
            if (item.path === 'more') {
              return (
                <div key="more" className="relative group">
                  <button
                    onClick={() => {}}
                    className="flex flex-col items-center gap-0.5 py-2.5 px-3 transition-colors"
                  >
                    <Menu className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">More</span>
                  </button>
                  {/* Dropup menu */}
                  <div className="absolute bottom-full right-0 mb-1 w-44 bg-white rounded-2xl shadow-xl border border-border/60 overflow-hidden hidden group-hover:block">
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Shield className="h-4 w-4 text-purple-600" />
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/password')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Change Password
                    </button>
                  </div>
                </div>
              )
            }
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-2.5 px-3 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  if (d.toDateString() === today) return 'Today'
  if (d.toDateString() === yesterday) return 'Yesterday'
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}
