import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Toast } from "@/hooks/useToast"

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: number) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-md">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-in slide-in-from-top-2",
        toast.type === "success" && "bg-emerald-600",
        toast.type === "error" && "bg-red-600",
        toast.type === "info" && "bg-blue-600"
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
