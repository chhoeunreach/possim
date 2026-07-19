import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button
          className="p-1 rounded-md hover:bg-muted disabled:opacity-30"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium text-foreground">
          {page} / {totalPages}
        </span>
        <button
          className="p-1 rounded-md hover:bg-muted disabled:opacity-30"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
