import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { FileUpload } from "@/components/shared/FileUpload"
import { useShift } from "@/contexts/ShiftContext"
import { api } from "@/lib/api"
import { i18n } from "@/lib/i18n"
import { fmt } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/ui/toast"
import { ArrowDown, ArrowUp, DollarSign, Wallet, Landmark, Plus, Store } from "lucide-react"

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200, 500, 1000]

export function TransactionPage() {
  const [type, setType] = useState("inflow")
  const [currency, setCurrency] = useState("USD")
  const [method, setMethod] = useState("Cash")
  const [amount, setAmount] = useState("")
  const [cost, setCost] = useState("")
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentShift, refresh } = useShift()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const isInflow = type === "inflow"
  const isUSD = currency === "USD"
  const symbol = isUSD ? '$' : '៛'
  const parsedAmount = parseFloat(amount) || 0
  const parsedCost = parseFloat(cost) || 0
  const profit = parsedAmount - parsedCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShift) {
      showToast(i18n.t('txn.err.noShift'), 'error')
      return
    }
    if (parsedAmount <= 0) {
      showToast(i18n.t('txn.err.amount'), 'error')
      return
    }
    setLoading(true)
    try {
      await api.createTransaction({
        shift_id: currentShift.id,
        type: type as 'inflow' | 'outflow',
        currency: currency as 'USD' | 'KHR',
        payment_method: method as 'Cash' | 'Bank',
        amount: parsedAmount,
        cost: parsedCost,
        invoice_url: invoiceUrl,
      })
      showToast(i18n.t('txn.ok'), 'success')
      await refresh()
      navigate('/')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Transaction failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const quickAmount = (val: number) => {
    setAmount(isUSD ? val.toFixed(2) : String(val * 1000))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader title={i18n.t('txn.title')} onBack={() => navigate('/')} />

      <PageContainer>
        {/* Branch context */}
        <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{i18n.t('txn.branch')}</p>
              <p className="font-semibold">{currentShift?.branch_name || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Type selector */}
            <Card>
              <CardContent className="p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  {i18n.t('txn.type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('inflow')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      isInflow
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isInflow ? 'bg-emerald-100' : 'bg-muted'}`}>
                      <ArrowDown className={`h-5 w-5 ${isInflow ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${isInflow ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                        {i18n.t('txn.type.inflow')}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">Sale / Revenue</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('outflow')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      !isInflow
                        ? 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${!isInflow ? 'bg-red-100' : 'bg-muted'}`}>
                      <ArrowUp className={`h-5 w-5 ${!isInflow ? 'text-red-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${!isInflow ? 'text-red-700' : 'text-muted-foreground'}`}>
                        {i18n.t('txn.type.outflow')}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">Expense / Purchase</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Currency + Method */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {i18n.t('txn.currency')}
                  </label>
                  <div className="flex gap-2">
                    {(['USD', 'KHR'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          currency === c
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <DollarSign className={`h-4 w-4 ${currency === c ? 'text-primary' : 'text-muted-foreground/50'}`} />
                          <span>{c}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {i18n.t('txn.method')}
                  </label>
                  <div className="flex gap-2">
                    {(['Cash', 'Bank'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          method === m
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          {m === 'Cash' ? (
                            <Wallet className={`h-4 w-4 ${method === m ? 'text-primary' : 'text-muted-foreground/50'}`} />
                          ) : (
                            <Landmark className={`h-4 w-4 ${method === m ? 'text-primary' : 'text-muted-foreground/50'}`} />
                          )}
                          <span>{m}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Amount */}
            <Card>
              <CardContent className="p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {i18n.t('txn.amount')}
                </label>
                <div className="relative mb-3">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary">
                    {symbol}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-2xl font-bold tracking-tight h-14 text-center"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => quickAmount(val)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-muted-foreground/20 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground"
                    >
                      {isUSD ? `$${val}` : `${val}k`}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost — only for inflow */}
            {isInflow && (
              <Card>
                <CardContent className="p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {i18n.t('txn.cost')} <span className="font-normal lowercase text-muted-foreground/50">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
                      {symbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="pl-9 text-lg font-semibold h-12"
                      placeholder="0.00"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary preview */}
            {parsedAmount > 0 && (
              <Card className={`border-2 ${isInflow ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className={`font-semibold ${isInflow ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isInflow ? 'Inflow' : 'Outflow'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold">{fmt(parsedAmount, currency as 'USD' | 'KHR')}</span>
                    </div>
                    {isInflow && parsedCost > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost</span>
                          <span className="text-red-500">{fmt(parsedCost, currency as 'USD' | 'KHR')}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed pt-1 mt-1">
                          <span className="font-medium text-muted-foreground">Profit</span>
                          <span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {fmt(profit, currency as 'USD' | 'KHR')}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment</span>
                      <span>{method === 'Cash' ? 'Cash' : 'Bank Transfer'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoice */}
            <Card>
              <CardContent className="p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {i18n.t('txn.invoice')} <span className="font-normal lowercase text-muted-foreground/50">(optional)</span>
                </label>
                <FileUpload onUpload={(url) => setInvoiceUrl(url)} hint={i18n.t('txn.invoice.hint')} />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" className="flex-1 gap-2" disabled={loading || parsedAmount <= 0}>
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    {i18n.t('txn.submit')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </div>
  )
}
