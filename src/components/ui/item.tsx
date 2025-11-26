import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const itemVariants = cva(
  "group flex flex-col gap-4 rounded-lg p-4 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-background",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ItemGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-4", className)} {...props} />
))
ItemGroup.displayName = "ItemGroup"

export interface ItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof itemVariants> {
  asChild?: boolean
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn(itemVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Item.displayName = "Item"

const ItemMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "image" | "icon" }
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-none",
      variant === "image" && "h-16 w-16 overflow-hidden rounded-md border",
      className
    )}
    {...props}
  />
))
ItemMedia.displayName = "ItemMedia"

const ItemHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-none overflow-hidden rounded-t-md -mx-4 -mt-4 mb-0", className)}
    {...props}
  />
))
ItemHeader.displayName = "ItemHeader"

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 space-y-1", className)} {...props} />
))
ItemContent.displayName = "ItemContent"

const ItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
ItemTitle.displayName = "ItemTitle"

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ItemDescription.displayName = "ItemDescription"

export { Item, ItemGroup, ItemMedia, ItemHeader, ItemContent, ItemTitle, ItemDescription, itemVariants }
