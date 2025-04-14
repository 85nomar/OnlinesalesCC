import React from 'react';
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Settings,
  LayoutDashboard,
  TestTube,
  TicketCheck,
  Package,
  Boxes
} from "lucide-react";

// Import the logo assets directly with relative paths
import MMLogoRedPath from "@/assets/MM_LOGO-RGB.svg";
import MMLogoWhitePath from "@/assets/MM_LOGO-white.svg";
import MMWirbelRedPath from "@/assets/MM-Wirbel-rgb-red.svg";
import MMWirbelWhitePath from "@/assets/MM-Wirbel-rgb-white.svg";

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useTranslation();

  // Navigation items config
  const navItems = [
    {
      title: t('common.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/",
      active: location === "/" || location === "/dashboard"
    },
    {
      title: t('common.tickets'),
      icon: <TicketCheck className="h-5 w-5" />,
      href: "/tickets",
      active: location === "/tickets"
    },
    {
      title: t('common.groupedOrders', 'Grouped Orders'),
      icon: <Boxes className="h-5 w-5" />,
      href: "/open-orders",
      active: location === "/open-orders"
    },
    {
      title: t('common.allOrders', 'All Orders'),
      icon: <Package className="h-5 w-5" />,
      href: "/all-orders",
      active: location === "/all-orders"
    },
    {
      title: "API Tests",
      icon: <TestTube className="h-5 w-5" />,
      href: "/test/tickets-api",
      active: location === "/test/tickets-api"
    },
    {
      title: t('common.settings', 'Settings'),
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      active: location === "/settings"
    }
  ];

  if (isCollapsed) {
    return (
      <div
        className="fixed top-0 left-0 h-full bg-background dark:bg-darkElevated shadow-lg transition-all z-20 border-r border-border hidden md:block"
        style={{ width: "64px" }}
      >
        <div className="flex flex-col h-full">
          {/* Collapsed logo container */}
          <div className="p-4 flex justify-center border-b border-border">
            <img src={MMWirbelRedPath} alt="Logo" className="h-7 w-7 dark:hidden" />
            <img src={MMWirbelWhitePath} alt="Logo" className="h-7 w-7 hidden dark:block" />
          </div>

          {/* Navigation icons only */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul>
              {navItems.map((item) => (
                <li key={item.href} className="mb-1 px-2">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex justify-center items-center h-10 w-10 mx-auto rounded-md",
                      item.active
                        ? "bg-muted text-primary dark:text-primary-foreground"
                        : "text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                    )}
                  >
                    {item.icon}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User avatar only */}
          <div className="p-4 border-t border-border flex justify-center">
            <div className="bg-muted dark:bg-muted h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium">
              JD
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 left-0 h-full bg-background dark:bg-darkElevated shadow-lg transition-all z-20 border-r border-border hidden md:block"
      style={{ width: "250px" }}
    >
      <div className="flex flex-col h-full">
        {/* Logo container */}
        <div className="p-4 border-b border-border">
          <img src={MMLogoRedPath} alt="Logo" className="h-8 dark:hidden" />
          <img src={MMLogoWhitePath} alt="Logo" className="h-8 hidden dark:block" />
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.href} className="mb-1 px-2">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                    item.active
                      ? "bg-muted text-primary dark:text-primary-foreground"
                      : "text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-muted dark:bg-muted h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium">
                JD
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground">Order Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
