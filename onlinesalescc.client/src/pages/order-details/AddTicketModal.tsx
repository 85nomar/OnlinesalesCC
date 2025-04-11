import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { TicketsService } from '@/features/tickets';
import { MappedTicket } from '@/features/tickets/types/mappings';
import { MappedOpenOrder } from '@/features/orders/types/mappings';

const formSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
});

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemNumber?: number;
  orderNumber?: number;
}

export default function AddTicketModal({
  isOpen,
  onClose,
  onSuccess,
  itemNumber,
  orderNumber,
}: AddTicketModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await TicketsService.createTicket({
        ...values,
        itemNumber,
        orderNumber,
      });
      toast({
        title: t('common.success'),
        description: t('tickets.createdSuccess'),
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: t('common.error'),
        description: t('tickets.createError'),
        variant: 'destructive',
      });
    }
  };
  // ... existing code ...
} 