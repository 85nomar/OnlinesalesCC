import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  OrdersService, 
  OrdersAdditionalService, 
  mapOpenOrder, 
  mapOpenOrderGrouped 
} from "@/features/orders";
import { TicketsService } from "@/features/tickets";
import { getDeliveryDateStatus } from "@/lib/utils";
import DateFormatter from "@/components/DateFormatter";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { ActionIcon } from "@/components/ui/action-icon";
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Plus, Mail, PenSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import EmailModal from "./EmailModal";
import EditDeliveryDateModal from "./EditDeliveryDateModal";
import AddAlternativeItemModal from "./AddAlternativeItemModal";
import AddTicketModal from "@/components/tickets/AddTicketModal";
import OrderTicketsModal from "../open-orders/OrderTicketsModal";
import {
  MappedOpenOrder,
  MappedOpenOrderGrouped,
  MappedOrdersGroupedAdditional,
  MappedAlternativeItem
} from "@/features/orders/types/mappings";
import { Ticket } from '@/features/tickets/types/models';

export default function OrderDetailsPage() {
  const [, params] = useRoute("/order-details/:itemNumber");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const itemNumber = params ? parseInt(params.itemNumber) : 0;

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDeliveryDateModalOpen, setIsDeliveryDateModalOpen] = useState(false);
  const [isAlternativeModalOpen, setIsAlternativeModalOpen] = useState(false);
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  // State for order-specific tickets modal
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderTicketsModalOpen, setIsOrderTicketsModalOpen] = useState(false);

  // Fetch individual orders for this item number
  const { data: rawOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', itemNumber],
    queryFn: async () => {
      const orders = await OrdersService.getOpenOrdersByItemNumber(itemNumber);
      return orders.map(mapOpenOrder);
    },
    enabled: !!itemNumber,
  });

  // Fetch grouped orders
  const { data: rawGroupedOrders = [], isLoading: isLoadingGrouped } = useQuery({
    queryKey: ['groupedOrders'],
    queryFn: async () => {
      const response = await OrdersService.getOpenOrdersGrouped();
      const orders = Array.isArray(response) ? response : response.items;
      return orders.map(mapOpenOrderGrouped);
    },
  });

  // Fetch additional data
  const { data: additionalData, isLoading: isLoadingAdditional } = useQuery({
    queryKey: ['additionalData', itemNumber],
    queryFn: async () => {
      const data = await OrdersAdditionalService.getOrderAdditional(itemNumber);
      return data ? {
        ...data,
        alternativeItems: data.alternativeItems?.map(item => ({
          orderItemNumber: item.orderArtikelNr,
          alternativeItemNumber: item.alternativeArtikelNr,
          alternativeItemName: item.alternativeArtikel
        })) || []
      } : null;
    },
    enabled: !!itemNumber,
  });

  // Fetch tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['tickets', itemNumber],
    queryFn: async () => {
      return await TicketsService.getTicketsByItemNumber(itemNumber);
    },
    enabled: !!itemNumber,
  });

  // Find the matching grouped order for this item
  const groupedInfo = rawGroupedOrders.find((order: MappedOpenOrderGrouped) => order.itemNumber === itemNumber);

  // Redirect if invalid item number
  useEffect(() => {
    if (!itemNumber) {
      navigate("/open-orders");
    }
  }, [itemNumber, navigate]);

  // Handle adding a ticket
  const handleAddTicket = () => {
    setIsAddTicketModalOpen(true);
  };

  // Handle editing delivery date
  const handleEditDeliveryDate = () => {
    setIsDeliveryDateModalOpen(true);
  };

  // Handle adding alternative item
  const handleAddAlternative = () => {
    setIsAlternativeModalOpen(true);
  };

  // Handle removing alternative item
  const handleRemoveAlternative = async (altItemNumber: number) => {
    try {
      await OrdersAdditionalService.removeAlternativeItem(itemNumber, altItemNumber);
      queryClient.invalidateQueries({ queryKey: ['additionalData', itemNumber] });
      toast({
        title: t('common.success'),
        description: t('orders.alternativeItemRemoved'),
      });
    } catch (error) {
      console.error('Error removing alternative item:', error);
      toast({
        title: t('common.error'),
        description: t('orders.failedToRemoveAlternative'),
        variant: 'destructive',
      });
    }
  };

  // Handle opening tickets modal
  const handleViewTickets = () => {
    setIsTicketsModalOpen(true);
  };

  // Handle opening order-specific tickets modal
  const handleViewOrderTickets = (orderNumber: number) => {
    setSelectedOrderId(orderNumber);
    setIsOrderTicketsModalOpen(true);
  };

  // Get delivery date status for styling
  const deliveryDate = additionalData?.newDeliveryDate || groupedInfo?.creationDate || "";
  const dateStatus = getDeliveryDateStatus(deliveryDate);
  const dateColor =
    dateStatus === 'danger' ? 'text-danger font-medium' :
      dateStatus === 'warning' ? 'text-warning font-medium' :
        'text-gray-900 dark:text-white font-medium';

  // Table columns configuration
  const columns = [
    {
      header: t('orders.orderNumber'),
      accessor: (row: MappedOpenOrder | MappedOpenOrderGrouped) => 'orderNumber' in row ? row.orderNumber : undefined,
      cell: (value: number | undefined) => (
        <span className="font-mono">{value ?? '-'}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.creationDate'),
      accessor: (row: MappedOpenOrder | MappedOpenOrderGrouped) => row.creationDate,
      cell: (value: string) => <DateFormatter date={value} withTime={true} />,
      sortable: true
    },
    {
      header: t('orders.quantity'),
      accessor: (row: MappedOpenOrder | MappedOpenOrderGrouped) => row.quantity,
      sortable: true
    },
    {
      header: t('common.tickets'),
      accessor: (row: MappedOpenOrder | MappedOpenOrderGrouped) => {
        if (!('orderNumber' in row)) return { count: 0, orderNumber: undefined };
        
        const orderTickets = tickets.filter((ticket: Ticket) =>
          ticket.bestellNr && ticket.bestellNr.toString() === row.orderNumber.toString()
        );
        return {
          count: orderTickets.length,
          orderNumber: row.orderNumber
        };
      },
      cell: (value: { count: number, orderNumber?: number }) => {
        if (!value || !value.orderNumber) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (value.count > 0 && value.orderNumber) {
                handleViewOrderTickets(value.orderNumber);
              }
            }}
            className="flex items-center justify-center p-1"
            disabled={value.count === 0}
            title={value.count > 0 ? `${value.count} ${t('common.tickets')}` : ""}
          >
            <Badge variant={value.count > 0 ? "counter" : "zero"} className="flex items-center justify-center w-8 h-8">
              {value.count}
            </Badge>
          </button>
        );
      },
      sortable: true
    },
    {
      header: t('orders.status'),
      accessor: (row: MappedOpenOrder | MappedOpenOrderGrouped) => 'orderStatus' in row ? row.orderStatus : undefined,
      cell: (value: string | undefined) => {
        if (!value || value === '0' || value === '') {
          return <Badge variant="awaiting">{t('statusLabels.unknown', 'Status Unknown')}</Badge>;
        }

        // Determine the badge variant
        const getBadgeVariant = (status: string): "default" | "destructive" | "scheduled" | "procurement" | "fulfillment" | "shipped" | "awaiting" | "backordered" => {
          const normalizedStatus = status.trim().toUpperCase();

          if (normalizedStatus === "SCHEDULED")
            return "scheduled";
          if (normalizedStatus.includes("CANCELLED"))
            return "backordered";
          if (normalizedStatus.includes("PICKED_UP") || normalizedStatus.includes("COMPLETED"))
            return "scheduled";
          if (normalizedStatus.includes("SHIPPED"))
            return "shipped";
          if (normalizedStatus.includes("RETURN"))
            return "awaiting";
          if (normalizedStatus.includes("PROCUREMENT") || normalizedStatus.includes("TRANSFER"))
            return "procurement";
          if (normalizedStatus.includes("FULFILLMENT") || normalizedStatus.includes("INITIATED"))
            return "fulfillment";

          return "default";
        };

        const variant = getBadgeVariant(value);
        const label = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        return <Badge variant={variant}>{label}</Badge>;
      },
      sortable: true
    }
  ];

  // Group orders by product group
  const groupedOrders = rawOrders.reduce((acc, order) => {
    const group = order.productGroup || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(order);
    return acc;
  }, {} as Record<string, MappedOpenOrder[]>);

  if (!groupedInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('orders.loadingItemDetails', 'Loading Item Details...')}
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Item Information Card */}
      <div className="bg-background dark:bg-darkElevated rounded-lg shadow-sm overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            {/* Left: Title and item info */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg font-bold text-muted-foreground">
                {groupedInfo?.supplier?.charAt(0) || '?'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{groupedInfo?.itemName}</h1>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{groupedInfo?.supplier}</span> •
                  <span className="ml-1 font-mono">#{groupedInfo?.itemNumber}</span>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center"
                size="sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                {t('orders.notifyCustomers', 'Notify Customers')}
              </Button>
              <Button
                onClick={handleAddTicket}
                variant="outline"
                className="flex items-center"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('tickets.addTicket')}
              </Button>
            </div>
          </div>

          {/* Item details grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            <div className="bg-muted/30 rounded p-2">
              <div className="text-xs font-medium text-muted-foreground">{t('orders.itemNumber')}</div>
              <div className="text-sm font-mono font-medium">{groupedInfo?.itemNumber}</div>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <div className="text-xs font-medium text-muted-foreground">{t('orders.brand')}</div>
              <div className="text-sm font-medium">{groupedInfo?.supplier}</div>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <div className="text-xs font-medium text-muted-foreground">{t('orders.productGroup')}</div>
              <div className="text-sm font-medium">
                <span className="font-mono">{groupedInfo?.productGroup || t('common.unknownGroup', 'Unknown Group')}</span>
              </div>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <div className="text-xs font-medium text-muted-foreground">{t('orders.totalOrders')}</div>
              <div className="text-sm font-medium">{groupedInfo?.quantity || 0}</div>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <div className="text-xs font-medium text-muted-foreground">{t('common.tickets')}</div>
              <div className="text-sm font-medium">
                <button
                  onClick={handleViewTickets}
                  className="flex justify-center items-center p-1"
                  title={tickets.length > 0 ? `${tickets.length} ${t('common.tickets')}` : ""}
                  disabled={tickets.length === 0}
                >
                  <Badge variant={tickets.length > 0 ? "counter" : "zero"}>
                    {tickets.length}
                  </Badge>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Date & Alternatives */}
        <div className="border-t border-border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Delivery Date */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">{t('orders.deliveryDate')}</h3>
              <ActionIcon
                onClick={handleEditDeliveryDate}
                icon={<PencilIcon />}
                title={t('orders.editDeliveryDate')}
                size="sm"
              />
            </div>
            <div className={`px-2 py-1.5 rounded-md border ${dateStatus === 'danger' ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/30' :
              dateStatus === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900/30' :
                'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30'
              }`}>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${dateColor}`}>
                  {deliveryDate ? <DateFormatter date={deliveryDate} withTime={true} /> : t('orders.noDateAvailable', 'No date available')}
                </span>

                {additionalData?.originalDeliveryDate && (
                  <span className="ml-2 text-xs text-muted-foreground line-through">
                    <DateFormatter date={additionalData.originalDeliveryDate} withTime={true} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Items */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">{t('orders.alternativeItems')}</h3>
              <ActionIcon
                onClick={handleAddAlternative}
                icon={<PlusIcon />}
                title={t('orders.addAlternativeItem')}
                size="sm"
              />
            </div>

            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {additionalData?.alternativeItems && additionalData.alternativeItems.length > 0 ? (
                additionalData.alternativeItems.map(item => (
                  <div
                    key={item.orderItemNumber}
                    className="py-1 px-2 bg-muted/30 rounded flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <span className="text-xs text-foreground">{item.alternativeItemName}</span>
                      <span className="ml-1 text-xs text-muted-foreground font-mono">#{item.alternativeItemNumber}</span>
                    </div>
                    <ActionIcon
                      onClick={() => handleRemoveAlternative(item.alternativeItemNumber)}
                      icon={<TrashIcon />}
                      title={t('orders.removeAlternativeItem')}
                      size="sm"
                      variant="destructive"
                    />
                  </div>
                ))
              ) : (
                <div className="p-2 bg-muted/30 rounded text-center text-xs text-muted-foreground">
                  {t('orders.noAlternativeItems')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="bg-background dark:bg-darkElevated rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">{t('orders.individualOrders')}</h2>
            <p className="text-xs text-muted-foreground">{t('orders.showingAllOrdersForItem')}</p>
          </div>
          <div className="text-xs bg-muted/40 px-2 py-1 rounded">
            <span className="font-medium">{rawOrders.length}</span> {t('common.orders')}
          </div>
        </div>

        <DataTable
          data={rawOrders}
          columns={columns}
          isLoading={isLoadingOrders}
          searchable={true}
          searchFields={["orderNumber", "orderStatus"]}
        />
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        itemInfo={{
          itemNumber,
          itemName: groupedInfo?.itemName || "",
          newDeliveryDate: additionalData?.newDeliveryDate || groupedInfo?.creationDate || "",
          alternatives: additionalData?.alternativeItems || []
        }}
        orders={rawOrders}
      />

      {/* Edit Delivery Date Modal */}
      <EditDeliveryDateModal
        isOpen={isDeliveryDateModalOpen}
        onClose={() => setIsDeliveryDateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['additionalData', itemNumber] });
          setIsDeliveryDateModalOpen(false);
        }}
        itemNumber={itemNumber}
        currentDate={additionalData?.newDeliveryDate || groupedInfo?.creationDate || ""}
        originalDate={additionalData?.originalDeliveryDate || groupedInfo?.creationDate || ""}
      />

      {/* Add Alternative Item Modal */}
      <AddAlternativeItemModal
        isOpen={isAlternativeModalOpen}
        onClose={() => setIsAlternativeModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['additionalData', itemNumber] });
          setIsAlternativeModalOpen(false);
        }}
        artikelNr={itemNumber}
        currentAlternatives={additionalData?.alternativeItems || []}
      />

      {/* Add Ticket Modal */}
      <AddTicketModal
        isOpen={isAddTicketModalOpen}
        onClose={() => setIsAddTicketModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tickets', itemNumber] });
          queryClient.invalidateQueries({ queryKey: ['additionalData', itemNumber] });
          setIsAddTicketModalOpen(false);
        }}
        artikelNr={itemNumber}
      />

      {/* Order-specific Tickets Modal */}
      {selectedOrderId && (
        <OrderTicketsModal
          isOpen={isOrderTicketsModalOpen}
          onClose={() => {
            setIsOrderTicketsModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderNumber={selectedOrderId}
        />
      )}

      {/* Item-specific Tickets Modal */}
      <OrderTicketsModal
        isOpen={isTicketsModalOpen}
        onClose={() => setIsTicketsModalOpen(false)}
        itemNumber={itemNumber}
      />
    </>
  );
}
