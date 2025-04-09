import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { OrdersService } from "@/services/api";
import { TicketsService } from "@/services/tickets.service";
import DataTable from "@/components/DataTable";
import DateFormatter from "@/components/DateFormatter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import OrderTicketsModal from "./OrderTicketsModal";
import { useLocation } from "wouter";

export default function AllOrdersPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Pagination state for the backend
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string | undefined>('erstelldatum');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ticketCounts, setTicketCounts] = useState<Record<number, number>>({});

  // State for tickets modal
  const [selectedArtikelNr, setSelectedArtikelNr] = useState<number | null>(null);
  const [selectedBestellNr, setSelectedBestellNr] = useState<number | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  // State for global search
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchResults, setGlobalSearchResults] = useState<OpenOrders[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all orders with pagination
  const { data: ordersResponse, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['allOrders', page, pageSize, sortBy, sortDirection],
    queryFn: async () => {
      try {
        return await OrdersService.getPaginatedOrders(page, pageSize, sortBy, sortDirection);
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

  // Extract orders and total count from response
  const orders = ordersResponse?.items || [];
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
        const countsMap: Record<number, number> = {};

        // Initialize all orders with 0 counts
        ordersToProcess.forEach(order => {
          if (order.BestellNr) {
            countsMap[order.BestellNr] = 0;
          }
        });

        // Count tickets for each order
        allTickets.forEach(ticket => {
          if (ticket.bestellNr) {
            const bestellNr = parseInt(ticket.bestellNr.toString(), 10);
            if (countsMap[bestellNr] !== undefined) {
              countsMap[bestellNr] = (countsMap[bestellNr] || 0) + 1;
            }
          }
        });

        setTicketCounts(countsMap);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        // Initialize all with 0 in case of error
        const countsMap: Record<number, number> = {};
        ordersToProcess.forEach(order => {
          if (order.BestellNr) {
            countsMap[order.BestellNr] = 0;
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
      // Use the centralized search function from OrdersService
      const results = await OrdersService.searchOrders(query);
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
  const handleOpenTicketsModal = (artikelNr: number, bestellNr?: number) => {
    setSelectedArtikelNr(artikelNr);
    setSelectedBestellNr(bestellNr || null);
    setIsTicketsModalOpen(true);
  };

  // Handle close tickets modal
  const handleCloseTicketsModal = () => {
    setIsTicketsModalOpen(false);
    setSelectedArtikelNr(null);
    setSelectedBestellNr(null);
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
  const handleRowClick = (order: OpenOrders) => {
    if (!order || !order.ArtikelNr) {
      console.warn('Unable to navigate - invalid order data:', order);
      return;
    }
    navigate(`/order-details/${order.ArtikelNr}`);
  };

  // Table columns configuration
  const columns = [
    {
      header: t('orders.orderNumber'),
      accessor: (row: OpenOrders) => row?.BestellNr,
      cell: (value: number) => (
        <span className="font-mono">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.date'),
      accessor: (row: OpenOrders) => row?.Erstelldatum,
      cell: (value: string) => (
        <DateFormatter date={value} showOriginalOnError withTime={true} />
      ),
      sortable: true
    },
    {
      header: t('orders.itemNumber'),
      accessor: (row: OpenOrders) => row?.ArtikelNr,
      cell: (value: number) => (
        <span className="font-mono">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.brand'),
      accessor: (row: OpenOrders) => row?.Hrs,
      cell: (value: string) => (
        <span>{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.item'),
      accessor: (row: OpenOrders) => row?.Artikel,
      cell: (value: string) => (
        <span className="max-w-xs truncate block">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.productGroup'),
      accessor: (row: OpenOrders) => row?.WgrNo,
      cell: (value: string) => (
        <span className="font-mono text-xs">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.quantity'),
      accessor: (row: OpenOrders) => row?.Anzahl,
      cell: (value: number) => (
        <span>{value ?? 0}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.tickets', 'Tickets'),
      accessor: (row: OpenOrders) => row?.BestellNr ? ticketCounts[row.BestellNr] || 0 : 0,
      cell: (value: number, row: OpenOrders) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.ArtikelNr) {
                // Pass both the article number and order number when opening the modal
                handleOpenTicketsModal(row.ArtikelNr, row.BestellNr);
              }
            }}
            disabled={false} // Allow clicking even if count is 0 to add new tickets
            className="flex justify-center items-center p-1"
            title={value > 0 ? `${value} ${t('common.tickets')}` : t('tickets.addTicket', 'Add ticket')}
          >
            <Badge variant={value > 0 ? "counter" : "zero"}>
              {value}
            </Badge>
          </button>
        </div>
      ),
      sortable: false
    },
    {
      header: t('orders.status'),
      accessor: (row: OpenOrders) => row?.BestellStatus,
      cell: (value: string) => {
        if (!value) return <span className="text-muted-foreground">-</span>;

        // Get the appropriate badge variant for this status
        const variant = getStatusBadgeVariant(value);

        return <Badge variant={variant as any}>{value}</Badge>;
      },
      sortable: true
    }
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
            data={orders}
            columns={columns}
            isLoading={isLoadingOrders}
            searchable={true}
            searchFields={["BestellNr", "ArtikelNr", "Hrs", "Artikel", "BestellStatus"]}
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
      {selectedArtikelNr && (
        <OrderTicketsModal
          isOpen={isTicketsModalOpen}
          onClose={handleCloseTicketsModal}
          artikelNr={selectedArtikelNr}
          bestellNr={selectedBestellNr || undefined}
        />
      )}
    </>
  );
} 