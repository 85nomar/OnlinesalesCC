import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  const tooltipKey = theme === "dark" 
    ? "common.switchToLightMode" 
    : "common.switchToDarkMode";
  
  return (
    <TooltipWrapper content={tooltipKey}>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme}
        aria-label={t(tooltipKey)}
        className="relative"
      >
        {/* Sun icon - visible in light mode, hidden in dark mode */}
        <Sun className={`h-5 w-5 transition-all ${theme === 'dark' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} absolute`} />
        
        {/* Moon icon - visible in dark mode, hidden in light mode */}
        <Moon className={`h-5 w-5 transition-all ${theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} absolute`} />
        
        {/* Spacer to maintain button size */}
        <span className="h-5 w-5 block opacity-0">.</span>
      </Button>
    </TooltipWrapper>
  );
}
