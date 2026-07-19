import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FileQuestion, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h1 className="text-2xl font-bold text-slate-800 mb-1">404</h1>
      <p className="text-sm text-muted-foreground mb-6">Page not found</p>
      <Button variant="outline" className="gap-2" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
    </div>
  )
}
