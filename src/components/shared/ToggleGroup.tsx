import { cn } from "@/lib/utils"

interface ToggleOption {
  value: string
  label: string
}

interface ToggleGroupProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ToggleGroup({ options, value, onChange, className }: ToggleGroupProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "py-3 rounded-xl font-medium text-sm border-2 transition-all duration-150",
            value === opt.value
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
