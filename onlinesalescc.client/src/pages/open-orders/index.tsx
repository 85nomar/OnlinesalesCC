import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { OrdersService, OrdersAdditionalService } from "@/features/orders";
import DataTable from "@/components/DataTable";
import type { 
  OpenOrder, 
  OpenOrderGrouped, 
  OrdersGroupedAdditional,
  OrderFilterRequest
} from "@/features/orders/types/models";
import { 
  MappedOpenOrder, 
  MappedOpenOrderGrouped, 
  MappedOrdersGroupedAdditional 
} from "@/features/orders/types/mappings";
import { getDeliveryDateStatus } from "@/lib/utils";
import DateFormatter from "@/components/DateFormatter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ActionIcon } from "@/components/ui/action-icon";
import { PencilIcon } from "@/components/ui/icons";
import OrderTicketsModal from "./OrderTicketsModal";

export default function OpenOrdersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedArtikelNr, setSelectedArtikelNr] = useState<number | null>(null);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  // Pagination state for the backend
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // State for global search
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchResults, setGlobalSearchResults] = useState<OpenOrderGrouped[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch grouped orders
  const { data: ordersResponse, isLoading: isLoadingOrders, refetch } = useQuery({
    queryKey: ['openOrdersGrouped'],
    queryFn: () => OrdersService.getOpenOrdersGrouped(),
    // Don't refetch when global search is active
    enabled: !globalSearchQuery
  });

  // Extract orders from the response, handling both array and object responses
  const getOrders = () => {
    if (!ordersResponse) return [];
    
    return Array.isArray(ordersResponse) ? ordersResponse : [];
  };

  // Get total count from the response, handling both array and object responses
  const getTotalCount = () => {
    if (!ordersResponse) return 0;
    
    // If response is an array, return its length
    if (Array.isArray(ordersResponse)) {
      return ordersResponse.length;
    }
    
    return 0;
  };

  const orders = getOrders();
  const totalCount = getTotalCount();

  // Fetch additional data for orders
  const { data: additionalData = [], isLoading: isLoadingAdditional } = useQuery({
    queryKey: ['additionalData'],
    queryFn: async () => {
      try {
        return await OrdersAdditionalService.getAllOrdersAdditional();
      } catch (error) {
        console.error('Failed to fetch additional data:', error);
        toast({
          title: "Error",
          description: "Failed to load additional orders data. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Handle pagination change events (page or pageSize change)
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

  // Handle sorting changes coming from the DataTable
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
      console.log(`Global search for "${query}" returned ${results.length} results`);

      if (!results.length) {
        toast({
          title: "No Results",
          description: `No orders found matching "${query}"`,
          variant: "default",
        });
      }

      // Group the results by item number
      const groupedResults = new Map<number, MappedOpenOrderGrouped>();

      results.forEach((order: MappedOpenOrder) => {
        if (!order.itemNumber) return;

        // If we already have this article, update its values
        if (groupedResults.has(order.itemNumber)) {
          const existingGroup = groupedResults.get(order.itemNumber)!;
          // Increment quantity
          existingGroup.quantity = (existingGroup.quantity || 0) + (order.quantity || 0);
        } else {
          // Create a new group for this item
          groupedResults.set(order.itemNumber, {
            itemNumber: order.itemNumber,
            itemName: order.itemName,
            quantity: order.quantity || 0,
            creationDate: order.creationDate || new Date().toISOString(),
            ticketCount: 0  // Will be populated later in fetchTicketCounts
          });
        }
      });

      setGlobalSearchResults(Array.from(groupedResults.values()));
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

  // Handle opening tickets modal for an item number
  const handleOpenTicketsModal = (artikelNr: number) => {
    setSelectedArtikelNr(artikelNr);
    setIsTicketsModalOpen(true);
  };

  // Handle closing tickets modal
  const handleCloseTicketsModal = () => {
    setIsTicketsModalOpen(false);
    setSelectedArtikelNr(null);
  };

  // Table columns configuration
  const columns = [
    {
      header: t('orders.itemNumber'),
      accessor: (row: OpenOrderGrouped) => row?.ArtikelNr,
      cell: (value: number) => (
        <span className="font-mono">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.brand'),
      accessor: (row: OpenOrderGrouped) => row?.Hrs,
      cell: (value: string) => (
        <span>{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.item'),
      accessor: (row: OpenOrderGrouped) => row?.Artikel,
      cell: (value: string) => (
        <span className="max-w-xs truncate block">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.productGroup'),
      accessor: (row: OpenOrderGrouped) => row?.WgrNo,
      cell: (value: number) => (
        <span className="font-mono text-xs">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.totalOrders'),
      accessor: (row: OpenOrderGrouped) => row?.Anzahl,
      cell: (value: number) => (
        <span>{value ?? 0}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.deliveryDate'),
      accessor: (row: OpenOrderGrouped) => {
        if (!row) return { originalDate: "" };
        
        // Find additional data for this item
        const additionalInfo = additionalData.find(item => item.itemNumber === row.itemNumber);

        if (additionalInfo?.newDeliveryDate) {
          return {
            newDate: additionalInfo.newDeliveryDate,
            originalDate: additionalInfo.originalDeliveryDate || row.Erstelldatum
          };
        }

        return { originalDate: row.Erstelldatum || "" };
      },
      cell: (value: { newDate?: string, originalDate: string }) => {
        if (!value || (!value.newDate && !value.originalDate)) {
          return <span className="text-muted-foreground text-sm">{t('orders.noDateAvailable')}</span>;
        }

        const dateStatus = value.newDate
          ? getDeliveryDateStatus(value.newDate)
          : getDeliveryDateStatus(value.originalDate);

        const dateColor =
          dateStatus === 'danger' ? 'text-danger font-medium' :
            dateStatus === 'warning' ? 'text-warning font-medium' :
              'text-gray-900 dark:text-white font-medium';

        return (
          <div className="flex items-center">
            {value.newDate ? (
              <>
                <span className={`text-sm ${dateColor}`}>
                  <DateFormatter date={value.newDate} showOriginalOnError withTime={false} />
                </span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 line-through">
                  <DateFormatter date={value.originalDate} showOriginalOnError withTime={false} />
                </span>
              </>
            ) : (
              <span className={`text-sm ${dateColor}`}>
                <DateFormatter date={value.originalDate} showOriginalOnError withTime={false} />
              </span>
            )}
          </div>
        );
      },
      sortable: true
    },
    {
      header: t('orders.alternatives'),
      accessor: (row: OpenOrderGrouped) => {
        if (!row) return { count: 0, artikelNr: 0 };

        // Find additional data for this item to check for alternative items
        const additionalInfo = additionalData.find(item => item.itemNumber === row.itemNumber);
        const alternativesCount = additionalInfo?.alternativeItems?.length || 0;

        return {
          count: alternativesCount,
          artikelNr: row.itemNumber
        };
      },
      cell: (value: { count: number, artikelNr: number }) => {
        if (!value || !value.artikelNr) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <div className="flex justify-center">
            <Badge variant={value.count > 0 ? "info" : "zero"}>
              {value.count}
            </Badge>
          </div>
        );
      },
      sortable: true
    },
    {
      header: t('common.tickets'),
      accessor: (row: OpenOrderGrouped) => {
        if (!row) return { count: 0, artikelNr: 0 };
        return {
          count: row.AnzahlTickets || 0,
          artikelNr: row.itemNumber
        };
      },
      cell: (value: { count: number, artikelNr: number }) => {
        if (!value || !value.artikelNr) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (value.count > 0) {
                setSelectedArtikelNr(value.artikelNr);
                setIsTicketsModalOpen(true);
              }
            }}
            disabled={!value.count || value.count === 0}
            className="flex justify-center items-center p-1"
          >
            <Badge variant={value.count > 0 ? "fulfillment" : "zero"}>
              {value.count}
            </Badge>
          </button>
        );
      },
      sortable: true
    },
    {
      header: t('common.actions'),
      accessor: (row: OpenOrderGrouped) => row,
      cell: (_: any, row: OpenOrderGrouped) => {
        if (!row || !row.itemNumber) {
          return null;
        }

        return (
          <div className="flex justify-end">
            <ActionIcon
              icon={<PencilIcon />}
              title={t('common.editOrderDetails')}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/order-details/${row.itemNumber}`);
              }}
            />
          </div>
        );
      }
    }
  ];

  // Handle row click to navigate to order details
  const handleRowClick = (order: OpenOrderGrouped) => {
    if (!order || !order.itemNumber) {
      console.warn('Unable to navigate - invalid order data:', order);
      return;
    }
    navigate(`/order-details/${order.itemNumber}`);
  };

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
            searchFields={["itemNumber", "Hrs", "Artikel", "WgrNo"]}
            // Pagination props
            totalItems={totalCount}
            page={page}
            pageSize={pageSize}
            onPaginationChange={handlePaginationChange}
            onSortChange={handleSortChange}
            serverSidePagination={!globalSearchQuery}
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
          itemNumber={selectedArtikelNr}
        />
      )}
    </>
  );
}
