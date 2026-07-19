import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/ui/toast"
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react"

export function PasswordPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast("New passwords don't match", 'error')
      return
    }
    if (newPassword.length < 4) {
      showToast('New password must be at least 4 characters', 'error')
      return
    }
    setLoading(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      showToast('Password changed successfully', 'success')
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to change password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader
        title="Change Password"
        subtitle={user?.username}
        onBack={() => navigate('/')}
      />
      <PageContainer>
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Current Password</label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">New Password</label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm New Password</label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <button
                type="button"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPw ? 'Hide' : 'Show'} passwords
              </button>
              <Button type="submit" className="w-full gap-2" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                <Lock className="h-4 w-4" />
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Button
          variant="ghost"
          className="w-full mt-4 gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </PageContainer>
    </div>
  )
}
