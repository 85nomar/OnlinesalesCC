import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, MaximizeIcon } from "lucide-react";

interface MetadataItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface DialogMetadata {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  items?: MetadataItem[];
}

interface ExpandableTextProps {
  text: string | null | undefined;
  maxLines?: number;
  className?: string;
  metadata?: DialogMetadata;
}

export default function ExpandableText({ 
  text, 
  maxLines = 2, 
  className,
  metadata
}: ExpandableTextProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  
  // Check if text is overflowing to show the expand indicator
  useEffect(() => {
    const checkOverflow = () => {
      if (!textRef.current || !text) return;
      
      const el = textRef.current;
      setIsOverflowing(
        el.scrollHeight > el.clientHeight || 
        text.length > 80
      );
    };
    
    checkOverflow();
    // Recalculate on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsDialogOpen(true);
    }
  };
  
  return (
    <>
      <div 
        className={cn(
          "w-full relative group",
          isOverflowing && "cursor-pointer",
          className
        )}
        onClick={() => isOverflowing && setIsDialogOpen(true)}
        onKeyDown={handleKeyDown}
        tabIndex={isOverflowing ? 0 : undefined}
        role={isOverflowing ? "button" : undefined}
        aria-expanded={isDialogOpen}
        aria-label={isOverflowing ? "Expand comment" : undefined}
      >
        <div
          ref={textRef}
          className={cn(
            "text-gray-600 dark:text-gray-300 pr-6", // Add padding for icon
            maxLines === 1 
              ? "truncate" 
              : maxLines === 2 
                ? "line-clamp-2" 
                : maxLines === 3 
                  ? "line-clamp-3" 
                  : `line-clamp-${maxLines}`
          )}
        >
          {text || ''}
        </div>
        
        {/* Icon indicator for expandable content */}
        {isOverflowing && (
          <div className="absolute right-0 top-0 flex items-center h-full">
            <MaximizeIcon 
              className="h-3.5 w-3.5 text-muted-foreground opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" 
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Dialog for showing the full text */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{metadata?.title || "Full Comment"}</DialogTitle>
            <DialogDescription>
              {metadata?.subtitle || "View the complete text content"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Metadata display */}
          {metadata?.items && metadata.items.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              {metadata.items.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {metadata?.items && metadata.items.length > 0 && <Separator className="my-2" />}
          
          {/* Comment content */}
          <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
            {text || ''}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}