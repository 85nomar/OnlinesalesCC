import React from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
}

export function TooltipWrapper({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  className,
}: TooltipWrapperProps) {
  const { t } = useTranslation();
  
  // If there's no tooltip content, just return children
  if (!content) {
    return <>{children}</>;
  }
  
  // If content is a string, try to use it as a translation key
  const translatedContent = typeof content === 'string' 
    ? t(content as string) 
    : content;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className={className}
          role="tooltip"
        >
          {translatedContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}