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
import { Loader2, X, Ticket as TicketIcon, Edit, Trash } from "lucide-react";
import DateFormatter from "@/components/DateFormatter";
import { useTranslation } from "react-i18next";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";

interface OrderTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artikelNr: number;
}

export default function OrderTicketsModal({
  isOpen,
  onClose,
  artikelNr
}: OrderTicketsModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [itemName, setItemName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tickets for this artikel number
  useEffect(() => {
    const fetchTickets = async () => {
      if (!artikelNr || !isOpen) return;

      setIsLoading(true);
      try {
        const [fetchedTickets, ordersData] = await Promise.all([
          TicketsService.getTicketsByArtikelNr(artikelNr),
          OrdersService.getOpenOrdersGrouped()
        ]);

        setTickets(fetchedTickets);

        // Get item name
        const itemInfo = ordersData.find(order => order.ArtikelNr === artikelNr);
        if (itemInfo) {
          setItemName(itemInfo.Artikel);
        }

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
  }, [artikelNr, isOpen, toast]);

  // Handle deleting a ticket
  const handleDeleteTicket = async (id: string) => {
    try {
      await TicketsService.deleteTicket(id);
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== id));
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-primary" />
            {t('tickets.ticketsFor', 'Tickets for')} "{itemName}"
          </DialogTitle>
        </DialogHeader>

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
                <li key={ticket.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{ticket.comment}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono mr-2">Order #{ticket.bestellNr}</span>
                        <span className="mr-2">·</span>
                        <span>Created by: {ticket.byUser}</span>
                        <span className="mr-2 ml-2">·</span>
                        <span><DateFormatter date={ticket.entrydate} withTime={true} /></span>
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
                          onClick={() => handleDeleteTicket(ticket.id)}
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
  );
}
