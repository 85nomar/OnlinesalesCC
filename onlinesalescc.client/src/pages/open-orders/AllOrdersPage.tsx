import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { OrdersService } from "@/features/orders";
import { TicketsService } from "@/features/tickets";
import DataTable from "@/components/DataTable";
import DateFormatter from "@/components/DateFormatter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import OrderTicketsModal from "./OrderTicketsModal";
import { useLocation } from "wouter";
import { 
  MappedOpenOrder, 
  MappedOpenOrderGrouped, 
  mapOpenOrder, 
  mapOpenOrderGrouped 
} from "@/features/orders/types/mappings";
import { OpenOrder, OpenOrderGrouped, OrderFilterRequest } from "@/features/orders/types/models";

type OrderData = MappedOpenOrder | MappedOpenOrderGrouped;

// Define interface matching DataTable expectations
interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export default function AllOrdersPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Pagination state for the backend
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string | undefined>('erstelldatum');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});

  // State for tickets modal
  const [selectedItemNumber, setSelectedItemNumber] = useState<number | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  // State for global search
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchResults, setGlobalSearchResults] = useState<MappedOpenOrder[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all orders with pagination
  const { data: ordersResponse, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['allOrders', page, pageSize, sortBy, sortDirection],
    queryFn: async () => {
      try {
        // Use the filter parameters that match OrderFilterRequest
        // Since OrderFilterRequest doesn't have pagination/sorting, we'll handle it differently
        const orders = await OrdersService.getOpenOrders();
        
        // Manual client-side pagination and sorting as a workaround
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return { 
          items: orders.slice(startIndex, endIndex),
          totalCount: orders.length
        };
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast({
          title: "Error",
          description: "Failed to load orders data. Please try again.",
          variant: "destructive",
        });
        return { items: [], totalCount: 0 };
      }
    },
    // Don't refetch when global search is active
    enabled: !globalSearchQuery
  });

  // We need to check if ordersResponse and ordersResponse.items exist before trying to access them
  const orders = ordersResponse?.items ? 
    ordersResponse.items : 
    [];
  const totalCount = ordersResponse?.totalCount || 0;

  // Fetch ticket counts for each order when orders change
  useEffect(() => {
    const fetchTicketCounts = async () => {
      // Get the correct array of orders to process
      const ordersToProcess = globalSearchQuery ? globalSearchResults : orders;

      if (!ordersToProcess.length) return;

      try {
        // Get all tickets in one request
        const allTickets = await TicketsService.getAllTickets();

        // Create a map of order numbers to ticket counts
        const countsMap: Record<string, number> = {};

        // Initialize all orders with 0 counts
        ordersToProcess.forEach((order: MappedOpenOrder) => {
          if (order.orderNumber) {
            countsMap[order.orderNumber.toString()] = 0;
          }
        });

        // Count tickets for each order
        allTickets.forEach(ticket => {
          const orderNumber = ticket.orderNumber?.toString();
          if (orderNumber && countsMap[orderNumber] !== undefined) {
            countsMap[orderNumber]++;
          }
        });

        setTicketCounts(countsMap);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        // Initialize all with 0 in case of error
        const countsMap: Record<string, number> = {};
        ordersToProcess.forEach((order: MappedOpenOrder) => {
          if (order.orderNumber) {
            countsMap[order.orderNumber.toString()] = 0;
          }
        });
        setTicketCounts(countsMap);
      }
    };

    fetchTicketCounts();
  }, [orders, globalSearchResults, globalSearchQuery]);

  // Handle pagination change
  const handlePaginationChange = useCallback((newPage: number, newPageSize: number) => {
    console.log(`Pagination changed: page=${newPage}, pageSize=${newPageSize}`);
    // Reset global search if active
    if (globalSearchQuery) {
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    }
    setPage(newPage);
    setPageSize(newPageSize);
  }, [globalSearchQuery]);

  // Handle sorting changes
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    // Reset global search if active
    if (globalSearchQuery) {
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    }
    setSortBy(field);
    setSortDirection(direction);
  };

  // Handle global search
  const handleGlobalSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
      return;
    }

    setGlobalSearchQuery(query);
    setIsSearching(true);

    try {
      // Try to determine if query is an item number, order number, or something else
      const numberValue = parseInt(query, 10);
      
      // Create a filter that matches the OrderFilterRequest interface
      let filter: Partial<OrderFilterRequest> = {};
      
      if (!isNaN(numberValue)) {
        // If query is a number, search both item and order numbers
        if (numberValue > 1000000) {
          // Likely an order number (longer)
          filter.orderNumber = numberValue;
        } else {
          // Likely an item number (shorter)
          filter.itemNumber = numberValue;
        }
      } else {
        // If query is text, it could be a supplier or status
        filter.supplier = query;
      }
      
      const results = await OrdersService.getOpenOrders(filter);
      setGlobalSearchResults(results);
      console.log(`Global search for "${query}" returned ${results.length} results`);
    } catch (error) {
      console.error("Error during global search:", error);
      toast({
        title: "Search Error",
        description: "There was an error performing your search. Please try again.",
        variant: "destructive",
      });
      setGlobalSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle open tickets modal
  const handleOpenTicketsModal = (itemNumber: number, orderNumber?: number) => {
    setSelectedItemNumber(itemNumber);
    setSelectedOrderNumber(orderNumber || null);
    setIsTicketsModalOpen(true);
  };

  // Handle close tickets modal
  const handleCloseTicketsModal = () => {
    setIsTicketsModalOpen(false);
    setSelectedItemNumber(null);
    setSelectedOrderNumber(null);
  };

  // Get badge variant based on status text
  const getStatusBadgeVariant = (status: string): string => {
    if (!status) return "default";

    const normalizedStatus = status.trim().toUpperCase();

    if (normalizedStatus === "SCHEDULED")
      return "scheduled";
    if (normalizedStatus.includes("PROCUREMENT") || normalizedStatus.includes("TRANSFER"))
      return "procurement";
    if (normalizedStatus.includes("FULFILLMENT") || normalizedStatus.includes("INITIATED"))
      return "fulfillment";
    if (normalizedStatus.includes("SHIPPED"))
      return "shipped";
    if (normalizedStatus.includes("AWAITING") || normalizedStatus.includes("STOCK"))
      return "awaiting";
    if (normalizedStatus.includes("BACKORDER"))
      return "backordered";

    // Default case if no match is found
    return "default";
  };

  // Handle row click to navigate to order details
  const handleRowClick = (row: OrderData) => {
    if ('itemNumber' in row && row.itemNumber && 'orderNumber' in row && row.orderNumber) {
      handleOpenTicketsModal(row.itemNumber, row.orderNumber);
    }
  };

  // Table columns configuration
  const columns: DataTableColumn<OrderData>[] = [
    {
      accessor: "itemNumber",
      header: t("orders.itemNumber"),
      cell: (value, row) => {
        return 'itemNumber' in row ? (
          <span className="font-mono">{row.itemNumber || '-'}</span>
        ) : null;
      },
    },
    {
      accessor: "itemName",
      header: t("orders.itemName"),
      cell: (value, row) => {
        return 'itemName' in row ? (
          <span className="max-w-xs truncate block">{row.itemName || '-'}</span>
        ) : null;
      },
    },
    {
      accessor: (row) => 'orderNumber' in row ? row.orderNumber : undefined,
      header: t("orders.orderNumber"),
      cell: (value, row) => {
        return 'orderNumber' in row ? (
          <span className="font-mono">{row.orderNumber || '-'}</span>
        ) : null;
      },
    },
    {
      accessor: (row) => 'quantity' in row ? row.quantity : 0,
      header: t("orders.quantity"),
      cell: (value, row) => {
        return 'quantity' in row ? (
          <span>{row.quantity ?? 0}</span>
        ) : null;
      },
    },
    {
      accessor: (row) => 'deliveryDate' in row ? row.deliveryDate : undefined,
      header: t("orders.deliveryDate"),
      cell: (value, row) => {
        return 'deliveryDate' in row ? (
          <DateFormatter date={row.deliveryDate} showOriginalOnError withTime={true} />
        ) : null;
      },
    },
    {
      accessor: (row) => 'orderNumber' in row ? ticketCounts[row.orderNumber?.toString() || ''] || 0 : 0,
      header: t("orders.tickets"),
      cell: (value, row) => {
        if (!('orderNumber' in row) || !row.orderNumber) return null;
        
        const count = ticketCounts[row.orderNumber.toString()] || 0;
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if ('itemNumber' in row && row.itemNumber) {
                  handleOpenTicketsModal(row.itemNumber, row.orderNumber);
                }
              }}
              className="flex justify-center items-center p-1"
              title={count > 0 ? t('common.tickets', { count }) : t('tickets.addTicket')}
            >
              <Badge variant={count > 0 ? "counter" : "zero"}>
                {count}
              </Badge>
            </button>
          </div>
        );
      },
    },
    {
      accessor: (row) => 'status' in row ? row.status : 'orderStatus' in row ? row.orderStatus : undefined,
      header: t("orders.status"),
      cell: (value, row) => {
        if (!('status' in row || 'orderStatus' in row)) {
          return <span className="text-muted-foreground">-</span>;
        }
        const status = 'status' in row ? row.status : 'orderStatus' in row ? row.orderStatus : null;
        if (!status) {
          return <span className="text-muted-foreground">-</span>;
        }
        const variant = getStatusBadgeVariant(status as string);
        return <Badge variant={variant as any}>{status as string}</Badge>;
      },
    },
  ];

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-foreground">{t('common.openOrders')}</h1>
          <div className="text-xs bg-muted/40 px-2 py-1 rounded">
            <span className="font-medium">
              {globalSearchQuery ? globalSearchResults.length : totalCount}
            </span> {t('common.items')}
          </div>
        </div>

        {/* Open Orders Table */}
        <div className="bg-background dark:bg-darkElevated rounded-lg shadow-sm overflow-hidden">
          <DataTable
            data={globalSearchQuery ? globalSearchResults : orders}
            columns={columns}
            isLoading={isLoadingOrders}
            searchable={true}
            searchFields={["itemNumber", "itemName", "orderNumber", "supplier", "orderStatus"]}
            // Pass pagination props
            totalItems={totalCount}
            page={page}
            pageSize={pageSize}
            onPaginationChange={handlePaginationChange}
            onSortChange={handleSortChange}
            serverSidePagination={!globalSearchQuery} // Disable server-side when searching
            // Global search props
            onGlobalSearch={handleGlobalSearch}
            globalSearchActive={!!globalSearchQuery}
            globalSearchResults={globalSearchResults}
            isSearchLoading={isSearching}
            // Row click handler for navigation
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Tickets Modal */}
      {selectedItemNumber !== null && (
        <OrderTicketsModal
          isOpen={isTicketsModalOpen}
          onClose={handleCloseTicketsModal}
          itemNumber={selectedItemNumber}
          orderNumber={selectedOrderNumber || undefined}
        />
      )}
    </>
  );
} 