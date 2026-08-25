import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Doorframe button system (docs/redesign-plan-doorframe.md §2).
 * Visuals live in globals.css as .df-btn--* so the pencil/stroke effects
 * (pseudo-elements, reduced-motion handling) stay in one place.
 */
const buttonVariants = cva("df-btn", {
  variants: {
    variant: {
      primary: "df-btn--primary",
      secondary: "df-btn--secondary",
      ghost: "df-btn--ghost",
    },
    size: {
      default: "",
      sm: "text-[13.5px] [&.df-btn--primary]:px-6 [&.df-btn--primary]:py-2.5",
      lg: "[&.df-btn--primary]:px-10 [&.df-btn--primary]:py-4 [&.df-btn--primary]:text-[16.5px]",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
