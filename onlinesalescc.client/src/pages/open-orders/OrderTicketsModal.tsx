import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Ticket } from "@/shared/schema";
import { TicketsService } from "@/services/tickets.service";
import { OrdersService } from "@/services/orders.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Ticket as TicketIcon, Edit, Trash, Plus } from "lucide-react";
import DateFormatter from "@/components/DateFormatter";
import { useTranslation } from "react-i18next";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import AddTicketModal from "@/components/tickets/AddTicketModal";

interface OrderTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artikelNr?: number;
  bestellNr?: number;
}

export default function OrderTicketsModal({
  isOpen,
  onClose,
  artikelNr,
  bestellNr
}: OrderTicketsModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [itemName, setItemName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTicketModalOpen, setIsAddTicketModalOpen] = useState(false);

  // Fetch tickets for this artikel number or bestellNr
  useEffect(() => {
    const fetchTickets = async () => {
      if ((!artikelNr && !bestellNr) || !isOpen) return;

      setIsLoading(true);
      try {
        let fetchedTickets: Ticket[] = [];
        let title = "";

        if (bestellNr) {
          // Fetch tickets by order number
          fetchedTickets = await TicketsService.getTicketsByBestellNr(bestellNr);
          title = `Order #${bestellNr}`;
        } else if (artikelNr) {
          // Fetch tickets by item number
          fetchedTickets = await TicketsService.getTicketsByArtikelNr(artikelNr);

          // Get item name for the title
          const ordersData = await OrdersService.getOpenOrdersGrouped();
          const allGrouped = Array.isArray(ordersData)
            ? ordersData
            : 'items' in ordersData
              ? ordersData.items
              : [];

          const itemInfo = allGrouped.find((order: any) => order.ArtikelNr === artikelNr);
          if (itemInfo) {
            title = itemInfo.Artikel;
          }
        }

        setTickets(fetchedTickets);
        setItemName(title);

      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        toast({
          title: "Error",
          description: "Failed to load tickets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [artikelNr, bestellNr, isOpen, toast]);

  // Refresh tickets after adding a new one
  const handleTicketSuccess = () => {
    setIsAddTicketModalOpen(false);

    // Refresh tickets list
    if (bestellNr) {
      TicketsService.getTicketsByBestellNr(bestellNr)
        .then(tickets => setTickets(tickets))
        .catch(error => console.error("Failed to refresh tickets:", error));
    } else if (artikelNr) {
      TicketsService.getTicketsByArtikelNr(artikelNr)
        .then(tickets => setTickets(tickets))
        .catch(error => console.error("Failed to refresh tickets:", error));
    }
  };

  // Handle deleting a ticket
  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await TicketsService.deleteTicket(ticketId);
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.ticketId !== ticketId));
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-primary" />
              {bestellNr
                ? t('tickets.ticketsForOrder', 'Tickets for Order') + ` #${bestellNr}`
                : t('tickets.ticketsFor', 'Tickets for') + ` "${itemName}"`
              }
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
                          <span className="font-mono mr-2">Order #{ticket.bestellNr}</span>
                          <span className="mr-2">·</span>
                          <span>Created by: {ticket.byUser}</span>
                          <span className="mr-2 ml-2">·</span>
                          <span><DateFormatter date={ticket.entrydate ?? null} withTime={true} /></span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <TooltipWrapper content="common.editTicket">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-primary" />
                            <span className="sr-only">{t('common.editTicket')}</span>
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="common.deleteTicket">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteTicket(ticket.ticketId)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                            <span className="sr-only">{t('common.deleteTicket')}</span>
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Ticket Modal */}
      <AddTicketModal
        isOpen={isAddTicketModalOpen}
        onClose={() => setIsAddTicketModalOpen(false)}
        onSuccess={handleTicketSuccess}
        artikelNr={artikelNr}
        bestellNr={bestellNr}
      />
    </>
  );
}
