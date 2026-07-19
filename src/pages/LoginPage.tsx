import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { i18n } from "@/lib/i18n"
import { Globe } from "lucide-react"

export function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const lang = i18n.getLang()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!username || !password) {
      setError(i18n.t('login.err.empty'))
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      navigate(isAdmin ? '/admin' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('login.err.cred'))
    } finally {
      setLoading(false)
    }
  }

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'kh' : 'en'
    i18n.setLang(newLang)
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-6 pt-16 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{i18n.t('app.title')}</h1>
            <p className="text-blue-200 mt-2 text-sm">{i18n.t('app.subtitle')}</p>
          </div>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <Globe className="h-3 w-3" />
            {lang === 'en' ? 'KH' : 'EN'}
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-5">{i18n.t('login.title')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {i18n.t('login.username')}
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={i18n.t('login.username.ph')}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  {i18n.t('login.password')}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={i18n.t('login.password.ph')}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  i18n.t('login.submit')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
