import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { TicketsService } from '@/features/tickets';
import { MappedTicket } from '@/features/tickets/types/mappings';
import DateFormatter from '@/components/DateFormatter';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  itemNumber?: number;
  orderNumber?: number;
  showExistingTickets?: boolean;
  ticket?: MappedTicket | null;
}

interface TicketFormValues {
  comment: string;
  itemNumber?: string;
  orderNumber?: string;
}

interface OrderTicketFormValues {
  comment: string;
  orderNumber: string;
}

const ticketFormSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
  itemNumber: z.string().optional(),
  orderNumber: z.string().optional(),
});

const orderTicketFormSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
  orderNumber: z.string().min(1, 'Order number is required'),
});

export default function AddTicketModal({
  isOpen,
  onClose,
  onSuccess,
  itemNumber,
  orderNumber,
  showExistingTickets = true,
  ticket,
}: AddTicketModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      comment: ticket?.comment || '',
      itemNumber: ticket?.itemNumber?.toString() || itemNumber?.toString(),
      orderNumber: ticket?.orderNumber?.toString() || orderNumber?.toString(),
    },
  });

  const orderForm = useForm<OrderTicketFormValues>({
    resolver: zodResolver(orderTicketFormSchema),
    defaultValues: {
      comment: ticket?.comment || '',
      orderNumber: ticket?.orderNumber?.toString() || orderNumber?.toString() || '',
    },
  });

  // Fetch existing tickets when in order mode
  const { data: existingTickets = [], isLoading: isLoadingExistingTickets } = useQuery({
    queryKey: ['tickets', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return [];
      return await TicketsService.getTicketsByOrderNumber(orderNumber);
    },
    enabled: !!orderNumber && showExistingTickets,
  });

  // Helper function to render the existing tickets section
  const renderExistingTickets = (tickets: MappedTicket[]) => {
    if (!tickets.length) return null;

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">{t('tickets.existingTickets')}</h3>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm">{ticket.comment}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <DateFormatter date={ticket.createdAt ?? null} withTime={true} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Handle form submission for generic mode
  const handleGenericSubmit = async (values: TicketFormValues) => {
    setIsSubmitting(true);
    try {
      if (ticket?.id) {
        // Update existing ticket
        await TicketsService.updateTicket(ticket.ticketId, {
          comment: values.comment,
          itemNumber: values.itemNumber ? parseInt(values.itemNumber) : undefined,
          orderNumber: values.orderNumber ? parseInt(values.orderNumber) : undefined,
        });
      } else {
        // Create new ticket
        await TicketsService.createTicket({
          comment: values.comment,
          itemNumber: values.itemNumber ? parseInt(values.itemNumber) : undefined,
          orderNumber: values.orderNumber ? parseInt(values.orderNumber) : undefined,
        });
      }

      toast({
        title: t('tickets.success.title'),
        description: ticket?.id 
          ? t('tickets.updateSuccess.description', 'Ticket updated successfully') 
          : t('tickets.success.description', 'Ticket created successfully'),
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (values.orderNumber) {
        queryClient.invalidateQueries({ queryKey: ['tickets', parseInt(values.orderNumber)] });
      }
      if (values.itemNumber) {
        queryClient.invalidateQueries({ queryKey: ['tickets', 'item', parseInt(values.itemNumber)] });
      }

      // Close modal and trigger success callback
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error with ticket:', error);
      toast({
        title: t('tickets.error.title'),
        description: t('tickets.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission for order mode
  const handleOrderSubmit = async (values: OrderTicketFormValues) => {
    setIsSubmitting(true);
    try {
      if (ticket?.id) {
        // Update existing ticket
        await TicketsService.updateTicket(ticket.ticketId, {
          comment: values.comment,
          itemNumber: itemNumber,
          orderNumber: parseInt(values.orderNumber),
        });
      } else {
        // Create new ticket
        await TicketsService.createTicket({
          comment: values.comment,
          itemNumber: itemNumber,
          orderNumber: parseInt(values.orderNumber),
        });
      }

      toast({
        title: t('tickets.success.title'),
        description: ticket?.id 
          ? t('tickets.updateSuccess.description', 'Ticket updated successfully') 
          : t('tickets.success.description', 'Ticket created successfully'),
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', parseInt(values.orderNumber)] });
      if (itemNumber) {
        queryClient.invalidateQueries({ queryKey: ['tickets', 'item', itemNumber] });
      }

      // Close modal and trigger success callback
      orderForm.reset();
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error with ticket:', error);
      toast({
        title: t('tickets.error.title'),
        description: t('tickets.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary fallback={<div className="p-4 bg-destructive/10 text-destructive rounded-md">
      {t('common.errorBoundary', 'Something went wrong. Please try again or contact support.')}
    </div>}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ticket?.id ? t('tickets.editTicket', 'Edit Ticket') : t('tickets.addTicket', 'Add Ticket')}
            </DialogTitle>
          </DialogHeader>

          {orderNumber ? (
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(handleOrderSubmit)} className="space-y-4">
                <FormField
                  control={orderForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tickets.comment')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={orderForm.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tickets.orderNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showExistingTickets && !isLoadingExistingTickets && renderExistingTickets(existingTickets)}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenericSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tickets.comment')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tickets.itemNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!!itemNumber} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tickets.orderNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!!orderNumber} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}