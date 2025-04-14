import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/ThemeToggle";
import Breadcrumb from "@/components/Breadcrumb";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Bell, Menu, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { t } = useTranslation();

  // Determine current page name for breadcrumb
  let currentPage = "";
  let breadcrumbItems = [{ name: "home", path: "/", icon: <Home className="h-4 w-4" /> }];

  if (location === "/" || location === "/dashboard") {
    currentPage = "Dashboard";
    breadcrumbItems = [{ name: "home", path: "/", icon: <Home className="h-4 w-4" /> }];
  } else if (location.startsWith("/tickets")) {
    currentPage = "Tickets";
    breadcrumbItems = [
      { name: "home", path: "/", icon: <Home className="h-4 w-4" /> },
      { name: "Tickets", path: "/tickets", icon: null }
    ];
  } else if (location.startsWith("/open-orders")) {
    currentPage = "Open Orders (Grouped)";
    breadcrumbItems = [
      { name: "home", path: "/", icon: <Home className="h-4 w-4" /> },
      { name: "Open Orders (Grouped)", path: "/open-orders", icon: null }
    ];
  } else if (location.startsWith("/order-details")) {
    currentPage = "Order Details";
    breadcrumbItems = [
      { name: "home", path: "/", icon: <Home className="h-4 w-4" /> },
      { name: "Open Orders (Grouped)", path: "/open-orders", icon: null },
      { name: "Order Details", path: location, icon: null }
    ];
  } else if (location.startsWith("/test/tickets-api")) {
    currentPage = "Tickets API Test";
    breadcrumbItems = [
      { name: "home", path: "/", icon: <Home className="h-4 w-4" /> },
      { name: "Tickets API Test", path: "/test/tickets-api", icon: null }
    ];
  }

  return (
    <header className="bg-background dark:bg-darkElevated shadow z-10 flex items-center justify-between h-16 px-4 border-b border-border sticky top-0">
      <div className="flex items-center space-x-4">
        {/* Sidebar toggle button with tooltip */}
        <TooltipWrapper content="common.toggleSidebar">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={t('common.toggleSidebar')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </TooltipWrapper>

        {/* Breadcrumbs */}
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex items-center space-x-4">
        {/* Language selector */}
        <LanguageSelector />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications with tooltip */}
        <TooltipWrapper content="common.notifications">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground relative"
            aria-label={t('common.notifications')}
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary"></span>
          </Button>
        </TooltipWrapper>
      </div>
    </header>
  );
}
