import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TicketsService, OrdersService, OrdersAdditionalService } from "@/services/api";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BadgeAlert, 
  Package, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ArrowUpRight, 
  Plus,
  Ticket,
  CalendarClock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DateFormatter from "@/components/DateFormatter";
import { getDeliveryDateStatus } from "@/lib/utils";

/**
 * Ticket Monthly Trend Chart Component - Redesigned Version
 */
const TicketMonthlyTrendChart = ({ tickets, isLoading }: { tickets: any[], isLoading: boolean }) => {
  const { t } = useTranslation();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // If loading, show skeleton
  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  // Create month array for last 6 months
  const today = new Date();
  const monthBuckets: { label: string, shortLabel: string, count: number }[] = [];
  
  // Set up 6 months of buckets - going backward from current month
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthBuckets.push({
      label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      shortLabel: monthNames[date.getMonth()],
      count: 0
    });
  }
  
  // Count tickets in each month
  if (tickets && tickets.length > 0) {
    tickets.forEach(ticket => {
      const dateStr = ticket.entrydate;
      if (!dateStr) return;
      
      try {
        const ticketDate = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(ticketDate.getTime())) return;
        
        // Get month difference from today
        const monthDiff = (today.getFullYear() - ticketDate.getFullYear()) * 12 + 
                         (today.getMonth() - ticketDate.getMonth());
        
        // Only count if in last 6 months
        if (monthDiff >= 0 && monthDiff < 6) {
          // Get bucket index (5-monthDiff because array is newest to oldest)
          const bucketIndex = 5 - monthDiff;
          
          // Increment count in appropriate bucket
          if (monthBuckets[bucketIndex]) {
            monthBuckets[bucketIndex].count++;
          }
        }
      } catch (error) {
        console.error("Error processing ticket date:", error);
      }
    });
  }
  
  // Find max count for scaling
  const maxCount = Math.max(...monthBuckets.map(bucket => bucket.count), 1);
  
  // New horizontal bar chart design
  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground mb-2">
        {t('dashboard.ticketCreationByMonth', 'Ticket creation by month (last 6 months)')}
      </div>
      
      <div className="flex flex-col space-y-4 pt-4">
        {monthBuckets.map((bucket, index) => (
          <div key={index} className="flex items-center">
            <div className="w-10 text-xs text-muted-foreground">{bucket.shortLabel}</div>
            <div className="flex-1 h-4 relative">
              {bucket.count > 0 && (
                <div 
                  className="absolute top-0 h-4 bg-red-500/90 rounded-sm transition-all duration-300"
                  style={{
                    width: `${Math.max((bucket.count / maxCount) * 100, 5)}%`
                  }}
                ></div>
              )}
            </div>
            {bucket.count > 0 && (
              <div className="ml-2 text-xs font-medium">{bucket.count}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Tickets by Item Distribution Component 
 */
const TicketsByItemDistribution = ({ tickets, isLoading }: { tickets: any[], isLoading: boolean }) => {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return [];
    }
    
    // Group tickets by artikelNr and count
    const itemCounts: Record<number, number> = {};
    
    tickets.forEach(ticket => {
      const artikelNr = ticket.artikelNr;
      if (artikelNr) {
        if (!itemCounts[artikelNr]) {
          itemCounts[artikelNr] = 0;
        }
        itemCounts[artikelNr]++;
      }
    });
    
    // Convert to array and sort by count (descending)
    const sortedItems = Object.entries(itemCounts)
      .map(([artikelNr, count]) => ({ 
        artikelNr: Number(artikelNr), 
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Take top 5
    
    return sortedItems;
  }, [tickets]);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }
  
  if (stats.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t('dashboard.noTicketDataAvailable', 'No ticket data available')}
      </div>
    );
  }
  
  // Calculate the max count for scaling the bars
  const maxCount = Math.max(...stats.map(item => item.count));
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-1">
        {t('dashboard.top5ItemsWithMostTickets', 'Top 5 items with the most tickets')}
      </div>
      {stats.map((item) => (
        <div key={item.artikelNr} className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">{t('common.itemNumber', 'Item #')}{item.artikelNr}</span>
            <span>{item.count} {t('common.ticketsLowercase', 'tickets')}</span>
          </div>
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * RecentTickets Component
 */
const RecentTickets = ({ tickets, isLoading }: { tickets: any[], isLoading: boolean }) => {
  const { t } = useTranslation();
  // Sort tickets by creation date (newest first) and take latest 5
  const recentTickets = useMemo(() => {
    if (!tickets) return [];
    return [...tickets]
      .sort((a, b) => {
        const dateA = a.entrydate;
        const dateB = b.entrydate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 5);
  }, [tickets]);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  
  if (recentTickets.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t('dashboard.noTicketsAvailable', 'No tickets available')}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {recentTickets.map((ticket) => (
        <div key={ticket.id} className="p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm font-medium">#{ticket.ticketId}: {ticket.comment}</div>
              <div className="text-xs text-muted-foreground flex gap-2">
                <span className="font-mono">#{ticket.ticketId}</span>
                <span>•</span>
                <span>{t('common.itemNumber', 'Item #')}{ticket.artikelNr}</span>
                {ticket.bestellNr && (
                  <>
                    <span>•</span>
                    <span>{t('common.orderNumber', 'Order #')}{ticket.bestellNr}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <DateFormatter date={ticket.entrydate} withTime={true} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * UpcomingDeliveries Component
 */
const UpcomingDeliveries = ({ orders, additionalInfo, isLoading }: { 
  orders: any[], 
  additionalInfo: any[],
  isLoading: boolean 
}) => {
  const { t } = useTranslation();
  // Process orders with new delivery dates
  const upcomingDeliveries = useMemo(() => {
    if (!orders || !additionalInfo) return [];
    
    // Get all orders with delivery dates
    const ordersWithDates = additionalInfo
      .filter(info => info.newDeliveryDate)
      .map(info => {
        // Find the corresponding order
        const order = orders.find(order => order.ArtikelNr === info.ArtikelNr);
        return {
          artikelNr: info.ArtikelNr,
          artikel: order?.Artikel || `${t('common.itemNumber', 'Item #')}${info.ArtikelNr}`,
          deliveryDate: info.newDeliveryDate,
          hrs: order?.Hrs || t('common.unknown', 'Unknown'),
          status: getDeliveryDateStatus(info.newDeliveryDate)
        };
      })
      // Sort by delivery date, nearest first
      .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
      .slice(0, 5);
      
    return ordersWithDates;
  }, [orders, additionalInfo]);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  
  if (upcomingDeliveries.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t('dashboard.noUpcomingDeliveries', 'No upcoming deliveries')}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {upcomingDeliveries.map((delivery) => (
        <div key={delivery.artikelNr} className="p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/order-details/${delivery.artikelNr}`}>
                <div className="text-sm font-medium hover:underline cursor-pointer">{delivery.artikel}</div>
              </Link>
              <div className="text-xs text-muted-foreground flex gap-2">
                <span className="font-mono">#{delivery.artikelNr}</span>
                <span>•</span>
                <span>{delivery.hrs}</span>
              </div>
            </div>
            <div className={`text-xs font-medium ${
              delivery.status === 'danger' ? 'text-red-500' :
              delivery.status === 'warning' ? 'text-amber-500' :
              'text-green-500'
            }`}>
              <DateFormatter date={delivery.deliveryDate} withTime={false} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Main Home Dashboard Component
 */
export default function HomeDashboard() {
  const { t } = useTranslation();
  
  // Fetch all tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      try {
        return await TicketsService.getAllTickets();
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        return [];
      }
    }
  });
  
  // Fetch open orders grouped
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders/grouped'],
    queryFn: async () => {
      try {
        return await OrdersService.getOpenOrdersGrouped();
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        return [];
      }
    }
  });
  
  // Fetch additional order information
  const { data: additionalInfo = [], isLoading: isLoadingAdditional } = useQuery({
    queryKey: ['/api/orders/additional'],
    queryFn: async () => {
      try {
        return await OrdersAdditionalService.getOrdersGroupedAdditional();
      } catch (error) {
        console.error("Failed to fetch additional order info:", error);
        return [];
      }
    }
  });
  
  // Calculate order metrics
  const orderMetrics = useMemo(() => {
    if (!orders) return { total: 0, inDelivery: 0, pendingOrders: 0 };
    
    return {
      total: orders.length,
      inDelivery: orders.filter(order => 
        order.Erstelldatum && new Date(order.Erstelldatum) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      ).length,
      pendingOrders: orders.filter(order => 
        order.AnzahlTickets > 0
      ).length
    };
  }, [orders]);
  
  // Calculate ticket metrics
  const ticketMetrics = useMemo(() => {
    if (!tickets) return { total: 0 };
    
    return {
      total: tickets.length
    };
  }, [tickets]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-foreground">{t('common.dashboard')}</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex items-center"
            onClick={() => window.location.reload()}
          >
            <Clock className="mr-2 h-4 w-4" />
            {t('common.refreshData')}
          </Button>
          <Link href="/tickets">
            <Button 
              size="sm" 
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('common.newTicket')}
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orders Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              {t('common.orders')}
            </CardTitle>
            <CardDescription>{t('dashboard.overview')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl font-bold">{orderMetrics.total}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">{t('dashboard.inDelivery')}</span>
                    <span className="text-xl font-bold">{orderMetrics.inDelivery}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">{t('dashboard.withTickets')}</span>
                    <span className="text-xl font-bold">{orderMetrics.pendingOrders}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/open-orders">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                {t('common.viewAllOrders')}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Tickets Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Ticket className="mr-2 h-5 w-5 text-primary" />
              {t('common.tickets')}
            </CardTitle>
            <CardDescription>{t('dashboard.ticketsSummary')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTickets ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl font-bold">{ticketMetrics.total}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">{t('dashboard.withOrderNumber')}</span>
                    <span className="text-xl font-bold">
                      {tickets.filter(ticket => ticket.bestellNr).length}
                    </span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">{t('dashboard.recent')}</span>
                    <span className="text-xl font-bold">
                      {tickets.filter(ticket => {
                        const dateStr = ticket.entrydate;
                        if (!dateStr) return false;
                        const ticketDate = new Date(dateStr);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return ticketDate >= oneWeekAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/tickets">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                {t('common.viewAllTickets')}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Delivery Dates Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CalendarClock className="mr-2 h-5 w-5 text-primary" />
              {t('dashboard.deliveryDates')}
            </CardTitle>
            <CardDescription>{t('dashboard.upcomingDeliveries')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAdditional ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl font-bold">
                  {additionalInfo.filter(info => info.newDeliveryDate).length}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">{t('dashboard.thisWeek')}</span>
                    <span className="text-xl font-bold">
                      {additionalInfo.filter(info => {
                        if (!info.newDeliveryDate) return false;
                        const date = new Date(info.newDeliveryDate);
                        const now = new Date();
                        const weekFromNow = new Date();
                        weekFromNow.setDate(now.getDate() + 7);
                        return date >= now && date <= weekFromNow;
                      }).length}
                    </span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground">{t('dashboard.modified')}</span>
                    <span className="text-xl font-bold">
                      {additionalInfo.filter(info => 
                        info.newDeliveryDate && info.originalDeliveryDate && 
                        info.newDeliveryDate !== info.originalDeliveryDate
                      ).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link href="/open-orders">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                {t('common.manageDeliveries')}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Monthly Trend & Item Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-red-500" />
              {t('dashboard.monthlyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TicketMonthlyTrendChart tickets={tickets} isLoading={isLoadingTickets} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-primary" />
              {t('dashboard.ticketsByItem')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TicketsByItemDistribution tickets={tickets} isLoading={isLoadingTickets} />
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Tickets & Upcoming Deliveries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BadgeAlert className="mr-2 h-5 w-5 text-primary" />
              {t('dashboard.recentTickets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTickets tickets={tickets} isLoading={isLoadingTickets} />
          </CardContent>
          <CardFooter>
            <Link href="/tickets">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                {t('common.viewAllTickets')}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              {t('dashboard.upcomingDeliveries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingDeliveries 
              orders={orders} 
              additionalInfo={additionalInfo} 
              isLoading={isLoadingOrders || isLoadingAdditional} 
            />
          </CardContent>
          <CardFooter>
            <Link href="/open-orders">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                {t('common.viewAllOrders')}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}