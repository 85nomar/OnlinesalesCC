import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TicketsService } from "@/features/tickets";
import { OrdersService } from "@/features/orders";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ticket as TicketIcon, Trash, Plus } from "lucide-react";
import DateFormatter from "@/components/DateFormatter";
import { useTranslation } from "react-i18next";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import AddTicketModal from "@/components/tickets/AddTicketModal";
import { MappedTicket } from "@/features/tickets/types/mappings";
import { MappedOpenOrderGrouped } from "@/features/orders/types/mappings";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface OrderTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemNumber?: number;
  orderNumber?: number;
}

export default function OrderTicketsModal({
  isOpen,
  onClose,
  itemNumber,
  orderNumber,
}: OrderTicketsModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<MappedTicket[]>([]);
  const [itemName, setItemName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!isOpen) return;
      let fetchedTickets: MappedTicket[] = [];
      let title = '';

      try {
        if (orderNumber) {
          fetchedTickets = await TicketsService.getTicketsByOrderNumber(orderNumber);
          title = t('tickets.ticketsForOrder', 'Tickets for Order') + ` #${orderNumber}`;
        } else if (itemNumber) {
          fetchedTickets = await TicketsService.getTicketsByItemNumber(itemNumber);
          const ordersData = await OrdersService.getOpenOrdersGrouped();
          const groupedOrders = Array.isArray(ordersData) ? ordersData : [];
          const itemInfo = groupedOrders.find((item) => item.itemNumber === itemNumber);
          title = itemInfo?.itemName || t('tickets.ticketsForItem', 'Tickets for Item') + ` #${itemNumber}`;
        }
        setTickets(fetchedTickets);
        setItemName(title);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast({
          title: t('common.error'),
          description: t('tickets.fetchError'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [itemNumber, orderNumber, isOpen, toast, t]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (orderNumber) {
        const refreshedTickets = await TicketsService.getTicketsByOrderNumber(orderNumber);
        setTickets(refreshedTickets);
      } else if (itemNumber) {
        const refreshedTickets = await TicketsService.getTicketsByItemNumber(itemNumber);
        setTickets(refreshedTickets);
      }
      toast({
        title: t('common.success'),
        description: t('tickets.refreshSuccess'),
      });
    } catch (error) {
      console.error('Error refreshing tickets:', error);
      toast({
        title: t('common.error'),
        description: t('tickets.refreshError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a ticket
  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await TicketsService.deleteTicket(ticketId);
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.ticketId !== ticketId));
      toast({
        title: t('common.success'),
        description: t('tickets.deletedSuccessfully', 'Ticket deleted successfully'),
      });
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast({
        title: t('common.error'),
        description: t('tickets.failedToDelete', 'Failed to delete ticket. Please try again.'),
        variant: "destructive",
      });
    }
  };

  return (
    <ErrorBoundary fallback={<div className="p-4 text-destructive">{t('common.error')}</div>}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-primary" />
              {itemName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-end mb-2">
            <Button
              size="sm"
              onClick={() => setIsAddTicketModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {t('tickets.addTicket', 'Add Ticket')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('orders.noTicketsFound', 'No tickets found for this item.')}
            </div>
          ) : (
            <div className="mt-4 max-h-96 overflow-y-auto">
              <ul className="space-y-3">
                {tickets.map(ticket => (
                  <li key={ticket.ticketId} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{ticket.comment}</p>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-mono mr-2">
                            {ticket.orderNumber
                              ? t('tickets.orderNumber', 'Order') + ` #${ticket.orderNumber}`
                              : t('tickets.noOrderNumber', 'No Order Number')}
                          </span>
                          <span className="mr-2">·</span>
                          <span>{t('tickets.createdBy', 'Created by')}: {ticket.byUser || t('common.systemUser', 'System User')}</span>
                          <span className="mr-2 ml-2">·</span>
                          <span><DateFormatter date={ticket.createdAt ?? null} withTime={true} /></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipWrapper content={t('common.delete', 'Delete')}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTicket(ticket.ticketId)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddTicketModal
        isOpen={isAddTicketModalOpen}
        onClose={() => setIsAddTicketModalOpen(false)}
        onSuccess={handleRefresh}
        itemNumber={itemNumber}
        orderNumber={orderNumber}
      />
    </ErrorBoundary>
  );
}
