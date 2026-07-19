import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ShiftProvider } from "@/contexts/ShiftContext"
import { LoginPage } from "@/pages/LoginPage"
import { OpenShiftPage } from "@/pages/OpenShiftPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { TransactionPage } from "@/pages/TransactionPage"
import { CloseShiftPage } from "@/pages/CloseShiftPage"
import { AdminPage } from "@/pages/AdminPage"
import { ShiftHistoryPage } from "@/pages/ShiftHistoryPage"
import { ShiftReportPage } from "@/pages/ShiftReportPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PasswordPage } from "@/pages/PasswordPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" /></div>
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShiftProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/open-shift" element={<ProtectedRoute><OpenShiftPage /></ProtectedRoute>} />
            <Route path="/transaction" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
            <Route path="/close-shift" element={<ProtectedRoute><CloseShiftPage /></ProtectedRoute>} />
            <Route path="/shift-history" element={<ProtectedRoute><ShiftHistoryPage /></ProtectedRoute>} />
            <Route path="/shift-report/:shiftId" element={<ProtectedRoute><ShiftReportPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/password" element={<ProtectedRoute><PasswordPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ShiftProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
