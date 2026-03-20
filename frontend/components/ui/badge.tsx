import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#DDD6CC] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#2D3A35] text-white hover:bg-[#1A3D2E]",
        secondary: "border-transparent bg-[#EBE5DF] text-[#2D3A35] hover:bg-[#DDD6CC]",
        destructive: "border-transparent bg-[#C67B6F] text-white hover:bg-[#B56A5E]",
        outline: "text-[#2D3A35] border-[#DDD6CC]",
        // Five Elements (오행)
        wood: "border-transparent bg-[#5A7A66]/15 text-[#5A7A66]",
        fire: "border-transparent bg-[#A85544]/15 text-[#A85544]",
        earth: "border-transparent bg-[#B8922D]/15 text-[#B8922D]",
        metal: "border-transparent bg-[#6B7578]/15 text-[#6B7578]",
        water: "border-transparent bg-[#556B7E]/15 text-[#556B7E]",
        // Five Elements (오행) - full names (alias)
        "ohaeng-wood": "border-transparent bg-[#5A7A66]/15 text-[#5A7A66]",
        "ohaeng-fire": "border-transparent bg-[#A85544]/15 text-[#A85544]",
        "ohaeng-earth": "border-transparent bg-[#B8922D]/15 text-[#B8922D]",
        "ohaeng-metal": "border-transparent bg-[#6B7578]/15 text-[#6B7578]",
        "ohaeng-water": "border-transparent bg-[#556B7E]/15 text-[#556B7E]",
        // Fortune status
        good: "border-transparent bg-[#5A7D6B]/15 text-[#5A7D6B]",
        neutral: "border-transparent bg-[#8B8580]/15 text-[#8B8580]",
        caution: "border-transparent bg-[#C5A059]/15 text-[#B8922D]",
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
