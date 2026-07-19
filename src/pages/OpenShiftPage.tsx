import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { FileUpload } from "@/components/shared/FileUpload"
import { useAuth } from "@/contexts/AuthContext"
import { useShift } from "@/contexts/ShiftContext"
import { api } from "@/lib/api"
import { i18n } from "@/lib/i18n"
import { fmt } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/ui/toast"
import { Building2, Play, Wallet } from "lucide-react"

const BRANCHES = [
  { value: "កម្ពុជាក្រោម", label: "កម្ពុជាក្រោម" },
  { value: "វីអាយភី", label: "វីអាយភី" },
  { value: "អ៊ីអន", label: "អ៊ីអន" },
  { value: "កាប់គោ", label: "កាប់គោ" },
]

const QUICK_OPENINGS = [
  { usd: 200, khr: 50000 },
  { usd: 300, khr: 100000 },
  { usd: 500, khr: 200000 },
  { usd: 1000, khr: 500000 },
]

export function OpenShiftPage() {
  const [branch, setBranch] = useState("")
  const [openingUsd, setOpeningUsd] = useState("")
  const [openingKhr, setOpeningKhr] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { setCurrentShift } = useShift()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const parsedUsd = parseFloat(openingUsd) || 0
  const parsedKhr = parseFloat(openingKhr) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branch) {
      showToast(i18n.t('open.err.branch'), 'error')
      return
    }
    setLoading(true)
    try {
      const shift = await api.createShift({
        branch_name: branch,
        opening_usd: parsedUsd,
        opening_khr: parsedKhr,
        opening_photo_url: photoUrl,
      })
      setCurrentShift(shift)
      showToast(i18n.t('open.ok', { branch: shift.branch_name }), 'success')
      navigate('/')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open shift', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader
        title={i18n.t('open.title')}
        subtitle={i18n.t('open.loggedin', { name: user?.username || '' })}
      />

      <PageContainer>
        {/* Welcome card */}
        <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-primary/10">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold">Start Your Shift</h2>
                <p className="text-xs text-muted-foreground">Record opening cash and select your branch</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Branch select */}
            <Card>
              <CardContent className="p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  {i18n.t('open.branch')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBranch(b.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        branch === b.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-transparent bg-muted/20 hover:bg-muted/40'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${branch === b.value ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Building2 className={`h-4 w-4 ${branch === b.value ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      </div>
                      <span className={`text-sm font-medium ${branch === b.value ? 'text-primary' : 'text-muted-foreground'}`}>
                        {b.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opening cash */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {i18n.t('open.cash')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground block mb-1">USD ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/50">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={openingUsd}
                        onChange={(e) => setOpeningUsd(e.target.value)}
                        className="pl-7 text-lg font-bold h-12"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground block mb-1">KHR (៛)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/50">៛</span>
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        value={openingKhr}
                        onChange={(e) => setOpeningKhr(e.target.value)}
                        className="pl-7 text-lg font-bold h-12"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick fill suggestions */}
                <div className="mt-3">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Quick fill:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_OPENINGS.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setOpeningUsd(String(q.usd)); setOpeningKhr(String(q.khr)) }}
                        className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-muted-foreground/20 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground"
                      >
                        ${q.usd} + {fmt(q.khr, 'KHR')}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opening photo */}
            <Card>
              <CardContent className="p-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {i18n.t('open.photo')} <span className="font-normal lowercase text-muted-foreground/50">({i18n.t('open.photo.optional')})</span>
                </label>
                <FileUpload onUpload={(url) => setPhotoUrl(url)} hint={i18n.t('open.photo.hint')} />
              </CardContent>
            </Card>

            {/* Summary preview */}
            {(parsedUsd > 0 || parsedKhr > 0) && branch && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shift Summary</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch</span>
                      <span className="font-semibold">{BRANCHES.find(b => b.value === branch)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opening cash</span>
                      <span className="font-bold">{fmt(parsedUsd, 'USD')} + {fmt(parsedKhr, 'KHR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Staff</span>
                      <span>{user?.username || '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
              <Button type="submit" size="lg" className="flex-1 gap-2" disabled={loading || !branch}>
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    {i18n.t('open.submit')}
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
