import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut, Lock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  action?: ReactNode
  gradient?: "blue" | "purple"
}

export function PageHeader({ title, subtitle, onBack, action, gradient = "blue" }: PageHeaderProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const gradientClass = gradient === "blue"
    ? "from-blue-600 to-blue-800"
    : "from-purple-700 to-purple-900"

  return (
    <div className={`bg-gradient-to-br ${gradientClass} text-white px-6 pt-12 pb-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-white/70 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button
            onClick={() => navigate('/password')}
            className="text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <Lock className="h-3 w-3" />
          </button>
          <button
            onClick={logout}
            className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex-1 px-4 -mt-4 pb-24 ${className}`}>
      {children}
    </div>
  )
}

export function CardSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-border/50 p-6 ${className}`}>
      {children}
    </div>
  )
}
