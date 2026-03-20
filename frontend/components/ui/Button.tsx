import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#DDD6CC] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#2D3A35] text-white hover:bg-[#1A3D2E]",
        destructive: "bg-[#C67B6F] text-white hover:bg-[#B56A5E]",
        outline: "border border-[#EBE5DF] bg-[#FEFDFB] hover:bg-[#EBE5DF] hover:text-[#2D3A35]",
        secondary: "bg-[#EBE5DF] text-[#2D3A35] hover:bg-[#DDD6CC]",
        ghost: "hover:bg-[#EBE5DF] hover:text-[#2D3A35]",
        link: "text-[#C5A059] underline-offset-4 hover:underline",
        gold: "bg-gradient-to-r from-[#C5A059] to-[#B8922D] text-white hover:from-[#B8922D] hover:to-[#A68328]",
        premium: "bg-gradient-to-r from-[#2D3A35] via-[#1A3D2E] to-[#2D3A35] text-[#C5A059] border border-[#C5A059]/30 hover:border-[#C5A059]/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
