import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-stone-900 text-white hover:bg-stone-800",
        secondary: "border-transparent bg-stone-200 text-stone-800 hover:bg-stone-300",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-stone-900 border-stone-300",
        // Five Elements (오행) - short names
        wood: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
        fire: "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        earth: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
        metal: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
        water: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        // Five Elements (오행) - full names (alias)
        "ohaeng-wood": "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
        "ohaeng-fire": "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        "ohaeng-earth": "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
        "ohaeng-metal": "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
        "ohaeng-water": "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        // Fortune status
        good: "border-transparent bg-green-100 text-green-800",
        neutral: "border-transparent bg-gray-100 text-gray-800",
        caution: "border-transparent bg-orange-100 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
