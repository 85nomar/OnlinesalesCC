import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface BreadcrumbItem {
  name: string;
  path: string;
  icon?: ReactNode | null;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useTranslation();
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.path} className={isLast ? "" : "flex items-center space-x-2"}>
              {isLast ? (
                <span className="text-foreground font-medium">
                  {item.icon || t(item.name)}
                </span>
              ) : (
                <>
                  <Link 
                    href={item.path}
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    {item.icon || t(item.name)}
                  </Link>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
