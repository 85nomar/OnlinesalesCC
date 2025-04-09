import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { OrdersService, OrdersAdditionalService } from "@/services/api";
import DataTable from "@/components/DataTable";
import type { OpenOrders, OpenOrdersGrouped } from "@/shared/schema";
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
  const [globalSearchResults, setGlobalSearchResults] = useState<OpenOrdersGrouped[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch open orders grouped data with pagination
  const { data: ordersResponse, isLoading: isLoadingOrders, refetch } = useQuery({
    queryKey: ['openOrdersGrouped', page, pageSize, sortBy, sortDirection],
    queryFn: () => OrdersService.getOpenOrdersGrouped(page, pageSize, sortBy, sortDirection),
    // Don't refetch when global search is active
    enabled: !globalSearchQuery
  });

  // Process the API response which could be in multiple formats
  const groupedOrders = useMemo(() => {
    if (!ordersResponse) return [];

    // Determine if the response is the new paginated format
    if (Array.isArray(ordersResponse)) {
      return ordersResponse as OpenOrdersGrouped[];
    }

    // If response is the paginated object format
    if ('items' in ordersResponse) {
      return ordersResponse.items as OpenOrdersGrouped[];
    }

    return [];
  }, [ordersResponse]);

  // Get total count for pagination
  const totalCount = useMemo(() => {
    if (!ordersResponse) return 0;

    // If response is the paginated object format
    if (!Array.isArray(ordersResponse) && 'totalCount' in ordersResponse) {
      return ordersResponse.totalCount as number;
    }

    // Fallback to array length
    if (Array.isArray(ordersResponse)) {
      return ordersResponse.length;
    }

    return 0;
  }, [ordersResponse]);

  // Fetch additional data for orders
  const { data: additionalData = [], isLoading: isLoadingAdditional } = useQuery({
    queryKey: ['/api/orders/additional'],
    queryFn: async () => {
      try {
        return await OrdersAdditionalService.getOrdersGroupedAdditional();
      } catch (error) {
        console.error("Failed to fetch additional order data:", error);
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

  // Handle global search - need to convert regular orders to grouped format
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
      console.log(`Global search for "${query}" returned ${results.length} results`);

      if (!results.length) {
        setGlobalSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Group the results by item number (ArtikelNr)
      const groupedResults = new Map<number, OpenOrdersGrouped>();

      results.forEach(order => {
        if (!order.ArtikelNr) return;

        // If we already have this article, update its values
        if (groupedResults.has(order.ArtikelNr)) {
          const existing = groupedResults.get(order.ArtikelNr)!;
          // Increment the count
          existing.Anzahl = (existing.Anzahl || 0) + 1;
        } else {
          // Otherwise, create a new grouped entry with required fields
          const newGroupedOrder: OpenOrdersGrouped = {
            ArtikelNr: order.ArtikelNr,
            Artikel: order.Artikel || '',
            Hrs: order.Hrs || '',
            WgrNo: order.WgrNo || 0,
            Anzahl: 1,
            Erstelldatum: order.Erstelldatum || new Date().toISOString(),
            AnzahlTickets: 0,  // Default value for tickets count
          };

          groupedResults.set(order.ArtikelNr, newGroupedOrder);
        }
      });

      // Convert map to array
      const groupedArray = Array.from(groupedResults.values());
      console.log(`Grouped results into ${groupedArray.length} items`);

      setGlobalSearchResults(groupedArray);
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
      accessor: (row: OpenOrdersGrouped) => row?.ArtikelNr,
      cell: (value: number) => (
        <span className="font-mono">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.brand'),
      accessor: (row: OpenOrdersGrouped) => row?.Hrs,
      cell: (value: string) => (
        <span>{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.item'),
      accessor: (row: OpenOrdersGrouped) => row?.Artikel,
      cell: (value: string) => (
        <span className="max-w-xs truncate block">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.productGroup'),
      accessor: (row: OpenOrdersGrouped) => row?.WgrNo,
      cell: (value: number) => (
        <span className="font-mono text-xs">{value || '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.totalOrders'),
      accessor: (row: OpenOrdersGrouped) => row?.Anzahl,
      cell: (value: number) => (
        <span>{value ?? 0}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.deliveryDate'),
      accessor: (row: OpenOrdersGrouped) => {
        if (!row) return { originalDate: "" };

        // Find additional data for this item
        const additionalInfo = additionalData.find(item => item.ArtikelNr === row.ArtikelNr);

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
              <div className="flex items-center">
                <span className={`text-sm ${dateColor}`}>
                  <DateFormatter date={value.newDate} showOriginalOnError withTime={false} />
                </span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 line-through">
                  <DateFormatter date={value.originalDate} showOriginalOnError withTime={false} />
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <span className={`text-sm ${dateColor}`}>
                  <DateFormatter date={value.originalDate} showOriginalOnError withTime={false} />
                </span>
              </div>
            )}
          </div>
        );
      },
      sortable: true
    },
    {
      header: t('orders.alternatives'),
      accessor: (row: OpenOrdersGrouped) => {
        if (!row) return { count: 0, artikelNr: 0 };

        // Find additional data for this item to check for alternative items
        const additionalInfo = additionalData.find(item => item.ArtikelNr === row.ArtikelNr);
        const alternativesCount = additionalInfo?.alternativeItems?.length || 0;

        return {
          count: alternativesCount,
          artikelNr: row.ArtikelNr
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
      accessor: (row: OpenOrdersGrouped) => {
        if (!row) return { count: 0, artikelNr: 0 };
        return {
          count: row.AnzahlTickets || 0,
          artikelNr: row.ArtikelNr
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
      accessor: (row: OpenOrdersGrouped) => row,
      cell: (_: any, row: OpenOrdersGrouped) => {
        if (!row || !row.ArtikelNr) {
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
                navigate(`/order-details/${row.ArtikelNr}`);
              }}
            />
          </div>
        );
      }
    }
  ];

  // Handle row click to navigate to order details
  const handleRowClick = (order: OpenOrdersGrouped) => {
    if (!order || !order.ArtikelNr) {
      console.warn('Unable to navigate - invalid order data:', order);
      return;
    }
    navigate(`/order-details/${order.ArtikelNr}`);
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
            data={groupedOrders}
            columns={columns}
            isLoading={isLoadingOrders}
            searchable={true}
            searchFields={["ArtikelNr", "Hrs", "Artikel", "WgrNo"]}
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
          artikelNr={selectedArtikelNr}
        />
      )}
    </>
  );
}
