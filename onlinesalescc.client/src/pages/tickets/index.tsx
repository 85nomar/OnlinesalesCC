import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TicketsService } from "@/services/api";
import DataTable from "@/components/DataTable";
import ExpandableText from "@/components/ExpandableText";
import DateFormatter, { parseAndFormatDate } from "@/components/DateFormatter";
import type { Ticket } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ActionIcon } from "@/components/ui/action-icon";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import AddTicketModal from "@/components/tickets/AddTicketModal";
import { useTranslation } from "react-i18next";

export default function TicketsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);

  // Fetch tickets data
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      try {
        return await TicketsService.getAllTickets();
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        toast({
          title: t('common.error', 'Error'),
          description: t('tickets.fetchError', 'Failed to load tickets data. Please try again.'),
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Table columns configuration
  const columns = [
    {
      header: t('tickets.ticketId', 'Ticket ID'),
      accessor: (row: Ticket) => row.ticketId,
      cell: (value: number) => (
        <span className="font-mono">#{value}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.itemNumber', 'Item Number'),
      accessor: (row: Ticket) => row.artikelNr,
      cell: (value: number) => (
        <span className="font-mono">{value}</span>
      ),
      sortable: true
    },
    {
      header: t('orders.orderNumber', 'Order Number'),
      accessor: (row: Ticket) => row.bestellNr,
      cell: (value: number) => (
        <span className="font-mono">{value}</span>
      ),
      sortable: true
    },
    {
      header: t('tickets.comment', 'Comment'),
      accessor: (row: Ticket) => row.comment,
      cell: (value: string, row: Ticket) => (
        <div className="h-[3.5rem] py-2 flex items-start">
          <ExpandableText
            text={value}
            maxLines={2}
            className="max-w-md w-full"
            metadata={{
              title: `${t('tickets.ticketId', 'Ticket')} #${row.ticketId}`,
              items: [
                { label: t('orders.orderNumber', 'Order'), value: `${row.bestellNr}` },
                { label: t('orders.itemNumber', 'Item'), value: `${row.artikelNr}` },
                { label: t('tickets.createdBy', 'By'), value: row.byUser },
                { label: t('common.date', 'Date'), value: <DateFormatter date={row.entrydate} withTime={true} /> },
              ]
            }}
          />
        </div>
      ),
      sortable: true
    },
    {
      header: t('tickets.createdBy', 'Created By'),
      accessor: (row: Ticket) => row.byUser,
      sortable: true
    },
    {
      header: t('tickets.createdAt', 'Creation Date'),
      accessor: (row: Ticket) => row.entrydate,
      cell: (value: string) => <DateFormatter date={value} withTime={true} />,
      sortable: true
    },
    {
      header: t('common.actions', 'Actions'),
      accessor: (row: Ticket) => row,
      cell: (_: any, row: Ticket) => (
        <div className="flex justify-end space-x-2">
          <ActionIcon
            icon={<PencilIcon />}
            title="common.editTicket"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTicket(row);
            }}
          />
          <ActionIcon
            icon={<TrashIcon />}
            title="common.deleteTicket"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTicket(row.id);
            }}
          />
        </div>
      )
    }
  ];

  // Handle editing a ticket
  const handleEditTicket = (ticket: Ticket) => {
    setTicketToEdit(ticket);
    setIsAddModalOpen(true);
  };

  // Handle deleting a ticket
  const handleDeleteTicket = async (id: string) => {
    try {
      await TicketsService.deleteTicket(id);
      refetch();
      toast({
        title: t('common.success', 'Success'),
        description: t('tickets.ticketDeletedSuccess', 'Ticket deleted successfully'),
      });
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast({
        title: t('common.error', 'Error'),
        description: t('tickets.deleteTicketError', 'Failed to delete ticket. Please try again.'),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-foreground">{t('tickets.title', 'Tickets')}</h1>
          <div className="flex items-center gap-2">
            <div className="text-xs bg-muted/40 px-2 py-1 rounded">
              <span className="font-medium">{tickets.length}</span> {t('dashboard.tickets', 'tickets')}
            </div>
            <Button
              type="button"
              onClick={() => {
                setTicketToEdit(null);
                setIsAddModalOpen(true);
              }}
              size="sm"
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('tickets.addTicket', 'Add Ticket')}
            </Button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-background dark:bg-darkElevated rounded-lg shadow-sm overflow-hidden">
          <DataTable
            data={tickets}
            columns={columns}
            isLoading={isLoading}
            searchable={true}
            searchFields={["ticketId", "bestellNr", "artikelNr", "comment", "byUser", "entrydate"]}
          />
        </div>
      </div>

      {/* Add/Edit Ticket Modal */}
      <AddTicketModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTicketToEdit(null);
        }}
        onSuccess={() => {
          refetch();
          setIsAddModalOpen(false);
          setTicketToEdit(null);
        }}
        ticket={ticketToEdit}
      />
    </>
  );
}
