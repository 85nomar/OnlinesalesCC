import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { OrdersService, OrdersAdditionalService } from "@/services/api";
import DataTable from "@/components/DataTable";
import { OpenOrdersGrouped, OrdersGroupedAdditional, productGroups } from "@/lib/mockData";
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

  // Fetch open orders grouped data
  const { data: groupedOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders/grouped'],
    queryFn: async () => {
      try {
        const data = await OrdersService.getOpenOrdersGrouped();
        return data || [];
      } catch (error) {
        console.error("Failed to fetch grouped orders:", error);
        toast({
          title: "Error",
          description: "Failed to load orders data. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    }
  });

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
          <div 
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
              value.count > 0 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" 
                : "bg-muted text-muted-foreground"
            }`}
            title={value.count > 0 ? t('orders.hasAlternativeItems') : ""}
          >
            {value.count}
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
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
              value.count > 0 
                ? "bg-primary/10 text-primary dark:text-primary-foreground hover:bg-primary/20 cursor-pointer" 
                : "bg-muted text-muted-foreground cursor-default"
            }`}
            title={`${value.count} ${t('common.tickets')}`}
          >
            {value.count}
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

  // Handle closing tickets modal
  const handleCloseTicketsModal = () => {
    setIsTicketsModalOpen(false);
    setSelectedArtikelNr(null);
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-foreground">{t('common.openOrdersGrouped')}</h1>
          <div className="text-xs bg-muted/40 px-2 py-1 rounded">
            <span className="font-medium">{groupedOrders.length}</span> {t('common.items')}
          </div>
        </div>
        
        {/* Open Orders Grouped Table */}
        <div className="bg-background dark:bg-darkElevated rounded-lg shadow-sm overflow-hidden">
          <DataTable 
            data={groupedOrders} 
            columns={columns} 
            isLoading={isLoadingOrders || isLoadingAdditional}
            searchable={true}
            searchFields={["ArtikelNr", "Hrs", "Artikel"]}
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
