import React from "react";
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

export interface ActionIconProps {
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  icon: React.ReactNode;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
}

export function ActionIcon({
  onClick,
  title,
  icon,
  label,
  variant = "default",
  size = "md",
  className,
  tooltipSide = "top",
  tooltipAlign = "center",
}: ActionIconProps) {
  // Handle click with stopPropagation to prevent parent element clicks
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
  };
  
  // Handle keydown events for keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) onClick(e as unknown as React.MouseEvent);
    }
  };

  // Size classes mapping
  const sizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  };

  // Variant classes mapping
  const variantClasses = {
    default: "text-muted-foreground hover:text-primary focus:outline-none rounded-full hover:bg-muted transition-colors",
    destructive: "text-destructive/80 hover:text-destructive focus:outline-none rounded-full hover:bg-muted transition-colors",
    outline: "border border-input text-muted-foreground hover:text-foreground focus:outline-none rounded-full hover:bg-muted transition-colors",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none rounded-full transition-colors",
    ghost: "hover:bg-accent hover:text-accent-foreground focus:outline-none rounded-full transition-colors",
    link: "text-primary underline-offset-4 hover:underline focus:outline-none transition-colors",
  };
  
  // Icon size classes
  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  
  const buttonContent = (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        "flex items-center focus:ring-2 focus:ring-primary/40 focus-visible:outline-none",
        className
      )}
      type="button"
      aria-label={title || label || "Action button"}
      tabIndex={0}
    >
      {React.isValidElement(icon) && 
        React.cloneElement(icon as React.ReactElement, {
          className: cn(iconSizeClasses[size], (icon as React.ReactElement).props.className),
          "aria-hidden": "true"
        })
      }
      {label && <span className={cn("ml-1", size === "sm" ? "text-xs" : "text-sm")}>{label}</span>}
    </button>
  );
  
  return (
    <TooltipWrapper
      content={title}
      side={tooltipSide}
      align={tooltipAlign}
      className="text-xs font-medium"
    >
      {buttonContent}
    </TooltipWrapper>
  );
}